import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

interface CloudSyncModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ visible, onClose }) => {
  const {
    cloudSyncState,
    cloudUser,
    signInWithEmail,
    signUpWithEmail,
    signInAnonymously,
    signOutCloud,
    lists,
  } = useApp();

  const [authMode, setAuthMode] = useState<'status' | 'signin' | 'signup'>('status');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithEmail(email.trim(), password);
      setAuthMode('status');
      Alert.alert('Signed In', 'Real-time cloud sync is now active with your account.');
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await signUpWithEmail(email.trim(), password, displayName.trim() || 'Shopper');
      setAuthMode('status');
      Alert.alert('Account Created', 'Your grocery lists are now syncing across all devices.');
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signInAnonymously();
      Alert.alert('Connected', 'Started anonymous cloud session. Your lists will sync in real time.');
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || 'Failed to connect anonymously.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of cloud sync?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOutCloud();
          setAuthMode('status');
        },
      },
    ]);
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
              <Ionicons name="cloud" size={24} color="#10b981" />
              <Text style={styles.headerTitle}>Cloud Sync & Collaboration</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Status Banner */}
            <View
              style={[
                styles.statusBanner,
                cloudSyncState.status === 'synced'
                  ? styles.statusSynced
                  : cloudSyncState.status === 'connecting'
                  ? styles.statusConnecting
                  : styles.statusOffline,
              ]}
            >
              <Ionicons
                name={
                  cloudSyncState.status === 'synced'
                    ? 'checkmark-circle'
                    : cloudSyncState.status === 'connecting'
                    ? 'sync'
                    : 'information-circle'
                }
                size={22}
                color={
                  cloudSyncState.status === 'synced'
                    ? '#15803d'
                    : cloudSyncState.status === 'connecting'
                    ? '#b45309'
                    : '#475569'
                }
              />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>
                  {cloudSyncState.status === 'synced'
                    ? 'Cloud Sync Active (Firestore)'
                    : cloudSyncState.status === 'connecting'
                    ? 'Connecting to Cloud...'
                    : 'Offline / Local-First Mode'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {cloudSyncState.status === 'synced'
                    ? 'Lists and items synchronize in real-time across family members and devices.'
                    : cloudSyncState.status === 'connecting'
                    ? 'Establishing real-time listeners...'
                    : 'Working 100% offline with on-device SQLite / AsyncStorage.'}
                </Text>
              </View>
            </View>

            {/* Error Message if any */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* If Firebase credentials not provided in .env */}
            {!cloudSyncState.isConfigured ? (
              <View style={styles.configGuideCard}>
                <View style={styles.configHeader}>
                  <Ionicons name="flash-outline" size={20} color="#3b82f6" />
                  <Text style={styles.configTitle}>Zero-Maintenance Serverless Sync</Text>
                </View>
                <Text style={styles.configDesc}>
                  The app is currently running in local storage mode. To activate real-time multi-device cloud synchronization:
                </Text>
                <View style={styles.stepRow}>
                  <Text style={styles.stepNum}>1</Text>
                  <Text style={styles.stepText}>
                    Create a free project at <Text style={styles.boldText}>console.firebase.google.com</Text>
                  </Text>
                </View>
                <View style={styles.stepRow}>
                  <Text style={styles.stepNum}>2</Text>
                  <Text style={styles.stepText}>
                    Enable <Text style={styles.boldText}>Cloud Firestore</Text> and <Text style={styles.boldText}>Authentication</Text>
                  </Text>
                </View>
                <View style={styles.stepRow}>
                  <Text style={styles.stepNum}>3</Text>
                  <Text style={styles.stepText}>
                    Copy <Text style={styles.codeText}>.env.example</Text> to <Text style={styles.codeText}>.env</Text> and fill in your Firebase API keys.
                  </Text>
                </View>
                <View style={styles.noteBox}>
                  <Ionicons name="shield-checkmark" size={16} color="#059669" />
                  <Text style={styles.noteText}>
                    Offline Guarantee: Even with cloud sync, all data remains cached on device for seamless grocery trips with zero cell service.
                  </Text>
                </View>
              </View>
            ) : (
              /* When Firebase IS configured */
              <View>
                {cloudUser ? (
                  /* User is signed in */
                  <View style={styles.accountCard}>
                    <View style={styles.userRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {(cloudUser.displayName || cloudUser.email || 'A')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                          {cloudUser.displayName || (cloudUser.isAnonymous ? 'Anonymous Shopper' : 'Shopper')}
                        </Text>
                        <Text style={styles.userEmail}>
                          {cloudUser.email || `ID: ${cloudUser.uid.substring(0, 10)}...`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{lists.length}</Text>
                        <Text style={styles.statLabel}>Lists Synced</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                          {lists.reduce((acc, l) => acc + l.items.length, 0)}
                        </Text>
                        <Text style={styles.statLabel}>Total Items</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                          {lists.filter(l => l.isShared).length}
                        </Text>
                        <Text style={styles.statLabel}>Shared</Text>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                      <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                      <Text style={styles.signOutBtnText}>Sign Out from Cloud</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Not signed in yet */
                  <View style={styles.authContainer}>
                    {authMode === 'status' ? (
                      <View>
                        <Text style={styles.authPrompt}>
                          Choose how you want to connect to Firebase Realtime Sync:
                        </Text>
                        <TouchableOpacity
                          style={styles.primaryAuthBtn}
                          onPress={handleAnonymousSignIn}
                          disabled={loading}
                        >
                          {loading ? (
                            <ActivityIndicator color="#ffffff" />
                          ) : (
                            <>
                              <Ionicons name="flash" size={18} color="#ffffff" />
                              <Text style={styles.primaryAuthBtnText}>
                                Instant One-Tap Sync (Anonymous)
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.secondaryAuthBtn}
                          onPress={() => setAuthMode('signin')}
                        >
                          <Ionicons name="mail-outline" size={18} color="#0f172a" />
                          <Text style={styles.secondaryAuthBtnText}>
                            Sign In with Email / Password
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.textBtn}
                          onPress={() => setAuthMode('signup')}
                        >
                          <Text style={styles.textBtnLabel}>Create new Cloud Account</Text>
                        </TouchableOpacity>
                      </View>
                    ) : authMode === 'signin' ? (
                      /* Sign In Form */
                      <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>Sign In to Cloud Sync</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Email address"
                          value={email}
                          onChangeText={setEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Password"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry
                        />
                        <TouchableOpacity
                          style={styles.primaryAuthBtn}
                          onPress={handleSignIn}
                          disabled={loading}
                        >
                          {loading ? (
                            <ActivityIndicator color="#ffffff" />
                          ) : (
                            <Text style={styles.primaryAuthBtnText}>Sign In</Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.textBtn}
                          onPress={() => setAuthMode('status')}
                        >
                          <Text style={styles.textBtnLabel}>Back</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      /* Sign Up Form */
                      <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>Create Cloud Sync Account</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Your Name (e.g. Alex)"
                          value={displayName}
                          onChangeText={setDisplayName}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Email address"
                          value={email}
                          onChangeText={setEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Password (min 6 characters)"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry
                        />
                        <TouchableOpacity
                          style={styles.primaryAuthBtn}
                          onPress={handleSignUp}
                          disabled={loading}
                        >
                          {loading ? (
                            <ActivityIndicator color="#ffffff" />
                          ) : (
                            <Text style={styles.primaryAuthBtnText}>Create Account</Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.textBtn}
                          onPress={() => setAuthMode('status')}
                        >
                          <Text style={styles.textBtnLabel}>Back</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
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
    paddingBottom: 24,
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
  statusBanner: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  statusSynced: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  statusConnecting: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  statusOffline: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    flex: 1,
  },
  configGuideCard: {
    backgroundColor: '#f8fafc',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  configDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  stepText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#065f46',
    flex: 1,
    lineHeight: 16,
  },
  accountCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },
  signOutBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  authContainer: {
    paddingVertical: 8,
  },
  authPrompt: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 14,
    lineHeight: 20,
  },
  primaryAuthBtn: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  primaryAuthBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryAuthBtn: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  secondaryAuthBtnText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  textBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  textBtnLabel: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    paddingVertical: 8,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 12,
  },
});
