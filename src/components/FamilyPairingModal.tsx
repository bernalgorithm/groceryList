import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

interface FamilyPairingModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FamilyPairingModal: React.FC<FamilyPairingModalProps> = ({ visible, onClose }) => {
  const {
    user,
    familyRoom,
    pairWithFamilyCode,
    createFamilyRoomWithCode,
    unpairFamily,
    generateNewFamilyCode,
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(() => user.familyCode || generateNewFamilyCode());

  const activeCode = user.familyCode || generatedCode;

  const handleCopyCode = async () => {
    try {
      await Share.share({
        message: `Join our grocery list! Here is our family pairing code: ${activeCode}`,
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignored
    }
  };

  const handleJoinCode = async () => {
    const trimmed = inputCode.trim();
    if (!trimmed) {
      Alert.alert('Please enter a code', 'Type or paste the pairing code from your partner.');
      return;
    }
    setLoading(true);
    try {
      const room = await pairWithFamilyCode(trimmed);
      setInputCode('');
      Alert.alert(
        'Connected!',
        `Your app is now linked to family room "${room.code}". Lists and items will sync automatically with zero conflict.`
      );
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect. Please check the code and try again.';
      Alert.alert('Pairing Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateGeneratedCode = async () => {
    setLoading(true);
    try {
      const room = await createFamilyRoomWithCode(activeCode);
      Alert.alert(
        'Family Room Active!',
        `Your pairing code is ${room.code}. Share this with your partner so they can join.`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to activate code.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = () => {
    const next = generateNewFamilyCode();
    setGeneratedCode(next);
  };

  const handleUnpair = () => {
    Alert.alert(
      'Unpair Devices?',
      'Your phone will no longer receive live updates from this family room. Your local lists will remain on your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpair',
          style: 'destructive',
          onPress: async () => {
            await unpairFamily();
            const newCode = generateNewFamilyCode();
            setGeneratedCode(newCode);
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="people" size={24} color="#10b981" />
              <Text style={styles.headerTitle}>Partner & Family Sync</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {user.familyCode ? (
              /* ALREADY PAIRED STATE */
              <View>
                <View style={styles.pairedBanner}>
                  <View style={styles.pairedIconCircle}>
                    <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
                  </View>
                  <Text style={styles.pairedTitle}>Paired with Partner</Text>
                  <Text style={styles.pairedSubtitle}>
                    All your shared lists and items synchronize automatically in real time with collision-free item sync.
                  </Text>

                  <View style={styles.codeCard}>
                    <Text style={styles.codeLabel}>YOUR FAMILY ROOM CODE</Text>
                    <Text style={styles.codeValue}>{user.familyCode}</Text>
                  </View>

                  {/* Connected Members */}
                  {familyRoom?.memberNames && familyRoom.memberNames.length > 0 && (
                    <View style={styles.membersContainer}>
                      <Text style={styles.membersTitle}>
                        CONNECTED MEMBERS ({familyRoom.memberNames.length})
                      </Text>
                      <View style={styles.membersRow}>
                        {familyRoom.memberNames.map((name, idx) => (
                          <View key={idx} style={styles.memberBadge}>
                            <Ionicons name="person" size={12} color="#16a34a" />
                            <Text style={styles.memberName}>{name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <TouchableOpacity style={styles.shareBtn} onPress={handleCopyCode}>
                    <Ionicons name="share-social-outline" size={18} color="#ffffff" />
                    <Text style={styles.shareBtnText}>
                      {copied ? 'Link Shared!' : 'Share Code with Partner'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.unpairBtn} onPress={handleUnpair}>
                  <Ionicons name="link-outline" size={16} color="#ef4444" />
                  <Text style={styles.unpairBtnText}>Disconnect from this Family Code</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* NOT PAIRED YET - OPTION TO CREATE OR JOIN */
              <View>
                <Text style={styles.introText}>
                  Sync grocery lists between you and your partner over the cloud. Safe for thousands of users with zero login friction.
                </Text>

                {/* Section A: Share your code */}
                <View style={styles.card}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeader}>OPTION 1: SHARE YOUR CODE</Text>
                    <TouchableOpacity onPress={handleRegenerateCode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="refresh" size={16} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardDesc}>
                    Give this collision-resistant pairing code to your partner to enter on their phone:
                  </Text>

                  <View style={styles.codeBox}>
                    <Text style={styles.generatedCodeText}>{activeCode}</Text>
                  </View>

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { flex: 1 }]}
                      onPress={handleActivateGeneratedCode}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons name="key" size={16} color="#ffffff" />
                          <Text style={styles.primaryBtnText}>Activate This Room</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryBtn} onPress={handleCopyCode}>
                      <Ionicons name="share-outline" size={18} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Section B: Enter partner's code */}
                <View style={[styles.card, { marginTop: 14 }]}>
                  <Text style={styles.sectionHeader}>{"OPTION 2: ENTER PARTNER'S CODE"}</Text>
                  <Text style={styles.cardDesc}>
                    If your partner already generated a code, enter it below:
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="e.g. K9P-4X2"
                    placeholderTextColor="#94a3b8"
                    value={inputCode}
                    onChangeText={setInputCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />

                  <TouchableOpacity
                    style={styles.connectBtn}
                    onPress={handleJoinCode}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="link" size={18} color="#ffffff" />
                        <Text style={styles.connectBtnText}>Connect to Partner</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  introText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 12,
  },
  codeBox: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  generatedCodeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 3,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#e2e8f0',
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  connectBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  connectBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pairedBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  pairedIconCircle: {
    marginBottom: 8,
  },
  pairedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 4,
  },
  pairedSubtitle: {
    fontSize: 13,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  codeCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 14,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  codeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 2,
  },
  membersContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    alignItems: 'center',
  },
  membersTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  membersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  memberName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  shareBtn: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  unpairBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  unpairBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
