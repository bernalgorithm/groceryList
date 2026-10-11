import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { ListMode } from '../types';

interface ModeToggleProps {
  mode: ListMode;
  onModeChange: (mode: ListMode) => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onModeChange }) => {
  // Keep screen awake while in shopping mode so the phone doesn't sleep in the aisle
  useEffect(() => {
    if (mode === 'shopping') {
      activateKeepAwakeAsync('shopping-mode').catch(() => {});
    } else {
      deactivateKeepAwake('shopping-mode').catch(() => {});
    }

    return () => {
      deactivateKeepAwake('shopping-mode').catch(() => {});
    };
  }, [mode]);

  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, mode === 'edit' && styles.activeSegmentEdit]}
          onPress={() => onModeChange('edit')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="pencil"
            size={16}
            color={mode === 'edit' ? '#2563eb' : '#64748b'}
            style={styles.icon}
          />
          <Text style={[styles.segmentText, mode === 'edit' && styles.activeTextEdit]}>
            Edit Mode
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segment, mode === 'shopping' && styles.activeSegmentShop]}
          onPress={() => onModeChange('shopping')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="cart"
            size={17}
            color={mode === 'shopping' ? '#16a34a' : '#64748b'}
            style={styles.icon}
          />
          <Text style={[styles.segmentText, mode === 'shopping' && styles.activeTextShop]}>
            Shopping Mode
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'shopping' ? (
        <View style={styles.shoppingBanner}>
          <Ionicons name="lock-closed" size={14} color="#15803d" />
          <Text style={styles.bannerText}>
            List is <Text style={styles.bold}>immutable</Text>. Tap any item to conclude it. Screen stays awake.
          </Text>
        </View>
      ) : (
        <View style={styles.editBanner}>
          <Ionicons name="create-outline" size={14} color="#1d4ed8" />
          <Text style={styles.editBannerText}>
            Add, remove, or organize grocery items.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 3,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
  },
  activeSegmentEdit: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeSegmentShop: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    marginRight: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTextEdit: {
    color: '#2563eb',
    fontWeight: '700',
  },
  activeTextShop: {
    color: '#16a34a',
    fontWeight: '700',
  },
  shoppingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 8,
  },
  bannerText: {
    fontSize: 12,
    color: '#15803d',
    marginLeft: 6,
    flex: 1,
  },
  bold: {
    fontWeight: '700',
  },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  editBannerText: {
    fontSize: 12,
    color: '#1e40af',
    marginLeft: 6,
    flex: 1,
  },
});
