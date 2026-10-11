import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import {
  User,
  Friend,
  FriendRequest,
  GroceryList,
  GroceryItem,
  GroceryCategory,
  CloudSyncState,
} from '../types';
import {
  DEFAULT_USER,
  loadStorageData,
  saveStorageLists,
  saveStorageFriends,
  saveStorageFriendRequests,
  saveStorageUser,
} from '../storage/localStorage';
import { sendInviteMessage } from '../utils/invites';
import { autoDetectCategory } from '../utils/categories';
import { isFirebaseConfigured, FirebaseUser } from '../config/firebase';
import {
  subscribeToAuth,
  signInAnonymousUser,
  signInWithEmail as cloudSignInWithEmail,
  registerWithEmail as cloudRegisterWithEmail,
  signOutCloudUser,
} from '../services/cloudAuth';
import {
  subscribeToCloudLists,
  saveCloudList,
  deleteCloudList,
  subscribeToCloudFriendRequests,
  saveCloudFriendRequest,
  updateCloudFriendRequestStatus,
  subscribeToCloudFriends,
  saveCloudFriend,
  deleteCloudFriend,
} from '../services/cloudSync';

interface AppContextType {
  user: User;
  lists: GroceryList[];
  friends: Friend[];
  friendRequests: FriendRequest[];
  pendingRequestsCount: number;
  isLoaded: boolean;
  cloudSyncState: CloudSyncState;
  cloudUser: FirebaseUser | null;
  createList: (data: {
    title: string;
    description?: string;
    color?: string;
    icon?: string;
    isShared?: boolean;
    sharedWith?: Friend[];
  }) => GroceryList;
  updateList: (list: GroceryList) => void;
  deleteList: (listId: string) => void;
  addItem: (
    listId: string,
    item: {
      name: string;
      quantity?: number;
      unit?: string;
      category?: GroceryCategory;
      notes?: string;
    }
  ) => void;
  updateItem: (listId: string, item: GroceryItem) => void;
  deleteItem: (listId: string, itemId: string) => void;
  toggleConcludeItem: (listId: string, itemId: string) => void;
  clearConcludedItems: (listId: string) => void;
  sendFriendInvite: (
    contact: string,
    relationship: Friend['relationship']
  ) => Promise<{ success: boolean; method: string }>;
  acceptFriendRequest: (requestId: string) => void;
  rejectFriendRequest: (requestId: string) => void;
  removeFriend: (friendId: string) => void;
  toggleListSharing: (listId: string, friend: Friend) => void;
  simulatePartnerActivity: (listId: string) => void;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOutCloud: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cloud Sync State
  const [cloudUser, setCloudUser] = useState<FirebaseUser | null>(null);
  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncState>(() => ({
    isConfigured: isFirebaseConfigured(),
    status: isFirebaseConfigured() ? 'connecting' : 'offline-local',
  }));

  // Load local persistent storage first (instant 0ms startup)
  useEffect(() => {
    async function init() {
      const data = await loadStorageData();
      setUser(data.user);
      setLists(data.lists);
      setFriends(data.friends);
      setFriendRequests(data.friendRequests);
      setIsLoaded(true);
    }
    init();
  }, []);

  // Subscribe to Firebase Auth state if configured
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const unsubAuth = subscribeToAuth(fbUser => {
      setCloudUser(fbUser);
      if (fbUser) {
        setCloudSyncState(prev => ({
          ...prev,
          status: 'synced',
          lastSyncedAt: new Date().toLocaleTimeString(),
        }));
        // Update user ID and display name if provided by Firebase
        if (fbUser.displayName || fbUser.email) {
          setUser(prev => {
            const updated = {
              ...prev,
              id: fbUser.uid,
              name: fbUser.displayName || prev.name,
              email: fbUser.email || prev.email,
            };
            saveStorageUser(updated);
            return updated;
          });
        }
      } else {
        setCloudSyncState(prev => ({
          ...prev,
          status: 'offline-local',
        }));
      }
    });

    return () => unsubAuth();
  }, []);

  // Active Real-time Firestore Subscriptions for Lists, Friends, and Requests
  useEffect(() => {
    if (!isFirebaseConfigured() || !cloudUser) return;

    // 1. Subscribe to Cloud Lists
    const unsubLists = subscribeToCloudLists(
      cloudUser.uid,
      cloudLists => {
        if (cloudLists.length > 0) {
          setLists(cloudLists);
          saveStorageLists(cloudLists);
        }
        setCloudSyncState(prev => ({
          ...prev,
          status: 'synced',
          lastSyncedAt: new Date().toLocaleTimeString(),
        }));
      },
      err => {
        setCloudSyncState(prev => ({
          ...prev,
          status: 'error',
          errorMessage: err.message,
        }));
      }
    );

    // 2. Subscribe to Cloud Friend Requests
    const unsubReqs = subscribeToCloudFriendRequests(
      cloudUser.uid,
      user.email || user.phone,
      cloudReqs => {
        if (cloudReqs.length > 0) {
          setFriendRequests(cloudReqs);
          saveStorageFriendRequests(cloudReqs);
        }
      }
    );

    // 3. Subscribe to Cloud Friends
    const unsubFriends = subscribeToCloudFriends(cloudUser.uid, cloudFrds => {
      if (cloudFrds.length > 0) {
        setFriends(cloudFrds);
        saveStorageFriends(cloudFrds);
      }
    });

    return () => {
      unsubLists();
      unsubReqs();
      unsubFriends();
    };
  }, [cloudUser, user.email, user.phone]);

  const pendingRequestsCount = useMemo(
    () => friendRequests.filter(r => r.status === 'pending').length,
    [friendRequests]
  );

  const triggerHaptic = async (type: 'light' | 'success') => {
    try {
      if (type === 'success') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // Haptics not available on web or some emulators; fail silently
    }
  };

  const createList = (data: {
    title: string;
    description?: string;
    color?: string;
    icon?: string;
    isShared?: boolean;
    sharedWith?: Friend[];
  }) => {
    const currentUserId = cloudUser ? cloudUser.uid : user.id;
    const memberIds = [currentUserId];
    if (data.sharedWith) {
      data.sharedWith.forEach(f => {
        if (f.userId) memberIds.push(f.userId);
      });
    }

    const newList: GroceryList = {
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: data.title,
      description: data.description,
      color: data.color || '#10b981',
      icon: data.icon || 'cart',
      ownerId: currentUserId,
      ownerName: user.name,
      isShared: !!data.isShared,
      sharedWith: data.sharedWith || [],
      memberIds,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newList, ...lists];
    setLists(updated);
    saveStorageLists(updated);

    // Sync to Cloud Firestore asynchronously
    saveCloudList(newList).catch(err =>
      console.warn('[CloudSync] Failed to save list to cloud:', err)
    );

    return newList;
  };

  const updateList = (updatedList: GroceryList) => {
    const listWithTimestamp = {
      ...updatedList,
      updatedAt: new Date().toISOString(),
    };
    const updated = lists.map(l => (l.id === updatedList.id ? listWithTimestamp : l));
    setLists(updated);
    saveStorageLists(updated);

    saveCloudList(listWithTimestamp).catch(err =>
      console.warn('[CloudSync] Failed to update list in cloud:', err)
    );
  };

  const deleteList = (listId: string) => {
    const updated = lists.filter(l => l.id !== listId);
    setLists(updated);
    saveStorageLists(updated);

    deleteCloudList(listId).catch(err =>
      console.warn('[CloudSync] Failed to delete list from cloud:', err)
    );
  };

  const addItem = (
    listId: string,
    itemData: {
      name: string;
      quantity?: number;
      unit?: string;
      category?: GroceryCategory;
      notes?: string;
    }
  ) => {
    const detectedCategory = itemData.category || autoDetectCategory(itemData.name);
    const newItem: GroceryItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      listId,
      name: itemData.name.trim(),
      quantity: itemData.quantity ?? 1,
      unit: itemData.unit ?? 'pcs',
      category: detectedCategory,
      notes: itemData.notes,
      isConcluded: false,
      addedBy: cloudUser ? cloudUser.uid : user.id,
      addedByName: user.name.split(' ')[0],
      addedAt: new Date().toISOString(),
    };

    let modifiedList: GroceryList | undefined;

    const updated = lists.map(l => {
      if (l.id === listId) {
        modifiedList = {
          ...l,
          updatedAt: new Date().toISOString(),
          items: [newItem, ...l.items],
        };
        return modifiedList;
      }
      return l;
    });

    setLists(updated);
    saveStorageLists(updated);
    triggerHaptic('light');

    if (modifiedList) {
      saveCloudList(modifiedList).catch(err =>
        console.warn('[CloudSync] Failed to add item to cloud:', err)
      );
    }
  };

  const updateItem = (listId: string, updatedItem: GroceryItem) => {
    let modifiedList: GroceryList | undefined;

    const updated = lists.map(l => {
      if (l.id === listId) {
        modifiedList = {
          ...l,
          updatedAt: new Date().toISOString(),
          items: l.items.map(it => (it.id === updatedItem.id ? updatedItem : it)),
        };
        return modifiedList;
      }
      return l;
    });

    setLists(updated);
    saveStorageLists(updated);

    if (modifiedList) {
      saveCloudList(modifiedList).catch(err =>
        console.warn('[CloudSync] Failed to update item in cloud:', err)
      );
    }
  };

  const deleteItem = (listId: string, itemId: string) => {
    let modifiedList: GroceryList | undefined;

    const updated = lists.map(l => {
      if (l.id === listId) {
        modifiedList = {
          ...l,
          updatedAt: new Date().toISOString(),
          items: l.items.filter(it => it.id !== itemId),
        };
        return modifiedList;
      }
      return l;
    });

    setLists(updated);
    saveStorageLists(updated);
    triggerHaptic('light');

    if (modifiedList) {
      saveCloudList(modifiedList).catch(err =>
        console.warn('[CloudSync] Failed to delete item from cloud:', err)
      );
    }
  };

  const toggleConcludeItem = (listId: string, itemId: string) => {
    let nowConcluded = false;
    let modifiedList: GroceryList | undefined;

    const updated = lists.map(l => {
      if (l.id === listId) {
        const updatedItems = l.items.map(it => {
          if (it.id === itemId) {
            nowConcluded = !it.isConcluded;
            return {
              ...it,
              isConcluded: nowConcluded,
              concludedBy: nowConcluded ? user.name.split(' ')[0] : undefined,
              concludedAt: nowConcluded ? new Date().toISOString() : undefined,
            };
          }
          return it;
        });

        modifiedList = {
          ...l,
          updatedAt: new Date().toISOString(),
          items: updatedItems,
        };
        return modifiedList;
      }
      return l;
    });

    setLists(updated);
    saveStorageLists(updated);

    if (nowConcluded) {
      triggerHaptic('success');
    } else {
      triggerHaptic('light');
    }

    if (modifiedList) {
      saveCloudList(modifiedList).catch(err =>
        console.warn('[CloudSync] Failed to toggle conclude item in cloud:', err)
      );
    }
  };

  const clearConcludedItems = (listId: string) => {
    let modifiedList: GroceryList | undefined;

    const updated = lists.map(l => {
      if (l.id === listId) {
        modifiedList = {
          ...l,
          updatedAt: new Date().toISOString(),
          items: l.items.filter(it => !it.isConcluded),
        };
        return modifiedList;
      }
      return l;
    });

    setLists(updated);
    saveStorageLists(updated);

    if (modifiedList) {
      saveCloudList(modifiedList).catch(err =>
        console.warn('[CloudSync] Failed to clear concluded items in cloud:', err)
      );
    }
  };

  const sendFriendInvite = async (contact: string, relationship: Friend['relationship']) => {
    const result = await sendInviteMessage({
      contact,
      senderName: user.name,
    });

    // Also register pending outgoing request
    const newRequest: FriendRequest = {
      id: `req_${Date.now()}`,
      senderId: cloudUser ? cloudUser.uid : user.id,
      senderName: user.name,
      senderContact: user.email,
      senderAvatarColor: user.avatarColor,
      receiverContact: contact,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updatedRequests = [newRequest, ...friendRequests];
    setFriendRequests(updatedRequests);
    saveStorageFriendRequests(updatedRequests);

    saveCloudFriendRequest(newRequest).catch(err =>
      console.warn('[CloudSync] Failed to save friend request in cloud:', err)
    );

    return result;
  };

  const acceptFriendRequest = (requestId: string) => {
    const req = friendRequests.find(r => r.id === requestId);
    if (!req) return;

    const newFriend: Friend = {
      id: `frd_${Date.now()}`,
      userId: req.senderId,
      name: req.senderName,
      email: req.senderContact.includes('@') ? req.senderContact : undefined,
      phone: !req.senderContact.includes('@') ? req.senderContact : undefined,
      avatarColor: req.senderAvatarColor || '#3b82f6',
      relationship: 'Friend',
      addedAt: new Date().toISOString(),
    };

    const updatedFriends = [newFriend, ...friends];
    const updatedRequests = friendRequests.map(r =>
      r.id === requestId ? { ...r, status: 'accepted' as const } : r
    );

    setFriends(updatedFriends);
    setFriendRequests(updatedRequests);
    saveStorageFriends(updatedFriends);
    saveStorageFriendRequests(updatedRequests);
    triggerHaptic('success');

    updateCloudFriendRequestStatus(requestId, 'accepted').catch(err =>
      console.warn('[CloudSync] Failed to accept friend request in cloud:', err)
    );
    if (cloudUser) {
      saveCloudFriend(cloudUser.uid, newFriend).catch(err =>
        console.warn('[CloudSync] Failed to save friend in cloud:', err)
      );
    }
  };

  const rejectFriendRequest = (requestId: string) => {
    const updatedRequests = friendRequests.map(r =>
      r.id === requestId ? { ...r, status: 'rejected' as const } : r
    );
    setFriendRequests(updatedRequests);
    saveStorageFriendRequests(updatedRequests);

    updateCloudFriendRequestStatus(requestId, 'rejected').catch(err =>
      console.warn('[CloudSync] Failed to reject friend request in cloud:', err)
    );
  };

  const removeFriend = (friendId: string) => {
    const updatedFriends = friends.filter(f => f.id !== friendId);
    setFriends(updatedFriends);
    saveStorageFriends(updatedFriends);

    if (cloudUser) {
      deleteCloudFriend(cloudUser.uid, friendId).catch(err =>
        console.warn('[CloudSync] Failed to delete friend from cloud:', err)
      );
    }

    // Also remove from any shared lists
    const updatedLists = lists.map(l => {
      const updatedShared = l.sharedWith.filter(f => f.id !== friendId);
      const updatedMembers = [l.ownerId, ...updatedShared.map(f => f.userId)];
      const updatedList = {
        ...l,
        sharedWith: updatedShared,
        memberIds: updatedMembers,
        isShared: updatedShared.length > 0,
      };
      if (l.sharedWith.some(f => f.id === friendId)) {
        saveCloudList(updatedList).catch(err =>
          console.warn('[CloudSync] Failed to update list members in cloud:', err)
        );
      }
      return updatedList;
    });
    setLists(updatedLists);
    saveStorageLists(updatedLists);
  };

  const toggleListSharing = (listId: string, friend: Friend) => {
    let modifiedList: GroceryList | undefined;

    const updated = lists.map(l => {
      if (l.id === listId) {
        const isAlreadyShared = l.sharedWith.some(f => f.id === friend.id);
        const updatedShared = isAlreadyShared
          ? l.sharedWith.filter(f => f.id !== friend.id)
          : [...l.sharedWith, friend];
        const updatedMembers = [l.ownerId, ...updatedShared.map(f => f.userId)];

        modifiedList = {
          ...l,
          isShared: updatedShared.length > 0,
          sharedWith: updatedShared,
          memberIds: updatedMembers,
          updatedAt: new Date().toISOString(),
        };
        return modifiedList;
      }
      return l;
    });

    setLists(updated);
    saveStorageLists(updated);

    if (modifiedList) {
      saveCloudList(modifiedList).catch(err =>
        console.warn('[CloudSync] Failed to update list sharing in cloud:', err)
      );
    }
  };

  // Auth actions
  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    await cloudSignInWithEmail(email, pass);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, pass: string, name: string) => {
    await cloudRegisterWithEmail(email, pass);
    setUser(prev => {
      const updated = { ...prev, name, email };
      saveStorageUser(updated);
      return updated;
    });
  }, []);

  const signInAnonymously = useCallback(async () => {
    await signInAnonymousUser();
  }, []);

  const signOutCloud = useCallback(async () => {
    await signOutCloudUser();
    setCloudUser(null);
  }, []);

  // Simulated collaboration activity to demonstrate real-time sync when testing with family/partner
  const simulatePartnerActivity = (listId: string) => {
    const partnerItems = [
      { name: 'Avocados (3 pack)', category: 'Produce' as GroceryCategory, quantity: 1, unit: 'pack' },
      { name: 'Dark Roast Coffee Beans', category: 'Beverages' as GroceryCategory, quantity: 1, unit: 'bag' },
      { name: 'Greek Yogurt 0% Vanilla', category: 'Dairy & Refrigerated' as GroceryCategory, quantity: 2, unit: 'tubs' },
      { name: 'Olive Oil Extra Virgin', category: 'Pantry & Canned' as GroceryCategory, quantity: 1, unit: 'bottle' },
      { name: 'Dark Chocolate Sea Salt Bar', category: 'Snacks' as GroceryCategory, quantity: 2, unit: 'bars' },
    ];
    const randomItem = partnerItems[Math.floor(Math.random() * partnerItems.length)];
    const partnerName = friends[0]?.name.split(' ')[0] || 'Sarah';

    const newItem: GroceryItem = {
      id: `item_${Date.now()}_partner`,
      listId,
      name: randomItem.name,
      quantity: randomItem.quantity,
      unit: randomItem.unit,
      category: randomItem.category,
      isConcluded: false,
      addedBy: friends[0]?.userId || 'usr_partner',
      addedByName: partnerName,
      addedAt: new Date().toISOString(),
    };

    let modifiedList: GroceryList | undefined;

    const updated = lists.map(l => {
      if (l.id === listId) {
        modifiedList = {
          ...l,
          updatedAt: new Date().toISOString(),
          items: [newItem, ...l.items],
        };
        return modifiedList;
      }
      return l;
    });

    setLists(updated);
    saveStorageLists(updated);
    triggerHaptic('light');

    if (modifiedList) {
      saveCloudList(modifiedList).catch(err =>
        console.warn('[CloudSync] Failed to simulate partner activity in cloud:', err)
      );
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        lists,
        friends,
        friendRequests,
        pendingRequestsCount,
        isLoaded,
        cloudSyncState,
        cloudUser,
        createList,
        updateList,
        deleteList,
        addItem,
        updateItem,
        deleteItem,
        toggleConcludeItem,
        clearConcludedItems,
        sendFriendInvite,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        toggleListSharing,
        simulatePartnerActivity,
        signInWithEmail,
        signUpWithEmail,
        signInAnonymously,
        signOutCloud,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
