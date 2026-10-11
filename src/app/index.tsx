import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { GroceryList } from '../types';
import { CreateListModal } from '../components/CreateListModal';

type FilterType = 'all' | 'shared' | 'personal';

export default function HomeScreen() {
  const { lists, pendingRequestsCount } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigation = useNavigation();

  // Set up header right button with pending friend request badge
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push('/friends')}
          style={styles.friendsHeaderBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="people-outline" size={24} color="#0f172a" />
          {pendingRequestsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRequestsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, pendingRequestsCount]);

  const filteredLists = lists.filter(l => {
    if (filter === 'shared') return l.isShared;
    if (filter === 'personal') return !l.isShared;
    return true;
  });

  const renderListCard = ({ item }: { item: GroceryList }) => {
    const totalItems = item.items.length;
    const concludedItems = item.items.filter(i => i.isConcluded).length;
    const progress = totalItems > 0 ? (concludedItems / totalItems) * 100 : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push(`/list/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
            <Ionicons name={item.icon as any} size={20} color="#ffffff" />
          </View>
          <View style={styles.cardTitles}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.cardDescription} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </View>

        {/* Share status & collaborators */}
        <View style={styles.collaboratorsRow}>
          {item.isShared ? (
            <View style={styles.sharedBadge}>
              <Ionicons name="people" size={13} color="#16a34a" />
              <Text style={styles.sharedBadgeText}>
                Shared ({item.sharedWith.length + 1})
              </Text>
              <View style={styles.avatarsPreview}>
                {item.sharedWith.slice(0, 3).map((f, i) => (
                  <View
                    key={f.id}
                    style={[
                      styles.collabAvatar,
                      { backgroundColor: f.avatarColor, marginLeft: i > 0 ? -6 : 4 },
                    ]}
                  >
                    <Text style={styles.collabAvatarText}>{f.name[0]}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.personalBadge}>
              <Ionicons name="lock-closed" size={12} color="#64748b" />
              <Text style={styles.personalBadgeText}>Personal list</Text>
            </View>
          )}

          <Text style={styles.itemCountText}>
            {concludedItems}/{totalItems} items done
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progress}%`, backgroundColor: item.color },
            ]}
          />
        </View>

        {/* Recent items preview */}
        {totalItems > 0 && (
          <View style={styles.previewContainer}>
            {item.items.slice(0, 3).map(it => (
              <View key={it.id} style={styles.previewItem}>
                <Ionicons
                  name={it.isConcluded ? 'checkmark-circle' : 'ellipse-outline'}
                  size={12}
                  color={it.isConcluded ? '#16a34a' : '#94a3b8'}
                />
                <Text
                  style={[
                    styles.previewText,
                    it.isConcluded && styles.previewTextConcluded,
                  ]}
                  numberOfLines={1}
                >
                  {it.name}
                </Text>
              </View>
            ))}
            {totalItems > 3 && (
              <Text style={styles.moreItemsText}>+{totalItems - 3} more</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Segmented Filter Pills */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({lists.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, filter === 'shared' && styles.filterPillActive]}
          onPress={() => setFilter('shared')}
        >
          <Ionicons
            name="people"
            size={13}
            color={filter === 'shared' ? '#ffffff' : '#64748b'}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.filterText, filter === 'shared' && styles.filterTextActive]}>
            Shared ({lists.filter(l => l.isShared).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, filter === 'personal' && styles.filterPillActive]}
          onPress={() => setFilter('personal')}
        >
          <Ionicons
            name="lock-closed"
            size={12}
            color={filter === 'personal' ? '#ffffff' : '#64748b'}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.filterText, filter === 'personal' && styles.filterTextActive]}>
            Personal ({lists.filter(l => !l.isShared).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lists Feed */}
      <FlatList
        data={filteredLists}
        keyExtractor={item => item.id}
        renderItem={renderListCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cart-outline" size={48} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No grocery lists found</Text>
            <Text style={styles.emptySubtitle}>
              Tap the button below to start your first shopping list or collaborate with family!
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
        <Text style={styles.fabText}>New List</Text>
      </TouchableOpacity>

      {/* Create List Modal */}
      <CreateListModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onListCreated={listId => router.push(`/list/${listId}`)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  friendsHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 6,
    backgroundColor: '#ef4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitles: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  collaboratorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sharedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    marginLeft: 4,
  },
  avatarsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collabAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  collabAvatarText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '700',
  },
  personalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  personalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  previewContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewText: {
    fontSize: 12,
    color: '#475569',
  },
  previewTextConcluded: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  moreItemsText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    alignSelf: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    gap: 6,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
