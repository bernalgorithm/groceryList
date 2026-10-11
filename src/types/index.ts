export type ListMode = 'edit' | 'shopping';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarColor: string;
}

export interface Friend {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  avatarColor: string;
  relationship: 'Family' | 'Partner' | 'Roommate' | 'Friend';
  addedAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderContact: string;
  senderAvatarColor: string;
  receiverContact: string; // phone or email entered
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export type GroceryCategory =
  | 'Produce'
  | 'Dairy & Refrigerated'
  | 'Bakery'
  | 'Meat & Seafood'
  | 'Pantry & Canned'
  | 'Frozen'
  | 'Beverages'
  | 'Snacks'
  | 'Household'
  | 'Other';

export interface GroceryItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  category: GroceryCategory;
  isConcluded: boolean;
  concludedBy?: string;
  concludedAt?: string;
  addedBy: string;
  addedByName: string;
  addedAt: string;
  notes?: string;
}

export interface GroceryList {
  id: string;
  title: string;
  description?: string;
  color: string;
  icon: string;
  ownerId: string;
  ownerName: string;
  isShared: boolean;
  sharedWith: Friend[];
  memberIds?: string[];
  items: GroceryItem[];
  createdAt: string;
  updatedAt: string;
}

export type CloudSyncStatus = 'offline-local' | 'connecting' | 'synced' | 'error';

export interface CloudSyncState {
  isConfigured: boolean;
  status: CloudSyncStatus;
  lastSyncedAt?: string;
  errorMessage?: string;
}
