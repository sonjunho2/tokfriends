// src/screens/main/ProfileDetailScreen.js
import React, { useEffect, useMemo, useState } from 'react';
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

export default function ProfileDetailScreen({ navigation, route }) {
  const profile = route?.params?.profile;
  const preferredFont = route?.params?.preferredFont;
  const isSelf = Boolean(route?.params?.isSelf);
  const [sending, setSending] = useState(false);

  const targetAccountId =
    typeof profile?.targetAccountId === 'string' ? profile.targetAccountId.trim() : '';

  const [following, setFollowing] = useState(false);
  const [interested, setInterested] = useState(false);
  const [updatingFollow, setUpdatingFollow] = useState(false);
  const [updatingInterest, setUpdatingInterest] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (targetAccountId && !isSelf) {
      apiClient.recordProfileVisit(targetAccountId);
      Promise.all([
        apiClient.getFollowStatus(targetAccountId),
        apiClient.getInterestStatus(targetAccountId),
      ])
        .then(([followRes, interestRes]) => {
          if (!mounted) return;
          setFollowing(Boolean(followRes?.following));
          setInterested(Boolean(interestRes?.interested));
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [targetAccountId, isSelf]);

  const data = useMemo(() => {
    const location = profile?.location || '지역 미설정';
    return {
      name: profile?.name || '회원',
      location,
      title: profile?.title || '한줄 소개가 없습니다.',
      bio: profile?.bio || '소개가 없습니다.',
      avatar: profile?.avatar || null,
      coverImage: profile?.coverImage || profile?.avatar || null,
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

  const handleToggleFollow = async () => {
    if (!targetAccountId) {
      Alert.alert('안내', '팔로우할 수 있는 계정 정보가 없습니다.');
      return;
    }
    if (updatingFollow) return;
    setUpdatingFollow(true);
    try {
      if (following) {
        await apiClient.unfollowAccount(targetAccountId);
        setFollowing(false);
        Alert.alert('알림', `${data.name}님의 팔로우를 취소했습니다.`);
      } else {
        await apiClient.followAccount(targetAccountId);
        setFollowing(true);
        Alert.alert('알림', `${data.name}님을 팔로우했습니다.`);
      }
    } catch (error) {
      Alert.alert('팔로우 실패', error?.message || '처리에 실패했습니다.');
    } finally {
      setUpdatingFollow(false);
    }
  };

  const handleToggleInterest = async () => {
    if (!targetAccountId) {
      Alert.alert('안내', '관심을 보낼 수 있는 계정 정보가 없습니다.');
      return;
    }
    if (updatingInterest) return;
    setUpdatingInterest(true);
    try {
      if (interested) {
        await apiClient.removeInterest(targetAccountId);
        setInterested(false);
        Alert.alert('알림', `${data.name}님에게 보낸 관심을 취소했습니다.`);
      } else {
        await apiClient.sendInterest(targetAccountId);
        setInterested(true);
        Alert.alert('알림', `${data.name}님에게 관심을 보냈습니다!`);
      }
    } catch (error) {
      Alert.alert('관심 처리 실패', error?.message || '처리에 실패했습니다.');
    } finally {
      setUpdatingInterest(false);
    }
  };

  const handleMessage = async () => {
    if (sending) return;
    const targetUserId =
      typeof profile?.targetUserId === 'string' ? profile.targetUserId.trim() : '';
    if (!targetUserId && !targetAccountId) {
      Alert.alert('안내', '대화할 회원 정보를 찾을 수 없습니다.');
      return;
    }
    if (targetUserId && targetAccountId) {
      Alert.alert('안내', '대화 상대 식별 정보가 올바르지 않습니다.');
      return;
    }
    setSending(true);
    try {
      const room = await apiClient.ensureDirectRoom(
        targetUserId ? { targetUserId } : { targetAccountId },
      );
      const roomId = room?.id || room?._id;
      if (!roomId) {
        throw new Error('채팅방 정보를 확인할 수 없습니다.');
      }
      const participant = {
        ...(targetUserId ? { id: targetUserId, targetUserId } : { targetAccountId }),
        name: data.name,
        avatar: data.avatar,
        headline: data.title,
      };
      navigation.navigate('Chat', {
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
            source={data.coverImage ? { uri: data.coverImage } : undefined}
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
            <View style={styles.actionButtonGroup}>
              {Boolean(targetAccountId) && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionButton,
                      interested && styles.secondaryActionButtonActive,
                      updatingInterest && { opacity: 0.6 },
                    ]}
                    onPress={handleToggleInterest}
                    activeOpacity={0.85}
                    disabled={updatingInterest}
                  >
                    <Ionicons
                      name={interested ? 'heart' : 'heart-outline'}
                      size={20}
                      color={interested ? '#FF3B6B' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.secondaryActionText,
                        interested && styles.secondaryActionTextActive,
                      ]}
                    >
                      {interested ? '관심 보냄' : '관심 보내기'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.secondaryActionButton,
                      following && styles.followingActionButton,
                      updatingFollow && { opacity: 0.6 },
                    ]}
                    onPress={handleToggleFollow}
                    activeOpacity={0.85}
                    disabled={updatingFollow}
                  >
                    <Ionicons
                      name={following ? 'checkmark-circle-outline' : 'person-add-outline'}
                      size={20}
                      color={following ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.secondaryActionText,
                        following && styles.followingActionText,
                      ]}
                    >
                      {following ? '팔로잉' : '팔로우'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, sending && { opacity: 0.6 }]}
                onPress={handleMessage}
                activeOpacity={0.85}
                disabled={sending}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textInverse} />
                <Text style={styles.primaryButtonText}>메시지 보내기</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: colors.backgroundSecondary,
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
  actionButtonGroup: {
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryActionButton: {
    flex: 1,
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
  secondaryActionButtonActive: {
    borderColor: '#FF3B6B',
    backgroundColor: '#FFF0F3',
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  secondaryActionTextActive: {
    color: '#FF3B6B',
  },
  followingActionButton: {
    borderColor: colors.primary,
    backgroundColor: '#F0ECFF',
  },
  followingActionText: {
    color: colors.primary,
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
