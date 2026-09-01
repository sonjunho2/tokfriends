// src/components/UserListItem.js
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

export default function UserListItem({ item, onPress }) {
  const {
    avatar = 'https://i.pravatar.cc/128',
    name = '닉네임',
    age = 25,
    points = 0,
    subtitle = '소개 문구가 들어갑니다',
    lastSeenLabel = '1일',
    regionLabel = '서울',
    distanceKm = 10,
  } = item || {};
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: avatar }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {name}, {age}
          </Text>
          {!!points && <Text style={styles.point}>{points}P</Text>}
        </View>
        <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.badgeTime}>{lastSeenLabel}</Text>
          <View style={styles.metaPlace}>
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{regionLabel} · {distanceKm}km</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row:{ flexDirection:'row', paddingVertical:14, paddingRight:16, gap:12, borderBottomWidth:1, borderBottomColor:colors.border },
  avatar:{ width:72, height:72, borderRadius:16, backgroundColor:'#eee' },
  titleRow:{ flexDirection:'row', alignItems:'center', gap:8 },
  title:{ fontSize:18, fontWeight:'700', color:colors.text },
  point:{ fontSize:14, fontWeight:'700', color:colors.primary },
  subtitle:{ marginTop:4, fontSize:14, color:colors.textSecondary },
  metaRow:{ flexDirection:'row', alignItems:'center', marginTop:8, gap:10 },
  badgeTime:{ paddingHorizontal:10, paddingVertical:4, borderRadius:8, backgroundColor:'#FFE4EC', color:colors.primary, fontWeight:'800', fontSize:12 },
  metaPlace:{ flexDirection:'row', alignItems:'center', gap:4 },
  metaText:{ fontSize:12, color:colors.textSecondary },
});
