import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../../theme/tokens';

export type EmptyStatePreset =
  | 'chats'
  | 'friends'
  | 'live'
  | 'notifications'
  | 'search'
  | 'favorites'
  | 'default';

export interface EmptyStateViewProps {
  preset?: EmptyStatePreset;
  iconName?: keyof typeof Ionicons.glyphMap;
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  style?: ViewStyle;
}

const PRESET_CONFIGS: Record<
  EmptyStatePreset,
  {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    ctaLabel?: string;
  }
> = {
  chats: {
    icon: 'chatbubbles-outline',
    title: '아직 대화 내역이 없습니다',
    description: '설레는 첫 인사를 건네고 소중한 인연을 시작해보세요 ✨',
    ctaLabel: '추천 인연 둘러보기',
  },
  friends: {
    icon: 'people-outline',
    title: '아직 등록된 친구가 없습니다',
    description: '마음에 드는 프로필에 친구 신청을 보내보세요!',
    ctaLabel: '새로운 친구 찾기',
  },
  live: {
    icon: 'radio-outline',
    title: '진행 중인 라이브 방송이 없습니다',
    description: '지금 바로 첫 방송의 주인공이 되어보세요 🎙️',
    ctaLabel: '라이브 방송 시작하기',
  },
  notifications: {
    icon: 'notifications-outline',
    title: '새로운 알림이 없습니다',
    description: '활동 소식이나 이벤트 알림이 오면 바로 알려드릴게요.',
  },
  search: {
    icon: 'search-outline',
    title: '검색 결과가 없습니다',
    description: '단어의 철자를 확인하거나 다른 검색어로 찾아보세요.',
    ctaLabel: '검색어 초기화',
  },
  favorites: {
    icon: 'heart-outline',
    title: '찜한 친구가 없습니다',
    description: '관심 있는 친구를 찜해두고 빠르게 소식을 받아보세요.',
    ctaLabel: '인연 탐색하기',
  },
  default: {
    icon: 'sparkles-outline',
    title: '표시할 내용이 없습니다',
    description: '새로운 소식과 업데이트를 기대해 주세요!',
  },
};

export default function EmptyStateView({
  preset = 'default',
  iconName,
  title,
  description,
  ctaLabel,
  onCtaPress,
  secondaryLabel,
  onSecondaryPress,
  style,
}: EmptyStateViewProps) {
  const config = PRESET_CONFIGS[preset] || PRESET_CONFIGS.default;

  const displayIcon = iconName || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayCta = ctaLabel !== undefined ? ctaLabel : config.ctaLabel;

  return (
    <View style={[styles.container, style]}>
      {/* 일러스트 서클 그래픽 */}
      <View style={styles.iconCircleOuter}>
        <LinearGradient
          colors={['#FFEBF0', '#F3E8FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircleInner}
        >
          <Ionicons name={displayIcon} size={42} color={tokens.colors.primary} />
        </LinearGradient>
      </View>

      {/* 유도 문구 텍스트 */}
      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={styles.description}>{displayDescription}</Text>

      {/* CTA 액션 버튼 */}
      {displayCta && onCtaPress && (
        <TouchableOpacity
          style={styles.ctaButtonWrapper}
          activeOpacity={0.88}
          onPress={onCtaPress}
        >
          <LinearGradient
            colors={tokens.colors.gradients.primaryPurple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>{displayCta}</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* 보조 액션 (새로고침 등) */}
      {secondaryLabel && onSecondaryPress && (
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onSecondaryPress}
          hitSlop={8}
        >
          <Text style={styles.secondaryText}>{secondaryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  iconCircleOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: tokens.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...tokens.shadows.soft,
  },
  iconCircleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...tokens.typography.h3,
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    ...tokens.typography.body2,
    color: tokens.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 24,
  },
  ctaButtonWrapper: {
    borderRadius: tokens.radius.card,
    overflow: 'hidden',
    ...tokens.shadows.card,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 24,
    gap: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    marginTop: 14,
    paddingVertical: 6,
  },
  secondaryText: {
    ...tokens.typography.caption,
    color: tokens.colors.textTertiary,
    textDecorationLine: 'underline',
  },
});
