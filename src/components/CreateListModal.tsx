import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Friend } from '../types';

interface CreateListModalProps {
  visible: boolean;
  onClose: () => void;
  onListCreated?: (listId: string) => void;
}

const COLORS = [
  '#10b981', // Emerald
  '#2563eb', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#64748b', // Slate
];

const ICONS = ['cart', 'basket', 'restaurant', 'nutrition', 'cafe', 'wine', 'happy', 'heart'];

export const CreateListModal: React.FC<CreateListModalProps> = ({
  visible,
  onClose,
  onListCreated,
}) => {
  const { friends, createList } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [isShared, setIsShared] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const handleToggleFriend = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a list name.');
      return;
    }

    const sharedWithFriends: Friend[] = isShared
      ? friends.filter(f => selectedFriends.includes(f.id))
      : [];

    const newList = createList({
      title: title.trim(),
      description: description.trim() || undefined,
      color: selectedColor,
      icon: selectedIcon,
      isShared,
      sharedWith: sharedWithFriends,
    });

    setTitle('');
    setDescription('');
    setIsShared(false);
    setSelectedFriends([]);
    onClose();

    if (onListCreated) {
      onListCreated(newList.id);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: selectedColor }]}>
              <Ionicons name={selectedIcon as any} size={22} color="#ffffff" />
            </View>
            <View style={styles.headerTitles}>
              <Text style={styles.title}>Create New List</Text>
              <Text style={styles.subtitle}>Personal or shared grocery list</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formBody} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <Text style={styles.label}>List Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Costco Run, Weekly Dinners, Party Snacks"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />

            {/* Description Input */}
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 44 }]}
              placeholder="e.g. For this weekend's BBQ"
              placeholderTextColor="#94a3b8"
              value={description}
              onChangeText={setDescription}
            />

            {/* Color Palette */}
            <Text style={styles.label}>Theme Color</Text>
            <View style={styles.colorPalette}>
              {COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorCircleSelected,
                  ]}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Icon Picker */}
            <Text style={styles.label}>Icon</Text>
            <View style={styles.iconRow}>
              {ICONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  style={[
                    styles.iconBox,
                    selectedIcon === icon && { borderColor: selectedColor, backgroundColor: '#f0fdf4' },
                  ]}
                >
                  <Ionicons
                    name={icon as any}
                    size={20}
                    color={selectedIcon === icon ? selectedColor : '#64748b'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Share toggle */}
            <View style={styles.shareToggleRow}>
              <View style={styles.shareTextContainer}>
                <Text style={styles.shareTitle}>Share with Family & Friends</Text>
                <Text style={styles.shareSubtitle}>
                  Allow collaborators to add and check off items
                </Text>
              </View>
              <Switch
                value={isShared}
                onValueChange={setIsShared}
                trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                thumbColor={isShared ? '#16a34a' : '#f1f5f9'}
              />
            </View>

            {/* If shared is enabled, show friends selector */}
            {isShared && (
              <View style={styles.friendsBox}>
                <Text style={styles.friendsBoxTitle}>Select Collaborators:</Text>
                {friends.length === 0 ? (
                  <Text style={styles.noFriendsNotice}>
                    No friends connected yet. You can invite family after creating the list.
                  </Text>
                ) : (
                  friends.map(friend => {
                    const checked = selectedFriends.includes(friend.id);
                    return (
                      <TouchableOpacity
                        key={friend.id}
                        onPress={() => handleToggleFriend(friend.id)}
                        style={styles.friendCheckRow}
                      >
                        <View style={[styles.avatarMini, { backgroundColor: friend.avatarColor }]}>
                          <Text style={styles.avatarMiniText}>{friend.name[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.friendCheckName}>{friend.name}</Text>
                          <Text style={styles.friendCheckRel}>{friend.relationship}</Text>
                        </View>
                        <Ionicons
                          name={checked ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={checked ? '#16a34a' : '#cbd5e1'}
                        />
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: selectedColor }, !title.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Text style={styles.saveBtnText}>Create List</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  formBody: {
    maxHeight: 400,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  colorPalette: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
    elevation: 3,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  shareTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  shareTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  shareSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  friendsBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  friendsBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  noFriendsNotice: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  friendCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarMiniText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  friendCheckName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  friendCheckRel: {
    fontSize: 11,
    color: '#64748b',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
