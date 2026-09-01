// src/components/Avatar.js
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

/**
 * shape: 'rounded' | 'circle'
 *   - 기본은 'rounded' (이미지처럼 라운드 사각형, radius=12)
 */
export default function Avatar({
  source,
  name,
  size = 56,
  shape = 'rounded',
  online = false,
  showBorder = false,
  style,
}) {
  const radius = shape === 'circle' ? size / 2 : 12;
  const dotSize = Math.max(10, Math.round(size * 0.24));
  const fontSize = Math.round(size * 0.36);

  const getInitials = (n) => {
    if (!n) return '?';
    const parts = String(n).trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.substring(0, 2).toUpperCase();
  };

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.box,
          { width: size, height: size, borderRadius: radius },
          showBorder && styles.border,
        ]}
      >
        {source ? (
          <Image
            source={source}
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
              right: 2,
              bottom: 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundSecondary },
  border: { borderWidth: 1, borderColor: colors.border },
  img: { resizeMode: 'cover' },
  ph: { backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  initials: { color: '#fff', fontWeight: '700' },
  dot: { position: 'absolute', backgroundColor: colors.success, borderWidth: 2, borderColor: '#fff' },
});
