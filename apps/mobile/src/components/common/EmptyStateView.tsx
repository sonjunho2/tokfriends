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
  | 'feed'
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
    description: '첫 인사를 건네고 새로운 이웃과의 대화를 시작해보세요.',
    ctaLabel: '추천 이웃 둘러보기',
  },
  friends: {
    icon: 'people-outline',
    title: '아직 등록된 친구가 없습니다',
    description: '마음에 드는 프로필에 친구 신청을 보내보세요.',
    ctaLabel: '새로운 친구 찾기',
  },
  live: {
    icon: 'radio-outline',
    title: '진행 중인 라이브 방송이 없습니다',
    description: '지금 바로 첫 라이브 방송을 시작해보세요.',
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
    title: '관심 등록된 내역이 없습니다',
    description: '관심 있는 상품이나 친구를 찜해두고 빠르게 확인해보세요.',
    ctaLabel: '마켓 둘러보기',
  },
  feed: {
    icon: 'chatbubble-ellipses-outline',
    title: '우리 동네의 첫 번째 소식을 전해보세요',
    description: '이웃들과 나누고 싶은 소소한 일상이나 궁금한 점을 남겨보세요.',
    ctaLabel: '첫 동네 이야기 쓰기',
  },
  default: {
    icon: 'document-text-outline',
    title: '표시할 내용이 없습니다',
    description: '새로운 소식과 업데이트를 기대해 주세요.',
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
        <Ionicons name={displayIcon} size={36} color={tokens.colors.primary} />
      </View>

      {/* 유도 문구 텍스트 */}
      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={styles.description}>{displayDescription}</Text>

      {/* CTA 액션 버튼 */}
      {displayCta && onCtaPress && (
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={onCtaPress}
        >
          <Text style={styles.ctaText}>{displayCta}</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* 보조 액션 (새로고침 등) */}
      {secondaryLabel && onSecondaryPress && (
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onSecondaryPress}
          hitSlop={8}
          activeOpacity={0.7}
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
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: 48,
  },
  iconCircleOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: tokens.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    color: tokens.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
    marginBottom: tokens.spacing.xl,
    letterSpacing: -0.1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.button,
    minHeight: 46,
    paddingHorizontal: tokens.spacing.xl,
    gap: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    marginTop: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
  },
  secondaryText: {
    fontSize: 12,
    fontWeight: '500',
    color: tokens.colors.textTertiary,
    textDecorationLine: 'underline',
  },
});
