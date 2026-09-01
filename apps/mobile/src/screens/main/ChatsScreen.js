// src/screens/main/ChatsScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import ChatListItem from '../../components/ChatListItem';
import SegmentBar from '../../components/SegmentBar';

const SEGMENTS = ['전체', '읽지 않음', '신규', '즐겨찾기'];

const createInitialChats = () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: ['은별', '아라', '사라', '윤아', '나리', '도윤'][i % 6],
    age: [22, 27, 31, 29, 34, 26][i % 6],
    points: [15, 0, 30, 5, 80, 0][i % 6],
    snippet: '대화해요!',
    timeLabel: ['방금', '1시간', '17시간', '2일', '6시간', '3일'][i % 6],
    regionLabel: ['서초', '수서', '대전', '울산', '서울', '부산'][i % 6],
    distanceKm: [3, 18, 42, 5, 16, 28][i % 6],
    unread: [0, 1, 0, 2, 0, 3][i % 6],
    isNew: [false, true, false, false, true, false][i % 6],
    favorite: [true, false, false, true, false, false][i % 6],
  }));

export default function ChatsScreen({ navigation, route }) {
  // route.params.initialSeg 로 초기 탭을 지정할 수 있게 함 (예: '신규', '전체' 등)
  const initialIndex = Math.max(0, SEGMENTS.findIndex((s) => s === route?.params?.initialSeg));
  const [seg, setSeg] = useState(SEGMENTS[initialIndex] || SEGMENTS[0]);
  const [chats, setChats] = useState(createInitialChats);

  // 다른 화면에서 넘어오며 params가 갱신될 때도 반영
  useEffect(() => {
    if (route?.params?.initialSeg) {
      const idx = SEGMENTS.findIndex((s) => s === route.params.initialSeg);
      if (idx >= 0) setSeg(SEGMENTS[idx]);
    }
  }, [route?.params?.initialSeg]);

  const filteredData = useMemo(() => {
    switch (seg) {
      case '읽지 않음':
        return chats.filter((chat) => chat.unread > 0);
      case '신규':
        return chats.filter((chat) => chat.isNew);
      case '즐겨찾기':
        return chats.filter((chat) => chat.favorite);
      default:
        return chats;
    }
  }, [chats, seg]);

  const updateFavorite = useCallback((chatId, nextFavorite) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              favorite: nextFavorite,
              isNew: nextFavorite ? false : chat.isNew,
            }
          : chat
      )
    );
  }, []);

  const handleOpenChat = useCallback(
    (item) => {
      navigation.navigate('ChatRoom', {
        id: item.id,
        user: item,
        isFavorite: item.favorite,
        onToggleFavorite: (nextFavorite) => updateFavorite(item.id, nextFavorite),
      });
    },
    [navigation, updateFavorite]
  );

  const canGoBack = navigation.canGoBack();

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          {canGoBack && (
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerTitle}>대화</Text>
        <View style={styles.headerSideRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateChatRoom')}
            hitSlop={8}
            style={styles.createBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color={colors.textInverse} />
            <Text style={styles.createBtnTxt}>방 만들기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 세그먼트 */}
      <SegmentBar
        segments={SEGMENTS}
        value={seg}
        onChange={setSeg}
        style={styles.segmentBar}
        contentContainerStyle={{ paddingRight: 12 }}
      />

      {/* 리스트 */}
      <FlatList
        style={styles.list}
        data={filteredData}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => <ChatListItem item={item} onPress={() => handleOpenChat(item)} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>표시할 대화가 없어요</Text>
            <Text style={styles.emptySubtitle}>새로운 대화를 시작하거나 즐겨찾기를 추가해 보세요.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerSide: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerSideRight: { minWidth: 40, alignItems: 'flex-end', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: colors.text },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
    shadowColor: '#F36C93',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  createBtnTxt: { color: colors.textInverse, fontWeight: '800', fontSize: 13 },
  segmentBar: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  list: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  emptyWrap: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
