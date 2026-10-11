import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { GroceryList, FriendRequest, Friend } from '../types';

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
    familyCode: list.familyCode ? list.familyCode.toUpperCase().trim() : undefined,
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
        // Sort newest first
        cloudLists.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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
    const listsCol = collection(db, 'lists');
    const listsQuery = query(listsCol, where('familyCode', '==', familyCode.toUpperCase().trim()));

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
 * Register or join a family room in Firestore
 */
export const registerFamilyRoom = async (
  familyCode: string,
  user: { id: string; name: string }
): Promise<void> => {
  if (!isFirebaseConfigured() || !db) return;
  const roomRef = doc(db, 'familyRooms', familyCode.toUpperCase().trim());
  await setDoc(
    roomRef,
    {
      code: familyCode.toUpperCase().trim(),
      updatedAt: new Date().toISOString(),
      lastMember: user.name,
    },
    { merge: true }
  );
};

/**
 * Save or update an entire grocery list document in Firestore
 */
export const saveCloudList = async (list: GroceryList): Promise<void> => {
  if (!isFirebaseConfigured() || !db) return;
  const listToSave = prepareListForCloud(list);
  const docRef = doc(db, 'lists', list.id);
  await setDoc(docRef, listToSave, { merge: true });
};

/**
 * Delete a grocery list from Firestore
 */
export const deleteCloudList = async (listId: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) return;
  const docRef = doc(db, 'lists', listId);
  await deleteDoc(docRef);
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
    // Listen to incoming friend requests where receiver matches user's email/phone or sender matches userId
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
