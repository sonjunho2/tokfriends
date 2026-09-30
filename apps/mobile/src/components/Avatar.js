// src/components/Avatar.js
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

/**
 * shape: 'rounded' | 'circle'
 *   - 기본은 'rounded' (모던 스쿼클 라운드, radius = size * 0.28)
 */
export default function Avatar({
  source,
  uri,
  name,
  size = 56,
  shape = 'rounded',
  online = false,
  showBorder = false,
  style,
}) {
  const radius = shape === 'circle' ? size / 2 : Math.round(size * 0.28);
  const dotSize = Math.max(10, Math.round(size * 0.24));
  const fontSize = Math.round(size * 0.36);

  const getInitials = (n) => {
    if (!n) return '다';
    const parts = String(n).trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.substring(0, 2);
  };

  const imageSource = source || (uri ? { uri } : null);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.box,
          { width: size, height: size, borderRadius: radius },
          showBorder && styles.border,
        ]}
      >
        {imageSource ? (
          <Image
            source={imageSource}
            style={[styles.img, { width: size, height: size, borderRadius: radius }]}
          />
        ) : (
          <View style={[styles.ph, { width: size, height: size, borderRadius: radius }]}>
            <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
          </View>
        )}
      </View>

      {online && (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              right: 1,
              bottom: 1,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F4F6',
    overflow: 'hidden',
  },
  border: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  img: {
    resizeMode: 'cover',
  },
  ph: {
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.primary,
    fontWeight: '800',
  },
  dot: {
    position: 'absolute',
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
