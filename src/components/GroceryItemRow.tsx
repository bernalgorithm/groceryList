import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GroceryItem, ListMode } from '../types';
import { getCategoryInfo } from '../utils/categories';

interface GroceryItemRowProps {
  item: GroceryItem;
  mode: ListMode;
  onToggleConcluded: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onUpdateQuantity?: (itemId: string, newQuantity: number) => void;
}

export const GroceryItemRow: React.FC<GroceryItemRowProps> = ({
  item,
  mode,
  onToggleConcluded,
  onDeleteItem,
  onUpdateQuantity,
}) => {
  const categoryInfo = getCategoryInfo(item.category);
  const isShopping = mode === 'shopping';

  // In Shopping Mode, tapping anywhere on the row toggles concluded
  const handleRowPress = () => {
    onToggleConcluded(item.id);
  };

  return (
    <TouchableOpacity
      activeOpacity={isShopping ? 0.6 : 0.95}
      onPress={isShopping ? handleRowPress : undefined}
      style={[
        styles.container,
        isShopping ? styles.shoppingContainer : styles.editContainer,
        item.isConcluded && styles.concludedContainer,
      ]}
    >
      {/* Checkbox / Concluded indicator */}
      <TouchableOpacity
        style={[
          styles.checkbox,
          item.isConcluded ? styles.checkboxChecked : styles.checkboxUnchecked,
          isShopping && styles.shoppingCheckbox,
        ]}
        onPress={() => onToggleConcluded(item.id)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        {item.isConcluded && (
          <Ionicons
            name="checkmark"
            size={isShopping ? 20 : 16}
            color="#ffffff"
          />
        )}
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text
            style={[
              styles.nameText,
              isShopping && styles.shoppingNameText,
              item.isConcluded && styles.concludedNameText,
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>

          {/* Quantity & Unit */}
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>
              {item.quantity} {item.unit}
            </Text>
          </View>
        </View>

        {/* Metadata row */}
        <View style={styles.metaRow}>
          {/* Category Chip */}
          <View style={[styles.categoryChip, { backgroundColor: categoryInfo.bgColor }]}>
            <Ionicons
              name={categoryInfo.icon as any}
              size={11}
              color={categoryInfo.color}
              style={styles.categoryIcon}
            />
            <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
              {item.category}
            </Text>
          </View>

          {/* Concluded By indicator */}
          {item.isConcluded && item.concludedBy && (
            <View style={styles.concludedByTag}>
              <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
              <Text style={styles.concludedByText}>Done by {item.concludedBy}</Text>
            </View>
          )}

          {/* Added By indicator */}
          {!item.isConcluded && item.addedByName && (
            <Text style={styles.addedByText}>Added by {item.addedByName}</Text>
          )}

          {/* Notes indicator */}
          {item.notes ? (
            <Text style={styles.notesText} numberOfLines={1}>
              • {item.notes}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Edit Mode actions: Quantity stepper & Delete */}
      {!isShopping && (
        <View style={styles.editActions}>
          {onUpdateQuantity && (
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                onPress={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                style={styles.stepButton}
              >
                <Ionicons name="remove" size={14} color="#475569" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
                style={styles.stepButton}
              >
                <Ionicons name="add" size={14} color="#475569" />
              </TouchableOpacity>
            </View>
          )}

          {onDeleteItem && (
            <TouchableOpacity
              onPress={() => onDeleteItem(item.id)}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  shoppingContainer: {
    paddingVertical: 14,
    minHeight: 64,
  },
  editContainer: {
    paddingVertical: 10,
    minHeight: 56,
  },
  concludedContainer: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    opacity: 0.65,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  shoppingCheckbox: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  checkboxUnchecked: {
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    paddingRight: 8,
  },
  shoppingNameText: {
    fontSize: 17,
    fontWeight: '600',
  },
  concludedNameText: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  quantityBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryIcon: {
    marginRight: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  concludedByTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  concludedByText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
  },
  addedByText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  notesText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 8,
  },
  stepperContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
  },
});
