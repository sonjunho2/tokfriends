// src/components/ChatListItem.js
import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

export default function ChatListItem({ item, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.row}>
      <Text numberOfLines={1} style={styles.title}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
});
