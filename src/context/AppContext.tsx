import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { User, Friend, FriendRequest, GroceryList, GroceryItem, GroceryCategory } from '../types';
import {
  DEFAULT_USER,
  loadStorageData,
  saveStorageLists,
  saveStorageFriends,
  saveStorageFriendRequests,
} from '../storage/localStorage';
import { sendInviteMessage } from '../utils/invites';
import { autoDetectCategory } from '../utils/categories';

interface AppContextType {
  user: User;
  lists: GroceryList[];
  friends: Friend[];
  friendRequests: FriendRequest[];
  pendingRequestsCount: number;
  isLoaded: boolean;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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
    const newList: GroceryList = {
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: data.title,
      description: data.description,
      color: data.color || '#10b981',
      icon: data.icon || 'cart',
      ownerId: user.id,
      ownerName: user.name,
      isShared: !!data.isShared,
      sharedWith: data.sharedWith || [],
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newList, ...lists];
    setLists(updated);
    saveStorageLists(updated);
    return newList;
  };

  const updateList = (updatedList: GroceryList) => {
    const updated = lists.map(l => (l.id === updatedList.id ? { ...updatedList, updatedAt: new Date().toISOString() } : l));
    setLists(updated);
    saveStorageLists(updated);
  };

  const deleteList = (listId: string) => {
    const updated = lists.filter(l => l.id !== listId);
    setLists(updated);
    saveStorageLists(updated);
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
      addedBy: user.id,
      addedByName: user.name.split(' ')[0],
      addedAt: new Date().toISOString(),
    };

    const updated = lists.map(l => {
      if (l.id === listId) {
        return {
          ...l,
          updatedAt: new Date().toISOString(),
          items: [newItem, ...l.items],
        };
      }
      return l;
    });

    setLists(updated);
    saveStorageLists(updated);
    triggerHaptic('light');
  };

  const updateItem = (listId: string, updatedItem: GroceryItem) => {
    const updated = lists.map(l => {
      if (l.id === listId) {
        return {
          ...l,
          updatedAt: new Date().toISOString(),
          items: l.items.map(it => (it.id === updatedItem.id ? updatedItem : it)),
        };
      }
      return l;
    });
    setLists(updated);
    saveStorageLists(updated);
  };

  const deleteItem = (listId: string, itemId: string) => {
    const updated = lists.map(l => {
      if (l.id === listId) {
        return {
          ...l,
          updatedAt: new Date().toISOString(),
          items: l.items.filter(it => it.id !== itemId),
        };
      }
      return l;
    });
    setLists(updated);
    saveStorageLists(updated);
    triggerHaptic('light');
  };

  const toggleConcludeItem = (listId: string, itemId: string) => {
    let nowConcluded = false;
    const updated = lists.map(l => {
      if (l.id === listId) {
        return {
          ...l,
          updatedAt: new Date().toISOString(),
          items: l.items.map(it => {
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
          }),
        };
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
  };

  const clearConcludedItems = (listId: string) => {
    const updated = lists.map(l => {
      if (l.id === listId) {
        return {
          ...l,
          updatedAt: new Date().toISOString(),
          items: l.items.filter(it => !it.isConcluded),
        };
      }
      return l;
    });
    setLists(updated);
    saveStorageLists(updated);
  };

  const sendFriendInvite = async (contact: string, relationship: Friend['relationship']) => {
    const result = await sendInviteMessage({
      contact,
      senderName: user.name,
    });

    // Also register pending outgoing request locally
    const newRequest: FriendRequest = {
      id: `req_${Date.now()}`,
      senderId: user.id,
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
  };

  const rejectFriendRequest = (requestId: string) => {
    const updatedRequests = friendRequests.map(r =>
      r.id === requestId ? { ...r, status: 'rejected' as const } : r
    );
    setFriendRequests(updatedRequests);
    saveStorageFriendRequests(updatedRequests);
  };

  const removeFriend = (friendId: string) => {
    const updatedFriends = friends.filter(f => f.id !== friendId);
    setFriends(updatedFriends);
    saveStorageFriends(updatedFriends);

    // Also remove from any shared lists
    const updatedLists = lists.map(l => ({
      ...l,
      sharedWith: l.sharedWith.filter(f => f.id !== friendId),
      isShared: l.sharedWith.filter(f => f.id !== friendId).length > 0,
    }));
    setLists(updatedLists);
    saveStorageLists(updatedLists);
  };

  const toggleListSharing = (listId: string, friend: Friend) => {
    const updated = lists.map(l => {
      if (l.id === listId) {
        const isAlreadyShared = l.sharedWith.some(f => f.id === friend.id);
        const updatedShared = isAlreadyShared
          ? l.sharedWith.filter(f => f.id !== friend.id)
          : [...l.sharedWith, friend];
        return {
          ...l,
          isShared: updatedShared.length > 0,
          sharedWith: updatedShared,
          updatedAt: new Date().toISOString(),
        };
      }
      return l;
    });
    setLists(updated);
    saveStorageLists(updated);
  };

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

    const updated = lists.map(l => {
      if (l.id === listId) {
        return {
          ...l,
          updatedAt: new Date().toISOString(),
          items: [newItem, ...l.items],
        };
      }
      return l;
    });

    setLists(updated);
    saveStorageLists(updated);
    triggerHaptic('light');
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
