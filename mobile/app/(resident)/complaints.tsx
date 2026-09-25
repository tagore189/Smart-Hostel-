import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../services/api';

type TabKey = 'list' | 'new';

interface AttachmentItem {
  url: string;
  fileType: 'image' | 'video' | 'document';
  originalName: string;
  size?: number;
}

const CATEGORIES = [
  { key: 'Room', label: 'Room', icon: 'bed' as const },
  { key: 'Plumbing', label: 'Plumbing', icon: 'water' as const },
  { key: 'Electricity', label: 'Electricity', icon: 'flash' as const },
  { key: 'Wi-Fi', label: 'Wi-Fi', icon: 'wifi' as const },
  { key: 'Cleaning', label: 'Cleaning', icon: 'sparkles' as const },
  { key: 'Food', label: 'Food', icon: 'restaurant' as const },
  { key: 'Maintenance', label: 'Maintenance', icon: 'construct' as const },
  { key: 'Other', label: 'Other', icon: 'ellipsis-horizontal' as const },
];

export default function ComplaintsScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Room');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['complaints'],
    queryFn: async () => {
      try {
        const res = await api.get('/complaints');
        return res.data || res.complaints || [];
      } catch {
        return [];
      }
    },
  });

  // Pick Image or Video
  const handlePickMedia = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow gallery access to upload photos or videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadFile({
          uri: asset.uri,
          name: asset.fileName || `media_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
          type: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        });
      }
    } catch (err: any) {
      Alert.alert('Picker Error', err.message || 'Could not select media');
    }
  };

  // Pick Document (PDF, Doc)
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const doc = result.assets[0];
        await uploadFile({
          uri: doc.uri,
          name: doc.name || `doc_${Date.now()}.pdf`,
          type: doc.mimeType || 'application/pdf',
        });
      }
    } catch (err: any) {
      Alert.alert('Document Error', err.message || 'Could not select document');
    }
  };

  // Upload file helper
  const uploadFile = async (fileObj: { uri: string; name: string; type: string }) => {
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileObj.uri,
        name: fileObj.name,
        type: fileObj.type,
      } as any);

      const res = await api.upload('/complaints/upload', formData);
      if (res.success && res.data) {
        setAttachments((prev) => [...prev, res.data]);
      } else {
        throw new Error(res.message || 'File upload failed');
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload attachment.');
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Complaint Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post('/complaints', {
        title,
        description,
        category,
        attachments,
      });
    },
    onSuccess: () => {
      Alert.alert('Complaint Submitted', 'Your ticket has been logged and assigned to hostel management.');
      setTitle('');
      setDescription('');
      setCategory('Room');
      setAttachments([]);
      setActiveTab('list');
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to submit complaint.');
    },
  });

  const complaints = Array.isArray(data) ? data : [];

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a complaint title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please describe the issue.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Complaints" showBack />

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['list', 'new'] as TabKey[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'list' ? 'list' : 'add-circle'}
              size={18}
              color={activeTab === tab ? '#FFF' : Colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'list' ? 'My Complaints' : 'New Complaint'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {activeTab === 'list' ? (
          complaints.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={56} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Complaints</Text>
              <Text style={styles.emptySubtitle}>Everything looks great! Submit a complaint if you need help.</Text>
            </View>
          ) : (
            complaints.map((c) => (
              <TouchableOpacity
                key={c._id}
                style={styles.cardWrapper}
                onPress={() => setSelectedComplaint(c)}
                activeOpacity={0.8}
              >
                <Card>
                  <View style={styles.complaintHeader}>
                    <View style={styles.headerLeft}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{c.category}</Text>
                      </View>
                    </View>
                    <StatusBadge status={c.status} />
                  </View>

                  <Text style={styles.complaintTitle}>{c.title}</Text>
                  <Text style={styles.complaintDesc} numberOfLines={2}>
                    {c.description}
                  </Text>

                  {/* Attachment indicators */}
                  {((c.attachments && c.attachments.length > 0) || c.photoUrl) && (
                    <View style={styles.attachmentTagRow}>
                      <Ionicons name="attach" size={14} color={Colors.primary} />
                      <Text style={styles.attachmentTagText}>
                        {c.attachments?.length || 1} attachment(s)
                      </Text>
                    </View>
                  )}

                  {/* Admin response snippet if any */}
                  {c.adminResponse && (
                    <View style={styles.responseBox}>
                      <Ionicons name="chatbubble-ellipses" size={14} color={Colors.primary} />
                      <Text style={styles.responseText} numberOfLines={1}>
                        Admin: {c.adminResponse}
                      </Text>
                    </View>
                  )}

                  <View style={styles.complaintFooter}>
                    <Text style={styles.dateText}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </Text>
                    <Text style={styles.viewDetailText}>View Details →</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )
        ) : (
          /* NEW COMPLAINT FORM */
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Report an Issue</Text>
            <Text style={styles.formSubtitle}>
              Select the category and provide details so maintenance staff can resolve it promptly.
            </Text>

            {/* Categories Grid */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.catChip, category === cat.key && styles.catChipActive]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={category === cat.key ? '#FFF' : Colors.textSecondary}
                  />
                  <Text style={[styles.catText, category === cat.key && styles.catTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title */}
            <Text style={styles.fieldLabel}>Issue Summary</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Geyser not heating in my room"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Description */}
            <Text style={styles.fieldLabel}>Detailed Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what is wrong, when it started, and any specific notes..."
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            {/* Attachments Section (Section 12) */}
            <Text style={styles.fieldLabel}>Attachments (Images, Videos, Documents)</Text>
            <View style={styles.attachBtnRow}>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={handlePickMedia}
                disabled={uploadingFile}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={18} color={Colors.primary} />
                <Text style={styles.attachBtnText}>Add Photo / Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachBtn}
                onPress={handlePickDocument}
                disabled={uploadingFile}
                activeOpacity={0.8}
              >
                <Ionicons name="document-attach-outline" size={18} color="#2563EB" />
                <Text style={[styles.attachBtnText, { color: '#2563EB' }]}>Add Document</Text>
              </TouchableOpacity>
            </View>

            {uploadingFile && (
              <View style={styles.uploadingBox}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.uploadingText}>Uploading attachment to secure storage...</Text>
              </View>
            )}

            {/* Attachment preview list */}
            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((att, idx) => (
                  <View key={idx} style={styles.attachmentChip}>
                    <Ionicons
                      name={att.fileType === 'document' ? 'document-text' : att.fileType === 'video' ? 'videocam' : 'image'}
                      size={16}
                      color={Colors.primary}
                    />
                    <Text style={styles.attachmentName} numberOfLines={1}>{att.originalName}</Text>
                    <TouchableOpacity onPress={() => removeAttachment(idx)}>
                      <Ionicons name="close-circle" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, createMutation.isPending && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFF" />
                  <Text style={styles.submitButtonText}>Submit Complaint</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* COMPLAINT DETAIL MODAL */}
      <Modal
        visible={!!selectedComplaint}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedComplaint(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedComplaint?.title}</Text>
                <Text style={styles.modalCategory}>{selectedComplaint?.category}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedComplaint(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedComplaint && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalStatusRow}>
                  <Text style={styles.modalStatusLabel}>Current Status:</Text>
                  <StatusBadge status={selectedComplaint.status} />
                </View>

                <Text style={styles.modalDescLabel}>Description:</Text>
                <Text style={styles.modalDescText}>{selectedComplaint.description}</Text>

                {/* Admin response */}
                {selectedComplaint.adminResponse && (
                  <View style={styles.adminResponseCard}>
                    <Text style={styles.adminResponseTitle}>Warden / Admin Response:</Text>
                    <Text style={styles.adminResponseText}>{selectedComplaint.adminResponse}</Text>
                  </View>
                )}

                {/* Staff assigned */}
                {selectedComplaint.assignedStaffName && (
                  <View style={styles.staffInfoRow}>
                    <Ionicons name="person" size={14} color={Colors.primary} />
                    <Text style={styles.staffInfoText}>Assigned Technician: {selectedComplaint.assignedStaffName}</Text>
                  </View>
                )}

                {/* Attachments */}
                {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                  <View style={styles.modalAttachmentsSection}>
                    <Text style={styles.modalDescLabel}>Attachments ({selectedComplaint.attachments.length}):</Text>
                    {selectedComplaint.attachments.map((att: any, idx: number) => (
                      <View key={idx} style={styles.modalAttachmentItem}>
                        <Ionicons
                          name={att.fileType === 'document' ? 'document-text' : att.fileType === 'video' ? 'videocam' : 'image'}
                          size={18}
                          color={Colors.primary}
                        />
                        <Text style={styles.modalAttachmentName}>{att.originalName}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Timeline */}
                {selectedComplaint.timeline && selectedComplaint.timeline.length > 0 && (
                  <View style={styles.timelineBox}>
                    <Text style={styles.timelineHeader}>Activity Updates</Text>
                    {selectedComplaint.timeline.map((entry: any, i: number) => (
                      <View key={i} style={styles.timelineRow}>
                        <View style={styles.timelineBullet} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.timelineStatusTitle}>{entry.status}</Text>
                          <Text style={styles.timelineNoteText}>{entry.note}</Text>
                          <Text style={styles.timelineTimeText}>
                            {new Date(entry.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    gap: 6,
  },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  activeTabText: { color: '#FFF' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 16,
    paddingBottom: 40,
  },
  cardWrapper: { marginBottom: 10 },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  categoryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  complaintTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  complaintDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  attachmentTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  attachmentTagText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  responseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  responseText: { fontSize: 11, color: Colors.text, flex: 1, fontStyle: 'italic' },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dateText: { fontSize: 11, color: Colors.textMuted },
  viewDetailText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 14 },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
  formContainer: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  formTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  formSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginTop: 12, marginBottom: 6 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  catTextActive: { color: '#FFF' },
  input: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  attachBtnRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSecondary,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  attachBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  uploadingText: { fontSize: 12, color: Colors.primary },
  attachmentsList: { gap: 6, marginBottom: 12 },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 8,
  },
  attachmentName: { fontSize: 12, color: Colors.text, flex: 1 },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginTop: 20,
    gap: 8,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  modalCategory: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  modalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalStatusLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  modalDescLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
  modalDescText: { fontSize: 13, color: Colors.text, lineHeight: 18, marginBottom: 14 },
  adminResponseCard: {
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 12,
  },
  adminResponseTitle: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  adminResponseText: { fontSize: 13, color: Colors.text, marginTop: 2 },
  staffInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  staffInfoText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  modalAttachmentsSection: { marginBottom: 14 },
  modalAttachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceSecondary,
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  modalAttachmentName: { fontSize: 12, color: Colors.text, flex: 1 },
  timelineBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 20,
  },
  timelineHeader: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  timelineRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  timelineBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 6 },
  timelineStatusTitle: { fontSize: 12, fontWeight: '700', color: Colors.text },
  timelineNoteText: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  timelineTimeText: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
});
