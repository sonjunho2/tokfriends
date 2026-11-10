// apps/mobile/src/screens/auth/PermissionGuideScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

const PERMISSIONS = [
  {
    key: 'camera',
    title: '카메라 (선택)',
    desc: '실시간 라이브 방송 영상 송출, 프로필 사진 촬영, 중고 마켓 상품 사진 촬영',
    icon: 'camera',
    iconColor: '#FF3B6B',
    bgColor: '#FFF0F5',
  },
  {
    key: 'photos',
    title: '사진 / 앨범 / 저장공간 (선택)',
    desc: '프로필 사진 변경, 마켓 상품 사진 첨부, 1:1 대화방 및 라이브 사진 전송',
    icon: 'images',
    iconColor: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    key: 'mic',
    title: '마이크 / 음성 (선택)',
    desc: '실시간 라이브 방송 음성 송출, 1:1 보이스 및 영상 대화 소통',
    icon: 'mic',
    iconColor: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  {
    key: 'notification',
    title: '알림 (선택)',
    desc: '관심 스트리머 실시간 라이브 시작 알림, 1:1 채팅 메시지 및 3D 선물 수신 알림',
    icon: 'notifications',
    iconColor: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  {
    key: 'location',
    title: '위치 정보 (선택)',
    desc: '우리 동네 기반 실시간 라이브 방송 탐색 및 안심 중고 직거래 마켓 추천',
    icon: 'location',
    iconColor: '#10B981',
    bgColor: '#ECFDF5',
  },
];

export default function PermissionGuideScreen({ navigation }) {
  const [cameraPerm, requestCameraPermission] = useCameraPermissions();
  const [micPerm, requestMicrophonePermission] = useMicrophonePermissions();
  const [requesting, setRequesting] = useState(false);

  const handleConfirm = async () => {
    setRequesting(true);
    try {
      // 1. 카메라 권한 사전 요청
      if (requestCameraPermission) {
        await requestCameraPermission().catch(() => {});
      }
      // 2. 마이크 권한 사전 요청
      if (requestMicrophonePermission) {
        await requestMicrophonePermission().catch(() => {});
      }
      // 3. 미디어 앨범 권한 사전 요청
      if (ImagePicker?.requestMediaLibraryPermissionsAsync) {
        await ImagePicker.requestMediaLibraryPermissionsAsync().catch(() => {});
      }
    } catch (e) {
      console.warn('Permission request error during guide:', e);
    } finally {
      try {
        await AsyncStorage.setItem('@mocco_permission_guided', 'true');
        await AsyncStorage.setItem('@mocco_onboarded', 'true');
      } catch {}
      setRequesting(false);
      if (navigation?.replace) {
        navigation.replace('Login');
      } else if (navigation?.navigate) {
        navigation.navigate('Login');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 상단 헤더 영역 */}
      <View style={styles.header}>
        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>MOCCO APP PERMISSION</Text>
        </View>
        <Text style={styles.title}>
          모꼬 서비스 이용을 위해{'\n'}
          <Text style={styles.titleHighlight}>앱 접근 권한</Text>을 확인해 주세요
        </Text>
        <Text style={styles.subtitle}>
          정보통신망법 제22조의2(접근권한에 대한 동의) 규정에 따라{'\n'}
          모꼬 서비스 이용 시 필요한 접근 권한을 미리 안내해 드립니다.
        </Text>
      </View>

      {/* 권한 목록 리스트 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>선택 접근 권한 안내</Text>
          <Text style={styles.sectionBadge}>선택 가능</Text>
        </View>

        {PERMISSIONS.map((p) => (
          <View key={p.key} style={styles.permCard}>
            <View style={[styles.iconWrap, { backgroundColor: p.bgColor }]}>
              <Ionicons name={p.icon} size={22} color={p.iconColor} />
            </View>
            <View style={styles.permTextWrap}>
              <Text style={styles.permTitle}>{p.title}</Text>
              <Text style={styles.permDesc}>{p.desc}</Text>
            </View>
          </View>
        ))}

        {/* 법정 고지 안내 박스 */}
        <View style={styles.noticeBox}>
          <Ionicons name="information-circle-outline" size={16} color="#64748B" style={{ marginTop: 2 }} />
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={styles.noticeText}>
              • 선택 접근 권한은 해당 기능을 사용하실 때 허용이 필요하며, 허용하지 않아도 기본 서비스를 이용하실 수 있습니다.
            </Text>
            <Text style={[styles.noticeText, { marginTop: 4 }]}>
              • 접근 권한은 기기의 [설정 &gt; 애플리케이션 &gt; 모꼬 &gt; 권한] 메뉴에서 언제든지 직접 변경하실 수 있습니다.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 하단 확인 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          disabled={requesting}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#FF5A36', '#FF3B6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmBtnGradient}
          >
            <Text style={styles.confirmBtnText}>
              {requesting ? '권한 확인 중...' : '확인 및 권한 허용하고 시작하기'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  badgeWrap: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF3B6B',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 30,
  },
  titleHighlight: {
    color: '#FF3B6B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  permCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  permTextWrap: {
    flex: 1,
  },
  permTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  permDesc: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  noticeText: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  confirmBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmBtnGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
