import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export default function HeaderLogo({ size = 'medium', style }) {
  const height =
    typeof size === 'number'
      ? size
      : size === 'small'
      ? 20
      : size === 'large'
      ? 40
      : 28;

  return (
    <View style={[styles.wrap, style]}>
      {/* Snack에서 큰 이미지 업로드를 피하기 위해 텍스트 로고로 대체합니다 */}
      <Text
        accessible
        accessibilityRole="header"
        style={{
          fontSize: height * 0.8,
          fontWeight: 'bold',
          color: '#333',
        }}
      >
        딱친
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center' },
});
