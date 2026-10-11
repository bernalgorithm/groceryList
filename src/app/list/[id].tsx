import React, { useState, useLayoutEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { ListMode, GroceryCategory } from '../../types';
import { ModeToggle } from '../../components/ModeToggle';
import { GroceryItemRow } from '../../components/GroceryItemRow';
import { ShareListModal } from '../../components/ShareListModal';
import { CATEGORIES, getCategoryInfo } from '../../utils/categories';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const {
    lists,
    addItem,
    updateItem,
    deleteItem,
    toggleConcludeItem,
    clearConcludedItems,
    deleteList,
    simulatePartnerActivity,
  } = useApp();

  const [mode, setMode] = useState<ListMode>('edit');
  const [showShareModal, setShowShareModal] = useState(false);

  // Quick Add Item inputs for Edit Mode
  const [newItemName, setNewItemName] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnit, setNewUnit] = useState('pcs');
  const [selectedCategory, setSelectedCategory] = useState<GroceryCategory | undefined>(undefined);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const currentList = lists.find(l => l.id === id);

  const handleListMenu = useCallback(() => {
    if (!currentList) return;
    Alert.alert(
      currentList.title,
      'List actions:',
      [
        {
          text: 'Clear Concluded Items',
          onPress: () => {
            clearConcludedItems(currentList.id);
          },
        },
        {
          text: 'Share with Friends/Family',
          onPress: () => setShowShareModal(true),
        },
        {
          text: 'Delete List',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete List?',
              `Are you sure you want to delete "${currentList.title}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    deleteList(currentList.id);
                    router.back();
                  },
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [currentList, clearConcludedItems, deleteList]);

  // Configure navigation header
  useLayoutEffect(() => {
    if (!currentList) return;
    navigation.setOptions({
      title: currentList.title,
      headerRight: () => (
        <View style={styles.headerRightButtons}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setShowShareModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentList.isShared ? 'people' : 'person-add-outline'}
              size={21}
              color={currentList.isShared ? '#16a34a' : '#0f172a'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleListMenu}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={21} color="#0f172a" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, currentList, handleListMenu]);

  const handleAddItem = () => {
    if (!newItemName.trim() || !currentList) return;
    addItem(currentList.id, {
      name: newItemName.trim(),
      quantity: newQuantity,
      unit: newUnit,
      category: selectedCategory,
    });
    setNewItemName('');
    setNewQuantity(1);
    setNewUnit('pcs');
    setSelectedCategory(undefined);
    setShowCategoryPicker(false);
  };

  const handleUpdateQuantity = (itemId: string, qty: number) => {
    if (!currentList) return;
    const item = currentList.items.find(i => i.id === itemId);
    if (item) {
      updateItem(currentList.id, { ...item, quantity: qty });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (!currentList) return;
    deleteItem(currentList.id, itemId);
  };

  // Group or sort items: In shopping mode, active items first, concluded at bottom
  const sortedItems = useMemo(() => {
    if (!currentList) return [];
    if (mode === 'shopping') {
      return [...currentList.items].sort((a, b) => {
        if (a.isConcluded === b.isConcluded) return 0;
        return a.isConcluded ? 1 : -1;
      });
    }
    return currentList.items;
  }, [currentList, mode]);

  if (!currentList) {
    return (
      <View style={styles.notFoundContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#94a3b8" />
        <Text style={styles.notFoundText}>Grocery list not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return to Lists</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalItems = currentList.items.length;
  const concludedCount = currentList.items.filter(i => i.isConcluded).length;
  const progressPercent = totalItems > 0 ? (concludedCount / totalItems) * 100 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.keyboardContainer}
      >
        {/* Top Control Bar: Mode Toggle & Banner */}
        <ModeToggle mode={mode} onModeChange={setMode} />

        {/* Progress & Collaboration Bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryStats}>
            <Text style={styles.progressText}>
              <Text style={styles.bold}>{concludedCount}</Text> of{' '}
              <Text style={styles.bold}>{totalItems}</Text> concluded ({Math.round(progressPercent)}%)
            </Text>
            {currentList.isShared && (
              <TouchableOpacity
                style={styles.sharedBadge}
                onPress={() => setShowShareModal(true)}
              >
                <Ionicons name="people" size={13} color="#15803d" />
                <Text style={styles.sharedBadgeText}>
                  Shared with {currentList.sharedWith.map(s => s.name.split(' ')[0]).join(', ') || 'Friends'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Clear completed button */}
          {concludedCount > 0 && (
            <TouchableOpacity
              onPress={() => clearConcludedItems(currentList.id)}
              style={styles.clearBtn}
            >
              <Ionicons name="checkmark-done" size={14} color="#64748b" />
              <Text style={styles.clearBtnText}>Clear Done</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Item List */}
        <FlatList
          data={sortedItems}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <GroceryItemRow
              item={item}
              mode={mode}
              onToggleConcluded={itemId => toggleConcludeItem(currentList.id, itemId)}
              onDeleteItem={mode === 'edit' ? handleDeleteItem : undefined}
              onUpdateQuantity={mode === 'edit' ? handleUpdateQuantity : undefined}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="basket-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Your list is empty</Text>
              <Text style={styles.emptySubtitle}>
                {mode === 'edit'
                  ? 'Use the bar below to add items to your grocery list.'
                  : 'Switch to Edit Mode above to add items.'}
              </Text>
            </View>
          }
        />

        {/* Edit Mode: Add Item Bar (Locked / Hidden in Shopping Mode) */}
        {mode === 'edit' ? (
          <View style={styles.addBarContainer}>
            {/* Category selection chips dropdown */}
            {showCategoryPicker && (
              <View style={styles.categoryPickerContainer}>
                <Text style={styles.categoryPickerTitle}>Assign Category:</Text>
                <View style={styles.categoriesWrap}>
                  {CATEGORIES.map(cat => {
                    const isSelected = selectedCategory === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.name}
                        onPress={() => {
                          setSelectedCategory(cat.name);
                          setShowCategoryPicker(false);
                        }}
                        style={[
                          styles.catChip,
                          { backgroundColor: cat.bgColor },
                          isSelected && styles.catChipSelected,
                        ]}
                      >
                        <Ionicons
                          name={cat.icon as any}
                          size={12}
                          color={cat.color}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.catChipText, { color: cat.color }]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.addBarRow}>
              {/* Category picker toggle button */}
              <TouchableOpacity
                style={[
                  styles.categoryToggleBtn,
                  selectedCategory && { backgroundColor: getCategoryInfo(selectedCategory).bgColor },
                ]}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Ionicons
                  name={
                    selectedCategory
                      ? (getCategoryInfo(selectedCategory).icon as any)
                      : 'pricetag-outline'
                  }
                  size={18}
                  color={
                    selectedCategory
                      ? getCategoryInfo(selectedCategory).color
                      : '#64748b'
                  }
                />
              </TouchableOpacity>

              {/* Text Input */}
              <TextInput
                style={styles.addInput}
                placeholder="Add item (e.g. Milk, Bananas)..."
                placeholderTextColor="#94a3b8"
                value={newItemName}
                onChangeText={setNewItemName}
                onSubmitEditing={handleAddItem}
                returnKeyType="done"
              />

              {/* Quantity Stepper */}
              <View style={styles.qtyControl}>
                <TouchableOpacity
                  onPress={() => setNewQuantity(Math.max(1, newQuantity - 1))}
                  style={styles.qtyBtn}
                >
                  <Ionicons name="remove" size={13} color="#475569" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{newQuantity}</Text>
                <TouchableOpacity
                  onPress={() => setNewQuantity(newQuantity + 1)}
                  style={styles.qtyBtn}
                >
                  <Ionicons name="add" size={13} color="#475569" />
                </TouchableOpacity>
              </View>

              {/* Add Button */}
              <TouchableOpacity
                style={[
                  styles.addButton,
                  !newItemName.trim() && styles.addButtonDisabled,
                ]}
                onPress={handleAddItem}
                disabled={!newItemName.trim()}
              >
                <Ionicons name="arrow-up" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Shopping Mode Bottom Bar */
          <View style={styles.shoppingBottomBar}>
            <View style={styles.shoppingBottomInfo}>
              <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
              <Text style={styles.shoppingBottomText}>
                List locked against accidental edits
              </Text>
            </View>
            {currentList.isShared && (
              <TouchableOpacity
                style={styles.partnerSimBtn}
                onPress={() => simulatePartnerActivity(currentList.id)}
              >
                <Ionicons name="sparkles" size={14} color="#d97706" />
                <Text style={styles.partnerSimText}>Simulate Partner Sync</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Share Modal */}
        <ShareListModal
          visible={showShareModal}
          list={currentList}
          onClose={() => setShowShareModal(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardContainer: {
    flex: 1,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 6,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  summaryStats: {
    flex: 1,
  },
  progressText: {
    fontSize: 13,
    color: '#334155',
  },
  bold: {
    fontWeight: '700',
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sharedBadgeText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    gap: 4,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 32,
  },
  addBarContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryPickerContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryPickerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  catChipSelected: {
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#0f172a',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  qtyBtn: {
    padding: 6,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    minWidth: 18,
    textAlign: 'center',
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  shoppingBottomBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shoppingBottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  shoppingBottomText: {
    fontSize: 13,
    color: '#15803d',
    fontWeight: '600',
  },
  partnerSimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 4,
  },
  partnerSimText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  backBtn: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
