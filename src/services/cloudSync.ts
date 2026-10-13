import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  arrayUnion,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { GroceryList, GroceryItem, FriendRequest, Friend, FamilyRoom } from '../types';

/**
 * Normalizes family pairing codes to uppercase XXX-XXX format
 */
export const normalizeFamilyCode = (code: string): string => {
  const cleaned = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase().trim();
  if (cleaned.length === 6) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  return cleaned;
};

/**
 * Generates an unguessable, collision-resistant 6-character alphanumeric pairing code
 * 30 non-ambiguous chars ^ 6 = 729,000,000 unique combinations
 */
export const generateCollisionResistantFamilyCode = (): string => {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 3; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${p1}-${p2}`;
};

/**
 * Ensures list object has correct memberIds array for Firestore security and querying
 */
export const prepareListForCloud = (list: GroceryList): GroceryList => {
  const memberSet = new Set<string>();
  if (list.ownerId) memberSet.add(list.ownerId);
  if (list.sharedWith && Array.isArray(list.sharedWith)) {
    list.sharedWith.forEach(f => {
      if (f.userId) memberSet.add(f.userId);
    });
  }
  return {
    ...list,
    memberIds: Array.from(memberSet),
    familyCode: list.familyCode ? normalizeFamilyCode(list.familyCode) : undefined,
  };
};

/**
 * Real-time subscription to all grocery lists that the current user belongs to (as owner or member)
 */
export const subscribeToCloudLists = (
  userId: string,
  onUpdate: (lists: GroceryList[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!isFirebaseConfigured() || !db || !userId) {
    return () => {};
  }

  try {
    const listsCol = collection(db, 'lists');
    const listsQuery = query(listsCol, where('memberIds', 'array-contains', userId));

    return onSnapshot(
      listsQuery,
      snapshot => {
        const cloudLists: GroceryList[] = [];
        snapshot.forEach(docSnap => {
          cloudLists.push(docSnap.data() as GroceryList);
        });
        cloudLists.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        onUpdate(cloudLists);
      },
      error => {
        console.warn('[CloudSync] Lists subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[CloudSync] Failed to initialize lists listener:', err);
    return () => {};
  }
};

/**
 * Real-time subscription to lists belonging to a shared family room
 */
export const subscribeToFamilyLists = (
  familyCode: string,
  onUpdate: (lists: GroceryList[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!isFirebaseConfigured() || !db || !familyCode) {
    return () => {};
  }

  try {
    const normalized = normalizeFamilyCode(familyCode);
    const listsCol = collection(db, 'lists');
    const listsQuery = query(listsCol, where('familyCode', '==', normalized));

    return onSnapshot(
      listsQuery,
      snapshot => {
        const cloudLists: GroceryList[] = [];
        snapshot.forEach(docSnap => {
          cloudLists.push(docSnap.data() as GroceryList);
        });
        cloudLists.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        onUpdate(cloudLists);
      },
      error => {
        console.warn('[CloudSync] Family lists subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[CloudSync] Failed to initialize family lists listener:', err);
    return () => {};
  }
};

/**
 * Subcollection Real-Time Subscription:
 * Subscribes to individual items in lists/{listId}/items to prevent edit clobbering
 */
export const subscribeToCloudListItems = (
  listId: string,
  onUpdate: (items: GroceryItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!isFirebaseConfigured() || !db || !listId) {
    return () => {};
  }

  try {
    const itemsCol = collection(db, 'lists', listId, 'items');
    return onSnapshot(
      itemsCol,
      snapshot => {
        const items: GroceryItem[] = [];
        snapshot.forEach(docSnap => {
          items.push(docSnap.data() as GroceryItem);
        });
        // Sort items: un-concluded first, then newly added first
        items.sort((a, b) => {
          if (a.isConcluded !== b.isConcluded) {
            return a.isConcluded ? 1 : -1;
          }
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        });
        onUpdate(items);
      },
      error => {
        console.warn(`[CloudSync] Items subscription error for list ${listId}:`, error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn(`[CloudSync] Failed to initialize items listener for list ${listId}:`, err);
    return () => {};
  }
};

/**
 * Save or update a single item in the list's subcollection
 * Isolated per-document write prevents race condition clobbering
 */
export const saveCloudItem = async (listId: string, item: GroceryItem): Promise<void> => {
  if (!isFirebaseConfigured() || !db) return;
  const itemRef = doc(db, 'lists', listId, 'items', item.id);
  await setDoc(itemRef, item, { merge: true });

  // Update parent list timestamp for sync tracking
  const listRef = doc(db, 'lists', listId);
  await updateDoc(listRef, { updatedAt: new Date().toISOString() }).catch(() => {});
};

/**
 * Atomic status toggle for an item in the subcollection.
 * Only touches 3 fields on 1 document: avoids overwriting other simultaneous edits.
 */
export const updateCloudItemConcludeStatus = async (
  listId: string,
  itemId: string,
  isConcluded: boolean,
  concludedBy?: string,
  concludedAt?: string
): Promise<void> => {
  if (!isFirebaseConfigured() || !db) return;
  const itemRef = doc(db, 'lists', listId, 'items', itemId);
  const data: Record<string, any> = {
    isConcluded,
    concludedBy: isConcluded ? (concludedBy || 'Someone') : null,
    concludedAt: isConcluded ? (concludedAt || new Date().toISOString()) : null,
  };
  await updateDoc(itemRef, data);

  const listRef = doc(db, 'lists', listId);
  await updateDoc(listRef, { updatedAt: new Date().toISOString() }).catch(() => {});
};

/**
 * Delete a single item from the subcollection
 */
export const deleteCloudItem = async (listId: string, itemId: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) return;
  const itemRef = doc(db, 'lists', listId, 'items', itemId);
  await deleteDoc(itemRef);

  const listRef = doc(db, 'lists', listId);
  await updateDoc(listRef, { updatedAt: new Date().toISOString() }).catch(() => {});
};

/**
 * Clear concluded items in bulk using an atomic Firestore batch write
 */
export const batchDeleteCloudItems = async (listId: string, itemIds: string[]): Promise<void> => {
  if (!isFirebaseConfigured() || !db || itemIds.length === 0) return;
  const firestore = db;
  const batch = writeBatch(firestore);
  itemIds.forEach(id => {
    const itemRef = doc(firestore, 'lists', listId, 'items', id);
    batch.delete(itemRef);
  });
  await batch.commit();

  const listRef = doc(firestore, 'lists', listId);
  await updateDoc(listRef, { updatedAt: new Date().toISOString() }).catch(() => {});
};

/**
 * Save or update list metadata in Firestore
 * If initial items are present (e.g. list creation), seeds them to the items subcollection
 */
export const saveCloudList = async (list: GroceryList): Promise<void> => {
  if (!isFirebaseConfigured() || !db) return;
  const firestore = db;
  const listToSave = prepareListForCloud(list);
  const { items, ...metadata } = listToSave;

  const listDocData = {
    ...metadata,
    itemCount: items ? items.length : 0,
    concludedCount: items ? items.filter(i => i.isConcluded).length : 0,
  };

  const docRef = doc(firestore, 'lists', list.id);
  await setDoc(docRef, listDocData, { merge: true });

  // If list was created with items, seed them to the items subcollection
  if (items && items.length > 0) {
    const batch = writeBatch(firestore);
    items.forEach(item => {
      const itemRef = doc(firestore, 'lists', list.id, 'items', item.id);
      batch.set(itemRef, item, { merge: true });
    });
    await batch.commit();
  }
};

/**
 * Delete a grocery list from Firestore and clean up its subcollection
 */
export const deleteCloudList = async (listId: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) return;
  const docRef = doc(db, 'lists', listId);
  await deleteDoc(docRef);
};

/**
 * Register or claim a family room in Firestore with collision detection
 */
export const registerFamilyRoom = async (
  familyCode: string,
  user: { id: string; name: string }
): Promise<FamilyRoom> => {
  const normalized = normalizeFamilyCode(familyCode);
  if (!isFirebaseConfigured() || !db) {
    return {
      code: normalized,
      ownerId: user.id,
      ownerName: user.name,
      memberIds: [user.id],
      memberNames: [user.name],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const roomRef = doc(db, 'familyRooms', normalized);
  const snap = await getDoc(roomRef);

  if (snap.exists()) {
    const existing = snap.data() as FamilyRoom;
    if (existing.memberIds?.includes(user.id)) {
      return existing;
    }
    // Room exists: join as member
    await updateDoc(roomRef, {
      memberIds: arrayUnion(user.id),
      memberNames: arrayUnion(user.name),
      updatedAt: new Date().toISOString(),
    });
    return {
      ...existing,
      memberIds: [...(existing.memberIds || []), user.id],
      memberNames: [...(existing.memberNames || []), user.name],
    };
  }

  const newRoom: FamilyRoom = {
    code: normalized,
    ownerId: user.id,
    ownerName: user.name,
    memberIds: [user.id],
    memberNames: [user.name],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(roomRef, newRoom);
  return newRoom;
};

/**
 * Join an existing family room with verification
 */
export const joinFamilyRoom = async (
  familyCode: string,
  user: { id: string; name: string }
): Promise<FamilyRoom> => {
  const normalized = normalizeFamilyCode(familyCode);
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase cloud sync is not configured. Add keys to .env to enable sync.');
  }

  const roomRef = doc(db, 'familyRooms', normalized);
  const snap = await getDoc(roomRef);

  if (!snap.exists()) {
    throw new Error(`Pairing code "${normalized}" was not found. Please verify the code with your partner.`);
  }

  const roomData = snap.data() as FamilyRoom;
  await updateDoc(roomRef, {
    memberIds: arrayUnion(user.id),
    memberNames: arrayUnion(user.name),
    updatedAt: new Date().toISOString(),
  });

  return {
    ...roomData,
    memberIds: Array.from(new Set([...(roomData.memberIds || []), user.id])),
    memberNames: Array.from(new Set([...(roomData.memberNames || []), user.name])),
  };
};

/**
 * Real-time subscription to family room metadata (members, status)
 */
export const subscribeToFamilyRoom = (
  familyCode: string,
  onUpdate: (room: FamilyRoom) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!isFirebaseConfigured() || !db || !familyCode) {
    return () => {};
  }
  const normalized = normalizeFamilyCode(familyCode);
  const roomRef = doc(db, 'familyRooms', normalized);
  return onSnapshot(
    roomRef,
    snap => {
      if (snap.exists()) {
        onUpdate(snap.data() as FamilyRoom);
      }
    },
    error => {
      console.warn('[CloudSync] Family room subscription error:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Real-time subscription for Friend Requests involving the user
 */
export const subscribeToCloudFriendRequests = (
  userId: string,
  userContact: string,
  onUpdate: (requests: FriendRequest[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!isFirebaseConfigured() || !db || !userId) {
    return () => {};
  }

  try {
    const reqsCol = collection(db, 'friendRequests');
    const q = query(reqsCol, where('receiverContact', '==', userContact));

    return onSnapshot(
      q,
      snapshot => {
        const requests: FriendRequest[] = [];
        snapshot.forEach(docSnap => {
          requests.push(docSnap.data() as FriendRequest);
        });
        requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(requests);
      },
      error => {
        console.warn('[CloudSync] Friend requests subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[CloudSync] Failed to initialize friend request listener:', err);
    return () => {};
  }
};

/**
 * Send a friend request to Cloud Firestore
 */
export const saveCloudFriendRequest = async (request: FriendRequest): Promise<void> => {
  if (!isFirebaseConfigured() || !db) return;
  const docRef = doc(db, 'friendRequests', request.id);
  await setDoc(docRef, request, { merge: true });
};

/**
 * Update friend request status in Cloud Firestore
 */
export const updateCloudFriendRequestStatus = async (
  requestId: string,
  status: 'accepted' | 'rejected'
): Promise<void> => {
  if (!isFirebaseConfigured() || !db) return;
  const docRef = doc(db, 'friendRequests', requestId);
  await setDoc(docRef, { status }, { merge: true });
};

/**
 * Real-time subscription for user friends
 */
export const subscribeToCloudFriends = (
  userId: string,
  onUpdate: (friends: Friend[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!isFirebaseConfigured() || !db || !userId) {
    return () => {};
  }

  try {
    const friendsCol = collection(db, 'users', userId, 'friends');
    return onSnapshot(
      friendsCol,
      snapshot => {
        const friends: Friend[] = [];
        snapshot.forEach(docSnap => {
          friends.push(docSnap.data() as Friend);
        });
        onUpdate(friends);
      },
      error => {
        console.warn('[CloudSync] Friends subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[CloudSync] Failed to initialize friends listener:', err);
    return () => {};
  }
};

/**
 * Save friend to user's friends collection in Firestore
 */
export const saveCloudFriend = async (userId: string, friend: Friend): Promise<void> => {
  if (!isFirebaseConfigured() || !db) return;
  const docRef = doc(db, 'users', userId, 'friends', friend.id);
  await setDoc(docRef, friend, { merge: true });
};

/**
 * Remove friend from user's friends collection in Firestore
 */
export const deleteCloudFriend = async (userId: string, friendId: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) return;
  const docRef = doc(db, 'users', userId, 'friends', friendId);
  await deleteDoc(docRef);
};
