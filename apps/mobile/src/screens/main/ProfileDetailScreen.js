import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import ReportModal from '../../components/ReportModal';
import GiftPickerSheet from '../../components/GiftPickerSheet';
import GiftEffectOverlay from '../../components/GiftEffectOverlay';
import colors from '../../theme/colors';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { checkAndConfirmActionPoint } from '../../utils/pointPolicyHelper';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProfileDetailScreen({ navigation, route }) {
  const { user } = useAuth();
  const profile = route?.params?.profile;
  const preferredFont = route?.params?.preferredFont;
  const isSelf = Boolean(route?.params?.isSelf);
  const [sending, setSending] = useState(false);

  const initialTargetAccountId =
    typeof profile?.targetAccountId === 'string' ? profile.targetAccountId.trim() : '';
  const targetUserId =
    typeof profile?.targetUserId === 'string'
      ? profile.targetUserId.trim()
      : typeof profile?.id === 'string' && !profile.id.startsWith('acc_')
      ? profile.id.trim()
      : '';

  const [resolvedAccountId, setResolvedAccountId] = useState(initialTargetAccountId);
  const targetAccountId = resolvedAccountId || initialTargetAccountId;

  const [following, setFollowing] = useState(false);
  const [interested, setInterested] = useState(false);
  const [friendStatus, setFriendStatus] = useState('none');
  const [friendshipId, setFriendshipId] = useState(null);
  const [updatingFollow, setUpdatingFollow] = useState(false);
  const [updatingInterest, setUpdatingInterest] = useState(false);
  const [updatingFriend, setUpdatingFriend] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [blocking, setBlocking] = useState(false);

  // 다중 프로필 사진 (타사 앱 Bigo/Azar 스타일)
  const [userPhotos, setUserPhotos] = useState(
    Array.isArray(profile?.photos) && profile.photos.length > 0 ? profile.photos : []
  );
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const heroScrollRef = useRef(null);

  // 선물하기 및 3D 이펙트 상태
  const [giftPickerVisible, setGiftPickerVisible] = useState(false);
  const [myPoints, setMyPoints] = useState(0);
  const giftOverlayRef = useRef(null);

  // 사진 확대 보기 모달 상태 (스와이프 뷰어)
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState(null);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);
  const viewerScrollRef = useRef(null);

  const fetchMyPoints = useCallback(async () => {
    try {
      const res = await apiClient.getPointBalance();
      if (res?.balance !== undefined) {
        setMyPoints(Number(res.balance));
      }
    } catch {}
  }, []);

  // 유저의 다중 사진 목록 페칭
  const loadUserPhotos = useCallback(async () => {
    try {
      const queryId = isSelf ? (user?.id || targetUserId) : (targetUserId || targetAccountId);
      if (!queryId) return;
      const res = await apiClient.getUserPhotos(queryId);
      if (Array.isArray(res) && res.length > 0) {
        setUserPhotos(res);
      }
    } catch (e) {
      // ignore
    }
  }, [isSelf, user?.id, targetUserId, targetAccountId]);

  useEffect(() => {
    loadUserPhotos();
  }, [loadUserPhotos]);

  useEffect(() => {
    let mounted = true;
    if ((targetAccountId || targetUserId) && !isSelf) {
      // 1. 방문자 기록 남기기 (알림 센터와 실시간 연계)
      apiClient.recordProfileVisit(targetAccountId || targetUserId).catch(() => {});

      // 2. targetAccountId가 없고 targetUserId만 있으면 유저 상세 조회로 accountId 보충
      if (!targetAccountId && targetUserId) {
        apiClient.getUserById(targetUserId).then((u) => {
          if (mounted && u?.targetAccountId) {
            setResolvedAccountId(u.targetAccountId);
            apiClient.recordProfileVisit(u.targetAccountId).catch(() => {});
          }
        }).catch(() => {});
      }

      // 3. 상태(팔로우, 관심, 친구) 일괄 조회
      Promise.all([
        targetAccountId ? apiClient.getFollowStatus(targetAccountId) : Promise.resolve({ following: false }),
        targetAccountId ? apiClient.getInterestStatus(targetAccountId) : Promise.resolve({ interested: false }),
        apiClient.getFriendshipStatus({ targetUserId, targetAccountId }),
      ])
        .then(([followRes, interestRes, friendRes]) => {
          if (!mounted) return;
          setFollowing(Boolean(followRes?.following));
          setInterested(Boolean(interestRes?.interested));
          setFriendStatus(friendRes?.status || 'none');
          if (friendRes?.friendshipId) {
            setFriendshipId(friendRes.friendshipId);
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [targetAccountId, targetUserId, isSelf]);

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
      interests: Array.isArray(profile?.interests) ? profile.interests : [],
    };
  }, [profile]);

  const displayPhotos = useMemo(() => {
    if (userPhotos.length > 0) {
      return userPhotos.map((p, idx) => ({
        id: p.id || `photo-${idx}`,
        url: p.url,
        isPrimary: Boolean(p.isPrimary),
      }));
    }
    const fallbackUrl = data.avatar || data.coverImage;
    if (fallbackUrl) {
      return [{ id: 'primary-fallback', url: fallbackUrl, isPrimary: true }];
    }
    return [];
  }, [userPhotos, data.avatar, data.coverImage]);

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
      items.push(`${data.points} 온`);
    }
    return items;
  }, [data.age, data.distanceKm, data.points]);

  const handleOpenGiftSheet = () => {
    fetchMyPoints();
    setGiftPickerVisible(true);
  };

  const handleSendGift = async (gift) => {
    if (!gift?.id) return;
    if (!targetUserId && !targetAccountId) {
      Alert.alert('오류', '선물할 대상 회원 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const room = await apiClient.ensureDirectRoom(
        targetUserId ? { targetUserId } : { targetAccountId },
      );
      const roomId = room?.id || room?._id;
      if (!roomId) throw new Error('채팅방을 생성하지 못했습니다.');

      const res = await apiClient.sendChatGift({
        chatId: roomId,
        giftId: gift.id,
      });

      if (res?.spendableBalance !== undefined) {
        setMyPoints(Number(res.spendableBalance));
      } else {
        setMyPoints((prev) => Math.max(0, prev - (gift.amount || gift.pricePoints || 0)));
      }
      setGiftPickerVisible(false);

      giftOverlayRef.current?.enqueueGift({
        name: gift.name,
        amount: gift.amount || gift.pricePoints || 0,
        animationUrl: gift.animationUrl,
        animationType: gift.animationType,
        thumbnailUrl: gift.thumbnailUrl,
        icon: gift.icon,
        senderName: '나',
      });

      Alert.alert(
        '🎁 선물 전송 완료',
        `${data.name}님에게 [${gift.name}] 선물을 보냈습니다!`,
      );
    } catch (e) {
      Alert.alert('선물 실패', e?.message || '선물을 보내지 못했습니다. 온(ON) 잔액을 확인해 주세요.');
    }
  };

  const handleOpenPhoto = (url, index = 0) => {
    if (!url) return;
    setActivePhotoUrl(url);
    setViewerPhotoIndex(index);
    setPhotoViewerVisible(true);
    setTimeout(() => {
      viewerScrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: false });
    }, 50);
  };

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

  const handleFriendAction = async () => {
    if (!targetAccountId && !targetUserId) {
      Alert.alert('안내', '친구 요청을 보낼 회원 정보가 없습니다.');
      return;
    }
    if (updatingFriend) return;

    if (friendStatus === 'accepted') {
      Alert.alert(
        '친구 관계 관리',
        `'${data.name}'님과 이미 친구 사이입니다.\n친구 관계를 끊으시겠습니까?`,
        [
          { text: '닫기' },
          {
            text: '친구 끊기',
            style: 'destructive',
            onPress: async () => {
              if (updatingFriend) return;
              setUpdatingFriend(true);
              try {
                if (friendshipId) {
                  await apiClient.removeFriend(friendshipId);
                } else {
                  const allRes = await apiClient.getFriendships();
                  const allFriends = Array.isArray(allRes?.data)
                    ? allRes.data
                    : Array.isArray(allRes)
                    ? allRes
                    : [];
                  const found = allFriends.find(
                    (f) =>
                      f.status === 'accepted' &&
                      (f.targetAccountId === targetAccountId ||
                        f.userId === targetUserId ||
                        f.id === friendshipId),
                  );
                  if (found?.id) {
                    await apiClient.removeFriend(found.id);
                  } else {
                    throw new Error('친구 관계 정보를 찾지 못했습니다.');
                  }
                }
                setFriendStatus('none');
                setFriendshipId(null);
                Alert.alert('친구 끊기 완료', `'${data.name}'님과 친구 관계가 해제되었습니다.`);
              } catch (err) {
                Alert.alert('친구 끊기 실패', err?.message || '처리에 실패했습니다.');
              } finally {
                setUpdatingFriend(false);
              }
            },
          },
        ],
      );
      return;
    }

    if (friendStatus === 'requested_by_me') {
      Alert.alert(
        '보낸 친구 요청',
        `'${data.name}'님에게 보낸 친구 요청을 취소하시겠습니까?`,
        [
          { text: '닫기' },
          {
            text: '요청 취소하기',
            style: 'destructive',
            onPress: async () => {
              if (updatingFriend) return;
              setUpdatingFriend(true);
              try {
                if (friendshipId) {
                  await apiClient.cancelFriendRequest(friendshipId);
                } else {
                  const allRes = await apiClient.getFriendships();
                  const allFriends = Array.isArray(allRes?.data)
                    ? allRes.data
                    : Array.isArray(allRes)
                    ? allRes
                    : [];
                  const found = allFriends.find(
                    (f) =>
                      f.status === 'requested' &&
                      (f.targetAccountId === targetAccountId || f.userId === targetUserId),
                  );
                  if (found?.id) {
                    await apiClient.cancelFriendRequest(found.id);
                  }
                }
                setFriendStatus('none');
                setFriendshipId(null);
                Alert.alert('완료', '친구 요청이 취소되었습니다.');
              } catch (err) {
                Alert.alert('취소 실패', err?.message || '요청 취소에 실패했습니다.');
              } finally {
                setUpdatingFriend(false);
              }
            },
          },
        ],
      );
      return;
    }

    if (friendStatus === 'requested_to_me') {
      Alert.alert(
        '친구 요청 수락',
        `'${data.name}'님의 친구 요청을 수락하시겠습니까?`,
        [
          { text: '닫기' },
          {
            text: '수락하기',
            onPress: async () => {
              if (updatingFriend) return;
              setUpdatingFriend(true);
              try {
                if (friendshipId) {
                  await apiClient.acceptFriendRequest(friendshipId);
                } else {
                  const allRes = await apiClient.getFriendships();
                  const allFriends = Array.isArray(allRes?.data)
                    ? allRes.data
                    : Array.isArray(allRes)
                    ? allRes
                    : [];
                  const found = allFriends.find(
                    (f) =>
                      f.status === 'requested' &&
                      (f.targetAccountId === targetAccountId || f.userId === targetUserId),
                  );
                  if (found?.id) {
                    await apiClient.acceptFriendRequest(found.id);
                  }
                }
                setFriendStatus('accepted');
                Alert.alert('친구 수락 완료', `'${data.name}'님과 친구가 되었습니다!`);
              } catch (err) {
                Alert.alert('수락 실패', err?.message || '친구 수락에 실패했습니다.');
              } finally {
                setUpdatingFriend(false);
              }
            },
          },
        ],
      );
      return;
    }

    // friendStatus === 'none'
    checkAndConfirmActionPoint({
      actionType: 'directMessageRequest',
      actionName: '1:1 친구/대화 신청',
      navigation,
      onConfirm: async () => {
        setUpdatingFriend(true);
        try {
          const res = await apiClient.sendFriendRequest({
            targetAccountId: targetAccountId || undefined,
            addresseeId: targetUserId || undefined,
          });
          setFriendStatus('requested_by_me');
          if (res?.id) setFriendshipId(res.id);
          Alert.alert('친구 요청 완료', `${data.name}님에게 친구 요청을 보냈습니다.`);
        } catch (error) {
          Alert.alert('친구 요청 실패', error?.message || '친구 요청을 보내지 못했습니다.');
        } finally {
          setUpdatingFriend(false);
        }
      },
    });
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

    checkAndConfirmActionPoint({
      actionType: 'chatRoomCreate',
      actionName: '1:1 채팅방 개설',
      navigation,
      onConfirm: async () => {
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
      },
    });
  };

  const handleEditProfile = () => {
    navigation.navigate('ProfileEdit', {
      profile: profile || data,
      preferredFont,
    });
  };

  const handleOpenSafetyMenu = () => {
    Alert.alert(
      `${data.name} 님 관리`,
      '원하시는 작업을 선택하세요.',
      [
        {
          text: '신고하기',
          style: 'destructive',
          onPress: () => setReportModalVisible(true),
        },
        {
          text: '차단하기',
          style: 'destructive',
          onPress: confirmBlockUser,
        },
        {
          text: '취소',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const confirmBlockUser = () => {
    Alert.alert(
      '회원 차단',
      `정말 ${data.name}님을 차단하시겠습니까?\n차단하면 상대방의 프로필 및 게시물을 볼 수 없으며 대화가 차단됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단하기',
          style: 'destructive',
          onPress: handleBlockUser,
        },
      ]
    );
  };

  const handleBlockUser = async () => {
    if (blocking) return;
    if (!targetAccountId && !targetUserId) {
      Alert.alert('오류', '차단할 회원 정보가 없습니다.');
      return;
    }
    setBlocking(true);
    try {
      if (targetAccountId) {
        await apiClient.blockUser({ targetAccountId });
      } else {
        await apiClient.blockUser({ blockedUserId: targetUserId });
      }
      Alert.alert('차단 완료', `${data.name}님이 차단되었습니다.`, [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('차단 실패', err?.message || '회원 차단에 실패했습니다.');
    } finally {
      setBlocking(false);
    }
  };

  const handleReportSubmit = async ({ category, reason }) => {
    if (!targetAccountId && !targetUserId) {
      throw new Error('신고할 회원 정보가 없습니다.');
    }
    if (targetAccountId) {
      await apiClient.reportUser({ targetAccountId, reason });
    } else {
      await apiClient.reportUser({ targetUserId, reason });
    }
    Alert.alert('신고 접수 완료', '신고가 정상 접수되었습니다. 운영팀 검토 후 조치됩니다.');
  };

  const friendButtonConfig = useMemo(() => {
    switch (friendStatus) {
      case 'accepted':
        return {
          label: '친구',
          icon: 'people',
          color: colors.primary,
          active: true,
        };
      case 'requested_by_me':
        return {
          label: '친구 요청 대기중',
          icon: 'time-outline',
          color: '#F59E0B',
          active: true,
        };
      case 'requested_to_me':
        return {
          label: '친구 요청 수락하기',
          icon: 'mail-outline',
          color: colors.primary,
          active: true,
        };
      default:
        return {
          label: '친구 요청',
          icon: 'person-add-outline',
          color: colors.textSecondary,
          active: false,
        };
    }
  }, [friendStatus]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 상단 히어로 멀티 포토 캐러셀 (Bigo / Azar / Tinder 스타일) */}
        <View style={styles.heroWrapper}>
          {displayPhotos.length > 0 ? (
            <ScrollView
              ref={heroScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const newIndex = Math.round(offsetX / SCREEN_WIDTH);
                setActivePhotoIndex(newIndex);
              }}
              style={styles.heroScrollView}
            >
              {displayPhotos.map((photo, index) => (
                <TouchableOpacity
                  key={photo.id || index}
                  activeOpacity={0.95}
                  style={[styles.heroSlide, { width: SCREEN_WIDTH }]}
                  onPress={() => handleOpenPhoto(photo.url, index)}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                  <View style={styles.coverOverlay} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.heroSlide, styles.heroPlaceholder, { width: SCREEN_WIDTH }]}>
              <Ionicons name="person" size={80} color="rgba(255,255,255,0.3)" />
            </View>
          )}

          {/* 상단 스토리 스타일 인디케이터 바 (다중 사진일 때) */}
          {displayPhotos.length > 1 && (
            <View style={styles.storyIndicatorsRow}>
              {displayPhotos.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.storyIndicatorBar,
                    idx === activePhotoIndex && styles.storyIndicatorBarActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* 사진 장수 뱃지 카운터 */}
          {displayPhotos.length > 1 && (
            <View style={styles.photoCountBadge}>
              <Ionicons name="images" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.photoCountBadgeText}>
                {activePhotoIndex + 1} / {displayPhotos.length}
              </Text>
            </View>
          )}

          {/* 헤더 버튼 (뒤로가기, 안전 메뉴) */}
          <View style={styles.heroHeader}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={26} color={colors.textInverse} />
            </TouchableOpacity>
            {!isSelf ? (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleOpenSafetyMenu}
                hitSlop={8}
              >
                <Ionicons name="ellipsis-vertical" size={20} color={colors.textInverse} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>

          {/* 좌/우 터치 탭 넘기기 (Bigo / Tinder 스타일 빠른 탐색) */}
          {displayPhotos.length > 1 && (
            <>
              <TouchableOpacity
                style={styles.heroTapLeft}
                activeOpacity={1}
                onPress={() => {
                  if (activePhotoIndex > 0) {
                    const nextIdx = activePhotoIndex - 1;
                    heroScrollRef.current?.scrollTo({ x: nextIdx * SCREEN_WIDTH, animated: true });
                    setActivePhotoIndex(nextIdx);
                  }
                }}
              />
              <TouchableOpacity
                style={styles.heroTapRight}
                activeOpacity={1}
                onPress={() => {
                  if (activePhotoIndex < displayPhotos.length - 1) {
                    const nextIdx = activePhotoIndex + 1;
                    heroScrollRef.current?.scrollTo({ x: nextIdx * SCREEN_WIDTH, animated: true });
                    setActivePhotoIndex(nextIdx);
                  }
                }}
              />
            </>
          )}

          {/* 아바타 원형 서클 (대표 아이콘) */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            activeOpacity={0.9}
            onPress={() => handleOpenPhoto(data.avatar || displayPhotos[0]?.url, 0)}
          >
            <Avatar
              size={96}
              uri={data.avatar || displayPhotos[0]?.url}
              name={data.name}
              showBorder
              shape="circle"
              style={styles.avatar}
            />
          </TouchableOpacity>
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

          {/* 등록된 사진 갤러리 섹션 (타사 앱 Bigo/Azar 스타일) */}
          {displayPhotos.length > 0 && (
            <View style={styles.photoAlbumSection}>
              <View style={styles.photoAlbumHeader}>
                <View style={styles.photoAlbumTitleWrap}>
                  <Ionicons name="images-outline" size={18} color={colors.primary} />
                  <Text style={[styles.photoAlbumTitle, dynamicFont.heading]}>
                    등록된 사진
                  </Text>
                  <View style={styles.photoAlbumBadge}>
                    <Text style={styles.photoAlbumBadgeText}>{displayPhotos.length}장</Text>
                  </View>
                </View>
                <Text style={styles.photoAlbumSubHint}>터치하여 크게 보기</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoAlbumScroll}
              >
                {displayPhotos.map((photo, pIdx) => (
                  <TouchableOpacity
                    key={photo.id || pIdx}
                    style={[
                      styles.photoAlbumCard,
                      pIdx === activePhotoIndex && styles.photoAlbumCardActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      heroScrollRef.current?.scrollTo({ x: pIdx * SCREEN_WIDTH, animated: true });
                      setActivePhotoIndex(pIdx);
                      handleOpenPhoto(photo.url, pIdx);
                    }}
                  >
                    <Image source={{ uri: photo.url }} style={styles.photoAlbumThumb} />
                    {photo.isPrimary && (
                      <View style={styles.primaryTagBadge}>
                        <Text style={styles.primaryTagText}>대표</Text>
                      </View>
                    )}
                    <View style={styles.photoIndexTag}>
                      <Text style={styles.photoIndexTagText}>{pIdx + 1}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {data.interests.length > 0 && (
            <View style={styles.interestsRow}>
              {data.interests.map((tag) => (
                <View key={tag} style={styles.interestPill}>
                  <Text style={styles.interestPillText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

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
              {/* 1행: 선물하기 & 관심 보내기 */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.secondaryActionButton, styles.giftActionButton]}
                  onPress={handleOpenGiftSheet}
                  activeOpacity={0.85}
                >
                  <Ionicons name="gift" size={20} color="#EF4444" />
                  <Text style={[styles.secondaryActionText, styles.giftActionText]}>
                    선물하기
                  </Text>
                </TouchableOpacity>

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
              </View>

              {/* 2행: 팔로우 & 친구 요청 */}
              <View style={styles.actionRow}>
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

                <TouchableOpacity
                  style={[
                    styles.secondaryActionButton,
                    friendButtonConfig.active && styles.friendButtonActive,
                    updatingFriend && { opacity: 0.6 },
                  ]}
                  onPress={handleFriendAction}
                  activeOpacity={0.85}
                  disabled={updatingFriend}
                >
                  <Ionicons
                    name={friendButtonConfig.icon}
                    size={20}
                    color={friendButtonConfig.color}
                  />
                  <Text
                    style={[
                      styles.secondaryActionText,
                      friendButtonConfig.active && { color: friendButtonConfig.color },
                    ]}
                  >
                    {friendButtonConfig.label}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 3행: 1:1 메시지 보내기 */}
              <TouchableOpacity
                style={[styles.primaryButton, sending && { opacity: 0.6 }]}
                onPress={handleMessage}
                activeOpacity={0.85}
                disabled={sending}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textInverse} />
                <Text style={styles.primaryButtonText}>1:1 대화 시작하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 3D 선물 이펙트 오버레이 */}
      <GiftEffectOverlay ref={giftOverlayRef} />

      {/* 선물 선택 바텀 시트 */}
      <GiftPickerSheet
        visible={giftPickerVisible}
        onClose={() => setGiftPickerVisible(false)}
        onSendGift={handleSendGift}
        myPoints={myPoints}
        onGoToShop={() => navigation.navigate('Shop')}
        context="chat"
      />

      {/* 프로필 사진 풀스크린 다중 뷰어 모달 (Bigo / Tinder 스타일) */}
      <Modal
        visible={photoViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoViewerVisible(false)}
      >
        <View style={styles.photoViewerBackdrop}>
          {/* 상단 바: 사진 카운터 & 닫기 버튼 */}
          <View style={styles.photoViewerTopBar}>
            <View style={styles.viewerCounterBadge}>
              <Text style={styles.viewerCounterText}>
                {viewerPhotoIndex + 1} / {displayPhotos.length}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.photoViewerCloseBtn}
              onPress={() => setPhotoViewerVisible(false)}
              hitSlop={12}
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* 사진 슬라이더 */}
          <ScrollView
            ref={viewerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const newIndex = Math.round(offsetX / SCREEN_WIDTH);
              setViewerPhotoIndex(newIndex);
            }}
            contentOffset={{ x: viewerPhotoIndex * SCREEN_WIDTH, y: 0 }}
            style={styles.viewerScrollView}
          >
            {displayPhotos.map((photo, pIdx) => (
              <View
                key={photo.id || pIdx}
                style={[styles.viewerSlide, { width: SCREEN_WIDTH }]}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={styles.photoViewerImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          {/* 이전/다음 네비게이션 버튼 (2장 이상일 때) */}
          {displayPhotos.length > 1 && (
            <>
              {viewerPhotoIndex > 0 && (
                <TouchableOpacity
                  style={[styles.viewerNavButton, styles.viewerNavButtonLeft]}
                  onPress={() => {
                    const prev = viewerPhotoIndex - 1;
                    viewerScrollRef.current?.scrollTo({ x: prev * SCREEN_WIDTH, animated: true });
                    setViewerPhotoIndex(prev);
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {viewerPhotoIndex < displayPhotos.length - 1 && (
                <TouchableOpacity
                  style={[styles.viewerNavButton, styles.viewerNavButtonRight]}
                  onPress={() => {
                    const next = viewerPhotoIndex + 1;
                    viewerScrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
                    setViewerPhotoIndex(next);
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="chevron-forward" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Modal>

      <ReportModal
        visible={reportModalVisible}
        targetName={data.name}
        targetType="user"
        onClose={() => setReportModalVisible(false)}
        onSubmit={handleReportSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroWrapper: {
    position: 'relative',
    height: 400,
    backgroundColor: colors.backgroundSecondary,
  },
  heroScrollView: {
    width: '100%',
    height: '100%',
  },
  heroSlide: {
    height: 400,
    position: 'relative',
    backgroundColor: '#1E1E2D',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  storyIndicatorsRow: {
    position: 'absolute',
    top: 10,
    left: 14,
    right: 14,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  storyIndicatorBar: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  storyIndicatorBarActive: {
    backgroundColor: '#FFFFFF',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    zIndex: 10,
  },
  photoCountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroTapLeft: {
    position: 'absolute',
    top: 70,
    bottom: 60,
    left: 0,
    width: '30%',
    zIndex: 5,
  },
  heroTapRight: {
    position: 'absolute',
    top: 70,
    bottom: 60,
    right: 0,
    width: '30%',
    zIndex: 5,
  },
  heroHeader: {
    position: 'absolute',
    top: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 15,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 42,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -48,
    left: 20,
    zIndex: 20,
  },
  avatar: {
    borderWidth: 4,
    borderColor: colors.background,
  },
  body: {
    paddingTop: 60,
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
  friendButton: {
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
  friendButtonActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0ECFF',
  },
  friendButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  interestPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },
  interestPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  giftActionButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  giftActionText: {
    color: '#EF4444',
    fontWeight: '700',
  },
  photoAlbumSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  photoAlbumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoAlbumTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoAlbumTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  photoAlbumBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  photoAlbumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  photoAlbumSubHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  photoAlbumScroll: {
    gap: 10,
    paddingRight: 10,
  },
  photoAlbumCard: {
    width: 90,
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.backgroundSecondary,
  },
  photoAlbumCardActive: {
    borderColor: colors.primary,
  },
  photoAlbumThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  primaryTagBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  photoIndexTag: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIndexTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  photoViewerBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  photoViewerTopBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  viewerCounterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewerCounterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  photoViewerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerScrollView: {
    flex: 1,
    width: '100%',
  },
  viewerSlide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  photoViewerImage: {
    width: '100%',
    height: '80%',
  },
  viewerNavButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  viewerNavButtonLeft: {
    left: 12,
  },
  viewerNavButtonRight: {
    right: 12,
  },
});
