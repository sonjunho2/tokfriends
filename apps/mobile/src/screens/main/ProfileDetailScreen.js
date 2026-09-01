// src/screens/main/ProfileDetailScreen.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import colors from '../../theme/colors';
import { apiClient } from '../../api/client';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1080&q=80';

export default function ProfileDetailScreen({ navigation, route }) {
  const profile = route?.params?.profile;
  const preferredFont = route?.params?.preferredFont;
  const isSelf = Boolean(route?.params?.isSelf);
  const [sending, setSending] = useState(false);

  const data = useMemo(() => {
    const location = profile?.location || '서울 · 5km 이내';
    return {
      name: profile?.name || '회원님',
      location,
      title: profile?.title || '오늘 가입한 회원입니다',
      bio:
        profile?.bio ||
        '새로운 인연을 기다리고 있어요. 반려견과 드라이브하는 것을 좋아해요!',
      avatar: profile?.avatar || null,
      coverImage: profile?.coverImage || FALLBACK_IMAGE,
      age: profile?.age,
      distanceKm: profile?.distanceKm ?? profile?.distance,
      points: profile?.points,
    };
  }, [profile]);

    const dynamicFont = useMemo(() => {
    if (!preferredFont || preferredFont === 'system') {
      return { heading: null, body: null };
    }
    return {
      heading: { fontFamily: preferredFont },
      body: { fontFamily: preferredFont },
    };
  }, [preferredFont]);

  const metaItems = useMemo(() => {
    const items = [];
    if (typeof data.age === 'number') {
      items.push(`${data.age}세`);
    }
    if (typeof data.distanceKm === 'number') {
      items.push(`${data.distanceKm}km`);
    }
    if (typeof data.points === 'number') {
      items.push(`${data.points}P`);
    }
    return items;
  }, [data.age, data.distanceKm, data.points]);

  const handleMessage = async () => {
    if (sending) return;
    const targetId = profile?.id || profile?._id;
    if (!targetId) {
      Alert.alert('안내', '대화할 회원 정보를 찾을 수 없습니다.');
      return;
    }
    setSending(true);
    try {
      const room = await apiClient.ensureDirectRoom(targetId, { title: data.name });
      const roomId = room?.id || room?._id || Date.now();
      const participant = {
        id: targetId,
        name: data.name,
        avatar: data.avatar,
        headline: data.title,
      };
      navigation.navigate('Chats', {
        screen: 'ChatRoom',
        params: {
          id: roomId,
          room,
          user: participant,
        },
      });
    } catch (error) {
      Alert.alert('메시지 시작 실패', error?.message || '채팅방을 생성하지 못했습니다.');
    } finally {
      setSending(false);
    }
  };

    const handleEditProfile = () => {
    navigation.navigate('ProfileEdit', {
      profile: profile || data,
      preferredFont,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrapper}>
          <ImageBackground
            source={{ uri: data.coverImage }}
            style={styles.cover}
            imageStyle={styles.coverImage}
          >
            <View style={styles.coverOverlay} />
            <View style={styles.heroHeader}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={26} color={colors.textInverse} />
              </TouchableOpacity>
              <View style={styles.headerSpacer} />
            </View>
            <View style={styles.avatarWrapper}>
              <Avatar
                size={96}
                uri={data.avatar}
                name={data.name}
                showBorder
                shape="circle"
                style={styles.avatar}
              />
            </View>
          </ImageBackground>
        </View>

        <View style={styles.body}>
          <Text style={[styles.tagline, dynamicFont.body]}>{data.title}</Text>
          <Text style={[styles.name, dynamicFont.heading]}>{data.name}</Text>
          <Text style={[styles.location, dynamicFont.body]}>{data.location}</Text>

          {metaItems.length > 0 && (
            <View style={styles.metaRow}>
              {metaItems.map((item) => (
                <View key={item} style={styles.metaBadge}>
                  <Text style={[styles.metaBadgeText, dynamicFont.body]}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.infoCard}>
            <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, dynamicFont.body]}>{data.bio}</Text>
          </View>

          {isSelf ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={[styles.editButtonText, dynamicFont.heading]}>프로필 수정</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, sending && { opacity: 0.6 }]}
              onPress={handleMessage}
              activeOpacity={0.85}
              disabled={sending}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textInverse} />
              <Text style={styles.primaryButtonText}>메시지 보내기</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroWrapper: {
    position: 'relative',
  },
  cover: {
    height: 360,
    justifyContent: 'flex-end',
  },
  coverImage: {
    resizeMode: 'cover',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroHeader: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 42,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: -60,
  },
  avatar: {
    borderWidth: 4,
    borderColor: colors.background,
  },
  body: {
    paddingTop: 80,
    paddingHorizontal: 24,
    gap: 20,
  },
  tagline: {
    alignSelf: 'center',
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  name: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
  },
  location: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.pillActiveBg,
    borderWidth: 1,
    borderColor: colors.pillActiveBorder,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
    lineHeight: 22,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textInverse,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },            
});
