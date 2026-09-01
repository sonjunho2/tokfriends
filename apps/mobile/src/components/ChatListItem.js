// src/components/ChatListItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import Avatar from './Avatar';

export default function ChatListItem({ item, onPress }) {
const isUnread = item.unread > 0;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.row}>
      <Avatar name={item.name} size={60} shape="rounded" style={styles.avatar} />
      
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>
            {item.name}, {item.age}
          </Text>
          {!!item.points && (
            <View style={styles.pointBadge}>
              <Text style={styles.pointBadgeTxt}>{item.points}P</Text>
            </View>
          )}
          {item.favorite && (
            <Ionicons name="star" size={16} color="#F9C23C" />
          )}
        </View>

        <View style={styles.messageRow}>
          <Text
            numberOfLines={1}
            style={[styles.preview, isUnread && styles.previewUnread]}
          >
            {item.snippet}
          </Text>
          {isUnread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadTxt}>{item.unread}</Text>
            </View>
          ) : (
            <Text style={styles.readTxt}>읽음</Text>
          )}
        </View>

        <View style={styles.metaRow}>
          {!!item.timeLabel && <Text style={styles.metaText}>{item.timeLabel}</Text>}
          <Text style={styles.metaSeparator}>·</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {item.regionLabel} · {item.distanceKm}km
            </Text>
          </View>
         </View> 
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    marginLeft: 2,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  pointBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  pointBadgeTxt: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
      messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preview: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  previewUnread: {
    fontWeight: '700',
    color: colors.text,
  },
  unreadBadge: {
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadTxt: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '800',
  },
  readTxt: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  metaSeparator: {
    color: colors.textTertiary,
    fontSize: 12,
    marginHorizontal: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
