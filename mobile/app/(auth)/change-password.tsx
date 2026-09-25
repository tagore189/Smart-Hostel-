import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../_layout';
import { Colors } from '../../constants/Theme';

export default function ChangePasswordScreen() {
  const { changePassword, user, signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (newPassword !== confirmPassword) return Alert.alert('Passwords do not match', 'Re-enter the same new password in both fields.');
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (error: any) {
      Alert.alert('Could not update password', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.kicker}>SLG LUXURY LADIES PG</Text>
        <Text style={styles.title}>Set your password</Text>
        <Text style={styles.copy}>Welcome, {user?.name || 'resident'}. For your security, set a personal password before continuing.</Text>
        <TextInput style={styles.input} placeholder="Temporary password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="New password (10+ characters)" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" />
        <Text style={styles.hint}>Use at least 10 characters with uppercase, lowercase, and a number.</Text>
        <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update password</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={signOut} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: Colors.surface, padding: 24, borderRadius: 20, borderColor: Colors.border, borderWidth: 1 },
  kicker: { color: Colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  title: { color: Colors.text, fontSize: 26, fontWeight: '800', marginTop: 10 },
  copy: { color: Colors.textSecondary, lineHeight: 21, marginTop: 8, marginBottom: 18 },
  input: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceSecondary, borderRadius: 10, padding: 14, marginTop: 10, color: Colors.text },
  hint: { color: Colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  button: { backgroundColor: Colors.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 18 },
  disabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '700' },
  signOut: { alignItems: 'center', padding: 14, marginTop: 4 },
  signOutText: { color: Colors.textSecondary, fontWeight: '600' },
});
