// src/components/UserListItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import Avatar from './Avatar';

export default function UserListItem({ item, onPress }) {
  const {
    avatar,
    name = '회원',
    age,
    points,
    subtitle,
    lastSeenLabel,
    regionLabel,
    distanceKm,
    online = false,
  } = item || {};

  const placeItems = [];
  if (regionLabel) placeItems.push(regionLabel);
  if (typeof distanceKm === 'number') placeItems.push(`${distanceKm}km`);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <Avatar
        size={72}
        source={avatar ? { uri: avatar } : undefined}
        name={name}
        shape="rounded"
        online={online}
      />

      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {name}
            {typeof age === 'number' ? `, ${age}` : ''}
          </Text>

          {!!points && <Text style={styles.point}>{points}P</Text>}
        </View>

        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}

        {(lastSeenLabel || placeItems.length > 0) && (
          <View style={styles.metaRow}>
            {!!lastSeenLabel && (
              <Text style={styles.badgeTime}>{lastSeenLabel}</Text>
            )}

            {placeItems.length > 0 && (
              <View style={styles.metaPlace}>
                <Ionicons
                  name="location"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>{placeItems.join(' · ')}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingRight: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  point: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  badgeTime: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FFE4EC',
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  metaPlace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
