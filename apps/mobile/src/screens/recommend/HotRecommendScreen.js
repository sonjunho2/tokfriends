// src/screens/recommend/HotRecommendScreen.js
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import UserListItem from '../../components/UserListItem';
import SegmentBar, { DEFAULT_SEGMENTS } from '../../components/SegmentBar';

const USERS = [
  {
    id: 1,
    name: '여행을좋아하는수아',
    age: 26,
    points: 80,
    subtitle: '주말마다 근교 여행을 떠나요. 사진 남기는 걸 좋아해요.',
    avatar: 'https://i.pravatar.cc/150?img=18',
    lastSeenLabel: '4분',
    regionLabel: '서울',
    distanceKm: 3,
    online: true,
    gender: 'F',
    intent: '이성친구',
    instant: false,
    hot: true,
  },
  {
    id: 2,
    name: '수별윤',
    age: 45,
    points: 5,
    subtitle: '차분한 음악과 드라이브를 좋아하는 수별윤입니다.',
    avatar: 'https://i.pravatar.cc/150?img=44',
    lastSeenLabel: '1일',
    regionLabel: '대전',
    distanceKm: 120,
    online: false,
    gender: 'F',
    intent: '일반채팅',
    instant: false,
    hot: false,
  },
  {
    id: 3,
    name: '아직너틀그',
    age: 31,
    points: 15,
    subtitle: '맛집 찾기와 산책을 좋아해요. 진솔한 대화를 원해요.',
    avatar: 'https://i.pravatar.cc/150?img=32',
    lastSeenLabel: '17시간',
    regionLabel: '서울',
    distanceKm: 6,
    online: false,
    gender: 'M',
    intent: '이성친구',
    instant: false,
    hot: true,
  },
  {
    id: 4,
    name: '달코만초콜렛',
    age: 40,
    points: 90,
    subtitle: '디저트와 커피에 진심! 즐거운 수다 친구 찾아요.',
    avatar: 'https://i.pravatar.cc/150?img=49',
    lastSeenLabel: '6시간',
    regionLabel: '울산',
    distanceKm: 18,
    online: true,
    gender: 'F',
    intent: '즉석만남',
    instant: true,
    hot: true,
  },
  {
    id: 5,
    name: '나윤희나윤희',
    age: 50,
    points: 40,
    subtitle: '책과 영화 이야기를 나누고 싶어요. 하루를 기록 중이에요.',
    avatar: 'https://i.pravatar.cc/150?img=58',
    lastSeenLabel: '2일',
    regionLabel: '서울',
    distanceKm: 9,
    online: false,
    gender: 'F',
    intent: '일반채팅',
    instant: false,
    hot: false,
  },
  {
    id: 6,
    name: '달려가는나비',
    age: 23,
    points: 60,
    subtitle: '운동과 요리를 사랑해요. 활발한 친구면 좋겠어요.',
    avatar: 'https://i.pravatar.cc/150?img=12',
    lastSeenLabel: '방금',
    regionLabel: '서울',
    distanceKm: 2,
    online: true,
    gender: 'F',
    intent: '이성친구',
    instant: false,
    hot: true,
  },
  {
    id: 7,
    name: '스윗라떼',
    age: 34,
    points: 20,
    subtitle: '카페 투어와 야간 드라이브 좋아하는 스윗라떼예요.',
    avatar: 'https://i.pravatar.cc/150?img=54',
    lastSeenLabel: '20분',
    regionLabel: '인천',
    distanceKm: 12,
    online: true,
    gender: 'F',
    intent: '즉석만남',
    instant: true,
    hot: false,
  },
  {
    id: 8,
    name: '바람같이',
    age: 29,
    points: 55,
    subtitle: '등산과 캠핑을 즐기는 바람같이입니다.',
    avatar: 'https://i.pravatar.cc/150?img=28',
    lastSeenLabel: '1시간',
    regionLabel: '수원',
    distanceKm: 28,
    online: false,
    gender: 'M',
    intent: '이성친구',
    instant: false,
    hot: true,
  },
  {
    id: 9,
    name: '달빛소년',
    age: 21,
    points: 10,
    subtitle: '대학생이에요. 음악과 공연 이야기 나누고 싶어요.',
    avatar: 'https://i.pravatar.cc/150?img=29',
    lastSeenLabel: '30분',
    regionLabel: '서울',
    distanceKm: 4,
    online: true,
    gender: 'M',
    intent: '즉석만남',
    instant: true,
    hot: false,
  },
  {
    id: 10,
    name: '봄햇살',
    age: 37,
    points: 75,
    subtitle: '소소한 일상을 나누고 함께 산책할 친구 찾아요.',
    avatar: 'https://i.pravatar.cc/150?img=31',
    lastSeenLabel: '5시간',
    regionLabel: '부산',
    distanceKm: 35,
    online: false,
    gender: 'F',
    intent: '일반채팅',
    instant: false,
    hot: true,
  },
  {
    id: 11,
    name: '별빛소년',
    age: 42,
    points: 30,
    subtitle: '야구와 영화가 취미예요. 가족 같은 친구 원해요.',
    avatar: 'https://i.pravatar.cc/150?img=46',
    lastSeenLabel: '3시간',
    regionLabel: '창원',
    distanceKm: 48,
    online: false,
    gender: 'M',
    intent: '일반채팅',
    instant: false,
    hot: false,
  },
  {
    id: 12,
    name: '소나무',
    age: 48,
    points: 25,
    subtitle: '오랜 친구처럼 편안한 대화를 나누고 싶어요.',
    avatar: 'https://i.pravatar.cc/150?img=60',
    lastSeenLabel: '하루 전',
    regionLabel: '광주',
    distanceKm: 60,
    online: false,
    gender: 'M',
    intent: '일반채팅',
    instant: false,
    hot: false,
  },
];

export default function HotRecommendScreen({ navigation, route }) {
  const initial = route?.params?.selected && DEFAULT_SEGMENTS.includes(route.params.selected)
    ? route.params.selected
    : 'HOT추천';
  const [seg, setSeg] = useState(initial);

  const data = useMemo(
    () => {
      const list = USERS.filter((user) => {
        switch (seg) {
          case 'HOT추천':
            return user.hot;
          case '접속중':
            return user.online;
          case '가까운':
            return user.distanceKm <= 10;
          case '20대':
            return user.age >= 20 && user.age < 30;
          case '30대':
            return user.age >= 30 && user.age < 40;
          case '40대이상':
            return user.age >= 40;
          case '이성친구':
            return user.intent === '이성친구';
          case '즉석만남':
            return user.instant;
          case '전체':
          default:
            return true;
        }
      });

      switch (seg) {
        case 'HOT추천':
          return list.sort((a, b) => (b.points || 0) - (a.points || 0));
        case '가까운':
          return list.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
        case '접속중':
          return list.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
        default:
          return list;
      }
    },
    [seg]
  );

    const handleOpenProfile = (item) => {
    navigation.navigate('ProfileDetail', {
      profile: {
        name: item?.name,
        location: `${item?.regionLabel || '서울'} · ${item?.distanceKm ?? '-'}km`,
        title: `${seg} 추천 회원`,
        bio: item?.subtitle,
        avatar: item?.avatar,
        coverImage: item?.avatar,
        age: item?.age,
        distanceKm: item?.distanceKm,
        points: item?.points,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* 중앙 타이틀 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{seg || 'HOT추천'}</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* 공용 세그먼트 바 */}
      <SegmentBar value={seg} onChange={setSeg} />

      {/* 리스트 */}
      <FlatList
        data={data}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => <UserListItem item={item} onPress={() => handleOpenProfile(item)} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
});
