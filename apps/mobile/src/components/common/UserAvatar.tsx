import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageSourcePropType,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
export type AvatarStatus = 'online' | 'live' | 'busy' | 'offline';

export interface UserAvatarProps {
  source?: ImageSourcePropType;
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  isOnline?: boolean;
  isLive?: boolean;
  showBorder?: boolean;
  borderColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const SIZE_MAP: Record<string, number> = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 88,
};

export default function UserAvatar({
  source,
  uri,
  name = '',
  size = 'md',
  status,
  isOnline,
  isLive,
  showBorder = false,
  borderColor,
  onPress,
  style,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const dimension = typeof size === 'number' ? size : SIZE_MAP[size] || 48;
  const radius = dimension / 2;
  const dotSize = Math.max(9, Math.round(dimension * 0.26));
  const fontSize = Math.round(dimension * 0.36);

  // 상태 판별 (라이브 > 온라인 > 명시적 status)
  const currentStatus: AvatarStatus | null = isLive
    ? 'live'
    : isOnline
    ? 'online'
    : status || null;

  const getInitials = (n?: string) => {
    if (!n) return '다';
    const clean = n.trim();
    if (clean.length === 0) return '다';
    return clean.slice(0, 2);
  };

  const imageSource = uri
    ? {
        uri,
        // 저용량 및 캐시 최적화 헤더 설정
        cache: 'force-cache' as const,
      }
    : source;

  const content = (
    <View style={[{ width: dimension, height: dimension }, style]}>
      {/* 아바타 메인 래퍼 */}
      <View
        style={[
          styles.imageContainer,
          {
            width: dimension,
            height: dimension,
            borderRadius: radius,
            borderColor: borderColor || (showBorder ? tokens.colors.primary : 'transparent'),
            borderWidth: showBorder ? 2 : 0,
          },
        ]}
      >
        {imageSource && !imageError ? (
          <Image
            source={imageSource}
            style={[styles.image, { width: dimension, height: dimension, borderRadius: radius }]}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.placeholder, { width: dimension, height: dimension, borderRadius: radius }]}>
            {name ? (
              <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
            ) : (
              <Ionicons name="person" size={dimension * 0.45} color={tokens.colors.textTertiary} />
            )}
          </View>
        )}
      </View>

      {/* 🔴 라이브 뱃지 (중형 이상은 태그, 소형은 닷) */}
      {currentStatus === 'live' && (
        dimension >= 56 ? (
          <View style={styles.liveTagContainer}>
            <Text style={styles.liveTagText}>LIVE</Text>
          </View>
        ) : (
          <View
            style={[
              styles.statusDot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: tokens.colors.status.live,
              },
            ]}
          />
        )
      )}

      {/* 🟢 온라인 뱃지 */}
      {currentStatus === 'online' && (
        <View
          style={[
            styles.statusDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: tokens.colors.status.online,
            },
          ]}
        />
      )}

      {/* 🟡 자리비움 / 통화중 */}
      {currentStatus === 'busy' && (
        <View
          style={[
            styles.statusDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: tokens.colors.status.busy,
            },
          ]}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.82}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  imageContainer: {
    backgroundColor: tokens.colors.surfaceSecondary,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: tokens.colors.surfaceSecondary,
  },
  placeholder: {
    backgroundColor: tokens.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: tokens.colors.textSecondary,
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: tokens.colors.surface,
  },
  liveTagContainer: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: tokens.colors.status.live,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: tokens.radius.full,
    borderWidth: 1.5,
    borderColor: tokens.colors.surface,
    ...tokens.shadows.soft,
  },
  liveTagText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
