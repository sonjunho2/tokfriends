// src/screens/explore/ExploreScreen.js
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import UserListItem from '../../components/UserListItem';
import SegmentBar, { DEFAULT_SEGMENTS } from '../../components/SegmentBar';

export default function ExploreScreen({ navigation, route }) {
  const initial = route?.params?.selected && DEFAULT_SEGMENTS.includes(route.params.selected)
    ? route.params.selected
    : '전체';
  const [seg, setSeg] = useState(initial);

  const data = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i + 1,
        name: ['라임', '보라', '해린', '지유', '나린'][i % 5],
        age: [22, 27, 30, 24, 29][i % 5],
        points: [0, 10, 0, 0, 5][i % 5],
        subtitle: '대화는 언제나 환영해요!',
        avatar: `https://i.pravatar.cc/150?img=${(i % 60) + 1}`,
        lastSeenLabel: ['방금', '5분', '1시간', '어제', '3일'][i % 5],
        regionLabel: ['서울', '대전', '울산', '광주', '부산'][i % 5],
        distanceKm: [3, 12, 7, 40, 18][i % 5],
      })),
    [seg]
  );

  return (
    <View style={styles.container}>
      {/* 중앙 타이틀 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{seg}</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* 공용 세그먼트 바 */}
      <SegmentBar value={seg} onChange={setSeg} />

      <FlatList
        data={data}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => <UserListItem item={item} onPress={() => {}} />}
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
