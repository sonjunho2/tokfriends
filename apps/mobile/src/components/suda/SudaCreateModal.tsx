import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { createSudaPost } from '../../services/sudaService';

interface SudaCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function SudaCreateModal({
  visible,
  onClose,
  onCreated,
}: SudaCreateModalProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('알림', '한 줄 수다 내용을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await createSudaPost(content);
      setContent('');
      onCreated();
      onClose();
    } catch (err) {
      Alert.alert('오류', '글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheetCard}>
          <View style={styles.headerRow}>
            <View style={styles.badgeRow}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#FF3B6B" />
              <Text style={styles.sheetTitle}>실시간 1줄 동네 수다</Text>
              <View style={styles.townBadge}>
                <Text style={styles.townBadgeText}>역삼1동</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="가벼운 일상, 야식 추천, 산책 동행 등 이웃과 지금 나누고 싶은 한 줄을 남겨보세요! (최대 150자)"
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={150}
            value={content}
            onChangeText={setContent}
            autoFocus
          />

          <View style={styles.footerRow}>
            <Text style={styles.charCount}>{content.length} / 150자</Text>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                !content.trim() && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!content.trim() || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>등록하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  townBadge: {
    backgroundColor: '#FFF0F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  townBadgeText: {
    color: '#FF3B6B',
    fontSize: 11,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  textInput: {
    height: 110,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#FF3B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
