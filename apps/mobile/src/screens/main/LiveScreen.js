// src/screens/main/LiveScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import colors from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { checkAndConfirmActionPoint } from '../../utils/pointPolicyHelper';
import { EmptyStateView, ExtendedFAB, useExtendedFabScroll } from '../../components/common';
import { fetchMarketProducts, fetchMyMerchantProducts, MarketProduct, INITIAL_MARKET_PRODUCTS } from '../../services/marketService';

const LIVE_COLOR = '#FF3B6B';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOP3_CARD_WIDTH = Math.floor((SCREEN_WIDTH - 24 - 16) / 3);

const CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'shopping', label: '쇼핑/중고' },
  { key: 'talk', label: '토크/소통' },
  { key: 'music', label: '음악/노래' },
  { key: 'daily', label: '일상' },
  { key: 'hobby', label: '취미' },
];

export default function LiveScreen({ navigation }) {
  const { user, refreshMe } = useAuth();
  const insets = useSafeAreaInsets();
  const { isExtended, handleScroll, setIsExtended } = useExtendedFabScroll(15);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Start Live Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('talk');
  const [entryFee, setEntryFee] = useState(0);
  const [starting, setStarting] = useState(false);
  // 상품 연결 사전 세팅 상태
  const [marketProducts, setMarketProducts] = useState(INITIAL_MARKET_PRODUCTS);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [liveProductTab, setLiveProductTab] = useState('C2C'); // 'C2C' | 'MERCHANT' | 'AFFILIATE'
  const [myMerchantProducts, setMyMerchantProducts] = useState([]);
  const [myMerchant, setMyMerchant] = useState(null);
  const [myAffiliateProducts, setMyAffiliateProducts] = useState([]);

  // [👑 실시간 HOT 모꼬 LIVE TOP 3] 상태
  const [top3Rooms, setTop3Rooms] = useState([
    {
      id: 'LIVE-101',
      title: '불금 소통 방송 놀러오세요 ✨ 하트 환영!',
      viewerCount: 1240,
      totalLikes: 2150,
      rank: 1,
      coverUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      host: {
        name: '이지민',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
      },
      pinProduct: {
        title: '[모꼬단독] 무선 기계식 키보드',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200',
      },
    },
    {
      id: 'LIVE-102',
      title: '서아와의 1:1 비밀 프라이빗 라이브 💬',
      viewerCount: 890,
      totalLikes: 1420,
      rank: 2,
      coverUri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
      host: {
        name: '박서아',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
      },
      pinProduct: {
        title: '[본사직영] 올데이 프로틴 쉐이크',
        image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=200',
      },
    },
    {
      id: 'LIVE-103',
      title: '가을 단풍 여행 준비 같이해요 🍁',
      viewerCount: 650,
      totalLikes: 980,
      rank: 3,
      coverUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      host: {
        name: '최유나',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      },
      pinProduct: {
        title: '포근 램스울 오버핏 니트',
        image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200',
      },
    },
  ]);

  const loadTop3Rooms = useCallback(async () => {
    try {
      const res = await apiClient.get('/live/top3');
      const items = res?.data || res?.items || res;
      if (Array.isArray(items) && items.length > 0) {
        setTop3Rooms(items);
      }
    } catch {}
  }, []);

  const loadRooms = useCallback(async () => {
    try {
      const data = await apiClient.getActiveLiveRooms();
      console.log('[LiveScreen] getActiveLiveRooms data count:', Array.isArray(data) ? data.length : 0, data?.[0]);
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to load active live rooms', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyMerchantProducts()
      .then((res) => {
        if (res) {
          setMyMerchant(res.merchant || null);
          setMyMerchantProducts(res.products || []);
        }
      })
      .catch(() => {});

    apiClient.get('/affiliate/my-products')
      .then((res) => {
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setMyAffiliateProducts(list);
        } else {
          setMyAffiliateProducts([
            {
              id: 'aff-prod-001',
              title: '[모꼬단독] 프리미엄 저소음 무선 기계식 키보드',
              name: '[모꼬단독] 프리미엄 저소음 무선 기계식 키보드',
              price: 89000,
              salePriceKrw: 89000,
              commissionRate: 10,
              images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300'],
              merchantName: '테크기어 공식스토어',
            },
            {
              id: 'aff-prod-002',
              title: '[본사직영] 올데이 프로틴 쉐이크 30포 패키지',
              name: '[본사직영] 올데이 프로틴 쉐이크 30포 패키지',
              price: 49000,
              salePriceKrw: 49000,
              commissionRate: 15,
              images: ['https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=300'],
              merchantName: '모꼬 공식 직영관',
            },
          ]);
        }
      })
      .catch(() => {
        setMyAffiliateProducts([
          {
            id: 'aff-prod-001',
            title: '[모꼬단독] 프리미엄 저소음 무선 기계식 키보드',
            name: '[모꼬단독] 프리미엄 저소음 무선 기계식 키보드',
            price: 89000,
            salePriceKrw: 89000,
            commissionRate: 10,
            images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300'],
            merchantName: '테크기어 공식스토어',
          },
        ]);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsExtended(true);
      loadRooms();
    }, [loadRooms, setIsExtended])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRooms();
  }, [loadRooms]);

  const filteredRooms = useMemo(() => {
    if (selectedCategory === 'all') return rooms;
    if (selectedCategory === 'shopping') {
      return rooms.filter(
        (r) =>
          r.category === 'shopping' ||
          r.category === 'market' ||
          r.category?.includes('쇼핑') ||
          r.category?.includes('중고') ||
          Boolean(r.hasCommerce) ||
          Boolean(r.pinProduct) ||
          (Array.isArray(r.linkedProductIds) && r.linkedProductIds.length > 0)
      );
    }
    return rooms.filter((r) => r.category === selectedCategory || (r.category && r.category.includes(selectedCategory)));
  }, [rooms, selectedCategory]);

  const handleStartLive = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('알림', '방송 제목을 입력해 주세요.');
      return;
    }

    const fee = Math.max(0, Number(entryFee || 0));

    checkAndConfirmActionPoint({
      actionType: 'liveRoomCreate',
      actionName: '라이브 방송 개설',
      navigation,
      onConfirm: async () => {
        setStarting(true);
        try {
          const hostName = user?.nickname || user?.displayName || '나의 라이브';
          const hostAvatar = user?.avatarUrl || user?.avatarUri || null;
          const res = await apiClient.createLiveRoom({
            title: trimmedTitle,
            category,
            entryFee: fee,
            hostId: user?.id,
            hostName,
            hostAvatar,
            linkedProductIds: selectedProductIds,
          });
          const room = res?.room || res?.data || res;
          setModalVisible(false);
          setTitle('');
          setEntryFee(0);
          if (refreshMe) refreshMe().catch(() => {});
          navigation.navigate('LiveRoom', { room, roomId: room.id, isHost: true });
          loadRooms();
        } catch (e) {
          Alert.alert('시작 실패', e?.message || '라이브 방송을 시작하지 못했습니다.');
        } finally {
          setStarting(false);
        }
      },
    });
  };

  const handleEnterRoom = (room) => {
    const isHost = Boolean(
      user?.id && (room?.hostId === user.id || room?.host?.id === user.id)
    );
    if (isHost) {
      navigation.navigate('LiveRoom', { room, roomId: room.id, isHost: true });
      return;
    }

    const fee = Number(room?.entryFee ?? 0);

    checkAndConfirmActionPoint({
      actionType: 'liveRoomJoin',
      actionName: fee > 0 ? `라이브 방송 입장(입장료 ${fee.toLocaleString()} 온)` : '라이브 방송 무료 입장',
      overrideAmount: fee,
      navigation,
      onConfirm: async () => {
        try {
          await apiClient.joinLiveRoom(room.id);
          if (refreshMe) refreshMe().catch(() => {});
        } catch {}
        navigation.navigate('LiveRoom', { room, roomId: room.id, isHost: false });
      },
    });
  };

  const renderRoomItem = ({ item }) => {
    const host = item.host || {};
    const coverImage =
      item.coverUri ||
      host.avatar ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500';

    return (
      <TouchableOpacity
        style={styles.roomCard}
        onPress={() => handleEnterRoom(item)}
        activeOpacity={0.88}
      >
        {/* Full Card Cover Image */}
        <Image source={{ uri: coverImage }} style={styles.roomCardCover} />

        {/* Top Badges Overlay */}
        <View style={styles.cardHeaderBadges}>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTagText}>LIVE</Text>
          </View>
          <View style={styles.viewerBadge}>
            <Ionicons name="eye" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
            <Text style={styles.viewerCountText}>{item.viewerCount || 1}</Text>
          </View>
          <View
            style={[
              styles.entryFeePill,
              Number(item.entryFee || 0) > 0 ? styles.entryFeePaid : styles.entryFeeFree,
            ]}
          >
            <Text style={styles.entryFeePillText}>
              {Number(item.entryFee || 0) > 0 ? `${Number(item.entryFee).toLocaleString()} 온` : '무료'}
            </Text>
          </View>
        </View>

        {/* Bottom Dimmed Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.95)']}
          style={styles.cardBottomOverlay}
        >
          <View style={styles.cardHostRow}>
            <Avatar
              size={22}
              name={host.name}
              uri={host.avatar || coverImage}
              showBorder
              borderColor="#FFFFFF"
            />
            <Text style={styles.cardHostName} numberOfLines={1}>
              {host.name || '호스트'}
            </Text>
            {!!host.region && (
              <Text style={styles.cardHostRegion} numberOfLines={1}>
                · {host.region}
              </Text>
            )}
          </View>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>#{item.category || '소통'}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };


  // [👑 실시간 Top3] 전용 섹션 렌더링 (한 화면 3열 고정 & 화려한 엠블럼 오버레이)
  const renderTop3Section = () => {
    if (!top3Rooms || top3Rooms.length === 0) return null;

    // 첨부 이미지 스타일의 화려한 원형 엠블럼 (상단 중앙 오버랩)
    const renderRankEmblem = (rank) => {
      const isRank1 = rank === 1;
      const isRank2 = rank === 2;

      const emblemColors = isRank1
        ? {
            ringBorder: '#F59E0B',
            ringInner: '#FBBF24',
            crown: '#FBBF24',
            noText: '#FDE68A',
            numText: '#FBBF24',
            star: '#F59E0B',
            bg: '#181204',
            shadow: '#F59E0B',
          }
        : isRank2
        ? {
            ringBorder: '#CBD5E1',
            ringInner: '#94A3B8',
            crown: '#E2E8F0',
            noText: '#E2E8F0',
            numText: '#FFFFFF',
            star: '#94A3B8',
            bg: '#0F172A',
            shadow: '#94A3B8',
          }
        : {
            ringBorder: '#D97706',
            ringInner: '#B45309',
            crown: '#FDBA74',
            noText: '#FED7AA',
            numText: '#FDBA74',
            star: '#D97706',
            bg: '#1C120A',
            shadow: '#D97706',
          };

      return (
        <View style={[styles.emblemContainer, isRank1 && styles.emblemContainerGold, { shadowColor: emblemColors.shadow }]}>
          <View
            style={[
              styles.emblemOuterRing,
              isRank1 && styles.emblemOuterRingGold,
              { borderColor: emblemColors.ringBorder, backgroundColor: emblemColors.bg },
            ]}
          >
            <View
              style={[
                styles.emblemInnerRing,
                isRank1 && styles.emblemInnerRingGold,
                { borderColor: emblemColors.ringInner },
              ]}
            >
              {/* 상단 미니 왕관 */}
              <FontAwesome5
                name="crown"
                size={isRank1 ? 8.5 : 7}
                color={emblemColors.crown}
                style={styles.emblemCrownIcon}
              />
              {/* No. 레이블 & 순위 숫자 */}
              <View style={styles.emblemCenterRow}>
                <Text style={[styles.emblemNoText, isRank1 && styles.emblemNoTextGold, { color: emblemColors.noText }]}>No.</Text>
                <Text style={[styles.emblemNumText, isRank1 && styles.emblemNumTextGold, { color: emblemColors.numText }]}>{rank}</Text>
              </View>
              {/* 하단 미니 별 3개 */}
              <Text style={[styles.emblemStarsText, isRank1 && styles.emblemStarsTextGold, { color: emblemColors.star }]}>★ ★ ★</Text>
            </View>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.top3SectionWrap}>
        {/* 상단 타이틀 행 (실시간 Top3) */}
        <View style={styles.top3HeaderRow}>
          <View style={styles.top3TitleGroup}>
            <Text style={styles.top3CrownEmoji}>👑</Text>
            <Text style={styles.top3SectionTitle}>실시간 Top3</Text>
            <View style={styles.top3LiveDotBadge}>
              <View style={styles.top3LiveDot} />
              <Text style={styles.top3LiveDotText}>LIVE RANK</Text>
            </View>
          </View>
          <Text style={styles.top3Subtitle}>시청자 + 후원 집계</Text>
        </View>

        {/* 3열 한눈에 보이는 고정 그리드 (스크롤 없이 1~3위 동시 노출) */}
        <View style={styles.top3RowContainer}>
          {top3Rooms.slice(0, 3).map((item, index) => {
            const rank = item.rank || index + 1;
            const isRank1 = rank === 1;
            const isRank2 = rank === 2;

            const cardBorderColor = isRank1 ? '#F59E0B' : isRank2 ? '#94A3B8' : '#D97706';
            const viewerFormatted =
              item.viewerCount >= 1000
                ? `${(item.viewerCount / 1000).toFixed(1)}k`
                : (item.viewerCount || 0).toLocaleString();

            return (
              <View
                key={item.id || String(index)}
                style={[
                  styles.top3CardOuter,
                  isRank1 && styles.top3CardOuterGold,
                  isRank2 && styles.top3CardOuterSilver,
                  !isRank1 && !isRank2 && styles.top3CardOuterBronze,
                ]}
              >
                {/* 상단 중앙에 오버랩되는 첨부 스타일 화려한 엠블럼 */}
                {renderRankEmblem(rank)}

                <TouchableOpacity
                  style={[styles.top3CardInner, { borderColor: cardBorderColor }]}
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.navigate('LiveRoom', {
                      roomId: item.id,
                      roomTitle: item.title,
                      hostName: item.host?.name || item.hostName,
                      hostAvatar: item.host?.avatar || item.hostAvatar,
                    })
                  }
                >
                  <Image
                    source={{ uri: item.coverUri || item.host?.avatar }}
                    style={styles.top3Cover}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.95)']}
                    style={styles.top3Gradient}
                  >
                    {/* 상단 시청자수 미니 배지 */}
                    <View style={styles.top3TopRow}>
                      <View style={styles.top3ViewerBadgeMini}>
                        <View style={styles.redDot} />
                        <Text style={styles.top3ViewerTextMini}>{viewerFormatted}</Text>
                      </View>
                    </View>

                    {/* 하단 호스트 정보 */}
                    <View style={styles.top3BottomInfo}>
                      <View style={styles.top3HostRow}>
                        <Image
                          source={{ uri: item.host?.avatar || item.coverUri }}
                          style={[styles.top3HostAvatarMini, { borderColor: cardBorderColor }]}
                        />
                        <Text style={styles.top3HostNameMini} numberOfLines={1}>
                          {item.host?.name || item.hostName || '호스트'}
                        </Text>
                      </View>
                      <Text style={styles.top3RoomTitleMini} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.pinProduct ? (
                        <View style={styles.top3PinProductMini}>
                          <Text style={styles.top3PinTextMini} numberOfLines={1}>
                            📌 특가 핀
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>모꼬 LIVE</Text>
          <View style={styles.liveHeaderBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveHeaderBadgeText}>실시간 방송</Text>
          </View>
        </View>
      </View>

      {/* [👑 실시간 HOT 모꼬 LIVE TOP 3] 상단 배치 */}
      {renderTop3Section()}

      {/* Category selector chips */}
      <View style={styles.categoryBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.categoryScroll}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.key;
            return (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(item.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Rooms List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={LIVE_COLOR} />
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRoomItem}
          numColumns={2}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={
            filteredRooms.length > 0 ? styles.roomList : styles.emptyList
          }
          columnWrapperStyle={filteredRooms.length > 0 ? styles.columnWrap : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={LIVE_COLOR}
            />
          }
          ListEmptyComponent={
            <EmptyStateView
              preset="live"
              title="진행 중인 라이브 방송이 없습니다"
              description="지금 첫 라이브의 주인공이 되어 팬들과 소통해 보세요!"
              ctaLabel="🎥 내가 먼저 라이브 시작하기"
              onCtaPress={() => setModalVisible(true)}
              style={{ marginTop: 40 }}
            />
          }
        />
      )}

      {/* 당근마켓 스타일 가변 플로팅 액션 버튼 (Extended FAB) */}
      <ExtendedFAB
        label="+ LIVE"
        iconName="videocam"
        isExtended={isExtended}
        onPress={() => setModalVisible(true)}
      />

      {/* Start Live Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              hitSlop={8}
            >
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>라이브 방송 시작</Text>
            <TouchableOpacity
              onPress={handleStartLive}
              disabled={starting || !title.trim()}
              style={[
                styles.modalSubmitButton,
                (!title.trim() || starting) && styles.modalSubmitButtonDisabled,
              ]}
            >
              {starting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitText}>시작</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>방송 제목</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="예: 오늘 저녁 같이 이야기해요!"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
              autoFocus
            />

            <Text style={[styles.inputLabel, { marginTop: 24 }]}>카테고리</Text>
            <View style={styles.modalCategoryRow}>
              {CATEGORIES.filter((c) => c.key !== 'all').map((c) => {
                const isSelected = category === c.key;
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[
                      styles.modalCategoryChip,
                      isSelected && styles.modalCategoryChipActive,
                    ]}
                    onPress={() => setCategory(c.key)}
                  >
                    <Text
                      style={[
                        styles.modalCategoryText,
                        isSelected && styles.modalCategoryTextActive,
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* [+ 판매 상품 연결 (선택)] 섹션 */}
            <Text style={[styles.inputLabel, { marginTop: 24 }]}>🛍️ 판매 상품 연결 (선택)</Text>
            <Text style={styles.inputSubLabel}>
              방송 중 소개하고 실시간 에스크로 안전결제를 진행할 상품을 연결하세요.
            </Text>
            <TouchableOpacity
              style={styles.connectProductBtn}
              activeOpacity={0.85}
              onPress={() => setProductPickerVisible(!productPickerVisible)}
            >
              <View style={styles.connectProductBtnLeft}>
                <Ionicons name="pricetags" size={18} color="#FF3B6B" />
                <Text style={styles.connectProductBtnText}>
                  {selectedProductIds.length > 0
                    ? `${selectedProductIds.length}개 상품 연결됨 (터치하여 수정)`
                    : '+ 마켓 상품 목록에서 연결하기'}
                </Text>
              </View>
              <Ionicons
                name={productPickerVisible ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#64748B"
              />
            </TouchableOpacity>

            {/* 상품 선택 서브 리스트 */}
            {productPickerVisible && (
              <View style={styles.productPickerBox}>
                {/* 3-Way 서브 탭: [🏷️ 나의 중고] vs [🛍️ 입점사 일반] vs [🎙️ 제휴 위탁 (내 바구니)] */}
                <View style={styles.livePickerTabBar}>
                  <TouchableOpacity
                    style={[styles.livePickerTabBtn, liveProductTab === 'C2C' && styles.livePickerTabBtnActive]}
                    onPress={() => setLiveProductTab('C2C')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.livePickerTabText, liveProductTab === 'C2C' && styles.livePickerTabTextActive]}>
                      🏷️ 중고 ({marketProducts.length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.livePickerTabBtn, liveProductTab === 'MERCHANT' && styles.livePickerTabBtnActive]}
                    onPress={() => setLiveProductTab('MERCHANT')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.livePickerTabText, liveProductTab === 'MERCHANT' && styles.livePickerTabTextActive]}>
                      🛍️ 입점사 ({myMerchantProducts.length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.livePickerTabBtn, liveProductTab === 'AFFILIATE' && styles.livePickerTabBtnActive]}
                    onPress={() => setLiveProductTab('AFFILIATE')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.livePickerTabText, liveProductTab === 'AFFILIATE' && styles.livePickerTabTextActive]}>
                      🎙️ 제휴 위탁 ({myAffiliateProducts.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {liveProductTab === 'C2C' ? (
                  marketProducts.slice(0, 6).map((p) => {
                    const isChecked = selectedProductIds.includes(p.id);
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.pickerItemRow, isChecked && styles.pickerItemRowSelected]}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (isChecked) {
                            setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                          } else {
                            setSelectedProductIds([...selectedProductIds, p.id]);
                          }
                        }}
                      >
                        <Image source={{ uri: p.images[0] }} style={styles.pickerThumb} />
                        <View style={styles.pickerMeta}>
                          <View style={styles.pickerBadgeRow}>
                            <Text style={[styles.pickerTypeBadge, p.type === 'B2C_GROUP' ? styles.pickerTypeB2C : styles.pickerTypeC2C]}>
                              {p.type === 'B2C_GROUP' ? '공구' : '중고'}
                            </Text>
                            <Text style={styles.pickerPrice}>{p.price.toLocaleString()}원</Text>
                          </View>
                          <Text style={styles.pickerTitle} numberOfLines={1}>{p.title}</Text>
                        </View>
                        <Ionicons
                          name={isChecked ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={isChecked ? '#FF3B6B' : '#94A3B8'}
                        />
                      </TouchableOpacity>
                    );
                  })
                ) : liveProductTab === 'MERCHANT' ? (
                  myMerchantProducts.length > 0 ? (
                    myMerchantProducts.map((p) => {
                      const isChecked = selectedProductIds.includes(p.id);
                      const finalPrice = p.salePriceKrw || p.priceKrw;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.pickerItemRow, isChecked && styles.pickerItemRowSelected]}
                          activeOpacity={0.8}
                          onPress={() => {
                            if (isChecked) {
                              setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                            } else {
                              setSelectedProductIds([...selectedProductIds, p.id]);
                            }
                          }}
                        >
                          <Image
                            source={{ uri: p.images?.[0] || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300' }}
                            style={styles.pickerThumb}
                          />
                          <View style={styles.pickerMeta}>
                            <View style={styles.pickerBadgeRow}>
                              <Text style={[styles.pickerTypeBadge, styles.pickerTypeMerchant]}>
                                브랜드정품
                              </Text>
                              <Text style={styles.pickerPrice}>{finalPrice.toLocaleString()}원</Text>
                            </View>
                            <Text style={styles.pickerTitle} numberOfLines={1}>{p.name}</Text>
                          </View>
                          <Ionicons
                            name={isChecked ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={isChecked ? '#4F46E5' : '#94A3B8'}
                          />
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.emptyPickerBox}>
                      <Text style={styles.emptyPickerText}>등록된 입점사 일반 상품이 없습니다.</Text>
                      <Text style={styles.emptyPickerSub}>마이페이지 &gt; 입점사 관리에서 상품을 등록해보세요.</Text>
                    </View>
                  )
                ) : (
                  /* liveProductTab === 'AFFILIATE' (스트리머 제휴 위탁 장바구니) */
                  myAffiliateProducts.length > 0 ? (
                    myAffiliateProducts.map((p) => {
                      const isChecked = selectedProductIds.includes(p.id);
                      const finalPrice = p.salePriceKrw || p.priceKrw || p.price || 0;
                      const commRate = p.commissionRate || p.affiliateCommissionRate || 10;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.pickerItemRow, isChecked && styles.pickerItemRowSelected]}
                          activeOpacity={0.8}
                          onPress={() => {
                            if (isChecked) {
                              setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                            } else {
                              setSelectedProductIds([...selectedProductIds, p.id]);
                            }
                          }}
                        >
                          <Image
                            source={{ uri: p.images?.[0] || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300' }}
                            style={styles.pickerThumb}
                          />
                          <View style={styles.pickerMeta}>
                            <View style={styles.pickerBadgeRow}>
                              <Text style={[styles.pickerTypeBadge, { backgroundColor: '#FFF1F2', color: '#E11D48' }]}>
                                🎙️ 수익쉐어 {commRate}%
                              </Text>
                              <Text style={styles.pickerPrice}>{finalPrice.toLocaleString()}원</Text>
                            </View>
                            <Text style={styles.pickerTitle} numberOfLines={1}>{p.title || p.name}</Text>
                          </View>
                          <Ionicons
                            name={isChecked ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={isChecked ? '#E11D48' : '#94A3B8'}
                          />
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.emptyPickerBox}>
                      <Text style={styles.emptyPickerText}>담아둔 제휴 위탁 상품이 없습니다.</Text>
                      <Text style={styles.emptyPickerSub}>웹/앱 제휴 마켓에서 스트리머 제휴 상품을 담아보세요.</Text>
                    </View>
                  )
                )}
              </View>
            )}

            <Text style={[styles.inputLabel, { marginTop: 24 }]}>시청자 입장료 (참여 온 설정)</Text>
            <Text style={styles.inputSubLabel}>
              호스트가 직접 시청자의 입장료를 지정할 수 있습니다. (0 온 설정 시 무료)
            </Text>
            <View style={styles.entryFeeChipRow}>
              {[0, 10, 30, 50, 100].map((feeVal) => {
                const isSelected = entryFee === feeVal;
                return (
                  <TouchableOpacity
                    key={feeVal}
                    style={[
                      styles.entryFeeChip,
                      isSelected && styles.entryFeeChipActive,
                    ]}
                    onPress={() => setEntryFee(feeVal)}
                  >
                    <Text
                      style={[
                        styles.entryFeeChipText,
                        isSelected && styles.entryFeeChipTextActive,
                      ]}
                    >
                      {feeVal === 0 ? '무료' : `${feeVal} 온`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.customFeeRow}>
              <Text style={styles.customFeeLabel}>직접 입력:</Text>
              <TextInput
                style={styles.customFeeInput}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                value={String(entryFee)}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  const num = parseInt(cleaned, 10);
                  setEntryFee(isNaN(num) ? 0 : Math.min(num, 50000));
                }}
              />
              <Text style={styles.customFeeUnit}>온(ON)</Text>
            </View>

            <View style={styles.modalTipCard}>
              <Ionicons name="information-circle-outline" size={20} color={LIVE_COLOR} />
              <Text style={styles.modalTipText}>
                건전하고 따뜻한 커뮤니티 조성을 위해 상호 배려하는 방송을 부탁드립니다.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerMascotLogo: {
    width: 26,
    height: 26,
    borderRadius: 6,
    marginRight: 6,
  },
  top3SectionWrap: {
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  top3HeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  top3TitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  top3CrownEmoji: {
    fontSize: 15,
  },
  top3SectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  top3LiveDotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  top3LiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
  },
  top3LiveDotText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#DC2626',
  },
  top3Subtitle: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  // 3열 고정 컨테이너 (한 화면에 1, 2, 3위 동시 노출)
  top3RowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    alignItems: 'flex-end',
    paddingTop: 18,
  },
  top3CardOuter: {
    width: TOP3_CARD_WIDTH,
    height: 154,
    position: 'relative',
    overflow: 'visible',
  },
  top3CardOuterGold: {
    width: TOP3_CARD_WIDTH,
    height: 162,
    zIndex: 3,
  },
  top3CardOuterSilver: {
    width: TOP3_CARD_WIDTH,
    height: 154,
    zIndex: 2,
  },
  top3CardOuterBronze: {
    width: TOP3_CARD_WIDTH,
    height: 154,
    zIndex: 1,
  },
  // 첨부 이미지 스타일의 화려한 원형 엠블럼 (상단 중앙 오버랩)
  emblemContainer: {
    position: 'absolute',
    top: -16,
    left: 0,
    right: 0,
    width: '100%',
    alignItems: 'center',
    zIndex: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 8,
  },
  emblemContainerGold: {
    top: -19,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 10,
  },
  emblemOuterRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemOuterRingGold: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2.2,
  },
  emblemInnerRing: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
  },
  emblemInnerRingGold: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.2,
  },
  emblemCrownIcon: {
    marginTop: -1,
    marginBottom: 0,
  },
  emblemCenterRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: -1,
  },
  emblemNoText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginRight: 0.5,
  },
  emblemNoTextGold: {
    fontSize: 7.5,
  },
  emblemNumText: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 14,
  },
  emblemNumTextGold: {
    fontSize: 15,
    lineHeight: 16,
  },
  emblemStarsText: {
    fontSize: 4.5,
    letterSpacing: 0.5,
    marginTop: -1,
  },
  emblemStarsTextGold: {
    fontSize: 5,
  },
  // 카드 본체
  top3CardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
  },
  top3Cover: {
    width: '100%',
    height: '100%',
  },
  top3Gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'space-between',
    padding: 6,
    paddingTop: 16,
  },
  top3TopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  top3ViewerBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  redDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },
  top3ViewerTextMini: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  top3BottomInfo: {
    gap: 2,
  },
  top3HostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  top3HostAvatarMini: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
  top3HostNameMini: {
    flex: 1,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  top3RoomTitleMini: {
    fontSize: 8.5,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  top3PinProductMini: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 1,
  },
  top3PinTextMini: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#78350F',
  },
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  liveHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  liveHeaderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  startLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  startLiveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  categoryBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomList: {
    padding: 16,
    gap: 14,
  },
  columnWrap: {
    justifyContent: 'space-between',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomCard: {
    width: '48%',
    height: 220,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 4,
    position: 'relative',
  },
  roomCardCover: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'cover',
  },
  cardHeaderBadges: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 2,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: LIVE_COLOR,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  viewerCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  entryFeePill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  entryFeeFree: {
    backgroundColor: 'rgba(16, 185, 129, 0.85)',
  },
  entryFeePaid: {
    backgroundColor: 'rgba(245, 158, 11, 0.85)',
  },
  entryFeePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    paddingTop: 28,
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  cardHostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  cardHostName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  cardHostRegion: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    flexShrink: 1,
  },
  roomTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 59, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyStartButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: LIVE_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyStartButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  modalCancelText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  modalSubmitButton: {
    backgroundColor: LIVE_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
  },
  modalSubmitButtonDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  modalCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalCategoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.pillBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCategoryChipActive: {
    backgroundColor: 'rgba(255, 59, 107, 0.1)',
    borderColor: LIVE_COLOR,
  },
  modalCategoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalCategoryTextActive: {
    color: LIVE_COLOR,
    fontWeight: '700',
  },
  modalTipCard: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 59, 107, 0.06)',
    padding: 14,
    borderRadius: 14,
  },
  modalTipText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  entryFeePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  entryFeeFree: {
    backgroundColor: 'rgba(16, 185, 129, 0.85)',
  },
  entryFeePaid: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
  },
  entryFeePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  inputSubLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 10,
  },
  entryFeeChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  entryFeeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: colors.pillBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryFeeChipActive: {
    backgroundColor: 'rgba(255, 59, 107, 0.1)',
    borderColor: LIVE_COLOR,
  },
  entryFeeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  entryFeeChipTextActive: {
    color: LIVE_COLOR,
    fontWeight: '800',
  },
  customFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  customFeeLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  customFeeInput: {
    minWidth: 80,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
  },
  customFeeUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  // 커머스 핀 및 상품 선택 피커 스타일
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderRight: {
    marginLeft: 'auto',
  },
  commerceNeonBadge: {
    backgroundColor: '#FF3B6B',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#FF3B6B',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  commerceNeonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 4,
  },
  connectProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  connectProductBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectProductBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
  },
  productPickerBox: {
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  livePickerTabBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  livePickerTabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  livePickerTabBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  livePickerTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  livePickerTabTextActive: {
    color: '#FFFFFF',
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerItemRowSelected: {
    borderColor: '#FF3B6B',
    backgroundColor: '#FFF1F2',
  },
  pickerThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  pickerMeta: {
    flex: 1,
    marginHorizontal: 10,
  },
  pickerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  pickerTypeBadge: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  pickerTypeB2C: {
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
  },
  pickerTypeC2C: {
    backgroundColor: '#E0E7FF',
    color: '#4F46E5',
  },
  pickerTypeMerchant: {
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
  },
  pickerPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerTitle: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  emptyPickerBox: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyPickerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});

