import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import Card from '../../components/Card';
import { apiClient } from '../../api/client';

const GRID = [
  { key: '전체', label: '전체' },
  { key: '20대', label: '20대' },
  { key: '30대', label: '30대' },
  { key: '40대이상', label: '40대이상' },
];

const CARD_H = 190; // 두 박스 동일 높이

function mapHomeDiscoverUser(user) {
  const profile = user?.profile ?? {};

  return {
    id: user?.id,
    name: profile?.nickname || user?.displayName || '회원',
    age: typeof user?.age === 'number' ? user.age : undefined,
    avatar: profile?.avatarUri || undefined,
    location:
      [user?.region1, user?.region2].filter(Boolean).join(' · ') || '지역 미설정',
    bio: profile?.bio || profile?.headline || undefined,
    title: profile?.headline || '프로필',
  };
}

export default function HomeScreen({ navigation }) {
  const [leftSec, setLeftSec] = useState(30 * 60);
  const [idxNew, setIdxNew] = useState(0);
  const [idxBest, setIdxBest] = useState(0);
  const [discoverUsers, setDiscoverUsers] = useState([]);

  useEffect(() => {
    const t = setInterval(() => setLeftSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const leftStr = useMemo(() => {
    const m = Math.floor(leftSec / 60);
    const s = String(leftSec % 60).padStart(2, '0');
    return `${m}분 ${s}초`;
  }, [leftSec]);

  useEffect(() => {
    let active = true;

    const loadDiscoverUsers = async () => {
      try {
        const result = await apiClient.getDiscover();
        const list = Array.isArray(result) ? result : [];

        if (active) {
          setDiscoverUsers(
            list.map(mapHomeDiscoverUser).filter((item) => item.id),
          );
        }
      } catch {
        if (active) {
          setDiscoverUsers([]);
        }
      }
    };

    loadDiscoverUsers();

    return () => {
      active = false;
    };
  }, []);

  // 실제 회원 캐러셀
  useEffect(() => {
    if (discoverUsers.length <= 1) return undefined;

    const t1 = setInterval(
      () => setIdxNew((i) => (i + 1) % discoverUsers.length),
      3000,
    );
    const t2 = setInterval(
      () => setIdxBest((i) => (i + 1) % discoverUsers.length),
      3200,
    );

    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [discoverUsers.length]);

  const newItem =
    discoverUsers.length > 0
      ? discoverUsers[idxNew % discoverUsers.length]
      : null;

  const bestItem =
    discoverUsers.length > 0
      ? discoverUsers[(idxBest + 1) % discoverUsers.length]
      : null;

    const handleHighlightPress = (item) => {
    if (!item) return;
    navigation.navigate('ProfileDetail', {
      profile: {
        id: item.id,
        name: item.name,
        location: item.location,
        title: item.title,
        bio: item.bio,
        avatar: item.avatar,
        coverImage: item.avatar,
        age: item.age,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* 상단 앱명(가운데/크게) + 검색 */}
      <View style={styles.appbar}>
        <View style={{ width: 24 }} />
        <Text style={styles.appTitle}>MJ톡</Text>
        <TouchableOpacity hitSlop={8} style={styles.searchBtn}>
          <Ionicons name="search" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 /* 하단 탭바 가림 방지 */ }}
        showsVerticalScrollIndicator={false}
      >
        {/* 초록 배너 */}
        <Card style={styles.greenCard} noPadding>
          <View style={{ padding: 14, paddingRight: 120 }}>
            <Text style={styles.greenTitle}>오직 첫 가입자만!</Text>
            <Text style={styles.greenDesc}>30분 내 프로필 완성 시{'\n'}50포인트 지급</Text>
          </View>
          <TouchableOpacity style={styles.timerBtn} activeOpacity={0.9}>
            <Text style={styles.timerTxt}>{leftStr}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={styles.greenBadge}><Text style={styles.greenBadgeTxt}>1/1</Text></View>
        </Card>

        {/* 빠른 필터 - 2×4 아이콘 그리드 */}
        <View style={styles.grid}>
          {GRID.map((g) => (
            <TouchableOpacity
              key={g.key}
              style={styles.gridItem}
              activeOpacity={0.9}
              onPress={() => {
                navigation.navigate('HotRecommend', { selected: g.label });
              }}
            >
              <View style={styles.gridIcon}>
                <Text style={styles.gridIconText}>{g.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 나에게 관심있는 친구들 */}
        <Card style={styles.wideCard}>
          <View style={styles.wideRow}>
            <Text style={styles.wideTitle}>나에게{'\n'}관심있는 친구들</Text>
            <TouchableOpacity
              onPress={() => {
                const parentNav = navigation.getParent?.();
                if (parentNav && typeof parentNav.navigate === 'function') {
                  parentNav.navigate('Chats', { initialSeg: '신규' });
                } else if (typeof navigation.navigate === 'function') {
                  navigation.navigate('Chats');
                }
              }}
            >
              <Text style={styles.link}>확인하기 ›</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* 새로운 친구 / 추천 친구 — 동일 높이 + 이미지 1장 자동 전환 + 하단 중앙 정렬 제목 */}
        <View style={styles.dualRow}>
          {/* 새로운 친구 */}
          <View style={styles.dualCol}>
            <View style={styles.dualHeader}>
              <Text style={styles.dualTitle}>새로운 친구</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleHighlightPress(newItem)}
            >
              <Card style={[styles.dualCard, { height: CARD_H }]}>
                <View style={styles.imageWrap}>
                  {newItem?.avatar ? <Image source={{ uri: newItem.avatar }} style={styles.image} /> : <Text style={styles.dualTitle}>{newItem?.name || '회원 없음'}</Text>}
                </View>
              </Card>
            </TouchableOpacity>
          </View>

          {/* 추천 친구 */}
          <View style={styles.dualCol}>
            <View style={styles.dualHeader}>
              <Text style={styles.dualTitle}>추천 친구</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleHighlightPress(bestItem)}
            >
              <Card style={[styles.dualCard, { height: CARD_H }]}>
                <View style={styles.imageWrap}>
                  {bestItem?.avatar ? <Image source={{ uri: bestItem.avatar }} style={styles.image} /> : <Text style={styles.dualTitle}>{bestItem?.name || '회원 없음'}</Text>}
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        </View>

        {/* MJ톡 안내 (자리) */}
        <Card style={styles.guideCard}>
          <Text style={styles.guideTitle}>MJ톡 안내</Text>
          <Text style={styles.guideSub}>공지/도움말/가이드 영역</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  appbar: {
    position: 'relative',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.backgroundSecondary, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  appTitle: { fontSize: 20, fontWeight: '900', color: colors.text, textAlign: 'center', flex: 1 },
  searchBtn: { width: 24, alignItems: 'flex-end' },

  greenCard: { marginHorizontal: 16, marginTop: 12, backgroundColor: '#E8FAD8', borderRadius: 14, position: 'relative' },
  greenTitle: { color: '#14853E', fontWeight: '900', fontSize: 14 },
  greenDesc: { color: '#1D4C2B', fontWeight: '700', fontSize: 16, lineHeight: 22, marginTop: 2 },
  timerBtn: {
    position: 'absolute', right: 10, top: 10,
    backgroundColor: '#2FB75E', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  timerTxt: { color: '#fff', fontWeight: '900', fontSize: 12 },
  greenBadge: { position: 'absolute', right: 10, bottom: 8, backgroundColor: '#DDF0CB', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  greenBadgeTxt: { color: '#2D6B39', fontWeight: '700', fontSize: 11 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 16, paddingTop: 12 },
  gridItem: { width: '22%', alignItems: 'center' },
  gridIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  gridIconText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 18,
  },

  wideCard: { marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16 },
  wideRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wideTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  link: { color: colors.primary, fontWeight: '800' },

  dualRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, marginTop: 20 },
  dualCol: { flex: 1 },

  dualCard: {
    borderRadius: 18,
    justifyContent: 'center',
    overflow: 'hidden',
        padding: 0,
  },

  dualHeader: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  // 이미지를 박스에 가득 채우되 부드러운 라운드를 유지
  imageWrap: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  dualTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },

  guideCard: { marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16 },
  guideTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  guideSub: { marginTop: 6, color: colors.textSecondary },
});
