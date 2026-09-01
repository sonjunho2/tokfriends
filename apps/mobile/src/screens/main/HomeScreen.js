import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import Card from '../../components/Card';

const GRID = [
  { key: 'HOT추천', label: 'HOT추천' },
  { key: '접속중', label: '접속중' },
  { key: '가까운', label: '가까운' },
  { key: '20대', label: '20대' },
  { key: '30대', label: '30대' },
  { key: '40대이상', label: '40대이상' },
  { key: '이성친구', label: '이성친구' },
  { key: '즉석만남', label: '즉석만남' },
];

const CARD_H = 190; // 두 박스 동일 높이

// 더미 데이터 (TODO: API로 대체)
const best10 = [
  {
    id: 'b0',
    name: '윤아',
    age: 27,
    img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    avatar: 'https://i.pravatar.cc/150?img=11',
    location: '서울 강남구',
    bio: '따뜻한 커피와 산책을 좋아해요. 주말엔 전시 보러 가요.',
    title: '오늘의 베스트 추천',
    distanceKm: 3,
    points: 120,
  },
  {
    id: 'b1',
    name: '수아',
    age: 25,
    img: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    avatar: 'https://i.pravatar.cc/150?img=22',
    location: '서울 마포구',
    bio: '즉흥 여행과 사진 찍기를 사랑하는 수아예요.',
    title: '감성 가득한 친구',
    distanceKm: 7,
    points: 98,
  },
  {
    id: 'b2',
    name: '나리',
    age: 33,
    img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    avatar: 'https://i.pravatar.cc/150?img=35',
    location: '경기 성남시',
    bio: '차분한 대화를 좋아하고 드라이브를 즐겨요.',
    title: '차분한 대화 메이트',
    distanceKm: 12,
    points: 76,
  },
  {
    id: 'b3',
    name: '은채',
    age: 29,
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    avatar: 'https://i.pravatar.cc/150?img=5',
    location: '부산 해운대구',
    bio: '바다 보며 수다 떠는 걸 가장 좋아해요.',
    title: '늘 웃는 바다 친구',
    distanceKm: 220,
    points: 88,
  },
  {
    id: 'b4',
    name: '다인',
    age: 31,
    img: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80',
    avatar: 'https://i.pravatar.cc/150?img=45',
    location: '대전 서구',
    bio: '새로운 도전을 좋아하는 활발한 성격이에요.',
    title: '활발한 드라이브 파트너',
    distanceKm: 150,
    points: 64,
  },
];

const todayNew = [
  {
    id: 'n0',
    name: '유리',
    age: 24,
    img: 'https://images.unsplash.com/photo-1521579971123-1192931a1452?auto=format&fit=crop&w=900&q=80',
    avatar: 'https://i.pravatar.cc/150?img=16',
    location: '서울 송파구',
    bio: '헬스와 요리를 즐기는 유리에요. 새로운 레시피를 공유해요.',
    title: '오늘 가입한 따끈한 친구',
    distanceKm: 5,
    points: 45,
  },
  {
    id: 'n1',
    name: '연우',
    age: 28,
    img: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80',
    avatar: 'https://i.pravatar.cc/150?img=26',
    location: '인천 연수구',
    bio: '독서모임을 운영 중이고 진솔한 대화를 좋아합니다.',
    title: '생각을 나누는 사람',
    distanceKm: 24,
    points: 52,
  },
  {
    id: 'n2',
    name: '하린',
    age: 26,
    img: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=900&q=80',
    avatar: 'https://i.pravatar.cc/150?img=39',
    location: '광주 서구',
    bio: '노래 듣고 기타 연주하면서 하루를 마무리해요.',
    title: '음악을 나누는 친구',
    distanceKm: 180,
    points: 38,
  },
  {
    id: 'n3',
    name: '세린',
    age: 27,
    img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
    avatar: 'https://i.pravatar.cc/150?img=56',
    location: '대구 수성구',
    bio: '맛집 탐방과 사진 찍기를 좋아하는 세린입니다.',
    title: '오늘의 맛집 투어러',
    distanceKm: 90,
    points: 41,
  },
];

export default function HomeScreen({ navigation }) {
  const [leftSec, setLeftSec] = useState(30 * 60);
  const [idxNew, setIdxNew] = useState(0);
  const [idxBest, setIdxBest] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLeftSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const leftStr = useMemo(() => {
    const m = Math.floor(leftSec / 60);
    const s = String(leftSec % 60).padStart(2, '0');
    return `${m}분 ${s}초`;
  }, [leftSec]);

  // 캐러셀 자동 전환(스크롤 제거, 이미지 1장씩 자동 변경)
  useEffect(() => {
    const t1 = setInterval(() => setIdxNew((i) => (i + 1) % (todayNew.length || 1)), 3000);
    const t2 = setInterval(() => setIdxBest((i) => (i + 1) % (best10.length || 1)), 3200);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  const newList = todayNew.length > 0 ? todayNew : best10; // 오늘 없으면 대체
  const newItem = newList[idxNew % newList.length];
  const bestItem = best10[idxBest % best10.length];

    const handleHighlightPress = (item) => {
    if (!item) return;
    navigation.navigate('ProfileDetail', {
      profile: {
        name: item.name,
        location: item.location,
        title: item.title,
        bio: item.bio,
        avatar: item.avatar,
        coverImage: item.img,
        age: item.age,
        distanceKm: item.distanceKm,
        points: item.points,
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

        {/* 새로운 친구 / 베스트추천 — 동일 높이 + 이미지 1장 자동 전환 + 하단 중앙 정렬 제목 */}
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
                  {!!newItem && <Image source={{ uri: newItem.img }} style={styles.image} />}
                </View>
              </Card>
            </TouchableOpacity>
          </View>

          {/* 베스트추천 */}
          <View style={styles.dualCol}>
            <View style={styles.dualHeader}>
              <Text style={styles.dualTitle}>베스트추천</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleHighlightPress(bestItem)}
            >
              <Card style={[styles.dualCard, { height: CARD_H }]}>
                <View style={styles.imageWrap}>
                  {!!bestItem && <Image source={{ uri: bestItem.img }} style={styles.image} />}
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
