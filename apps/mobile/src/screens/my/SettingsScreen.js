// src/screens/my/SettingsScreen.js
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import colors from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import {
  getPushNotificationsEnabled,
  setPushNotificationsEnabled,
} from '../../utils/pushNotifications';


const MANAGED_FONT_ENDPOINT = 'https://manage.tokfriends.app/api/fonts/latest';

const FALLBACK_MANAGED_FONTS = [
  {
    id: 'nanumGothicBold',
    label: '나눔고딕 Bold',
    value: 'NanumGothic_700Bold',
    uri: 'https://github.com/google/fonts/raw/main/ofl/nanumgothic/NanumGothic-Bold.ttf',
  },
];

export default function SettingsScreen({ navigation }) {
  const { user, logout, refreshMe } = useAuth();
  const userProfile = user?.profile ?? {};

  const nickname = userProfile?.nickname || user?.displayName || '회원님';
  const locationLabel = [user?.region1, user?.region2].filter(Boolean).join(' · ') || '지역 미설정';
  const tagline =
    userProfile?.headline || '한줄 소개를 등록해 주세요.';

  const [pushEnabled, setPushEnabled] = useState(true);
  const [chatPush, setChatPush] = useState(true);
  const [livePush, setLivePush] = useState(true);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [nightPushOptIn, setNightPushOptIn] = useState(false);
  const [hideOnlineStatus, setHideOnlineStatus] = useState(false);

  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [availableFonts, setAvailableFonts] = useState(() => [
    { id: 'system', label: '시스템 기본', value: 'system' },
    { id: 'notoSansRegular', label: 'Noto Sans KR', value: 'NotoSansKR_400Regular' },
    { id: 'notoSansBold', label: 'Noto Sans KR Bold', value: 'NotoSansKR_700Bold' },
  ]);
  const [selectedFont, setSelectedFont] = useState('system');
  const [fontLoading, setFontLoading] = useState(false);
  const [fontMessage, setFontMessage] = useState('');
  const [blockedCount, setBlockedCount] = useState(null);
  const [friendsCount, setFriendsCount] = useState(null);
  const [visitorsCount, setVisitorsCount] = useState(null);
  const [followersCount, setFollowersCount] = useState(null);
  const [followingCount, setFollowingCount] = useState(null);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalTitle, setLegalTitle] = useState('');
  const [legalBody, setLegalBody] = useState('');
  const [legalLoading, setLegalLoading] = useState(false);
  const [cacheSize, setCacheSize] = useState('계산 중...');

  const [announcementsModalVisible, setAnnouncementsModalVisible] = useState(false);
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const syncServerPreference = useCallback(async (patchObj) => {
    try {
      if (user?.id) {
        await apiClient.updateUser(user.id, patchObj);
        if (refreshMe) await refreshMe();
      }
    } catch (err) {
      console.warn('Failed to sync settings with server', err);
    }
  }, [user?.id, refreshMe]);

  const calculateCacheSize = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const nonEssential = keys.filter(
        (k) =>
          k !== 'tokfriends_access_token' &&
          k !== 'tokfriends_cached_user' &&
          !k.startsWith('auth_')
      );
      if (nonEssential.length === 0) {
        setCacheSize('0.0 MB');
        return;
      }
      const items = await AsyncStorage.multiGet(nonEssential);
      let totalBytes = 0;
      items.forEach(([, val]) => {
        if (val) totalBytes += val.length * 2;
      });
      const mb = (totalBytes / (1024 * 1024) + (nonEssential.length > 0 ? 3.6 : 0)).toFixed(1);
      setCacheSize(`${mb} MB`);
    } catch {
      setCacheSize('0.0 MB');
    }
  }, []);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      '캐시 데이터 정리',
      '임시 저장된 이미지 및 캐시 데이터를 정리하시겠습니까?\n로그인 정보 및 회원 데이터는 안전하게 보존됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '정리하기',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const nonEssential = keys.filter(
                (k) =>
                  k !== 'tokfriends_access_token' &&
                  k !== 'tokfriends_cached_user' &&
                  !k.startsWith('auth_')
              );
              if (nonEssential.length > 0) {
                await AsyncStorage.multiRemove(nonEssential);
              }
              setCacheSize('0.0 MB');
              Alert.alert('정리 완료', '임시 캐시가 모두 정리되어 저장 공간이 확보되었습니다.');
            } catch {
              Alert.alert('오류', '캐시 정리 중 문제가 발생했습니다.');
            }
          },
        },
      ],
    );
  }, []);

  const openLegalDocument = useCallback(async (slug, title) => {
    setLegalTitle(title);
    setLegalModalVisible(true);
    setLegalLoading(true);
    setLegalBody('');
    try {
      const response = await apiClient.getLegalDocument(slug);
      const content =
        response?.content ||
        response?.html ||
        response?.body ||
        response?.data?.content ||
        response?.text;
      if (typeof content === 'string' && content.trim()) {
        setLegalBody(content.trim());
      } else {
        setLegalBody('등록된 약관 내용을 불러오지 못했습니다.');
      }
    } catch {
      setLegalBody('약관 내용을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLegalLoading(false);
    }
  }, []);

  const openAnnouncements = useCallback(async () => {
    setAnnouncementsModalVisible(true);
    setAnnouncementsLoading(true);
    setSelectedAnnouncement(null);
    try {
      const list = await apiClient.getAnnouncements();
      setAnnouncementsList(Array.isArray(list) ? list : []);
    } catch {
      setAnnouncementsList([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  const dynamicFont = useMemo(() => {
    if (selectedFont === 'system') {
      return { heading: null, body: null };
    }
    return {
      heading: { fontFamily: selectedFont },
      body: { fontFamily: selectedFont },
    };
  }, [selectedFont]);

  const balance = useMemo(() => {
    const p = user?.pointsBalance ?? 0;
    if (typeof p === 'number') return p;
    const numeric = parseInt(String(p).replace(/\D/g, ''), 10);
    return Number.isFinite(numeric) ? numeric : 0;
  }, [user]);

  const profilePayload = useMemo(
    () => ({
      name: nickname,
      location: locationLabel,
      title: userProfile?.headline || '한줄 소개를 등록해 주세요.',
      bio: userProfile?.bio || '소개가 없습니다.',
      avatar: userProfile?.avatarUri || null,
      coverImage: userProfile?.avatarUri || null,
    }),
    [nickname, locationLabel, user]
  );

  const handleTogglePush = useCallback(async (val) => {
    setPushEnabled(val);
    await setPushNotificationsEnabled(val);
  }, []);

  const handleToggleChatPush = useCallback(async (val) => {
    setChatPush(val);
    await AsyncStorage.setItem('dagaon_chat_push', val ? 'true' : 'false');
    await syncServerPreference({ chatPushOptIn: val });
  }, [syncServerPreference]);

  const handleToggleLivePush = useCallback(async (val) => {
    setLivePush(val);
    await AsyncStorage.setItem('dagaon_live_push', val ? 'true' : 'false');
    await syncServerPreference({ livePushOptIn: val });
  }, [syncServerPreference]);

  const handleToggleMarketing = useCallback(async (val) => {
    setMarketingOptIn(val);
    if (!val) {
      setNightPushOptIn(false);
      await AsyncStorage.setItem('dagaon_night_push', 'false');
      await syncServerPreference({ marketingOptIn: false, nightPushOptIn: false });
    } else {
      await syncServerPreference({ marketingOptIn: true });
    }
    await AsyncStorage.setItem('dagaon_marketing_push', val ? 'true' : 'false');

    const now = new Date();
    const dateFormatted = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
    if (val) {
      Alert.alert(
        '혜택 및 마케팅 알림 수신 동의',
        `동의 일시: ${dateFormatted}\n다가온의 이벤트, 할인 혜택 및 추천 소식 수신에 동의하셨습니다.\n(환경설정에서 언제든지 철회할 수 있습니다)`,
      );
    } else {
      Alert.alert(
        '혜택 및 마케팅 알림 수신 철회',
        `철회 일시: ${dateFormatted}\n마케팅 정보 수신 동의가 철회되었습니다.`,
      );
    }
  }, [syncServerPreference]);

  const handleToggleNightPush = useCallback(async (val) => {
    if (val && !marketingOptIn) {
      Alert.alert('안내', '야간 혜택 알림은 마케팅 알림에 먼저 동의하신 후 설정 가능합니다.');
      return;
    }
    setNightPushOptIn(val);
    await AsyncStorage.setItem('dagaon_night_push', val ? 'true' : 'false');
    await syncServerPreference({ nightPushOptIn: val });
  }, [marketingOptIn, syncServerPreference]);

  const handleToggleHideOnline = useCallback(async (val) => {
    setHideOnlineStatus(val);
    await AsyncStorage.setItem('dagaon_hide_online', val ? 'true' : 'false');
    await syncServerPreference({ hideOnlineStatus: val });
  }, [syncServerPreference]);

  const handleToggleDarkMode = useCallback(async (val) => {
    setDarkMode(val);
    await AsyncStorage.setItem('dagaon_dark_mode', val ? 'true' : 'false');
  }, []);

  const handleChangeFontSize = useCallback(async (size) => {
    setFontSize(size);
    await AsyncStorage.setItem('dagaon_font_size', size);
  }, []);

  const themeColors = useMemo(() => {
    if (darkMode) {
      return {
        background: '#0F172A',
        card: '#1E293B',
        headerBg: '#0F172A',
        textPrimary: '#F8FAFC',
        textSecondary: '#94A3B8',
        border: '#334155',
        borderLight: '#1E293B',
        subtleBg: '#1E293B',
        subRowBg: '#162032',
        divider: '#334155',
      };
    }
    return {
      background: colors.background || '#F7F8FA',
      card: '#FFFFFF',
      headerBg: '#FFFFFF',
      textPrimary: colors.textPrimary || '#191919',
      textSecondary: colors.textSecondary || '#4A4A4A',
      border: colors.border || '#E8EAED',
      borderLight: colors.borderLight || '#F2F3F5',
      subtleBg: '#F8FAFC',
      subRowBg: '#F9FAFB',
      divider: '#E5E7EB',
    };
  }, [darkMode]);

  const fontScale = fontSize === 'large' ? 1.12 : 1.0;

  const quickActions = [
    {
      key: 'charge',
      icon: 'card-outline',
      label: '충전하기',
      value: `${balance.toLocaleString()} 온`,
      accent: colors.primary,
      onPress: () => navigation.navigate('Shop'),
    },
    {
      key: 'attendance',
      icon: 'calendar-outline',
      label: '출석체크',
      value: '매일 도전해요',
      accent: '#3B82F6',
      onPress: () => navigation.navigate('Shop'),
    },
    {
      key: 'push',
      icon: 'notifications-outline',
      label: '푸시알림',
      value: pushEnabled ? '알림 켜짐' : '알림 꺼짐',
      accent: '#A855F7',
      onPress: () => handleTogglePush(!pushEnabled),
    },
  ];

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadSettingsAndCounts = async () => {
        try {
          const [
            savedDark,
            savedFontSize,
            savedChat,
            savedLive,
            savedMarketing,
            savedNight,
            savedHideOnline,
          ] = await Promise.all([
            AsyncStorage.getItem('dagaon_dark_mode'),
            AsyncStorage.getItem('dagaon_font_size'),
            AsyncStorage.getItem('dagaon_chat_push'),
            AsyncStorage.getItem('dagaon_live_push'),
            AsyncStorage.getItem('dagaon_marketing_push'),
            AsyncStorage.getItem('dagaon_night_push'),
            AsyncStorage.getItem('dagaon_hide_online'),
          ]);

          if (active) {
            if (savedDark !== null) setDarkMode(savedDark === 'true');
            if (savedFontSize !== null) setFontSize(savedFontSize);

            if (userProfile?.chatPushOptIn !== undefined) {
              setChatPush(userProfile.chatPushOptIn !== false);
            } else if (savedChat !== null) {
              setChatPush(savedChat === 'true');
            }

            if (userProfile?.livePushOptIn !== undefined) {
              setLivePush(userProfile.livePushOptIn !== false);
            } else if (savedLive !== null) {
              setLivePush(savedLive === 'true');
            }

            if (userProfile?.marketingOptIn !== undefined) {
              setMarketingOptIn(Boolean(userProfile.marketingOptIn));
            } else if (savedMarketing !== null) {
              setMarketingOptIn(savedMarketing === 'true');
            }

            if (userProfile?.nightPushOptIn !== undefined) {
              setNightPushOptIn(Boolean(userProfile.nightPushOptIn));
            } else if (savedNight !== null) {
              setNightPushOptIn(savedNight === 'true');
            }

            if (userProfile?.hideOnlineStatus !== undefined) {
              setHideOnlineStatus(Boolean(userProfile.hideOnlineStatus));
            } else if (savedHideOnline !== null) {
              setHideOnlineStatus(savedHideOnline === 'true');
            }
          }

          const [blockedRes, friendsRes, pushPref, visitsRes, followersRes, followingRes] = await Promise.allSettled([
            apiClient.getBlockedUsers(),
            apiClient.getFriendships(),
            getPushNotificationsEnabled(),
            apiClient.getProfileVisits({ limit: 1 }),
            apiClient.getFollowers('me', { limit: 1 }),
            apiClient.getFollowing('me', { limit: 1 }),
          ]);

          if (!active) return;

          if (pushPref.status === 'fulfilled') {
            setPushEnabled(pushPref.value);
          }

          if (blockedRes.status === 'fulfilled') {
            const blockedItems = Array.isArray(blockedRes.value?.data)
              ? blockedRes.value.data
              : Array.isArray(blockedRes.value?.items)
              ? blockedRes.value.items
              : [];
            setBlockedCount(blockedItems.length);
          } else {
            setBlockedCount(null);
          }

          if (friendsRes.status === 'fulfilled') {
            const rawFriends = Array.isArray(friendsRes.value?.data)
              ? friendsRes.value.data
              : Array.isArray(friendsRes.value)
              ? friendsRes.value
              : [];
            const accepted = rawFriends.filter((f) => f.status === 'accepted');
            setFriendsCount(accepted.length);
          } else {
            setFriendsCount(null);
          }

          if (visitsRes.status === 'fulfilled') {
            const totalVisits = visitsRes.value?.total ?? (Array.isArray(visitsRes.value?.data) ? visitsRes.value.data.length : null);
            setVisitorsCount(totalVisits);
          } else {
            setVisitorsCount(null);
          }

          if (followersRes.status === 'fulfilled') {
            const totalFollowers = followersRes.value?.total ?? (Array.isArray(followersRes.value?.data) ? followersRes.value.data.length : null);
            setFollowersCount(totalFollowers);
          } else {
            setFollowersCount(null);
          }

          if (followingRes.status === 'fulfilled') {
            const totalFollowing = followingRes.value?.total ?? (Array.isArray(followingRes.value?.data) ? followingRes.value.data.length : null);
            setFollowingCount(totalFollowing);
          } else {
            setFollowingCount(null);
          }
        } catch (error) {
          console.warn('Failed to load counts in settings', error);
        }
      };

      loadSettingsAndCounts();
      calculateCacheSize();

      return () => {
        active = false;
      };
    }, [calculateCacheSize, userProfile]),
  );

  const supportLinks = [
    {
      key: 'announcements',
      icon: 'megaphone-outline',
      label: '공지사항 및 서비스 소식',
      onPress: openAnnouncements,
    },
    {
      key: 'visitors',
      icon: 'eye-outline',
      label: '프로필 방문자',
      value: visitorsCount === null ? undefined : `${visitorsCount}명`,
      onPress: () => navigation.navigate('Visitors'),
    },
    {
      key: 'follows',
      icon: 'person-add-outline',
      label: '팔로워 / 팔로잉 관리',
      value: followersCount !== null && followingCount !== null ? `${followersCount} / ${followingCount}` : undefined,
      onPress: () => navigation.navigate('Follows'),
    },
    {
      key: 'settlement',
      icon: 'cash-outline',
      label: '크리에이터 수익금 출금',
      onPress: () => navigation.navigate('Settlement'),
    },
    {
      key: 'friends',
      icon: 'people-outline',
      label: '친구 목록 및 친구 관리',
      value: friendsCount === null ? undefined : String(friendsCount) + '명',
      onPress: () => navigation.navigate('Friends'),
    },
    {
      key: 'blocked',
      icon: 'ban-outline',
      label: '내가 차단한 회원',
      value: blockedCount === null ? undefined : String(blockedCount) + '명',
      onPress: () => navigation.navigate('BlockedUsers'),
    },
    {
      key: 'cache',
      icon: 'trash-bin-outline',
      label: '임시 캐시 및 저장공간 정리',
      value: cacheSize,
      onPress: handleClearCache,
    },
    {
      key: 'support',
      icon: 'help-circle-outline',
      label: '고객센터 및 운영정책',
      onPress: () => openLegalDocument('community-guidelines', '커뮤니티 가이드라인 및 운영정책'),
    },
    {
      key: 'terms',
      icon: 'document-text-outline',
      label: '서비스 이용약관',
      onPress: () => openLegalDocument('terms-of-service', '서비스 이용약관'),
    },
    {
      key: 'privacy',
      icon: 'shield-checkmark-outline',
      label: '개인정보 처리방침',
      onPress: () => openLegalDocument('privacy-policy', '개인정보 처리방침'),
    },
    {
      key: 'location',
      icon: 'location-outline',
      label: '위치기반서비스 이용약관',
      onPress: () => openLegalDocument('location-based-service', '위치기반서비스 이용약관'),
    },
    {
      key: 'version',
      icon: 'information-circle-outline',
      label: '앱 버전 정보',
      value: 'v1.2.0 (SDK 57)',
      onPress: () =>
        Alert.alert(
          '버전 정보',
          '다가온 v1.2.0\nExpo SDK 57 최신 정식 버전이 설치되어 있습니다.\n\n안정적인 실시간 소통을 위해 최신 상태를 유지하고 있습니다.',
        ),
    },
  ];

    const handleSelectFont = useCallback((value) => {
    setSelectedFont(value);
    setFontMessage('');
  }, []);

  const handleAddManagedFont = useCallback(async () => {
    if (fontLoading) {
      return;
    }

    setFontLoading(true);
    setFontMessage('관리서버에서 새 폰트를 다운로드 중이에요...');

    const existing = new Set(availableFonts.map((font) => font.value));
    let candidate = null;

    try {
      const response = await fetch(MANAGED_FONT_ENDPOINT);
      if (response.ok) {
        const payload = await response.json();
        const entries = [];
        const rawFonts = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.fonts)
          ? payload.fonts
          : Array.isArray(payload?.data?.fonts)
          ? payload.data.fonts
          : payload?.font
          ? [payload.font]
          : [];

        rawFonts.forEach((item, index) => {
          const rawFamily =
            item?.expoFamily ||
            item?.fontFamily ||
            item?.family ||
            item?.value ||
            item?.name ||
            `ManagedFont${index + 1}`;
          const family = String(rawFamily).replace(/[^0-9a-zA-Z_-]/g, '') || `ManagedFont${index + 1}`;
          const uri = item?.uri || item?.url || item?.source;
          if (!uri) return;
          entries.push({
            id: item?.id || family,
            label: item?.displayName || item?.label || item?.name || `커스텀 폰트 ${index + 1}`,
            value: family,
            uri,
          });
        });

        candidate = entries.find((font) => !existing.has(font.value));
      }
    } catch (error) {
      console.warn('Failed to fetch managed font manifest', error);
    }

    if (!candidate) {
      candidate = FALLBACK_MANAGED_FONTS.find((font) => !existing.has(font.value));
    }

    if (!candidate) {
      setFontMessage('추가할 수 있는 새 폰트가 없어요.');
      setFontLoading(false);
      return;
    }

    try {
      await Font.loadAsync({ [candidate.value]: candidate.uri });
      setAvailableFonts((prev) => [...prev, candidate]);
      setSelectedFont(candidate.value);
      setFontMessage(`'${candidate.label}' 폰트를 적용했어요.`);
    } catch (error) {
      console.warn('Failed to load managed font', error);
      setFontMessage('폰트를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setFontLoading(false);
    }
  }, [availableFonts, fontLoading]);

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '로그아웃하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: () => {
            void logout();
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '정말로 다가온 서비스를 탈퇴하시겠습니까?\n\n탈퇴 시 모든 개인정보 및 프로필, 보유 온(ON)이 소멸되며 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '최종 확인',
              '탈퇴 처리 후 즉시 계정이 비활성화되고 로그아웃됩니다. 계속 진행하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                {
                  text: '확인 및 탈퇴',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await apiClient.deleteAccount();
                      Alert.alert('탈퇴 완료', '회원 탈퇴가 정상적으로 완료되었습니다. 이용해 주셔서 감사합니다.');
                      await logout();
                    } catch (e) {
                      Alert.alert('탈퇴 실패', e?.message || '회원 탈퇴 처리 중 오류가 발생했습니다.');
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleOpenProfile = () => {
    navigation.navigate('ProfileDetail', {
      profile: profilePayload,
      isSelf: true,
      preferredFont: selectedFont,
    });
  };

  const canGoBack = (navigation.getState()?.index ?? 0) > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.headerBg }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.borderLight }]}>
        <View style={styles.headerLeft}>
          {canGoBack && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={[styles.headerTitle, dynamicFont.heading, { color: themeColors.textPrimary, fontSize: 20 * fontScale }]}>
            설정
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: themeColors.background }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={handleOpenProfile}>
          <View style={[styles.profileCard, { backgroundColor: themeColors.card }]}>
            <Avatar
              size={72}
              name={nickname}
              uri={userProfile?.avatarUri}
              showBorder
              style={styles.profileAvatar}
            />
            <View style={{ flex: 1 }}>
              <View style={styles.profileNameRow}>
                <Text style={[styles.profileName, dynamicFont.heading, { color: themeColors.textPrimary, fontSize: 21 * fontScale }]}>
                  {nickname}
                </Text>
                {hideOnlineStatus ? (
                  <View style={styles.incognitoBadge}>
                    <Ionicons name="eye-off-outline" size={11} color="#64748B" />
                    <Text style={styles.incognitoBadgeText}>시크릿</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.profileMeta, dynamicFont.body, { color: themeColors.textSecondary, fontSize: 13 * fontScale }]}>
                {locationLabel}
              </Text>
              <Text style={[styles.profileNote, dynamicFont.body, { color: themeColors.textSecondary, fontSize: 13 * fontScale }]}>
                {tagline}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* 소셜 관계 카운터 바 (방문자 / 팔로워 / 팔로잉 / 친구) */}
        <View style={[styles.socialStatsBar, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}>
          <TouchableOpacity
            style={styles.socialStatItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Visitors')}
          >
            <Text style={[styles.socialStatCount, dynamicFont.heading, { color: themeColors.textPrimary, fontSize: 18 * fontScale }]}>
              {visitorsCount !== null ? visitorsCount : 0}
            </Text>
            <Text style={[styles.socialStatLabel, dynamicFont.body, { color: themeColors.textSecondary, fontSize: 12 * fontScale }]}>
              방문자
            </Text>
          </TouchableOpacity>

          <View style={[styles.socialStatDivider, { backgroundColor: themeColors.divider }]} />

          <TouchableOpacity
            style={styles.socialStatItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Follows', { initialTab: 'followers' })}
          >
            <Text style={[styles.socialStatCount, dynamicFont.heading, { color: themeColors.textPrimary, fontSize: 18 * fontScale }]}>
              {followersCount !== null ? followersCount : 0}
            </Text>
            <Text style={[styles.socialStatLabel, dynamicFont.body, { color: themeColors.textSecondary, fontSize: 12 * fontScale }]}>
              팔로워
            </Text>
          </TouchableOpacity>

          <View style={[styles.socialStatDivider, { backgroundColor: themeColors.divider }]} />

          <TouchableOpacity
            style={styles.socialStatItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Follows', { initialTab: 'following' })}
          >
            <Text style={[styles.socialStatCount, dynamicFont.heading, { color: themeColors.textPrimary, fontSize: 18 * fontScale }]}>
              {followingCount !== null ? followingCount : 0}
            </Text>
            <Text style={[styles.socialStatLabel, dynamicFont.body, { color: themeColors.textSecondary, fontSize: 12 * fontScale }]}>
              팔로잉
            </Text>
          </TouchableOpacity>

          <View style={[styles.socialStatDivider, { backgroundColor: themeColors.divider }]} />

          <TouchableOpacity
            style={styles.socialStatItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Friends')}
          >
            <Text style={[styles.socialStatCount, dynamicFont.heading, { color: themeColors.textPrimary, fontSize: 18 * fontScale }]}>
              {friendsCount !== null ? friendsCount : 0}
            </Text>
            <Text style={[styles.socialStatLabel, dynamicFont.body, { color: themeColors.textSecondary, fontSize: 12 * fontScale }]}>
              내 친구
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicFont.heading, { color: themeColors.textPrimary, fontSize: 16 * fontScale }]}>
            빠른 메뉴
          </Text>
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            {quickActions.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.quickItem}
                activeOpacity={0.85}
                onPress={item.onPress}
              >
                <View style={[styles.quickIcon, { backgroundColor: `${item.accent}1A` }]}>
                  <Ionicons name={item.icon} size={18} color={item.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.quickLabel, dynamicFont.body, { color: themeColors.textPrimary, fontSize: 15 * fontScale }]}>
                    {item.label}
                  </Text>
                  {!!item.value && (
                    <Text style={[styles.quickValue, dynamicFont.body, { color: themeColors.textSecondary, fontSize: 13 * fontScale }]}>
                      {item.value}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={themeColors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. 푸시 알림 세부 설정 (법령 준수 & 마케팅/야간/채팅 분리) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicFont.heading, { color: themeColors.textPrimary, fontSize: 16 * fontScale }]}>
            알림 설정
          </Text>
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            {/* 마스터 푸시 */}
            <View style={[styles.toggleRow, { borderTopWidth: 0 }]}>
              <View style={styles.subToggleInfo}>
                <Text style={[styles.toggleLabel, dynamicFont.body, { color: themeColors.textPrimary, fontSize: 15 * fontScale }]}>
                  전체 푸시 알림
                </Text>
                <Text style={[styles.subToggleDesc, { color: themeColors.textSecondary, fontSize: 12 * fontScale }]}>
                  모든 앱 알림을 일괄 수신하거나 해제합니다.
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={handleTogglePush}
                trackColor={{ true: colors.primaryLight, false: '#E5E7EB' }}
                thumbColor={pushEnabled ? colors.primary : '#ffffff'}
              />
            </View>

            {pushEnabled && (
              <>
                {/* 1:1 채팅 알림 */}
                <View style={[styles.subToggleRow, { borderTopColor: themeColors.divider }]}>
                  <View style={styles.subToggleInfo}>
                    <Text style={[styles.subToggleLabel, dynamicFont.body, { color: themeColors.textPrimary, fontSize: 14 * fontScale }]}>
                      대화 및 1:1 메시지
                    </Text>
                    <Text style={[styles.subToggleDesc, { color: themeColors.textSecondary, fontSize: 12 * fontScale }]}>
                      새로운 쪽지 및 채팅 도착 알림
                    </Text>
                  </View>
                  <Switch
                    value={chatPush}
                    onValueChange={handleToggleChatPush}
                    trackColor={{ true: colors.primaryLight, false: '#E5E7EB' }}
                    thumbColor={chatPush ? colors.primary : '#ffffff'}
                  />
                </View>

                {/* 라이브 방송 알림 */}
                <View style={[styles.subToggleRow, { borderTopColor: themeColors.divider }]}>
                  <View style={styles.subToggleInfo}>
                    <Text style={[styles.subToggleLabel, dynamicFont.body, { color: themeColors.textPrimary, fontSize: 14 * fontScale }]}>
                      라이브 방송 시작
                    </Text>
                    <Text style={[styles.subToggleDesc, { color: themeColors.textSecondary, fontSize: 12 * fontScale }]}>
                      내가 팔로우한 호스트의 실시간 방송 알림
                    </Text>
                  </View>
                  <Switch
                    value={livePush}
                    onValueChange={handleToggleLivePush}
                    trackColor={{ true: colors.primaryLight, false: '#E5E7EB' }}
                    thumbColor={livePush ? colors.primary : '#ffffff'}
                  />
                </View>

                {/* 혜택 및 이벤트 (마케팅 정보 수신) */}
                <View style={[styles.subToggleRow, { borderTopColor: themeColors.divider }]}>
                  <View style={styles.subToggleInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.subToggleLabel, dynamicFont.body, { color: themeColors.textPrimary, fontSize: 14 * fontScale }]}>
                        혜택 및 이벤트 알림
                      </Text>
                      <View style={styles.badgeMini}>
                        <Text style={styles.badgeMiniText}>선택</Text>
                      </View>
                    </View>
                    <Text style={[styles.subToggleDesc, { color: themeColors.textSecondary, fontSize: 12 * fontScale }]}>
                      다가온의 프로모션, 포인트 혜택 및 추천 소식 (정보통신망법 준수)
                    </Text>
                  </View>
                  <Switch
                    value={marketingOptIn}
                    onValueChange={handleToggleMarketing}
                    trackColor={{ true: colors.primaryLight, false: '#E5E7EB' }}
                    thumbColor={marketingOptIn ? colors.primary : '#ffffff'}
                  />
                </View>

                {/* 야간 혜택 알림 (21:00 ~ 08:00) */}
                <View style={[styles.subToggleRow, { borderTopColor: themeColors.divider, opacity: marketingOptIn ? 1 : 0.45 }]}>
                  <View style={styles.subToggleInfo}>
                    <Text style={[styles.subToggleLabel, dynamicFont.body, { color: themeColors.textPrimary, fontSize: 14 * fontScale }]}>
                      야간 혜택 알림 (21:00 ~ 08:00)
                    </Text>
                    <Text style={[styles.subToggleDesc, { color: themeColors.textSecondary, fontSize: 12 * fontScale }]}>
                      밤 시간대 긴급 이벤트 및 타임 특가 알림 수신
                    </Text>
                  </View>
                  <Switch
                    value={nightPushOptIn}
                    onValueChange={handleToggleNightPush}
                    disabled={!marketingOptIn}
                    trackColor={{ true: colors.primaryLight, false: '#E5E7EB' }}
                    thumbColor={nightPushOptIn ? colors.primary : '#ffffff'}
                  />
                </View>
              </>
            )}
          </View>
        </View>

        {/* 3. 프라이버시 및 탐색 설정 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicFont.heading, { color: themeColors.textPrimary, fontSize: 16 * fontScale }]}>
            프라이버시 & 탐색
          </Text>
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            {/* 접속 상태 숨김 (시크릿 모드) */}
            <View style={styles.privacyItem}>
              <View style={styles.privacyInfo}>
                <View style={styles.privacyLabelRow}>
                  <Ionicons name="eye-off-outline" size={17} color={colors.primary} />
                  <Text style={[styles.privacyLabel, dynamicFont.body, { color: themeColors.textPrimary, fontSize: 15 * fontScale }]}>
                    접속 상태 숨기기 (시크릿 모드)
                  </Text>
                </View>
                <Text style={[styles.privacyDesc, { color: themeColors.textSecondary, fontSize: 12 * fontScale }]}>
                  홈 및 인연 탭에서 내 온라인 접속 중 표시(초록색 뱃지)를 숨깁니다.
                </Text>
              </View>
              <Switch
                value={hideOnlineStatus}
                onValueChange={handleToggleHideOnline}
                trackColor={{ true: colors.primaryLight, false: '#E5E7EB' }}
                thumbColor={hideOnlineStatus ? colors.primary : '#ffffff'}
              />
            </View>

            {/* 내가 차단한 회원 관리 */}
            <TouchableOpacity
              style={[styles.supportRow, { borderTopWidth: 1, borderTopColor: themeColors.divider }]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('BlockedUsers')}
            >
              <Ionicons
                name="ban-outline"
                size={18}
                color={themeColors.textSecondary}
                style={{ width: 22 }}
              />
              <Text style={[styles.supportLabel, dynamicFont.body, { color: themeColors.textPrimary, fontSize: 15 * fontScale }]}>
                내가 차단한 회원
              </Text>
              {blockedCount !== null && (
                <Text style={[styles.supportValue, dynamicFont.body, { color: themeColors.textSecondary, fontSize: 13 * fontScale }]}>
                  {blockedCount}명
                </Text>
              )}
              <Ionicons name="chevron-forward" size={16} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. 화면 및 접근성 설정 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicFont.heading, { color: themeColors.textPrimary, fontSize: 16 * fontScale }]}>
            화면 및 접근성
          </Text>
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            {/* 다크모드 */}
            <View style={[styles.toggleRow, { borderTopWidth: 0 }]}>
              <View style={styles.subToggleInfo}>
                <Text style={[styles.toggleLabel, dynamicFont.body, { color: themeColors.textPrimary, fontSize: 15 * fontScale }]}>
                  다크모드
                </Text>
                <Text style={[styles.subToggleDesc, { color: themeColors.textSecondary, fontSize: 12 * fontScale }]}>
                  어두운 테마로 눈의 피로를 줄입니다.
                </Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={handleToggleDarkMode}
                trackColor={{ true: colors.primaryLight, false: '#E5E7EB' }}
                thumbColor={darkMode ? '#1F2937' : '#ffffff'}
              />
            </View>

            {/* 폰트 크기 */}
            <View style={[styles.fontRow, { borderTopColor: themeColors.divider }]}>
              <Text style={[styles.toggleLabel, dynamicFont.body, { color: themeColors.textPrimary, fontSize: 15 * fontScale }]}>
                글자 크기
              </Text>
              <View style={styles.fontChoiceRow}>
                <TouchableOpacity
                  style={[styles.fontChoice, fontSize === 'medium' && styles.fontChoiceActive]}
                  onPress={() => handleChangeFontSize('medium')}
                >
                  <Text
                    style={[
                      styles.fontChoiceText,
                      fontSize === 'medium' && styles.fontChoiceTextActive,
                    ]}
                  >
                    기본
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fontChoice, fontSize === 'large' && styles.fontChoiceActive]}
                  onPress={() => handleChangeFontSize('large')}
                >
                  <Text
                    style={[
                      styles.fontChoiceText,
                      fontSize === 'large' && styles.fontChoiceTextActive,
                    ]}
                  >
                    크게
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 폰트 스타일 */}
            <View style={[styles.fontManagerRow, { borderTopColor: themeColors.divider }]}>
              <Text style={[styles.toggleLabel, dynamicFont.body, { color: themeColors.textPrimary, fontSize: 15 * fontScale }]}>
                글꼴 스타일
              </Text>
              <TouchableOpacity
                style={[styles.fontAddButton, fontLoading && styles.fontAddButtonDisabled]}
                onPress={handleAddManagedFont}
                activeOpacity={0.85}
                disabled={fontLoading}
              >
                {fontLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.fontAddButtonText}>폰트 추가</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.fontOptionsWrap}>
              {availableFonts.map((font) => {
                const isSelected = selectedFont === font.value;
                return (
                  <TouchableOpacity
                    key={font.value}
                    style={[styles.fontOption, isSelected && styles.fontOptionActive]}
                    onPress={() => handleSelectFont(font.value)}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.fontOptionText,
                        isSelected && styles.fontOptionTextActive,
                        font.value !== 'system' ? { fontFamily: font.value } : null,
                      ]}
                    >
                      {font.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.fontPreviewCard, { backgroundColor: themeColors.subRowBg, borderColor: themeColors.divider }]}>
              <Text style={[styles.fontPreviewLabel, dynamicFont.body, { color: themeColors.textSecondary }]}>
                폰트 미리보기
              </Text>
              <Text
                style={[
                  styles.fontPreviewText,
                  { color: themeColors.textPrimary, fontSize: 15 * fontScale },
                  selectedFont !== 'system' ? { fontFamily: selectedFont } : null,
                ]}
              >
                좋은 인연은 멀지 않아요. 새로운 이야기가 다가옵니다!
              </Text>
              {!!fontMessage && <Text style={styles.fontStatusText}>{fontMessage}</Text>}
            </View>
          </View>
        </View>

        {/* 5. 고객센터 & 도움말 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicFont.heading, { color: themeColors.textPrimary, fontSize: 16 * fontScale }]}>
            고객센터 & 도움말
          </Text>
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            {supportLinks.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.supportRow, { borderBottomColor: themeColors.divider }]}
                activeOpacity={0.85}
                onPress={item.onPress}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={themeColors.textSecondary}
                  style={{ width: 22 }}
                />
                <Text style={[styles.supportLabel, dynamicFont.body, { color: themeColors.textPrimary, fontSize: 15 * fontScale }]}>
                  {item.label}
                </Text>
                {item.value ? (
                  <Text style={[styles.supportValue, dynamicFont.body, { color: themeColors.textSecondary, fontSize: 13 * fontScale }]}>
                    {item.value}
                  </Text>
                ) : null}
                <Ionicons name="chevron-forward" size={16} color={themeColors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 6. 계정 관리 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicFont.heading, { color: themeColors.textPrimary, fontSize: 16 * fontScale }]}>
            계정 관리
          </Text>
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <TouchableOpacity
              style={styles.logoutRow}
              activeOpacity={0.85}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text style={[styles.logoutLabel, dynamicFont.body, { fontSize: 15 * fontScale }]}>
                로그아웃
              </Text>
            </TouchableOpacity>

            <View style={[styles.accountDivider, { backgroundColor: themeColors.divider }]} />

            <TouchableOpacity
              style={styles.deleteAccountRow}
              activeOpacity={0.85}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={18} color="#94A3B8" />
              <Text style={[styles.deleteAccountLabel, dynamicFont.body, { fontSize: 14 * fontScale }]}>
                회원 탈퇴
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.footerCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          activeOpacity={0.9}
          onPress={handleOpenProfile}
        >
          <Text style={[styles.footerTitle, dynamicFont.heading, { color: themeColors.textPrimary, fontSize: 16 * fontScale }]}>
            내 프로필 수정 및 전체 보기
          </Text>
          <Text style={[styles.footerSubtitle, dynamicFont.body, { color: themeColors.textSecondary, fontSize: 13 * fontScale }]}>
            사진첩, 지역, 관심사 및 소개글을 관리하세요.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={legalModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLegalModalVisible(false)}
      >
        <View style={styles.legalModalBackdrop}>
          <View style={styles.legalModalContainer}>
            <View style={styles.legalModalHeader}>
              <Text style={styles.legalModalTitle}>{legalTitle}</Text>
              <TouchableOpacity
                onPress={() => setLegalModalVisible(false)}
                hitSlop={8}
                style={styles.legalCloseBtn}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.legalModalBody} showsVerticalScrollIndicator={false}>
              {legalLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginTop: 40 }}
                />
              ) : (
                <Text style={styles.legalModalText}>{legalBody}</Text>
              )}
            </ScrollView>
          </View>
      </Modal>

      {/* Announcements Modal */}
      <Modal
        visible={announcementsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAnnouncementsModalVisible(false)}
      >
        <View style={styles.legalModalBackdrop}>
          <View style={styles.legalModalContainer}>
            <View style={styles.legalModalHeader}>
              <Text style={styles.legalModalTitle}>
                {selectedAnnouncement ? '공지사항 상세' : '공지사항 및 안내'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (selectedAnnouncement) {
                    setSelectedAnnouncement(null);
                  } else {
                    setAnnouncementsModalVisible(false);
                  }
                }}
                hitSlop={8}
                style={styles.legalCloseBtn}
              >
                <Ionicons
                  name={selectedAnnouncement ? 'chevron-back' : 'close'}
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.legalModalBody} showsVerticalScrollIndicator={false}>
              {announcementsLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginTop: 40 }}
                />
              ) : selectedAnnouncement ? (
                <View style={{ paddingVertical: 8 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#191919', lineHeight: 24, marginBottom: 8 }}>
                    {selectedAnnouncement.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#8E8E93', marginBottom: 16 }}>
                    {selectedAnnouncement.createdAt ? new Date(selectedAnnouncement.createdAt).toLocaleDateString('ko-KR') : ''}
                  </Text>
                  <View style={{ height: 1, backgroundColor: '#E8EAED', marginBottom: 16 }} />
                  <Text style={{ fontSize: 14, color: '#4A4A4A', lineHeight: 22 }}>
                    {selectedAnnouncement.body || selectedAnnouncement.content || '내용이 없습니다.'}
                  </Text>
                </View>
              ) : announcementsList.length > 0 ? (
                announcementsList.map((ann) => (
                  <TouchableOpacity
                    key={ann.id}
                    style={{
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F0F2F5',
                    }}
                    activeOpacity={0.8}
                    onPress={() => setSelectedAnnouncement(ann)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                        NOTICE
                      </Text>
                      <Text style={{ fontSize: 11, color: '#8E8E93' }}>
                        {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('ko-KR') : ''}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#191919' }} numberOfLines={1}>
                      {ann.title}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <Text style={{ color: '#8E8E93', fontSize: 14 }}>등록된 공지사항이 없습니다.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRight: { width: 32 },
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
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  profileCard: {
    marginTop: 16,
    marginHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  socialStatsBar: {
    marginTop: 12,
    marginHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.borderLight || '#F0F0F0',
  },
  socialStatItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  socialStatCount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary || '#191919',
    letterSpacing: -0.3,
  },
  socialStatLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary || '#6B7280',
  },
  socialStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  profileAvatar: {
    borderWidth: 4,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  profileMeta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  profileNote: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  section: {
    marginTop: 22,
    paddingHorizontal: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  quickValue: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  incognitoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  incognitoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  subToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingLeft: 8,
    borderTopWidth: 1,
  },
  subToggleInfo: {
    flex: 1,
    paddingRight: 12,
  },
  subToggleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  subToggleDesc: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
  },
  badgeMini: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
  },
  badgeMiniText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  privacyInfo: {
    flex: 1,
    paddingRight: 12,
  },
  privacyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  privacyDesc: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
  },
  fontRow: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fontChoiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  fontChoice: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.pillBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fontChoiceActive: {
    backgroundColor: colors.pillActiveBg,
    borderColor: colors.pillActiveBorder,
  },
  fontChoiceText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  fontChoiceTextActive: {
    color: colors.primary,
  },
    fontManagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fontAddButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  fontAddButtonDisabled: {
    opacity: 0.6,
  },
  fontAddButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  fontOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  fontOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.pillBg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  fontOptionActive: {
    backgroundColor: colors.pillActiveBg,
    borderColor: colors.pillActiveBorder,
  },
  fontOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  fontOptionTextActive: {
    color: colors.primary,
  },
  fontPreviewCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  fontPreviewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  fontPreviewText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
  },
  fontStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  supportLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  supportValue: {
    marginRight: 6,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  footerCard: {
    marginTop: 24,
    marginHorizontal: 18,
    backgroundColor: '#FFE0D6',
    borderRadius: 20,
    padding: 20,
    alignItems: 'flex-start',
    gap: 6,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6A55',
  },
  footerSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  legalModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  legalModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 30,
  },
  legalModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legalModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  legalCloseBtn: {
    padding: 4,
  },
  legalModalBody: {
    padding: 20,
  },
  legalModalText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  accountDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  deleteAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  deleteAccountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
});
