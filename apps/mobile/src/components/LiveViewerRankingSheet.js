// apps/mobile/src/components/LiveViewerRankingSheet.js
import React, { useState, useMemo } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import colors from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sample base viewers data to supplement active chat participants
const DEFAULT_VIEWERS = [
  { id: 'v1', name: 'ID:1141582236', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', gender: 'male', level: 25 },
  { id: 'v2', name: '디우', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', gender: 'male', level: 21 },
  { id: 'v3', name: 'Adil Khalikulov', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', gender: 'male', level: 18 },
  { id: 'v4', name: '☆김영일☆', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100', gender: 'male', level: 13 },
  { id: 'v5', name: 'hemi', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100', gender: 'female', level: 3 },
  { id: 'v6', name: '민지', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100', gender: 'female', level: 12 },
  { id: 'v7', name: '하늘바라기', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', gender: 'male', level: 7 },
];

const DEFAULT_CONTRIBUTORS = [
  {
    id: 'c1',
    name: '🌸 炫.🐅🐾',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    points: 17,
    level: 50,
    fanTag: 'WINGS 3',
    gender: 'female',
  },
  {
    id: 'c2',
    name: '블리주',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120',
    points: 10,
    level: 88,
    fanTag: 'POTATO 10',
    gender: 'male',
  },
  {
    id: 'c3',
    name: '구름이',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    points: 8,
    level: 32,
    fanTag: 'STAR 2',
    gender: 'female',
  },
  {
    id: 'c4',
    name: '호수',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120',
    points: 5,
    level: 19,
    fanTag: 'LILY 1',
    gender: 'male',
  },
];

export default function LiveViewerRankingSheet({
  visible,
  onClose,
  viewerCount = 1,
  activeViewers = [],
  messages = [],
  currentUser = null,
  myContributionPoints = 0,
  onOpenGiftPicker,
}) {
  const [activeTab, setActiveTab] = useState('viewers'); // 'viewers' | 'ranking' | 'vip'
  const [periodTab, setPeriodTab] = useState('daily'); // 'daily' | 'weekly' | 'monthly' | 'fan' | 'total'

  // Dynamic merged viewer list
  const mergedViewers = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Current user
    if (currentUser?.id) {
      seen.add(String(currentUser.id));
      list.push({
        id: String(currentUser.id),
        name: currentUser.name || currentUser.displayName || `ID:${String(currentUser.id).slice(0, 8)}`,
        avatar: currentUser.avatar || currentUser.profileImage,
        gender: currentUser.gender || 'male',
        level: currentUser.level || 1,
        isMe: true,
      });
    }

    // 2. Chat participants
    if (Array.isArray(messages)) {
      for (const m of messages) {
        const sid = String(m?.senderId || m?.sender?.id || '');
        if (sid && !seen.has(sid)) {
          seen.add(sid);
          list.push({
            id: sid,
            name: m?.senderName || m?.sender?.name || `ID:${sid.slice(0, 8)}`,
            avatar: m?.senderAvatar || m?.sender?.avatar,
            gender: m?.sender?.gender || 'male',
            level: m?.sender?.level || 12,
          });
        }
      }
    }

    // 3. Fallback active viewers
    for (const v of DEFAULT_VIEWERS) {
      if (!seen.has(v.id)) {
        seen.add(v.id);
        list.push(v);
      }
    }

    return list;
  }, [currentUser, messages]);

  // Dynamic contributors list
  const mergedContributors = useMemo(() => {
    const giftMap = new Map();

    // Collect from room messages
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (m.type === 'gift' && m.giftPoints) {
          const sid = String(m.senderId || m.sender?.id || m.senderName || 'anon');
          const prev = giftMap.get(sid) || {
            id: sid,
            name: m.senderName || m.sender?.name || '후원자',
            avatar: m.senderAvatar || m.sender?.avatar,
            points: 0,
            level: 30,
            fanTag: 'FAN 1',
          };
          prev.points += Number(m.giftPoints || 0);
          giftMap.set(sid, prev);
        }
      }
    }

    const dynamicList = Array.from(giftMap.values());
    const combined = [...dynamicList];

    for (const d of DEFAULT_CONTRIBUTORS) {
      if (!combined.some((c) => c.id === d.id || c.name === d.name)) {
        combined.push(d);
      }
    }

    return combined.sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [messages]);

  const renderViewerItem = ({ item }) => (
    <View style={styles.viewerItem}>
      <Avatar size={44} name={item.name} uri={item.avatar} />
      <View style={styles.viewerMeta}>
        <Text style={styles.viewerName} numberOfLines={1}>
          {item.name}
          {item.isMe ? ' (나)' : ''}
        </Text>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.genderBadge,
              item.gender === 'female' ? styles.femaleBadge : styles.maleBadge,
            ]}
          >
            <Ionicons
              name={item.gender === 'female' ? 'female' : 'male'}
              size={11}
              color={item.gender === 'female' ? '#EC4899' : '#3B82F6'}
            />
            {Boolean(item.level) && (
              <Text
                style={[
                  styles.genderBadgeText,
                  item.gender === 'female'
                    ? styles.femaleBadgeText
                    : styles.maleBadgeText,
                ]}
              >
                {item.level}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const renderContributorItem = ({ item, index }) => {
    const rank = index + 1;
    return (
      <View style={styles.contributorItem}>
        {/* Rank Number / Medal */}
        <View style={styles.rankCol}>
          {rank === 1 ? (
            <View style={[styles.medalCircle, styles.goldMedal]}>
              <Text style={styles.medalText}>1</Text>
            </View>
          ) : rank === 2 ? (
            <View style={[styles.medalCircle, styles.silverMedal]}>
              <Text style={styles.medalText}>2</Text>
            </View>
          ) : rank === 3 ? (
            <View style={[styles.medalCircle, styles.bronzeMedal]}>
              <Text style={styles.medalText}>3</Text>
            </View>
          ) : (
            <Text style={styles.rankNumberText}>{rank}</Text>
          )}
        </View>

        {/* Contributor Avatar with frame */}
        <View style={[styles.contributorAvatarWrap, rank === 1 && styles.goldAvatarFrame]}>
          <Avatar size={46} name={item.name} uri={item.avatar} />
        </View>

        {/* Contributor Meta */}
        <View style={styles.contributorMeta}>
          <Text style={styles.contributorName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.contributorBadgeRow}>
            {Boolean(item.level) && (
              <View style={styles.diamondLevelPill}>
                <Ionicons name="diamond" size={10} color="#8B5CF6" />
                <Text style={styles.diamondLevelText}>{item.level}</Text>
              </View>
            )}
            {Boolean(item.fanTag) && (
              <View style={styles.fanTagPill}>
                <Text style={styles.fanTagText}>{item.fanTag}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Contributed Coin / Points */}
        <View style={styles.pointsCol}>
          <Text style={styles.pointsText}>{item.points || 0}</Text>
          <View style={styles.coinIconCircle}>
            <Text style={styles.coinIconText}>🪙</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Header Tabs Row */}
              <View style={styles.headerRow}>
                <View style={styles.tabsContainer}>
                  <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'viewers' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('viewers')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.tabButtonText,
                        activeTab === 'viewers' && styles.tabButtonTextActive,
                      ]}
                    >
                      시청자 {viewerCount}
                    </Text>
                    {activeTab === 'viewers' && <View style={styles.tabIndicator} />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'ranking' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('ranking')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.tabButtonText,
                        activeTab === 'ranking' && styles.tabButtonTextActive,
                      ]}
                    >
                      기여도 랭킹
                    </Text>
                    {activeTab === 'ranking' && <View style={styles.tabIndicator} />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'vip' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('vip')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.tabButtonText,
                        activeTab === 'vip' && styles.tabButtonTextActive,
                      ]}
                    >
                      VIP
                    </Text>
                    {activeTab === 'vip' && <View style={styles.tabIndicator} />}
                  </TouchableOpacity>
                </View>

                {/* Close Button */}
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              {/* Tab Content: Viewers */}
              {activeTab === 'viewers' && (
                <FlatList
                  data={mergedViewers}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={renderViewerItem}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                />
              )}

              {/* Tab Content: Contribution Ranking */}
              {activeTab === 'ranking' && (
                <View style={styles.rankingWrap}>
                  {/* Sub Period Tabs */}
                  <View style={styles.subPeriodRow}>
                    {[
                      { key: 'daily', label: '일일' },
                      { key: 'weekly', label: '주간' },
                      { key: 'monthly', label: '월간' },
                      { key: 'fan', label: '팬' },
                      { key: 'total', label: '토탈랭킹' },
                    ].map((p) => (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.periodPill,
                          periodTab === p.key && styles.periodPillActive,
                        ]}
                        onPress={() => setPeriodTab(p.key)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.periodPillText,
                            periodTab === p.key && styles.periodPillTextActive,
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.helpIconBtn} hitSlop={8}>
                      <Ionicons name="help-circle-outline" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  {/* Countdown notice row */}
                  <View style={styles.countdownRow}>
                    <Text style={styles.countdownText}>카운트 다운: 11H 26M</Text>
                    <TouchableOpacity style={styles.dropdownBtn}>
                      <Text style={styles.dropdownBtnText}>오늘</Text>
                      <Ionicons name="caret-down" size={12} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  {/* Contributors List */}
                  <FlatList
                    data={mergedContributors}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderContributorItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                  />

                  {/* Bottom My Rank Footer Bar */}
                  <View style={styles.myRankFooter}>
                    <Text style={styles.myRankIndexText}>50+</Text>
                    <Avatar
                      size={36}
                      name={currentUser?.name || '나'}
                      uri={currentUser?.avatar}
                    />
                    <View style={styles.myRankMeta}>
                      <Text style={styles.myRankIdText} numberOfLines={1}>
                        ID:{currentUser?.id ? String(currentUser.id).slice(0, 10) : '1141582236'}
                      </Text>
                      <View style={styles.myRankCoinRow}>
                        <Text style={styles.coinIconText}>🪙</Text>
                        <Text style={styles.myRankCoinText}>{myContributionPoints}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.joinRankBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        onClose();
                        if (onOpenGiftPicker) onOpenGiftPicker();
                      }}
                    >
                      <Text style={styles.joinRankBtnText}>랭킹 진입함</Text>
                      <Text style={styles.joinRankBtnSub}>🌹x1</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Tab Content: VIP */}
              {activeTab === 'vip' && (
                <View style={styles.vipContainer}>
                  <View style={styles.vipBadgeBig}>
                    <Ionicons name="diamond" size={48} color="#F59E0B" />
                  </View>
                  <Text style={styles.vipTitle}>VIP 서포터 공간</Text>
                  <Text style={styles.vipSubtitle}>
                    호스트에게 특별한 선물을 전달하여 VIP 전용 배지와 독점 혜택을 획득해보세요!
                  </Text>
                  <TouchableOpacity
                    style={styles.vipActionBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      onClose();
                      if (onOpenGiftPicker) onOpenGiftPicker();
                    }}
                  >
                    <Text style={styles.vipActionBtnText}>선물하고 VIP 되기</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SCREEN_HEIGHT * 0.68,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  tabButton: {
    position: 'relative',
    paddingVertical: 6,
  },
  tabButtonActive: {},
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabButtonTextActive: {
    color: '#111827',
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -6,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: '#111827',
    borderRadius: 2,
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
    gap: 14,
  },
  viewerMeta: {
    flex: 1,
    gap: 4,
  },
  viewerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  maleBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  femaleBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
  },
  genderBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  maleBadgeText: {
    color: '#3B82F6',
  },
  femaleBadgeText: {
    color: '#EC4899',
  },
  rankingWrap: {
    flex: 1,
  },
  subPeriodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  periodPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  periodPillActive: {
    backgroundColor: '#E5E7EB',
  },
  periodPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodPillTextActive: {
    color: '#111827',
    fontWeight: '800',
  },
  helpIconBtn: {
    marginLeft: 'auto',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  countdownText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dropdownBtnText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  contributorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  rankCol: {
    width: 32,
    alignItems: 'center',
  },
  rankNumberText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  medalCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldMedal: {
    backgroundColor: '#F59E0B',
  },
  silverMedal: {
    backgroundColor: '#60A5FA',
  },
  bronzeMedal: {
    backgroundColor: '#FB923C',
  },
  medalText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  contributorAvatarWrap: {
    marginHorizontal: 8,
    borderRadius: 24,
    padding: 2,
  },
  goldAvatarFrame: {
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  contributorMeta: {
    flex: 1,
    gap: 4,
  },
  contributorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  contributorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diamondLevelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    gap: 3,
  },
  diamondLevelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  fanTagPill: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  fanTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
  },
  pointsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706',
  },
  coinIconCircle: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinIconText: {
    fontSize: 12,
  },
  myRankFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  myRankIndexText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  myRankMeta: {
    flex: 1,
  },
  myRankIdText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  myRankCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  myRankCoinText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  joinRankBtn: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  joinRankBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  joinRankBtnSub: {
    color: '#E0F2FE',
    fontSize: 10,
    fontWeight: '600',
  },
  vipContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  vipBadgeBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  vipTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  vipSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  vipActionBtn: {
    marginTop: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  vipActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
