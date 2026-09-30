// src/components/ChatListItem.js
import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import Avatar from './Avatar';
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

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();

    if (isYesterday) {
      return '어제';
    }

    const isThisYear = date.getFullYear() === now.getFullYear();
    if (isThisYear) {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}월 ${day}일`;
    }

    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
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
        return `🎁 선물: ${parsed.name || '선물'} (${parsed.amount ?? 0}P)`;
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
  const avatarUri = item.avatar || item.counterpart?.avatar || item.counterpartAvatar;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.container}
    >
      <View style={styles.avatarWrap}>
        <Avatar
          name={item.title}
          uri={avatarUri}
          size={52}
          shape="circle"
        />
      </View>

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
          <Text numberOfLines={2} style={styles.lastMessage}>
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
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
    fontWeight: '700',
    color: '#191919',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.3,
  },
  timeText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 13,
    color: '#71717A',
    lineHeight: 18,
    flex: 1,
    marginRight: 10,
    letterSpacing: -0.2,
  },
  badge: {
    backgroundColor: '#F04438',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
