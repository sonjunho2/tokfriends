// src/screens/list/UniversalListScreen.js
import React, { useMemo, useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import UserListItem from '../../components/UserListItem';

const SEGMENTS = ['전체','HOT추천','접속중','가까운','20대','30대','40대이상','이성친구','즉석만남'];

export default function UniversalListScreen({ navigation, route }) {
  const initial = route.params?.initialFilter || 'HOT추천';
  const [seg, setSeg] = useState(
    SEGMENTS.includes(initial) ? SEGMENTS.indexOf(initial) : 1
  );

  // 더미 원본
  const raw = useMemo(() => (
    Array.from({ length: 40 }, (_, i) => ({
      id: i + 1,
      name: ['여행을좋아하는수아','수별윤','아직너틀그','달코만초콜렛','나윤희나윤희'][i%5],
      age: [26,45,47,22,38][i%5],
      points: [0,5,15,90,40][i%5],
      subtitle: '마음이 맞으면 만나고 싶어요 부모님이랑 살고 있어요',
      avatar: `https://i.pravatar.cc/150?img=${(i%60)+1}`,
      lastSeenLabel: ['1일','4분','17시간','2일','6시간'][i%5],
      regionLabel: ['대전','서울','대전','울산','서울'][i%5],
      distanceKm: [2,59,7,3,12][i%5],
      online: [false,true,true,false,true][i%5],
      gender: ['F','F','M','F','M'][i%5],
      intent: ['일반채팅','이성친구','즉석만남','일반채팅','일반채팅'][i%5],
      hot: [true,false,true,false,false][i%5],
    }))
  ), []);

  // 필터/정렬
  const filtered = useMemo(() => {
    const label = SEGMENTS[seg];
    let list = raw.slice();

    switch (label) {
      case 'HOT추천':
        list = list.filter(x => x.hot).sort((a,b)=> (b.points||0)-(a.points||0));
        break;
      case '접속중':
        list = list.filter(x => x.online).sort((a,b)=> (a.distanceKm||0)-(b.distanceKm||0));
        break;
      case '가까운':
        list = list.sort((a,b)=> (a.distanceKm||0)-(b.distanceKm||0));
        break;
      case '20대':
        list = list.filter(x => x.age >= 20 && x.age < 30);
        break;
      case '30대':
        list = list.filter(x => x.age >= 30 && x.age < 40);
        break;
      case '40대이상':
        list = list.filter(x => x.age >= 40);
        break;
      case '이성친구':
        list = list.filter(x => x.intent === '이성친구');
        break;
      case '즉석만남':
        list = list.filter(x => x.intent === '즉석만남');
        break;
      case '전체':
      default:
        // 전체: 정렬 없이 그대로
        break;
    }
    return list;
  }, [seg, raw]);

  // 헤더 제목(A)을 현재 세그먼트로 표시
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: SEGMENTS[seg],
      headerTitleStyle: { fontSize: 20, fontWeight: '800', color: colors.text },
      headerStyle: { backgroundColor: colors.backgroundSecondary },
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={{ paddingHorizontal: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, seg]);

  return (
    <View style={styles.container}>
      {/* 알약바(B) */}
      <ScrollView
        style={styles.segScroll}
        contentContainerStyle={styles.segWrap}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {SEGMENTS.map((label, i) => {
          const on = i === seg;
          return (
            <TouchableOpacity
              key={label}
              style={[styles.seg, on && styles.segOn]}
              onPress={() => setSeg(i)}
              activeOpacity={0.9}
            >
              <Text style={[styles.segTxt, on && styles.segTxtOn]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 리스트(C) */}
      <FlatList
        data={filtered}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <UserListItem
            item={item}
            onPress={() =>
              navigation.navigate('ProfileDetail', {
                profile: {
                  name: item?.name,
                  location: `${item?.regionLabel || '서울'} · ${item?.distanceKm ?? '-'}km`,
                  title: `${SEGMENTS[seg]} 추천 회원`,
                  bio: item?.subtitle,
                  avatar: item?.avatar,
                  coverImage: item?.avatar,
                  age: item?.age,
                  distanceKm: item?.distanceKm,
                  points: item?.points,
                },
              })
            }
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor: colors.background },
   segScroll:{ paddingVertical:14 },
  segWrap:{ flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingRight:24 },
  seg:{
    minHeight:44,
    paddingHorizontal:18,
    borderRadius:20,
    backgroundColor:colors.pillBg,
    borderWidth:1,
    borderColor:colors.border,
    marginRight:8,
    justifyContent:'center',
    alignItems:'center',
    paddingVertical:0,
  },
  segOn:{ backgroundColor:colors.pillActiveBg, borderColor:colors.pillActiveBorder },
  segTxt:{ color:colors.textSecondary, fontWeight:'700', fontSize:14, lineHeight:20 },
  segTxtOn:{ color:colors.primary },
});
