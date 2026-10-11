import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Friend } from '../types';
import { useApp } from '../context/AppContext';

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
}

const RELATIONSHIPS: Friend['relationship'][] = ['Family', 'Partner', 'Roommate', 'Friend'];

export const AddFriendModal: React.FC<AddFriendModalProps> = ({ visible, onClose }) => {
  const { sendFriendInvite } = useApp();
  const [contact, setContact] = useState('');
  const [relationship, setRelationship] = useState<Friend['relationship']>('Family');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!contact.trim()) {
      Alert.alert('Required', 'Please enter a phone number or email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await sendFriendInvite(contact.trim(), relationship);
      setLoading(false);
      setContact('');
      onClose();

      Alert.alert(
        'Invite Sent!',
        `Your invitation was sent via ${result.method === 'sms' ? 'text message' : result.method === 'email' ? 'email' : 'share sheet'}. Once connected, you can share grocery lists and shop together!`
      );
    } catch {
      setLoading(false);
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person-add" size={22} color="#2563eb" />
                </View>
                <View style={styles.headerTitles}>
                  <Text style={styles.title}>Add Family or Friend</Text>
                  <Text style={styles.subtitle}>
                    Invite them to collaborate on grocery lists
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Instructions banner */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color="#0369a1" />
                <Text style={styles.infoText}>
                  Enter their phone number or email. They&apos;ll receive an invitation to download the app or accept your friend request!
                </Text>
              </View>

              {/* Input */}
              <Text style={styles.label}>Phone Number or Email</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +1 (555) 000-0000 or friend@email.com"
                placeholderTextColor="#94a3b8"
                value={contact}
                onChangeText={setContact}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Relationship picker */}
              <Text style={styles.label}>Relationship</Text>
              <View style={styles.pillRow}>
                {RELATIONSHIPS.map(rel => {
                  const isSelected = relationship === rel;
                  return (
                    <TouchableOpacity
                      key={rel}
                      onPress={() => setRelationship(rel)}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {rel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Buttons */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sendBtn, !contact.trim() && styles.sendBtnDisabled]}
                  onPress={handleSend}
                  disabled={loading || !contact.trim()}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.sendBtnText}>Send Invite</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#0369a1',
    flex: 1,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 16,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextSelected: {
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
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
  sendBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
