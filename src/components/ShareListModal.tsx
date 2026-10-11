import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GroceryList } from '../types';
import { useApp } from '../context/AppContext';
import { AddFriendModal } from './AddFriendModal';

interface ShareListModalProps {
  visible: boolean;
  list: GroceryList;
  onClose: () => void;
}

export const ShareListModal: React.FC<ShareListModalProps> = ({ visible, list, onClose }) => {
  const { friends, toggleListSharing, simulatePartnerActivity } = useApp();
  const [showAddFriend, setShowAddFriend] = useState(false);

  const isSharedWith = (friendId: string) => {
    return list.sharedWith.some(f => f.id === friendId);
  };

  const handleSimulate = () => {
    simulatePartnerActivity(list.id);
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="people" size={22} color="#10b981" />
              </View>
              <View style={styles.headerTitles}>
                <Text style={styles.title}>Share &ldquo;{list.title}&rdquo;</Text>
                <Text style={styles.subtitle}>
                  Choose family & friends who can view and edit this list
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* List of Friends */}
            <Text style={styles.sectionTitle}>Your Family & Friends</Text>
            {friends.length === 0 ? (
              <View style={styles.emptyFriends}>
                <Ionicons name="person-add-outline" size={32} color="#94a3b8" />
                <Text style={styles.emptyText}>You haven&apos;t added any family or friends yet.</Text>
              </View>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={item => item.id}
                style={styles.friendsList}
                renderItem={({ item }) => {
                  const shared = isSharedWith(item.id);
                  return (
                    <View style={styles.friendRow}>
                      <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
                        <Text style={styles.avatarText}>{item.name[0]}</Text>
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{item.name}</Text>
                        <Text style={styles.friendMeta}>
                          {item.relationship} • {item.email || item.phone}
                        </Text>
                      </View>
                      <Switch
                        value={shared}
                        onValueChange={() => toggleListSharing(list.id, item)}
                        trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                        thumbColor={shared ? '#16a34a' : '#f1f5f9'}
                      />
                    </View>
                  );
                }}
              />
            )}

            {/* Add New Contact button */}
            <TouchableOpacity
              style={styles.addContactBtn}
              onPress={() => setShowAddFriend(true)}
            >
              <Ionicons name="person-add-outline" size={18} color="#2563eb" />
              <Text style={styles.addContactText}>Invite New Family or Friend</Text>
            </TouchableOpacity>

            {/* Test Simulation Button */}
            {list.isShared && (
              <TouchableOpacity
                style={styles.simulateBtn}
                onPress={handleSimulate}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={16} color="#d97706" />
                <Text style={styles.simulateText}>
                  Simulate item added by {list.sharedWith[0]?.name.split(' ')[0] || 'Partner'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Done button */}
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AddFriendModal
        visible={showAddFriend}
        onClose={() => setShowAddFriend(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  friendsList: {
    maxHeight: 220,
  },
  emptyFriends: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  friendMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    gap: 8,
  },
  addContactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 6,
  },
  simulateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b45309',
  },
  doneBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
