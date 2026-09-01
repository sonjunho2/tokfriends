// src/screens/auth/WelcomeScreen.js
import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <Text style={styles.title}>MJ톡에 오신 걸 환영해요!</Text>
      <Text style={styles.sub}>새로운 친구, 지금 바로 시작해볼까요?</Text>

      <TouchableOpacity
        style={[styles.btn, styles.primary]}
        onPress={() => navigation.navigate('PhoneEntry')}
      >
        <Text style={styles.primaryTxt}>시작하기</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, justifyContent:'center', alignItems:'center', padding:24, backgroundColor:colors.background },
  title:{ fontSize:28, fontWeight:'800', color:colors.text, textAlign:'center' },
  sub:{ marginTop:8, fontSize:14, color:colors.textSecondary, textAlign:'center' },
  btn:{ width:'100%', height:56, borderRadius:16, justifyContent:'center', alignItems:'center', marginTop:16 },
  primary:{ backgroundColor:colors.primary },
  primaryTxt:{ color:'#fff', fontWeight:'800', fontSize:18 },
});
