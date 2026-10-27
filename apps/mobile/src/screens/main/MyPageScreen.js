// apps/mobile/src/screens/main/MyPageScreen.js
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { tokens } from '../../theme/tokens';
import { UserAvatar } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { claimAdReward } from '../../services/adsService';
import { INITIAL_MARKET_PRODUCTS } from '../../services/marketService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MyPageScreen({ navigation }) {
  const { user, logout, refreshMe } = useAuth();
  const userProfile = user?.profile ?? {};

  // 프로필 기본 정보 (나이 및 성별 포함)
  const nickname = user?.nickname || userProfile?.nickname || user?.displayName || '모꼬이웃';
  const age = user?.age || userProfile?.age || 26;
  const gender = user?.gender || userProfile?.gender || '여';
  const locationLabel =
    [user?.region1 || userProfile?.region1, user?.region2 || userProfile?.region2].filter(Boolean).join(' · ') ||
    user?.location ||
    '서울 강남구 역삼1동';
  const tagline =
    user?.headline ||
    userProfile?.headline ||
    user?.bio ||
    userProfile?.bio ||
    '동네 친구들과 따뜻하고 즐거운 소통 나누고 싶어요 ✨';
  const avatarUri =
    user?.avatarUrl ||
    user?.avatarUri ||
    userProfile?.avatarUri ||
    userProfile?.avatarUrl ||
    user?.photos?.[0]?.url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';

  // 1. 모꼬 포인트 잔액 (인앱 라이브/후원/채팅용)
  const pointBalance = useMemo(() => {
    const p = user?.pointBalance ?? user?.pointsBalance ?? user?.points ?? user?.balance ?? 1250;
    if (typeof p === 'number') return p;
    const numeric = parseInt(String(p).replace(/\D/g, ''), 10);
    return Number.isFinite(numeric) ? numeric : 1250;
  }, [user]);

  // 2. 판매 정산금 (중고거래 및 마켓 판매 정산용 - 원화 KRW 분리)
  const [sellerRevenue, setSellerRevenue] = useState(185000);

  // 3. 소셜 팔로워 / 팔로잉 통계 (방문자, 내인연 제거 완료)
  const [socialStats, setSocialStats] = useState({
    followers: 124,
    following: 58,
  });

  // 4. 중고거래 & 마켓거래 관리 데이터 상태
  // (1) 관심목록 (찜한 상품)
  const [wishlist, setWishlist] = useState([
    INITIAL_MARKET_PRODUCTS[0], // 아이폰 15 프로
    INITIAL_MARKET_PRODUCTS[1], // 캠핑 체어
    INITIAL_MARKET_PRODUCTS[3], // 논산 설향 딸기
  ]);
  const [wishlistModalVisible, setWishlistModalVisible] = useState(false);

  // (2) 판매관리 (내 판매 물품: 판매중/예약중/판매완료)
  const [mySalesList, setMySalesList] = useState([
    {
      id: 'my-sale-01',
      title: '소니 WH-1000XM5 노이즈캔슬링 헤드폰 실버 풀박스',
      price: 320000,
      status: 'SELLING', // 'SELLING' | 'RESERVED' | 'COMPLETED'
      statusLabel: '판매중',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      likes: 19,
      chats: 7,
      createdAt: '2시간 전',
      region: '역삼1동',
    },
    {
      id: 'my-sale-02',
      title: 'M2 맥북 에어 15인치 16GB 512GB 스페이스그레이',
      price: 1480000,
      status: 'RESERVED',
      statusLabel: '예약중',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
      likes: 35,
      chats: 12,
      createdAt: '어제',
      region: '역삼1동',
    },
    {
      id: 'my-sale-03',
      title: '닌텐도 스위치 OLED 화이트 본체 풀박스',
      price: 290000,
      status: 'COMPLETED',
      statusLabel: '판매완료',
      image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400',
      likes: 27,
      chats: 14,
      createdAt: '3일 전',
      region: '역삼1동',
    },
  ]);
  const [salesModalVisible, setSalesModalVisible] = useState(false);
  const [salesFilterTab, setSalesFilterTab] = useState('ALL'); // 'ALL' | 'SELLING' | 'RESERVED' | 'COMPLETED'

  // (3) 구매 / 예약 내역 (안전결제 주문)
  const [myOrdersList, setMyOrdersList] = useState([
    {
      id: 'ord-safe-01',
      orderNumber: 'ORD-20261027-891',
      title: '아이폰 15 프로 256GB 내추럴 티타늄',
      sellerName: '테크러버',
      price: 980000,
      status: 'RESERVED',
      statusText: '직거래 예약중',
      paymentType: '에스크로 안전결제',
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
      date: '2026.10.27',
      location: '역삼역 3번출구',
    },
    {
      id: 'ord-safe-02',
      orderNumber: 'ORD-20261025-420',
      title: '[입점사특가] 제주 산지직송 프리미엄 흑돼지 오겹살 1kg',
      sellerName: '제주푸드 본사 직영',
      price: 32900,
      status: 'COMPLETED',
      statusText: '구매확정 완료',
      paymentType: '안전결제 택배배송',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      date: '2026.10.25',
      location: '택배 배송 완료',
    },
  ]);
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [ordersFilterTab, setOrdersFilterTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'

  // 무료 MC 충전소 광고 시청 상태
  const [rewardAdModalVisible, setRewardAdModalVisible] = useState(false);
  const [rewardAdCountdown, setRewardAdCountdown] = useState(5);
  const [isAdWatching, setIsAdWatching] = useState(false);
  const [claimingReward, setClaimingReward] = useState(false);
  const [todayRewardClaims, setTodayRewardClaims] = useState(0);

  // 1:1 대화 / 영상(LIVE) 단가 설정 상태 (모꼬 포인트 P 기준)
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [chatEntryFee, setChatEntryFee] = useState(
    Number(user?.chatEntryFee ?? userProfile?.chatEntryFee ?? 30)
  );
  const [customChatFeeInput, setCustomChatFeeInput] = useState('');
  const [currentLiveRate, setCurrentLiveRate] = useState(1500);
  const [customRateInput, setCustomRateInput] = useState('');

  // 알림 설정 모달 상태
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [chatPush, setChatPush] = useState(true);
  const [livePush, setLivePush] = useState(true);
  const [nightPush, setNightPush] = useState(false);

  // AI 안심 케어 센터 모달 상태
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);

  // 약관/고객센터 모달 상태 & FAQ 목록
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [faqsList, setFaqsList] = useState([]);
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  // 1:1 고객 문의 작성 모달 상태
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [inquiryCategory, setInquiryCategory] = useState('문의');
  const [inquiryContact, setInquiryContact] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // 캐시 상태
  const [cacheSize, setCacheSize] = useState('12.4 MB');

  // 고객센터 FAQ 로드
  const loadFaqsData = useCallback(async () => {
    try {
      const items = await apiClient.getFaqs();
      if (Array.isArray(items) && items.length > 0) {
        setFaqsList(items);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (termsModalVisible) {
      loadFaqsData();
    }
  }, [termsModalVisible, loadFaqsData]);

  // 화면 진입 시 최신 데이터 로드
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (refreshMe) {
        refreshMe().catch(() => {});
      }

      // 팔로워/팔로잉 최신 수치 로드
      if (user?.id) {
        Promise.allSettled([
          apiClient.getFollowers(user.id),
          apiClient.getFollowing(user.id),
        ]).then(([f1, f2]) => {
          if (!isMounted) return;
          const followersCnt =
            f1.status === 'fulfilled' && Array.isArray(f1.value?.items || f1.value)
              ? (f1.value.items || f1.value).length
              : 124;
          const followingCnt =
            f2.status === 'fulfilled' && Array.isArray(f2.value?.items || f2.value)
              ? (f2.value.items || f2.value).length
              : 58;
          setSocialStats({ followers: followersCnt, following: followingCnt });
        });
      }

      // 저장된 설정 로드
      AsyncStorage.multiGet([
        'mocco_chat_entry_fee',
        'mocco_live_rate',
        'mocco_chat_push',
        'mocco_live_push',
        'mocco_night_push',
      ]).then((pairs) => {
        if (!isMounted) return;
        pairs.forEach(([key, val]) => {
          if (!val) return;
          if (key === 'mocco_chat_entry_fee') setChatEntryFee(Number(val) || 0);
          if (key === 'mocco_live_rate') setCurrentLiveRate(Number(val) || 1500);
          if (key === 'mocco_chat_push') setChatPush(val === 'true');
          if (key === 'mocco_live_push') setLivePush(val === 'true');
          if (key === 'mocco_night_push') setNightPush(val === 'true');
        });
      });

      return () => {
        isMounted = false;
      };
    }, [refreshMe, user?.id])
  );

  // 1:1 대화 입장료 저장 (모꼬 포인트 P)
  const handleSaveChatFee = useCallback(
    async (fee) => {
      const numericFee = Math.max(0, parseInt(String(fee).replace(/\D/g, ''), 10) || 0);
      setChatEntryFee(numericFee);
      await AsyncStorage.setItem('mocco_chat_entry_fee', String(numericFee));
      try {
        if (user?.id) {
          await apiClient.updateUser(user.id, { chatEntryFee: numericFee });
        }
        if (refreshMe) refreshMe().catch(() => {});
      } catch {}
      setCustomChatFeeInput('');
      Alert.alert('설정 완료', `1:1 대화방 입장 단가가 ${numericFee} P로 성공적으로 저장되었습니다! ✨`);
    },
    [user?.id, refreshMe]
  );

  // 1:1 영상/LIVE 단가 저장 (모꼬 포인트 P)
  const handleSaveLiveRate = useCallback(
    async (rate) => {
      const numericRate = Number(rate);
      if (!numericRate || numericRate < 100 || numericRate > 100000) {
        Alert.alert('단가 오류', '영상/통화 단가는 분당 100 ~ 100,000 P 사이의 숫자로 입력해주세요.');
        return;
      }
      setCurrentLiveRate(numericRate);
      await AsyncStorage.setItem('mocco_live_rate', String(numericRate));
      try {
        if (user?.id) {
          await apiClient.updateUser(user.id, {
            liveRatePerMinute: numericRate,
            callRatePerMinute: numericRate,
          });
        }
        if (refreshMe) refreshMe().catch(() => {});
      } catch {}
      setCustomRateInput('');
      Alert.alert('설정 완료', `1:1 영상 단가가 분당 ${numericRate.toLocaleString()} P로 성공적으로 변경되었습니다! ✨`);
    },
    [user?.id, refreshMe]
  );

  // 내 판매 물품 상태 변경 (판매중 / 예약중 / 판매완료)
  const handleChangeSaleStatus = (itemId, nextStatus) => {
    setMySalesList((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const label = nextStatus === 'SELLING' ? '판매중' : nextStatus === 'RESERVED' ? '예약중' : '판매완료';
          return { ...item, status: nextStatus, statusLabel: label };
        }
        return item;
      })
    );
    Alert.alert('상태 변경 완료', '상품의 거래 상태가 정상적으로 업데이트되었습니다.');
  };

  // 내 판매 물품 삭제
  const handleDeleteSaleItem = (itemId) => {
    Alert.alert('상품 삭제', '이 판매 상품을 목록에서 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          setMySalesList((prev) => prev.filter((i) => i.id !== itemId));
          Alert.alert('삭제 완료', '판매 상품이 삭제되었습니다.');
        },
      },
    ]);
  };

  // 찜 해제
  const handleRemoveWishItem = (prodId) => {
    setWishlist((prev) => prev.filter((p) => p.id !== prodId));
    Alert.alert('관심 상품 해제', '관심목록에서 제거되었습니다.');
  };

  // 1:1 고객 문의 접수 처리
  const handleSubmitInquiry = useCallback(async () => {
    if (!inquiryMessage.trim()) {
      Alert.alert('입력 안내', '문의 내용을 입력해주세요.');
      return;
    }
    try {
      setSubmittingInquiry(true);
      await apiClient.submitSupportTicket({
        category: inquiryCategory,
        contact: inquiryContact.trim() || user?.phoneNumber || user?.email || '',
        userName: nickname,
        message: inquiryMessage.trim(),
      });
      setSubmittingInquiry(false);
      setInquiryModalVisible(false);
      setInquiryMessage('');
      Alert.alert(
        '접수 완료',
        '1:1 고객 문의가 정상적으로 접수되었습니다.\n관리자 확인 후 신속하게 처리해 드리겠습니다.'
      );
    } catch (e) {
      setSubmittingInquiry(false);
      Alert.alert('접수 실패', e?.message || '문의 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [inquiryCategory, inquiryContact, inquiryMessage, nickname, user]);

  // 캐시 정리
  const handleClearCache = useCallback(() => {
    Alert.alert('캐시 정리', '임시 이미지 및 네트워크 캐시를 정리하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '정리하기',
        onPress: () => {
          setCacheSize('0 KB');
          Alert.alert('완료', '임시 캐시가 모두 정리되어 쾌적해졌습니다.');
        },
      },
    ]);
  }, []);

  // 로그아웃
  const handleLogout = useCallback(() => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          if (logout) await logout();
        },
      },
    ]);
  }, [logout]);

  // 무료 MC 충전소 광고 시청 타이머 및 보상 수령 핸들러
  const handleOpenRewardAdModal = () => {
    if (todayRewardClaims >= 5) {
      Alert.alert(
        '일일 시청 한도 초과',
        '오늘 무료 포인트 광고 시청 한도(5회)를 모두 소진하셨습니다.\n내일 자정에 다시 참여해주세요! ✨'
      );
      return;
    }
    setRewardAdCountdown(5);
    setIsAdWatching(true);
    setRewardAdModalVisible(true);
  };

  useEffect(() => {
    let timer;
    if (rewardAdModalVisible && isAdWatching && rewardAdCountdown > 0) {
      timer = setTimeout(() => {
        setRewardAdCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [rewardAdModalVisible, isAdWatching, rewardAdCountdown]);

  const handleClaimAdReward = async () => {
    setClaimingReward(true);
    try {
      const res = await claimAdReward(user?.id, nickname);
      setClaimingReward(false);
      setRewardAdModalVisible(false);
      setIsAdWatching(false);

      if (res?.ok === false && res?.error === 'DAILY_LIMIT_EXCEEDED') {
        Alert.alert('알림', res.message || '일일 시청 한도 5회를 초과했습니다.');
        setTodayRewardClaims(5);
        return;
      }

      const remaining = res?.remainingDailyClaims ?? Math.max(0, 4 - todayRewardClaims);
      setTodayRewardClaims((prev) => Math.min(5, prev + 1));

      if (refreshMe) {
        refreshMe().catch(() => {});
      }

      Alert.alert(
        '🎉 10 모꼬 포인트 충전 완료!',
        `10 P가 충전되었습니다! (오늘 잔여: ${remaining}/5회)\n포인트 잔액이 즉시 반영되었습니다.`,
        [{ text: '확인' }]
      );
    } catch {
      setClaimingReward(false);
      setRewardAdModalVisible(false);
      Alert.alert('리워드 지급 완료', '10 P가 충전되었습니다!');
      if (refreshMe) refreshMe().catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. 상단 내비 바 */}
      <View style={styles.navBar}>
        <View style={styles.navTitleRow}>
          <Text style={styles.navTitle}>마이모꼬</Text>
        </View>
        <TouchableOpacity
          style={styles.navIconBtn}
          onPress={() => navigation.navigate('ProfileEdit', { profile: { ...user, ...userProfile } })}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-outline" size={22} color={tokens.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. 상단 프로필 헤더 카드 (나이 및 성별 반영) */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            {/* 아바타 */}
            <View style={{ position: 'relative' }}>
              <LinearGradient
                colors={tokens.colors.gradients.primaryPurple}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.storyRing}
              >
                <View style={styles.storyRingInner}>
                  <UserAvatar
                    uri={avatarUri}
                    name={nickname}
                    size="lg"
                    isOnline={true}
                    onPress={() => navigation.navigate('ProfileEdit', { profile: { ...user, ...userProfile } })}
                  />
                </View>
              </LinearGradient>
            </View>

            <View style={styles.profileInfoCol}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {nickname}
                </Text>
                {/* 📌 나이 & 성별 뱃지 추가 */}
                <View style={styles.ageBadge}>
                  <Text style={styles.ageBadgeText}>
                    {age}세 · {gender}
                  </Text>
                </View>
              </View>
              <Text style={styles.locationText}>📍 {locationLabel}</Text>
              <Text style={styles.taglineText} numberOfLines={2}>
                {tagline}
              </Text>
            </View>

            {/* 우측 [✏️ 프로필 수정] 캡슐 버튼 */}
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => navigation.navigate('ProfileEdit', { profile: { ...user, ...userProfile } })}
              activeOpacity={0.85}
            >
              <Ionicons name="pencil" size={13} color={tokens.colors.primary} />
              <Text style={styles.editProfileText}>수정</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. 자산/지갑 체계 전면 분리 (🪙 모꼬 포인트 vs 💵 판매 정산금 원화 분리) */}
        <View style={styles.walletSectionWrap}>
          {/* (1) 모꼬 포인트 카드 (인앱 소통, 라이브 입장/후원) */}
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pointWalletCard}
          >
            <View style={styles.walletHeaderRow}>
              <View style={styles.walletTitleGroup}>
                <Text style={styles.walletLabel}>🪙 모꼬 포인트</Text>
                <View style={styles.walletMiniTag}>
                  <Text style={styles.walletMiniTagText}>소통·후원</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.chargeBtnMini}
                onPress={() => navigation.navigate('Shop')}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={tokens.colors.gradients.primaryPink || ['#FF3B6B', '#FF758C']}
                  style={styles.chargeBtnMiniGradient}
                >
                  <Ionicons name="flash" size={12} color="#FFFFFF" />
                  <Text style={styles.chargeBtnMiniText}>충전하기</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.walletBalanceRow}>
              <Text style={styles.walletBalanceNumber}>{pointBalance.toLocaleString()}</Text>
              <Text style={styles.walletBalanceUnit}>P</Text>
            </View>
            <Text style={styles.walletSubHint}>라이브 방송 후원, 1:1 대화 및 선물 교환 시 사용</Text>
          </LinearGradient>

          {/* (2) 판매 정산금 카드 (중고거래 및 마켓 판매 수익금 - 원화 KRW) */}
          <View style={styles.cashWalletCard}>
            <View style={styles.walletHeaderRow}>
              <View style={styles.walletTitleGroup}>
                <Text style={styles.cashWalletLabel}>💵 판매 정산금 (원)</Text>
                <View style={styles.cashMiniTag}>
                  <Text style={styles.cashMiniTagText}>안전정산</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.settleBtnAction}
                onPress={() => navigation.navigate('Settlement')}
                activeOpacity={0.85}
              >
                <Ionicons name="wallet-outline" size={13} color="#1E293B" />
                <Text style={styles.settleBtnActionText}>정산/출금</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.walletBalanceRow}>
              <Text style={styles.cashBalanceNumber}>{sellerRevenue.toLocaleString()}</Text>
              <Text style={styles.cashBalanceUnit}>원</Text>
            </View>
            <Text style={styles.cashSubHint}>중고거래 및 마켓 상품 판매 완료 시 계좌로 출금 가능</Text>
          </View>
        </View>

        {/* 3.5 무료 모꼬 포인트 충전소 (광고 보고 10 P 받기) */}
        <TouchableOpacity
          style={styles.rewardBannerBtn}
          activeOpacity={0.88}
          onPress={handleOpenRewardAdModal}
        >
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rewardBannerGradient}
          >
            <View style={styles.rewardBannerLeft}>
              <View style={styles.rewardBannerIconBox}>
                <Ionicons name="film" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.rewardBannerTextBox}>
                <View style={styles.rewardBannerBadgeRow}>
                  <Text style={styles.rewardBannerTitle}>🎬 무료 모꼬 포인트 충전소</Text>
                  <View style={styles.rewardPointBadge}>
                    <Text style={styles.rewardPointBadgeText}>+10 P</Text>
                  </View>
                </View>
                <Text style={styles.rewardBannerDesc}>
                  광고 시청 완료 시 10 P 즉시 적립 (오늘 잔여: {Math.max(0, 5 - todayRewardClaims)}/5회)
                </Text>
              </View>
            </View>
            <View style={styles.rewardBannerRight}>
              <Text style={styles.rewardBannerActionText}>충전</Text>
              <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* 4. 소셜 스탯 카운터 (방문자, 내인연 제거 완료 -> 팔로워, 팔로잉만 듀얼 와이드 배치) */}
        <View style={styles.socialFollowDualCard}>
          <TouchableOpacity
            style={styles.followStatBox}
            onPress={() => navigation.navigate('Follows', { initialTab: 'followers' })}
            activeOpacity={0.8}
          >
            <View style={styles.followIconCircle}>
              <Ionicons name="people" size={18} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.followCount}>{socialStats.followers}</Text>
              <Text style={styles.followLabel}>팔로워</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <View style={styles.followDivider} />

          <TouchableOpacity
            style={styles.followStatBox}
            onPress={() => navigation.navigate('Follows', { initialTab: 'following' })}
            activeOpacity={0.8}
          >
            <View style={[styles.followIconCircle, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="person-add" size={18} color="#EC4899" />
            </View>
            <View>
              <Text style={styles.followCount}>{socialStats.following}</Text>
              <Text style={styles.followLabel}>팔로잉</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* 5. 중고거래 & 마켓거래 종합 관리 섹션 (관심목록, 판매관리, 구매/예약내역) */}
        <View style={styles.tradeManagementCard}>
          <View style={styles.tradeHeaderRow}>
            <Text style={styles.tradeHeaderTitle}>🛍️ 마켓 & 중고거래 관리</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Market', { screen: 'MarketMain' })}>
              <Text style={styles.tradeHeaderMore}>마켓 구경가기 ›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tradeItemsRow}>
            {/* 1) 관심목록 (찜 목록) */}
            <TouchableOpacity
              style={styles.tradeActionBtn}
              activeOpacity={0.82}
              onPress={() => setWishlistModalVisible(true)}
            >
              <View style={[styles.tradeIconWrap, { backgroundColor: '#FFF1F2' }]}>
                <Ionicons name="heart" size={20} color="#FF3B6B" />
              </View>
              <Text style={styles.tradeBtnTitle}>관심목록</Text>
              <Text style={styles.tradeBtnSub}>{wishlist.length}개 찜</Text>
            </TouchableOpacity>

            {/* 2) 판매관리 (내 판매 물품 - 판매중/예약중/판매완료) */}
            <TouchableOpacity
              style={styles.tradeActionBtn}
              activeOpacity={0.82}
              onPress={() => setSalesModalVisible(true)}
            >
              <View style={[styles.tradeIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="pricetags" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.tradeBtnTitle}>판매관리</Text>
              <Text style={styles.tradeBtnSub}>{mySalesList.length}건 등록</Text>
            </TouchableOpacity>

            {/* 3) 구매/예약 내역 (안전결제 주문) */}
            <TouchableOpacity
              style={styles.tradeActionBtn}
              activeOpacity={0.82}
              onPress={() => setOrdersModalVisible(true)}
            >
              <View style={[styles.tradeIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="receipt" size={20} color="#059669" />
              </View>
              <Text style={styles.tradeBtnTitle}>구매/예약내역</Text>
              <Text style={styles.tradeBtnSub}>{myOrdersList.length}건 진행</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. 그룹형 메뉴 리스트 1: 소셜 & 크리에이터 설정 */}
        {/* 📌 "마켓상품 등록하기" 삭제 완료 */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupHeader}>소셜 & 크리에이터 설정</Text>
          <View style={styles.menuContainer}>
            {/* 📸 갤러리 관리 */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('ProfileEdit', { profile: { ...user, ...userProfile } })}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#FFE4E6' }]}>
                <Ionicons name="images" size={18} color="#FF3B6B" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>갤러리 관리 (최대 9장)</Text>
                <Text style={styles.menuDesc}>매칭 및 바텀시트에 노출될 대표 사진</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* 💬/🎥 1:1 대화 및 영상 단가설정 (모꼬 포인트 P 기준) */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                setCustomRateInput(String(currentLiveRate));
                setCustomChatFeeInput(String(chatEntryFee));
                setRateModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#FDF2F8' }]}>
                <Ionicons name="chatbubbles" size={18} color="#DB2777" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>1:1 대화 및 영상 단가설정</Text>
                <Text style={styles.menuDesc}>
                  채팅 입장 {chatEntryFee} P · 영상 분당 {currentLiveRate.toLocaleString()} P
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* 🔔 알림 설정 */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setNotifModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="notifications" size={18} color="#3B82F6" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>알림 설정</Text>
                <Text style={styles.menuDesc}>채팅, 실시간 LIVE 및 야간 알림 제어</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. 그룹형 메뉴 리스트 2: 안심 케어 & 지원 */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupHeader}>안심 보호 & 지원</Text>
          <View style={styles.menuContainer}>
            {/* 🛡️ AI 안심 케어 센터 */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setSafetyModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#8B5CF6" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>AI 안심 케어 센터</Text>
                <Text style={styles.menuDesc}>24시간 AI 실시간 클린 필터링 가동 중</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* 🚫 내가 차단한 회원 */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('BlockedUsers')}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="ban" size={18} color="#EF4444" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>내가 차단한 회원 관리</Text>
                <Text style={styles.menuDesc}>차단 목록 및 해제 설정</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* 🧹 캐시 정리 */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleClearCache}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#FFEDD5' }]}>
                <Ionicons name="trash-bin" size={18} color="#F97316" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>임시 캐시 및 저장공간 정리</Text>
                <Text style={styles.menuDesc}>{cacheSize}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* 📄 고객센터 & 약관 */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setTermsModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="help-circle" size={18} color="#64748B" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>고객센터 & 약관</Text>
                <Text style={styles.menuDesc}>자주 묻는 질문 및 1:1 고객 문의</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 8. 하단 로그아웃 */}
        <View style={styles.footerSection}>
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>MOCCO v1.3.0 • Expo SDK 57</Text>
        </View>
      </ScrollView>

      {/* =================================================================== */}
      {/* 📌 신규 모달 A: 관심목록 (찜 목록) */}
      {/* =================================================================== */}
      <Modal
        visible={wishlistModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWishlistModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.dialogCard, { maxHeight: '82%', width: '92%' }]}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconBox, { backgroundColor: '#FFF1F2' }]}>
                <Ionicons name="heart" size={20} color="#FF3B6B" />
              </View>
              <Text style={styles.dialogTitle}>관심목록 (찜한 상품)</Text>
              <Text style={styles.dialogSub}>내가 관심 등록한 중고 거래 및 마켓 공구 상품입니다.</Text>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {wishlist.length === 0 ? (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Ionicons name="heart-dislike-outline" size={40} color="#94A3B8" />
                  <Text style={{ marginTop: 10, color: '#64748B', fontSize: 14 }}>
                    관심 등록된 상품이 없습니다.
                  </Text>
                </View>
              ) : (
                wishlist.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.modalListItem}
                    activeOpacity={0.88}
                    onPress={() => {
                      setWishlistModalVisible(false);
                      navigation.navigate('Market', {
                        screen: 'ProductDetail',
                        params: { productId: item.id, product: item },
                      });
                    }}
                  >
                    <Image source={{ uri: item.images?.[0] }} style={styles.modalItemThumb} />
                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <Text style={styles.modalItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.modalItemPrice}>{item.price?.toLocaleString()}원</Text>
                      <Text style={styles.modalItemLocation}>📍 {item.locationName || '동네 인증'}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeWishBtn}
                      onPress={() => handleRemoveWishItem(item.id)}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.dialogCancelBtn, { marginTop: 12 }]}
              onPress={() => setWishlistModalVisible(false)}
            >
              <Text style={styles.dialogCancelText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* 📌 신규 모달 B: 판매관리 (내 판매 물품 상태 관리) */}
      {/* =================================================================== */}
      <Modal
        visible={salesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSalesModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.dialogCard, { maxHeight: '86%', width: '92%' }]}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="pricetags" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.dialogTitle}>내 판매 물품 관리</Text>
              <Text style={styles.dialogSub}>등록한 중고 거래 물품의 상태를 실시간 변경하세요.</Text>
            </View>

            {/* 필터 탭 바 (전체 / 판매중 / 예약중 / 판매완료) */}
            <View style={styles.filterTabBar}>
              {[
                { key: 'ALL', label: '전체' },
                { key: 'SELLING', label: '판매중' },
                { key: 'RESERVED', label: '예약중' },
                { key: 'COMPLETED', label: '판매완료' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterTabBtn, salesFilterTab === tab.key && styles.filterTabBtnActive]}
                  onPress={() => setSalesFilterTab(tab.key)}
                >
                  <Text
                    style={[styles.filterTabText, salesFilterTab === tab.key && styles.filterTabTextActive]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {mySalesList
                .filter((item) => (salesFilterTab === 'ALL' ? true : item.status === salesFilterTab))
                .map((item) => (
                  <View key={item.id} style={styles.saleManageCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image source={{ uri: item.image }} style={styles.modalItemThumb} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <View
                            style={[
                              styles.statusChip,
                              item.status === 'SELLING'
                                ? { backgroundColor: '#ECFDF5' }
                                : item.status === 'RESERVED'
                                ? { backgroundColor: '#FFFBEB' }
                                : { backgroundColor: '#F1F5F9' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusChipText,
                                item.status === 'SELLING'
                                  ? { color: '#059669' }
                                  : item.status === 'RESERVED'
                                  ? { color: '#D97706' }
                                  : { color: '#64748B' },
                              ]}
                            >
                              {item.statusLabel}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, color: '#94A3B8' }}>{item.createdAt}</Text>
                        </View>
                        <Text style={styles.modalItemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.modalItemPrice}>{item.price?.toLocaleString()}원</Text>
                      </View>
                    </View>

                    {/* 상태 변경 퀵 액션 버튼 바 */}
                    <View style={styles.statusActionRow}>
                      <TouchableOpacity
                        style={[styles.statusChangeBtn, item.status === 'SELLING' && styles.statusChangeBtnDisabled]}
                        disabled={item.status === 'SELLING'}
                        onPress={() => handleChangeSaleStatus(item.id, 'SELLING')}
                      >
                        <Text style={styles.statusChangeBtnText}>판매중</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.statusChangeBtn, item.status === 'RESERVED' && styles.statusChangeBtnDisabled]}
                        disabled={item.status === 'RESERVED'}
                        onPress={() => handleChangeSaleStatus(item.id, 'RESERVED')}
                      >
                        <Text style={styles.statusChangeBtnText}>예약중</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.statusChangeBtn, item.status === 'COMPLETED' && styles.statusChangeBtnDisabled]}
                        disabled={item.status === 'COMPLETED'}
                        onPress={() => handleChangeSaleStatus(item.id, 'COMPLETED')}
                      >
                        <Text style={styles.statusChangeBtnText}>판매완료</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.statusChangeBtn, { backgroundColor: '#FEE2E2', borderColor: '#FECDD3' }]}
                        onPress={() => handleDeleteSaleItem(item.id)}
                      >
                        <Ionicons name="trash" size={13} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.dialogCancelBtn, { marginTop: 12 }]}
              onPress={() => setSalesModalVisible(false)}
            >
              <Text style={styles.dialogCancelText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* 📌 신규 모달 C: 구매 / 예약 내역 (안전결제 주문) */}
      {/* =================================================================== */}
      <Modal
        visible={ordersModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOrdersModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.dialogCard, { maxHeight: '86%', width: '92%' }]}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
              </View>
              <Text style={styles.dialogTitle}>구매 및 예약 내역</Text>
              <Text style={styles.dialogSub}>에스크로 안심 결제 및 거래 예약 진행 상태입니다.</Text>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {myOrdersList.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
                      {order.orderNumber}
                    </Text>
                    <View style={styles.orderStatusBadge}>
                      <Text style={styles.orderStatusText}>{order.statusText}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={{ uri: order.image }} style={styles.modalItemThumb} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.modalItemTitle} numberOfLines={1}>
                        {order.title}
                      </Text>
                      <Text style={styles.modalItemPrice}>{order.price?.toLocaleString()}원</Text>
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                        판매자: {order.sellerName} · {order.location}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderFooterActions}>
                    <TouchableOpacity
                      style={styles.orderChatBtn}
                      onPress={() => {
                        setOrdersModalVisible(false);
                        navigation.navigate('Chat', { screen: 'ChatsMain' });
                      }}
                    >
                      <Ionicons name="chatbubble-ellipses" size={13} color="#4F46E5" />
                      <Text style={styles.orderChatBtnText}>판매자와 대화</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.orderReceiptBtn}
                      onPress={() => {
                        Alert.alert('안전결제 보증', `주문번호: ${order.orderNumber}\n결제수단: ${order.paymentType}\n모꼬 에스크로 시스템에 의해 구매 확정 시까지 결제 대금이 안전하게 보관됩니다.`);
                      }}
                    >
                      <Text style={styles.orderReceiptBtnText}>안전보증서</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.dialogCancelBtn, { marginTop: 12 }]}
              onPress={() => setOrdersModalVisible(false)}
            >
              <Text style={styles.dialogCancelText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* 모달 1: 1:1 대화/영상 단가설정 (모꼬 포인트 P 기준) */}
      {/* =================================================================== */}
      <Modal
        visible={rateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.dialogCard, { maxHeight: '85%' }]}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconBox, { backgroundColor: '#FDF2F8' }]}>
                <Ionicons name="chatbubbles" size={20} color="#DB2777" />
              </View>
              <Text style={styles.dialogTitle}>1:1 대화 및 영상 단가설정</Text>
              <Text style={styles.dialogSub}>
                상대방이 1:1 대화를 신청하거나 영상 통화를 요청할 때 지불할 모꼬 포인트(P)를 설정하세요.
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* 섹션 A: 1:1 대화방 입장 단가 (P) */}
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.rateSectionLabel}>💬 1:1 대화방 입장 단가 (건당 P)</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#FF3B6B' }}>
                    {chatEntryFee > 0 ? `${chatEntryFee} P` : '무료'}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: tokens.colors.textSecondary, marginBottom: 8, lineHeight: 16 }}>
                  상대방이 1:1 대화를 신청할 때 지불하며, 나에게 모꼬 포인트로 적립됩니다.
                </Text>

                {/* 채팅 프리셋 칩 */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {[0, 10, 30, 50, 100].map((fee) => {
                    const isSelected = chatEntryFee === fee && !customChatFeeInput;
                    return (
                      <TouchableOpacity
                        key={fee}
                        style={[
                          styles.rateOptionBtn,
                          { flex: 1, minWidth: '28%', paddingVertical: 8, paddingHorizontal: 6, justifyContent: 'center' },
                          isSelected ? styles.rateOptionActive : styles.rateOptionInactive,
                        ]}
                        onPress={() => {
                          setCustomChatFeeInput('');
                          handleSaveChatFee(fee);
                        }}
                      >
                        <Text
                          style={[
                            styles.rateOptionText,
                            isSelected ? styles.rateOptionTextActive : styles.rateOptionTextInactive,
                            { fontSize: 12, textAlign: 'center' },
                          ]}
                        >
                          {fee === 0 ? '무료' : `${fee} P`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 채팅 직접 입력 */}
                <View style={styles.customRateInputRow}>
                  <TextInput
                    style={[styles.customRateInput, { flex: 1 }]}
                    keyboardType="numeric"
                    placeholder="채팅 단가 직접 입력 (P)"
                    placeholderTextColor="#94A3B8"
                    value={customChatFeeInput}
                    onChangeText={setCustomChatFeeInput}
                    maxLength={5}
                  />
                  <TouchableOpacity
                    style={[
                      styles.customRateSaveBtn,
                      !customChatFeeInput ? styles.customRateSaveBtnDisabled : null,
                    ]}
                    disabled={!customChatFeeInput}
                    onPress={() => handleSaveChatFee(customChatFeeInput)}
                  >
                    <Text style={styles.customRateSaveBtnText}>적용</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginBottom: 18 }} />

              {/* 섹션 B: 1:1 영상/LIVE 단가 (분당 P) */}
              <View style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.rateSectionLabel}>🎥 1:1 영상/LIVE 단가 (분당 P)</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#DB2777' }}>
                    분당 {currentLiveRate.toLocaleString()} P
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: tokens.colors.textSecondary, marginBottom: 8, lineHeight: 16 }}>
                  1:1 영상 라이브 시 분당 차감되어 나에게 모꼬 포인트로 적립됩니다.
                </Text>

                {/* 영상 프리셋 */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {[1000, 1500, 2000, 3000].map((rate) => {
                    const isSelected = currentLiveRate === rate && !customRateInput;
                    return (
                      <TouchableOpacity
                        key={rate}
                        style={[
                          styles.rateOptionBtn,
                          { flex: 1, minWidth: '45%', paddingVertical: 8, paddingHorizontal: 8, justifyContent: 'center' },
                          isSelected ? styles.rateOptionActive : styles.rateOptionInactive,
                        ]}
                        onPress={() => {
                          setCustomRateInput('');
                          handleSaveLiveRate(rate);
                        }}
                      >
                        <Text
                          style={[
                            styles.rateOptionText,
                            isSelected ? styles.rateOptionTextActive : styles.rateOptionTextInactive,
                            { fontSize: 12, textAlign: 'center' },
                          ]}
                        >
                          분당 {rate.toLocaleString()} P
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 영상 직접 입력 */}
                <View style={styles.customRateInputRow}>
                  <TextInput
                    style={[styles.customRateInput, { flex: 1 }]}
                    keyboardType="numeric"
                    placeholder="영상 단가 직접 입력 (100~100,000)"
                    placeholderTextColor="#94A3B8"
                    value={customRateInput}
                    onChangeText={setCustomRateInput}
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={[
                      styles.customRateSaveBtn,
                      !customRateInput ? styles.customRateSaveBtnDisabled : null,
                    ]}
                    disabled={!customRateInput}
                    onPress={() => handleSaveLiveRate(customRateInput)}
                  >
                    <Text style={styles.customRateSaveBtnText}>적용</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.dialogCancelBtn, { marginTop: 14 }]}
              onPress={() => setRateModalVisible(false)}
            >
              <Text style={styles.dialogCancelText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* 모달 2: 알림 설정 */}
      {/* =================================================================== */}
      <Modal
        visible={notifModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotifModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconBox, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="notifications" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.dialogTitle}>알림 수신 설정</Text>
              <Text style={styles.dialogSub}>실시간 소통과 편안한 휴식을 위해 알림을 맞춤 조정하세요.</Text>
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>1:1 대화 알림</Text>
                <Text style={styles.switchSub}>새로운 메시지가 도착했을 때 푸시 알림</Text>
              </View>
              <Switch
                value={chatPush}
                onValueChange={(val) => {
                  setChatPush(val);
                  AsyncStorage.setItem('mocco_chat_push', String(val));
                }}
                trackColor={{ false: '#CBD5E1', true: tokens.colors.primary }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>관심 크리에이터 LIVE 알림</Text>
                <Text style={styles.switchSub}>팔로우한 크리에이터가 방송을 시작할 때 알림</Text>
              </View>
              <Switch
                value={livePush}
                onValueChange={(val) => {
                  setLivePush(val);
                  AsyncStorage.setItem('mocco_live_push', String(val));
                }}
                trackColor={{ false: '#CBD5E1', true: tokens.colors.primary }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>야간 알림 제한 (22:00 ~ 08:00)</Text>
                <Text style={styles.switchSub}>수면 시간 동안 소리/진동을 차단합니다</Text>
              </View>
              <Switch
                value={nightPush}
                onValueChange={(val) => {
                  setNightPush(val);
                  AsyncStorage.setItem('mocco_night_push', String(val));
                }}
                trackColor={{ false: '#CBD5E1', true: tokens.colors.primary }}
              />
            </View>

            <TouchableOpacity
              style={styles.dialogCancelBtn}
              onPress={() => setNotifModalVisible(false)}
            >
              <Text style={styles.dialogCancelText}>완료</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* 모달 3: AI 안심 케어 센터 안내 */}
      {/* =================================================================== */}
      <Modal
        visible={safetyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSafetyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="shield-checkmark" size={22} color="#8B5CF6" />
              </View>
              <Text style={styles.dialogTitle}>AI 안심 케어 센터</Text>
              <Text style={styles.dialogSub}>
                회원님의 안전하고 건강한 소통을 위해 24시간 실시간 AI 가디언 시스템이 작동합니다.
              </Text>
            </View>

            <View style={styles.safetyBulletList}>
              <View style={styles.safetyBullet}>
                <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
                <Text style={styles.safetyBulletText}>
                  <Text style={{ fontWeight: '700' }}>실시간 비전 AI 채증:</Text> 방송 중 유해 영상이나 불법 콘텐츠 감지 시 즉시 블라인드 및 자동 차단
                </Text>
              </View>
              <View style={styles.safetyBullet}>
                <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
                <Text style={styles.safetyBulletText}>
                  <Text style={{ fontWeight: '700' }}>클린 텍스트 필터링:</Text> 비방, 욕설, 금전 요구 등 사기성 메시지 실시간 마스킹
                </Text>
              </View>
              <View style={styles.safetyBullet}>
                <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
                <Text style={styles.safetyBulletText}>
                  <Text style={{ fontWeight: '700' }}>철저한 개인정보 보호:</Text> 휴대폰 번호 및 실제 위치는 상대방에게 절대 노출되지 않습니다.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.dialogCancelBtn}
              onPress={() => setSafetyModalVisible(false)}
            >
              <Text style={styles.dialogCancelText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* 모달 4: 고객센터 & 약관 (관리자 FAQ 큐레이션 연동) */}
      {/* =================================================================== */}
      <Modal
        visible={termsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.dialogCard, { maxHeight: '85%' }]}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="help-circle" size={22} color="#64748B" />
              </View>
              <Text style={styles.dialogTitle}>고객센터 & 이용약관</Text>
              <Text style={styles.dialogSub}>
                자주 묻는 질문을 확인하시거나 1:1 문의를 남겨주시면 신속히 답변해 드립니다.
              </Text>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* 1:1 고객 문의 바로가기 배너 */}
              <TouchableOpacity
                style={styles.inquiryBanner}
                onPress={() => {
                  setInquiryContact(user?.phoneNumber || user?.email || '');
                  setInquiryModalVisible(true);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.inquiryBannerLeft}>
                  <Ionicons name="chatbubbles" size={22} color="#FF3B6B" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.inquiryBannerTitle}>1:1 고객센터 문의하기</Text>
                    <Text style={styles.inquiryBannerSub}>운영팀이 실시간으로 확인 후 지원합니다</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#FF3B6B" />
              </TouchableOpacity>

              {/* FAQ 아코디언 목록 */}
              <Text style={[styles.faqSectionHeader, { marginTop: 14 }]}>자주 묻는 질문 (FAQ)</Text>
              {faqsList.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <View key={faq.id} style={styles.faqItem}>
                    <TouchableOpacity
                      style={styles.faqQuestionRow}
                      activeOpacity={0.7}
                      onPress={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                    >
                      <View style={styles.faqBadge}>
                        <Text style={styles.faqBadgeText}>{faq.category || 'FAQ'}</Text>
                      </View>
                      <Text style={styles.faqQuestionText} numberOfLines={2}>
                        {faq.question}
                      </Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={tokens.colors.textSecondary}
                      />
                    </TouchableOpacity>
                    {isExpanded && (
                      <View style={styles.faqAnswerBox}>
                        <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.dialogCancelBtn, { marginTop: 14 }]}
              onPress={() => setTermsModalVisible(false)}
            >
              <Text style={styles.dialogCancelText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* 모달 5: 1:1 고객 문의 작성 모달 */}
      {/* =================================================================== */}
      <Modal
        visible={inquiryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInquiryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.dialogCard, { maxHeight: '90%' }]}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconBox, { backgroundColor: '#FFF1F2' }]}>
                <Ionicons name="create" size={22} color="#FF3B6B" />
              </View>
              <Text style={styles.dialogTitle}>1:1 고객 문의 접수</Text>
              <Text style={styles.dialogSub}>
                문의 유형과 내용을 남겨주시면 담당 관리자가 확인 후 답변드립니다.
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 유형 선택 칩 */}
              <Text style={styles.inputGroupLabel}>문의 유형</Text>
              <View style={styles.categoryChipRow}>
                {['문의', '신고', '환불/정산', '기타'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      inquiryCategory === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setInquiryCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        inquiryCategory === cat && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 답변 받을 연락처 / 이메일 */}
              <Text style={[styles.inputGroupLabel, { marginTop: 12 }]}>연락처 또는 이메일</Text>
              <TextInput
                style={styles.inquiryInput}
                placeholder="답변 받을 휴대폰 번호 또는 이메일"
                placeholderTextColor={tokens.colors.textTertiary}
                value={inquiryContact}
                onChangeText={setInquiryContact}
              />

              {/* 문의 내용 */}
              <Text style={[styles.inputGroupLabel, { marginTop: 12 }]}>문의 내용</Text>
              <TextInput
                style={[styles.inquiryInput, styles.inquiryTextArea]}
                placeholder="문의하실 내용을 구체적으로 작성해 주세요."
                placeholderTextColor={tokens.colors.textTertiary}
                value={inquiryMessage}
                onChangeText={setInquiryMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.inquiryBtnRow}>
              <TouchableOpacity
                style={styles.inquiryCancelBtn}
                onPress={() => setInquiryModalVisible(false)}
                disabled={submittingInquiry}
              >
                <Text style={styles.inquiryCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inquirySubmitBtn, submittingInquiry && { opacity: 0.6 }]}
                onPress={handleSubmitInquiry}
                disabled={submittingInquiry}
              >
                {submittingInquiry ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.inquirySubmitText}>접수하기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* 모달 6: 무료 MC 충전소 광고 시청 */}
      {/* =================================================================== */}
      <Modal
        visible={rewardAdModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isAdWatching) setRewardAdModalVisible(false);
        }}
      >
        <View style={styles.rewardModalBackdrop}>
          <View style={styles.rewardModalCard}>
            <View style={styles.rewardModalHeader}>
              <View style={styles.rewardAdTag}>
                <Text style={styles.rewardAdTagText}>SPONSORED AD</Text>
              </View>
              {rewardAdCountdown > 0 ? (
                <View style={styles.rewardTimerChip}>
                  <Ionicons name="time-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.rewardTimerText}>{rewardAdCountdown}초 후 보상</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.rewardCloseBtn}
                  onPress={() => setRewardAdModalVisible(false)}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.rewardAdVideoBox}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
                }}
                style={styles.rewardAdVideoImg}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(15, 23, 42, 0.9)']}
                style={styles.rewardAdVideoOverlay}
              >
                <Text style={styles.rewardAdBrand}>✨ 모꼬 프리미엄 라이프</Text>
                <Text style={styles.rewardAdHeadline}>
                  새로운 동네 친구와 나누는 따뜻한 소통의 순간
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.rewardModalBottom}>
              <View style={styles.rewardRewardBadgeRow}>
                <Ionicons name="gift" size={18} color="#FF3B6B" />
                <Text style={styles.rewardRewardDesc}>광고 시청 완료 보상: +10 모꼬 포인트</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.rewardClaimBtn,
                  rewardAdCountdown > 0 && styles.rewardClaimBtnDisabled,
                ]}
                disabled={rewardAdCountdown > 0 || claimingReward}
                onPress={handleClaimAdReward}
              >
                {claimingReward ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.rewardClaimBtnText}>
                    {rewardAdCountdown > 0 ? `${rewardAdCountdown}초 후 보상받기` : '10 P 받기'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFB',
  },
  navBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // 1. 프로필 헤더 카드
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingInner: {
    width: 63,
    height: 63,
    borderRadius: 31.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfoCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  ageBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  ageBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 3,
  },
  taglineText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF3B6B',
  },

  // 2. 자산/지갑 분리 섹션 (모꼬 포인트 vs 판매 정산금 원화)
  walletSectionWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  pointWalletCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  walletHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  walletTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  walletMiniTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  walletMiniTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chargeBtnMini: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  chargeBtnMiniGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chargeBtnMiniText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  walletBalanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 3,
  },
  walletBalanceNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  walletBalanceUnit: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  walletSubHint: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // 원화 판매 정산금 카드
  cashWalletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cashWalletLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  cashMiniTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  cashMiniTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
  },
  settleBtnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  settleBtnActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
  },
  cashBalanceNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  cashBalanceUnit: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  cashSubHint: {
    fontSize: 11,
    color: '#64748B',
  },

  // 무료 충전소 배너
  rewardBannerBtn: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  rewardBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rewardBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rewardBannerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rewardBannerTextBox: {
    flex: 1,
  },
  rewardBannerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  rewardBannerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  rewardPointBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rewardPointBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  rewardBannerDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10.5,
  },
  rewardBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 8,
  },
  rewardBannerActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // 3. 소셜 팔로워 / 팔로잉 듀얼 와이드 카드
  socialFollowDualCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  followStatBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  followIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followCount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  followLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  followDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },

  // 4. 중고거래 & 마켓거래 종합 관리 섹션 (관심목록, 판매관리, 구매/예약내역)
  tradeManagementCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tradeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tradeHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  tradeHeaderMore: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
  },
  tradeItemsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tradeActionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  tradeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tradeBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  tradeBtnSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  // 5. 메뉴 그룹
  menuGroup: {
    marginHorizontal: 16,
    marginTop: 18,
  },
  groupHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextBox: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  menuDesc: {
    fontSize: 11,
    color: '#94A3B8',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginLeft: 62,
  },

  // 6. 하단 로그아웃
  footerSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  logoutText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 11,
    color: '#CBD5E1',
  },

  // 모달 공통 스타일
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  dialogHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  dialogIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  dialogSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  dialogCancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },

  // 모달 내 리스트 아이템 스타일
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modalItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
  },
  modalItemPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalItemLocation: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  removeWishBtn: {
    padding: 8,
  },

  // 판매관리 카드
  saleManageCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statusChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  filterTabBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterTabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  filterTabBtnActive: {
    backgroundColor: '#0F172A',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  statusActionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  statusChangeBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChangeBtnDisabled: {
    opacity: 0.4,
    backgroundColor: '#E2E8F0',
  },
  statusChangeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },

  // 구매/예약 내역 카드
  orderCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderStatusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  orderFooterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  orderChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderChatBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  orderReceiptBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderReceiptBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  // 단가 설정 관련
  rateSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  rateOptionBtn: {
    borderRadius: 10,
    borderWidth: 1,
  },
  rateOptionActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  rateOptionInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  rateOptionText: {
    fontWeight: '700',
  },
  rateOptionTextActive: {
    color: '#FFFFFF',
  },
  rateOptionTextInactive: {
    color: '#475569',
  },
  customRateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customRateInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  customRateSaveBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  customRateSaveBtnDisabled: {
    opacity: 0.4,
  },
  customRateSaveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 스위치 행
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  switchSub: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // 안심 케어 센터
  safetyBulletList: {
    gap: 12,
    marginVertical: 10,
  },
  safetyBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  safetyBulletText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },

  // 고객센터 & 약관
  inquiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF1F2',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  inquiryBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inquiryBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E11D48',
  },
  inquiryBannerSub: {
    fontSize: 11,
    color: '#9F1239',
    marginTop: 2,
  },
  faqSectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
  },
  faqItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 6,
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  faqBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  faqBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  faqAnswerBox: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  faqAnswerText: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 17,
  },

  // 1:1 고객 문의 모달
  inputGroupLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
  },
  categoryChipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  categoryChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  categoryChipActive: {
    backgroundColor: '#FF3B6B',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  inquiryInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  inquiryTextArea: {
    minHeight: 100,
  },
  inquiryBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  inquiryCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  inquiryCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  inquirySubmitBtn: {
    flex: 1.5,
    backgroundColor: '#FF3B6B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  inquirySubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 무료 충전소 광고 시청 모달
  rewardModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rewardModalCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    overflow: 'hidden',
  },
  rewardModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  rewardAdTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rewardAdTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  rewardTimerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rewardTimerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  rewardCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardAdVideoBox: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  rewardAdVideoImg: {
    width: '100%',
    height: '100%',
  },
  rewardAdVideoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'flex-end',
    padding: 14,
  },
  rewardAdBrand: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  rewardAdHeadline: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  rewardModalBottom: {
    padding: 16,
  },
  rewardRewardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  rewardRewardDesc: {
    color: '#F8FAFC',
    fontSize: 12.5,
    fontWeight: '700',
  },
  rewardClaimBtn: {
    backgroundColor: '#FF3B6B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  rewardClaimBtnDisabled: {
    backgroundColor: '#475569',
  },
  rewardClaimBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
