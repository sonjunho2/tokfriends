// src/screens/main/LiveScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { apiClient } from '../../api/client';

const LIVE_COLOR = '#FF3B6B';

const CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'talk', label: '토크/소통' },
  { key: 'music', label: '음악/노래' },
  { key: 'daily', label: '일상' },
  { key: 'hobby', label: '취미' },
];

export default function LiveScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Start Live Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('talk');
  const [starting, setStarting] = useState(false);

  const loadRooms = useCallback(async () => {
    try {
      const data = await apiClient.getActiveLiveRooms();
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to load active live rooms', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRooms();
  }, [loadRooms]);

  const filteredRooms = useMemo(() => {
    if (selectedCategory === 'all') return rooms;
    return rooms.filter((r) => r.category === selectedCategory);
  }, [rooms, selectedCategory]);

  const handleStartLive = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('알림', '방송 제목을 입력해 주세요.');
      return;
    }
    setStarting(true);
    try {
      const room = await apiClient.createLiveRoom({
        title: trimmedTitle,
        category,
      });
      setModalVisible(false);
      setTitle('');
      navigation.navigate('LiveRoom', { room, roomId: room.id });
      loadRooms();
    } catch (e) {
      Alert.alert('시작 실패', e?.message || '라이브 방송을 시작하지 못했습니다.');
    } finally {
      setStarting(false);
    }
  };

  const handleEnterRoom = (room) => {
    navigation.navigate('LiveRoom', { room, roomId: room.id });
  };

  const renderRoomItem = ({ item }) => {
    const host = item.host || {};

    return (
      <TouchableOpacity
        style={styles.roomCard}
        onPress={() => handleEnterRoom(item)}
        activeOpacity={0.85}
      >
        {/* Cover / Visual Area */}
        <View style={styles.cardCover}>
          <Avatar
            size={56}
            name={host.name}
            uri={item.coverUri || host.avatar}
            showBorder
            style={styles.coverAvatar}
          />
          {/* Top badging */}
          <View style={styles.cardHeaderBadges}>
            <View style={styles.liveTag}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTagText}>LIVE</Text>
            </View>
            <View style={styles.viewerBadge}>
              <Ionicons name="eye" size={12} color="#FFFFFF" />
              <Text style={styles.viewerCountText}>{item.viewerCount || 1}</Text>
            </View>
          </View>
        </View>

        {/* Room Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.hostRow}>
            <Text style={styles.hostName} numberOfLines={1}>
              {host.name}
            </Text>
            {!!host.region && (
              <Text style={styles.hostRegion}>· {host.region}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>DAGAON</Text>
          <View style={styles.liveHeaderBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveHeaderBadgeText}>LIVE</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startLiveBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="videocam" size={16} color="#FFFFFF" />
          <Text style={styles.startLiveBtnText}>방송하기</Text>
        </TouchableOpacity>
      </View>

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
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="radio-outline" size={48} color={LIVE_COLOR} />
              </View>
              <Text style={styles.emptyTitle}>진행 중인 라이브가 없습니다</Text>
              <Text style={styles.emptySubtitle}>
                지금 바로 첫 번째 라이브 방송을 시작하고{'\n'}새로운 친구들과 실시간으로 소통해보세요!
              </Text>
              <TouchableOpacity
                style={styles.emptyStartButton}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="videocam-outline" size={18} color="#FFFFFF" />
                <Text style={styles.emptyStartButtonText}>내가 먼저 라이브 시작하기</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

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

            <View style={styles.modalTipCard}>
              <Ionicons name="information-circle-outline" size={20} color={LIVE_COLOR} />
              <Text style={styles.modalTipText}>
                건전하고 따뜻한 커뮤니티 조성을 위해 상호 배려하는 방송을 부탁드립니다.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 0.4,
  },
  liveHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 107, 0.1)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LIVE_COLOR,
  },
  liveHeaderBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: LIVE_COLOR,
  },
  startLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: LIVE_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  startLiveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryBar: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.pillBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(255, 59, 107, 0.1)',
    borderColor: LIVE_COLOR,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: LIVE_COLOR,
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
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCover: {
    height: 130,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coverAvatar: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardHeaderBadges: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    gap: 4,
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
  cardInfo: {
    padding: 10,
  },
  roomTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  hostName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  hostRegion: {
    fontSize: 11,
    color: colors.textTertiary,
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
});
