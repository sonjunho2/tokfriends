// src/components/ChatListItem.js
import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import colors from '../theme/colors';

const formatTime = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    if (isToday) {
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? '오후' : '오전';
      hours = hours % 12 || 12;
      return `${ampm} ${hours}:${minutes}`;
    }

    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
  } catch {
    return '';
  }
};

const formatLastMessage = (content) => {
  if (!content) return '대화가 시작되었습니다.';
  if (typeof content === 'string') {
    if (
      content.startsWith('{"id"') ||
      content.startsWith('{"name"') ||
      content.includes('"amount":')
    ) {
      try {
        const parsed = JSON.parse(content);
        return `🎁 ${parsed.name || '선물'} (${parsed.amount ?? 0}P)`;
      } catch {
        return '🎁 선물을 보냈습니다.';
      }
    }
    if (content.startsWith('http') || content.startsWith('data:')) {
      if (content.includes('.mp4') || content.includes('.mov')) return '🎥 동영상';
      return '📷 사진';
    }
  }
  return content;
};

export default function ChatListItem({ item, onPress }) {
  const timeText = formatTime(item.lastMessageAt);
  const unreadCount = Number(item.unreadCount) || 0;
  const lastMessageText = formatLastMessage(item.lastMessage);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.row}>
      <View style={styles.contentWrap}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.title}>
            {item.title}
          </Text>
          {Boolean(timeText) && (
            <Text style={styles.timeText}>{timeText}</Text>
          )}
        </View>

        <View style={styles.bottomRow}>
          <Text numberOfLines={1} style={styles.lastMessage}>
            {lastMessageText}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: colors.textMuted || '#8A92A6',
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary || '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
