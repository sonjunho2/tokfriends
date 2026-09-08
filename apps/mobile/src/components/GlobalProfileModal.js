// src/components/GlobalProfileModal.js
import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useProfileModal } from '../context/ProfileModalContext';
import Avatar from './Avatar';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';


export default function GlobalProfileModal() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { visible, profile, closeProfile } = useProfileModal();
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  const profileData = useMemo(() => {
    if (profile) return profile;
    if (!user) return null;

    const userProfile = user?.profile ?? {};
    const location =
      [user?.region1, user?.region2].filter(Boolean).join(' · ') || '지역 미설정';

    return {
      name: userProfile?.nickname || user?.displayName || '회원님',
      location,
      title: userProfile?.headline || '한줄 소개가 없습니다.',
      bio: userProfile?.bio || '소개가 없습니다.',
      avatar: userProfile?.avatarUri || null,
      coverImage: userProfile?.avatarUri || null,
    };
  }, [profile, user]);

  const handleClose = () => {
    closeProfile();
  };

  const handleOpenMyPage = () => {
    closeProfile();
    setTimeout(() => {
      navigation.navigate('MyPage', { screen: 'MyPageMain' });
    }, 0);
  };

  const handleOpenSettings = () => {
    closeProfile();
    setTimeout(() => {
      navigation.navigate('MyPage', { screen: 'MyPageMain' });
    }, 0);
  };

  const handleMessage = async () => {
    if (sending) return;
    const targetId = profile?.id || profile?._id;
    if (!targetId) {
      Alert.alert('안내', '대화할 회원 정보를 찾을 수 없습니다.');
      return;
    }
    setSending(true);
    try {
      const room = await apiClient.ensureDirectRoom(targetId, { title: profileData?.name });
      const roomId = room?.id || room?._id;
      if (!roomId) {
        throw new Error('채팅방 정보를 확인할 수 없습니다.');
      }
      const participant = {
        id: targetId,
        name: profileData?.name,
        avatar: profileData?.avatar,
        headline: profileData?.title,
      };
      closeProfile();
      setTimeout(() => {
        navigation.navigate('Chats', {
          screen: 'ChatRoom',
          params: { id: roomId, room, user: participant },
        });
      }, 120);
    } catch (error) {
      Alert.alert('메시지 시작 실패', error?.message || '채팅방을 생성하지 못했습니다.');
    } finally {
      setSending(false);
    }
  };

  if (!visible || !profileData) return null;

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {profileData.coverImage ? (
          <Image source={{ uri: profileData.coverImage }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder} />
        )}

        <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}> 
          <TouchableOpacity style={styles.topButton} onPress={handleClose} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.textInverse} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton} onPress={handleOpenSettings} hitSlop={8}>
            <Ionicons name="settings-outline" size={22} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarWrap}>
            <Avatar
              size={88}
              uri={profileData.avatar}
              name={profileData.name}
              shape="circle"
              showBorder
              style={styles.avatar}
            />
          </View>

          <Text style={styles.joinedLabel}>{profileData.title}</Text>
          <Text style={styles.name}>{profileData.name}님의 프로필</Text>
          <Text style={styles.location}>{profileData.location}</Text>

          <View style={styles.infoCard}>
            <Ionicons name="paw-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>{profileData.bio}</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, sending && { opacity: 0.6 }]}
            onPress={handleMessage}
            activeOpacity={0.85}
            disabled={sending}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textInverse} />
            <Text style={styles.primaryButtonText}>메시지 보내기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenMyPage}>
            <Text style={styles.secondaryButtonText}>마이페이지 열기</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  coverPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: colors.backgroundSecondary,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: 280,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: -60,
  },
  avatar: {
    borderWidth: 4,
    borderColor: colors.background,
  },
  joinedLabel: {
    alignSelf: 'center',
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  name: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  location: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundSecondary,
    padding: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
