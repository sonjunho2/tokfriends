// src/screens/chat/CreateChatRoomScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import colors from '../../theme/colors';
import { apiClient } from '../../api/client';

export default function CreateChatRoomScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('알림', '방 제목을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { title: title.trim(), category: '프로필기반' };
      const room = await apiClient.createRoom(payload); // 안전 폴백 포함
      // 생성 성공 → 채팅방으로 진입
      const nextId = room?.id || Date.now();
      const nextTitle = room?.title || title.trim();
      navigation.replace('ChatRoom', {
        id: nextId,
        title: nextTitle,
        user: {
          id: nextId,
          name: nextTitle,
          category: room?.category || payload.category,
        },
      });
    } catch (e) {
      Alert.alert('오류', e?.message || '방 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.backdrop}>
      <TouchableWithoutFeedback
        onPress={() => {
          if (!submitting) navigation.goBack();
        }}
      >
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalWrapper}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>새 채팅방 만들기</Text>
            <Text style={styles.modalDescription}>
              관심 카테고리는 가입 시 설정한 내 프로필 정보를 기준으로 자동 추천돼요.
            </Text>

            <Text style={styles.label}>방 제목</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="예) 주말 등산 같이 하실 분"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              autoCapitalize="none"
              maxLength={40}
              editable={!submitting}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.goBack()}
                disabled={submitting}
              >
                <Text style={styles.secondaryBtnTxt}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
                onPress={onSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnTxt}>방 만들기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalWrapper: {
    width: '100%',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  modalDescription: {
    marginTop: 8,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  label: {
    marginTop: 22,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 28,
  },
  secondaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundTertiary,
  },
  secondaryBtnTxt: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  primaryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnTxt: {
    color: colors.textInverse,
    fontWeight: '800',
  },
});
