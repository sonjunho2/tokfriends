// src/components/UserListItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import Avatar from './Avatar';

export default function UserListItem({
  item,
  onPress,
  onChatPress,
  myInterests = [],
}) {
  const {
    avatar,
    name = '회원',
    age,
    points,
    subtitle,
    lastSeenLabel,
    regionLabel,
    distanceKm,
    online = false,
    interests = [],
  } = item || {};

  const commonInterests = Array.isArray(interests)
    ? interests.filter((int) =>
        Array.isArray(myInterests) &&
        myInterests.some((my) => String(my).trim().toLowerCase() === String(int).trim().toLowerCase())
      )
    : [];

  const placeItems = [];
  if (regionLabel) placeItems.push(regionLabel);
  if (typeof distanceKm === 'number') {
    placeItems.push(distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`);
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <Avatar
          size={56}
          source={avatar ? { uri: avatar } : undefined}
          name={name}
          shape="circle"
          online={online}
        />

        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {name}
              {typeof age === 'number' ? `, ${age}` : ''}
            </Text>

            {commonInterests.length > 0 && (
              <View style={styles.matchBadge}>
                <Ionicons name="sparkles" size={11} color="#B45309" />
                <Text style={styles.matchBadgeText}>취향 일치 {commonInterests.length}</Text>
              </View>
            )}

            {!!points && <Text style={styles.point}>{points.toLocaleString()}P</Text>}
          </View>

          {!!subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}

          <View style={styles.metaRow}>
            {!!lastSeenLabel && (
              <View style={[styles.badgeTime, (lastSeenLabel === '방금' || online) && styles.badgeTimeOnline]}>
                <Text style={[styles.badgeTimeText, (lastSeenLabel === '방금' || online) && styles.badgeTimeTextOnline]}>
                  {lastSeenLabel === '방금' || online ? '🟢 접속 중' : lastSeenLabel}
                </Text>
              </View>
            )}

            {placeItems.length > 0 && (
              <View style={styles.metaPlace}>
                <Ionicons name="location-sharp" size={12} color="#6B7280" />
                <Text style={styles.metaText}>{placeItems.join(' · ')}</Text>
              </View>
            )}
          </View>
        </View>

        {onChatPress && (
          <TouchableOpacity
            style={styles.chatActionBtn}
            onPress={(e) => {
              e?.stopPropagation?.();
              onChatPress(item);
            }}
            hitSlop={6}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses" size={13} color="#191919" />
            <Text style={styles.chatActionBtnText}>대화</Text>
          </TouchableOpacity>
        )}
      </View>

      {Array.isArray(interests) && interests.length > 0 && (
        <View style={styles.chipsRow}>
          {interests.slice(0, 4).map((interest, idx) => {
            const isMatched = commonInterests.includes(interest);
            return (
              <View
                key={idx}
                style={[styles.interestChip, isMatched && styles.interestChipMatched]}
              >
                <Text
                  style={[
                    styles.interestChipText,
                    isMatched && styles.interestChipTextMatched,
                  ]}
                >
                  #{interest}
                </Text>
              </View>
            );
          })}
          {interests.length > 4 && (
            <Text style={styles.moreChipsText}>+{interests.length - 4}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  matchBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  point: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 'auto',
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#4B5563',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  badgeTime: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  badgeTimeOnline: {
    backgroundColor: '#ECFDF5',
  },
  badgeTimeText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  badgeTimeTextOnline: {
    color: '#059669',
    fontWeight: '700',
  },
  metaPlace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE500',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  chatActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191919',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  interestChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  interestChipMatched: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  interestChipText: {
    fontSize: 11.5,
    color: '#4B5563',
  },
  interestChipTextMatched: {
    color: '#854D0E',
    fontWeight: '700',
  },
  moreChipsText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 2,
  },
});
