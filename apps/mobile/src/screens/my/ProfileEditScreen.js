// src/screens/my/ProfileEditScreen.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

export default function ProfileEditScreen({ navigation, route }) {
  const profile = route?.params?.profile ?? {};
  const preferredFont = route?.params?.preferredFont;

  const [name, setName] = useState(profile?.name ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [title, setTitle] = useState(profile?.title ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');

  const previewFontStyle = useMemo(() => {
    if (!preferredFont || preferredFont === 'system') {
      return null;
    }
    return { fontFamily: preferredFont };
  }, [preferredFont]);

  const handleSave = () => {
    Alert.alert(
      '프로필 저장',
      '입력한 정보가 임시로 저장되었습니다. 실제 저장은 API 연결 후 완료됩니다.',
      [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 수정</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <Text style={styles.label}>닉네임</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="닉네임을 입력하세요"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={styles.label}>지역 / 나이</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="예) 서울, 여자 27살"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={styles.label}>한줄 소개</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="한줄 소개를 입력하세요"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={styles.label}>자기 소개</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={bio}
            onChangeText={setBio}
            multiline
            textAlignVertical="top"
            placeholder="나를 소개하는 글을 작성해보세요"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>미리보기</Text>
          <View style={styles.previewBox}>
            <Text style={[styles.previewName, previewFontStyle]}>{name || '회원님'}</Text>
            <Text style={[styles.previewLocation, previewFontStyle]}>{location || '서울, 여자 27살'}</Text>
            <Text style={[styles.previewTagline, previewFontStyle]}>{title || '나와 취미가 맞는 사람 찾는 중!'}</Text>
            <Text style={[styles.previewBio, previewFontStyle]}>
              {bio || '좋아하는 음악과 카페에 대해 이야기해요. 진솔한 대화를 좋아합니다.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
          <Ionicons name="save-outline" size={20} color={colors.textInverse} />
          <Text style={styles.saveButtonText}>변경사항 저장</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  formCard: {
    marginTop: 20,
    marginHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textarea: {
    minHeight: 120,
  },
  previewCard: {
    marginTop: 24,
    marginHorizontal: 18,
    gap: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  previewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  previewName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  previewLocation: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  previewTagline: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  previewBio: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  saveButton: {
    marginTop: 32,
    marginHorizontal: 18,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textInverse,
  },
});
