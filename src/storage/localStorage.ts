import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Friend, FriendRequest, GroceryList } from '../types';

const STORAGE_KEYS = {
  USER: '@grocery_app_user',
  LISTS: '@grocery_app_lists',
  FRIENDS: '@grocery_app_friends',
  FRIEND_REQUESTS: '@grocery_app_friend_requests',
};

export const DEFAULT_USER: User = {
  id: 'usr_me_1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  phone: '+1 (555) 234-5678',
  avatarColor: '#2563eb',
};

const SEED_FRIENDS: Friend[] = [
  {
    id: 'frd_1',
    userId: 'usr_sarah_2',
    name: 'Sarah (Partner)',
    email: 'sarah.j@example.com',
    phone: '+1 (555) 876-5432',
    avatarColor: '#ec4899',
    relationship: 'Partner',
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'frd_2',
    userId: 'usr_mom_3',
    name: 'Mom (Family)',
    email: 'mom.j@example.com',
    phone: '+1 (555) 345-6789',
    avatarColor: '#8b5cf6',
    relationship: 'Family',
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
];

const SEED_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'req_1',
    senderId: 'usr_david_4',
    senderName: 'David Miller (Roommate)',
    senderContact: '+1 (555) 432-1098',
    senderAvatarColor: '#10b981',
    receiverContact: DEFAULT_USER.email,
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
];

const SEED_LISTS: GroceryList[] = [
  {
    id: 'list_1',
    title: 'Weekly Family Groceries',
    description: 'Shared weekly staples & dinner ingredients',
    color: '#10b981',
    icon: 'cart',
    ownerId: DEFAULT_USER.id,
    ownerName: DEFAULT_USER.name,
    isShared: true,
    sharedWith: [SEED_FRIENDS[0]],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'item_1',
        listId: 'list_1',
        name: 'Whole Organic Milk',
        quantity: 1,
        unit: 'gal',
        category: 'Dairy & Refrigerated',
        isConcluded: false,
        addedBy: DEFAULT_USER.id,
        addedByName: 'Alex',
        addedAt: new Date().toISOString(),
        notes: 'Red cap preferred',
      },
      {
        id: 'item_2',
        listId: 'list_1',
        name: 'Honeycrisp Apples',
        quantity: 6,
        unit: 'pcs',
        category: 'Produce',
        isConcluded: false,
        addedBy: 'usr_sarah_2',
        addedByName: 'Sarah',
        addedAt: new Date().toISOString(),
      },
      {
        id: 'item_3',
        listId: 'list_1',
        name: 'Sourdough Loaf',
        quantity: 1,
        unit: 'loaf',
        category: 'Bakery',
        isConcluded: true,
        concludedBy: 'Sarah',
        concludedAt: new Date().toISOString(),
        addedBy: 'usr_sarah_2',
        addedByName: 'Sarah',
        addedAt: new Date().toISOString(),
      },
      {
        id: 'item_4',
        listId: 'list_1',
        name: 'Chicken Breasts',
        quantity: 2,
        unit: 'lbs',
        category: 'Meat & Seafood',
        isConcluded: false,
        addedBy: DEFAULT_USER.id,
        addedByName: 'Alex',
        addedAt: new Date().toISOString(),
      },
      {
        id: 'item_5',
        listId: 'list_1',
        name: 'Ground Espresso Coffee',
        quantity: 1,
        unit: 'bag',
        category: 'Beverages',
        isConcluded: false,
        addedBy: DEFAULT_USER.id,
        addedByName: 'Alex',
        addedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'list_2',
    title: 'Trader Joe’s Snacks (Personal)',
    description: 'Personal favorite snacks & treats',
    color: '#f59e0b',
    icon: 'happy',
    ownerId: DEFAULT_USER.id,
    ownerName: DEFAULT_USER.name,
    isShared: false,
    sharedWith: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'item_6',
        listId: 'list_2',
        name: 'Dark Chocolate Peanut Butter Cups',
        quantity: 2,
        unit: 'tubs',
        category: 'Snacks',
        isConcluded: false,
        addedBy: DEFAULT_USER.id,
        addedByName: 'Alex',
        addedAt: new Date().toISOString(),
      },
      {
        id: 'item_7',
        listId: 'list_2',
        name: 'Pork & Ginger Soup Dumplings',
        quantity: 3,
        unit: 'boxes',
        category: 'Frozen',
        isConcluded: false,
        addedBy: DEFAULT_USER.id,
        addedByName: 'Alex',
        addedAt: new Date().toISOString(),
      },
      {
        id: 'item_8',
        listId: 'list_2',
        name: 'Everything Bagel Dip',
        quantity: 1,
        unit: 'tub',
        category: 'Dairy & Refrigerated',
        isConcluded: true,
        concludedBy: 'Alex',
        concludedAt: new Date().toISOString(),
        addedBy: DEFAULT_USER.id,
        addedByName: 'Alex',
        addedAt: new Date().toISOString(),
      },
    ],
  },
];

export async function loadStorageData() {
  try {
    const [storedUser, storedLists, storedFriends, storedRequests] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.USER),
      AsyncStorage.getItem(STORAGE_KEYS.LISTS),
      AsyncStorage.getItem(STORAGE_KEYS.FRIENDS),
      AsyncStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS),
    ]);

    const user: User = storedUser ? JSON.parse(storedUser) : DEFAULT_USER;
    const lists: GroceryList[] = storedLists ? JSON.parse(storedLists) : SEED_LISTS;
    const friends: Friend[] = storedFriends ? JSON.parse(storedFriends) : SEED_FRIENDS;
    const friendRequests: FriendRequest[] = storedRequests
      ? JSON.parse(storedRequests)
      : SEED_FRIEND_REQUESTS;

    return { user, lists, friends, friendRequests };
  } catch (err) {
    console.error('Failed to load storage data:', err);
    return {
      user: DEFAULT_USER,
      lists: SEED_LISTS,
      friends: SEED_FRIENDS,
      friendRequests: SEED_FRIEND_REQUESTS,
    };
  }
}

export async function saveStorageLists(lists: GroceryList[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
  } catch (err) {
    console.error('Failed to save lists:', err);
  }
}

export async function saveStorageFriends(friends: Friend[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends));
  } catch (err) {
    console.error('Failed to save friends:', err);
  }
}

export async function saveStorageFriendRequests(requests: FriendRequest[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(requests));
  } catch (err) {
    console.error('Failed to save friend requests:', err);
  }
}

export async function saveStorageUser(user: User) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save user:', err);
  }
}
