// src/components/UserListItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
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

  const isOnline = lastSeenLabel === '방금' || online;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <Avatar
          size={52}
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
              <View style={[styles.badgeTime, isOnline && styles.badgeTimeOnline]}>
                {isOnline && <View style={styles.onlineDot} />}
                <Text style={[styles.badgeTimeText, isOnline && styles.badgeTimeTextOnline]}>
                  {isOnline ? '접속 중' : lastSeenLabel}
                </Text>
              </View>
            )}

            {placeItems.length > 0 && (
              <View style={styles.metaPlace}>
                <Ionicons name="location-sharp" size={12} color={tokens.colors.textTertiary} />
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
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses" size={13} color={tokens.colors.primary} />
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
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.base,
    marginBottom: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
    ...tokens.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    marginLeft: tokens.spacing.md,
    marginRight: tokens.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radius.xs,
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
    color: tokens.colors.primary,
    marginLeft: 'auto',
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: tokens.colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  badgeTime: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radius.xs,
    backgroundColor: tokens.colors.surfaceSecondary,
    gap: 4,
  },
  badgeTimeOnline: {
    backgroundColor: '#ECFDF5',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.success,
  },
  badgeTimeText: {
    fontSize: 11,
    color: tokens.colors.textSecondary,
    fontWeight: '500',
  },
  badgeTimeTextOnline: {
    color: tokens.colors.success,
    fontWeight: '700',
  },
  metaPlace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: tokens.colors.textTertiary,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    gap: 3,
    borderWidth: 1,
    borderColor: tokens.colors.primaryMuted,
  },
  chatActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.borderLight,
  },
  interestChip: {
    backgroundColor: tokens.colors.surfaceSecondary,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: tokens.radius.xs,
  },
  interestChipMatched: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  interestChipText: {
    fontSize: 11.5,
    color: tokens.colors.textSecondary,
  },
  interestChipTextMatched: {
    color: '#854D0E',
    fontWeight: '700',
  },
  moreChipsText: {
    fontSize: 11,
    color: tokens.colors.textTertiary,
    marginLeft: 2,
  },
});
