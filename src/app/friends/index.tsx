import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { AddFriendModal } from '../../components/AddFriendModal';
import { Friend } from '../../types';

export default function FriendsScreen() {
  const {
    user,
    friends,
    friendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    lists,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);

  const pendingRequests = friendRequests.filter(r => r.status === 'pending');

  const getSharedListCount = (friendId: string) => {
    return lists.filter(l => l.sharedWith.some(f => f.id === friendId)).length;
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert(
      'Remove Connection',
      `Remove ${friend.name} from your friends? They will no longer have access to shared lists.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFriend(friend.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={[styles.profileAvatar, { backgroundColor: user.avatarColor }]}>
            <Text style={styles.profileAvatarText}>{user.name[0]}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileContact}>{user.email}</Text>
            <Text style={styles.profileContact}>{user.phone}</Text>
          </View>
        </View>

        {/* Invite CTA Button */}
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.inviteIconCircle}>
            <Ionicons name="person-add" size={20} color="#2563eb" />
          </View>
          <View style={styles.inviteButtonTextContainer}>
            <Text style={styles.inviteButtonTitle}>Invite Family or Friends</Text>
            <Text style={styles.inviteButtonSubtitle}>
              Send a free SMS or email invite link
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#2563eb" />
        </TouchableOpacity>

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Friend Requests</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingRequests.length}</Text>
              </View>
            </View>

            {pendingRequests.map(req => (
              <View key={req.id} style={styles.requestCard}>
                <View
                  style={[styles.friendAvatar, { backgroundColor: req.senderAvatarColor }]}
                >
                  <Text style={styles.avatarText}>{req.senderName[0]}</Text>
                </View>
                <View style={styles.requestDetails}>
                  <Text style={styles.requestName}>{req.senderName}</Text>
                  <Text style={styles.requestContact}>{req.senderContact}</Text>
                  <Text style={styles.requestNote}>Wants to share grocery lists with you</Text>
                </View>

                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => acceptFriendRequest(req.id)}
                  >
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => rejectFriendRequest(req.id)}
                  >
                    <Ionicons name="close" size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Connected Family & Friends List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Family & Friends ({friends.length})</Text>

          {friends.length === 0 ? (
            <View style={styles.emptyFriendsCard}>
              <Ionicons name="people-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No friends connected yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your spouse, family members, or roommates to start sharing grocery lists and shopping together in real-time.
              </Text>
            </View>
          ) : (
            friends.map(friend => {
              const sharedCount = getSharedListCount(friend.id);
              return (
                <View key={friend.id} style={styles.friendCard}>
                  <View
                    style={[styles.friendAvatar, { backgroundColor: friend.avatarColor }]}
                  >
                    <Text style={styles.avatarText}>{friend.name[0]}</Text>
                  </View>

                  <View style={styles.friendDetails}>
                    <View style={styles.friendNameRow}>
                      <Text style={styles.friendName}>{friend.name}</Text>
                      <View style={styles.relBadge}>
                        <Text style={styles.relBadgeText}>{friend.relationship}</Text>
                      </View>
                    </View>
                    <Text style={styles.friendContact}>
                      {friend.email || friend.phone}
                    </Text>
                    <Text style={styles.sharedListsMeta}>
                      <Ionicons name="cart-outline" size={12} color="#16a34a" /> {sharedCount} shared {sharedCount === 1 ? 'list' : 'lists'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.removeFriendBtn}
                    onPress={() => handleRemoveFriend(friend)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="person-remove-outline" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Explanatory Info Card */}
        <View style={styles.howItWorksCard}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#0284c7" />
          <View style={{ flex: 1 }}>
            <Text style={styles.howItWorksTitle}>How Sharing Works</Text>
            <Text style={styles.howItWorksText}>
              • Lists in Edit Mode allow all collaborators to add, remove, or modify items.
              {'\n'}• Lists in Shopping Mode lock the items so nobody accidentally edits the list while shopping.
              {'\n'}• Anyone in Shopping Mode can tap items to mark them &quot;concluded&quot; in real-time.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add Friend Modal */}
      <AddFriendModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  profileContact: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  inviteIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inviteButtonTextContainer: {
    flex: 1,
  },
  inviteButtonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  inviteButtonSubtitle: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pendingBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  pendingBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  friendAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  requestDetails: {
    flex: 1,
  },
  requestName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  requestContact: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  requestNote: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: '500',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  declineBtn: {
    backgroundColor: '#e2e8f0',
    padding: 8,
    borderRadius: 8,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  friendDetails: {
    flex: 1,
  },
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  relBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  relBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  friendContact: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  sharedListsMeta: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 4,
  },
  removeFriendBtn: {
    padding: 8,
  },
  emptyFriendsCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  howItWorksCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginTop: 10,
  },
  howItWorksTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: 4,
  },
  howItWorksText: {
    fontSize: 12,
    color: '#0c4a6e',
    lineHeight: 18,
  },
});
