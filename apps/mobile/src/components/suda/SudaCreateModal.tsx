import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryFee, setEntryFee] = useState<number>(300);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && user?.chatEntryFee !== undefined) {
      setEntryFee(Number(user.chatEntryFee) || 0);
    }
  }, [visible, user?.chatEntryFee]);

  const FEE_OPTIONS = [
    { label: '✨ 무료', value: 0 },
    { label: '💰 50 꿀떡', value: 50 },
    { label: '💰 100 꿀떡', value: 100 },
    { label: '💰 300 꿀떡', value: 300 },
    { label: '💰 500 꿀떡', value: 500 },
  ];

  const handleSubmit = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('알림', '수다방 제목 또는 내용을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const roomPayload = {
        title: title.trim() || content.trim(),
        content: content.trim() || '나랑 1:1로 즐겁게 수다떨 이웃 편하게 입장해주세요!',
        entryFee,
      };
      await createSudaPost(roomPayload.content, roomPayload.title, roomPayload.entryFee);
      setTitle('');
      setContent('');
      onCreated();
      onClose();
    } catch (err) {
      Alert.alert('오류', '수다방 개설에 실패했습니다.');
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
              <Ionicons name="chatbubbles" size={18} color="#FF3B6B" />
              <Text style={styles.sheetTitle}>1:1 실시간 수다방 만들기</Text>
              <View style={styles.townBadge}>
                <Text style={styles.townBadgeText}>역삼1동</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* 방 제목 인풋 */}
          <TextInput
            style={[styles.textInput, { minHeight: 46, maxHeight: 52, marginBottom: 10, fontWeight: '700' }]}
            placeholder="방 제목 (예: 오늘 퇴근 후 강남역 맥주 한잔 🍺)"
            placeholderTextColor="#94A3B8"
            maxLength={60}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          {/* 소개 내용 인풋 */}
          <TextInput
            style={[styles.textInput, { minHeight: 64, maxHeight: 90, marginBottom: 12 }]}
            placeholder="상세 내용 (예: 역삼/강남 근처 이웃 환영! 가볍게 치맥해요~)"
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={150}
            value={content}
            onChangeText={setContent}
          />

          {/* 입장 비용 직접 입력 & 퀵 선택 */}
          <View style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>
                💰 1:1 수다방 입장 비용
              </Text>
              <Text style={{ fontSize: 10, color: '#94A3B8' }}>
                0원 입력 시 무료 입장
              </Text>
            </View>

            {/* 직접 입력 인풋 박스 */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 12,
                paddingHorizontal: 12,
                height: 44,
                marginBottom: 8,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: '800',
                  color: '#0F172A',
                  paddingVertical: 0,
                }}
                keyboardType="numeric"
                placeholder="입장 비용 직접 입력 (예: 500)"
                placeholderTextColor="#94A3B8"
                value={entryFee === 0 ? '' : String(entryFee)}
                onChangeText={(text) => {
                  const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                  setEntryFee(isNaN(num) ? 0 : num);
                }}
              />
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#FF3B6B', marginLeft: 6 }}>
                ON
              </Text>
            </View>

            {/* 빠른 선택 칩 버튼 */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {FEE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setEntryFee(opt.value)}
                  style={{
                    flex: 1,
                    paddingVertical: 6,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: entryFee === opt.value ? '#FFF0F3' : '#F1F5F9',
                    borderWidth: 1,
                    borderColor: entryFee === opt.value ? '#FF3B6B' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: entryFee === opt.value ? '#E11D48' : '#64748B',
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.charCount}>{content.length} / 150자</Text>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                !title.trim() && !content.trim() && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={(!title.trim() && !content.trim()) || submitting}
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
