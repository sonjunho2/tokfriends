import React from 'react';
import { View, Text, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useAuthStoreSync } from '../store/auth';
// ===== 메인 =====
import HomeScreen from '../screens/main/HomeScreen';
import LiveScreen from '../screens/main/LiveScreen';
import ChatsScreen from '../screens/main/ChatsScreen';
import MyPageScreen from '../screens/main/MyPageScreen';
import SettingsScreen from '../screens/my/SettingsScreen';
import ProfileEditScreen from '../screens/my/ProfileEditScreen';
import BlockedUsersScreen from '../screens/my/BlockedUsersScreen';
import FriendsScreen from '../screens/my/FriendsScreen';
import VisitorsScreen from '../screens/my/VisitorsScreen';
import FollowsScreen from '../screens/my/FollowsScreen';
import CommunityFeedScreen from '../screens/community/CommunityFeedScreen';
import PostDetailScreen from '../screens/community/PostDetailScreen';
import SettlementScreen from '../screens/my/SettlementScreen';

// ===== 서브 =====
import ChatRoomScreen from '../screens/main/ChatRoomScreen';
import ProfileDetailScreen from '../screens/main/ProfileDetailScreen';
import LiveRoomScreen from '../screens/live/LiveRoomScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokens } from '../theme/tokens';

// ===== 인증 =====
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import PhoneEntryScreen from '../screens/auth/PhoneEntryScreen';
import PhoneVerificationScreen from '../screens/auth/PhoneVerificationScreen';
import AgreementScreen from '../screens/auth/AgreementScreen';
import ProfileRegistrationScreen from '../screens/auth/ProfileRegistrationScreen';

const AuthStack = createNativeStackNavigator();
const HomeStackNav = createNativeStackNavigator();
const CommunityStackNav = createNativeStackNavigator();
const LiveStackNav = createNativeStackNavigator();
const ChatsStackNav = createNativeStackNavigator();
const MyPageStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** ===== 인증 플로우 ===== */
function AuthFlow({ initialRoute = 'Onboarding' }) {
  return (
    <AuthStack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <AuthStack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
      <AuthStack.Screen name="Agreement" component={AgreementScreen} />
      <AuthStack.Screen name="ProfileRegistration" component={ProfileRegistrationScreen} />
    </AuthStack.Navigator>
  );
}

/** ===== 홈 탭 안의 스택 =====
 * 홈 → 탐색 → HOT추천 → 채팅방/프로필 로 이어지는 전환을 한 스택에서 처리
 */
function HomeStack() {
  return (
    <HomeStackNav.Navigator
      initialRouteName="HomeMain"
      screenOptions={{ headerShown: false }}
    >
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen
        name="ProfileDetail"
        component={ProfileDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <HomeStackNav.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <HomeStackNav.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <HomeStackNav.Screen
        name="CommunityFeed"
        component={CommunityFeedScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <HomeStackNav.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <HomeStackNav.Screen
        name="Settlement"
        component={SettlementScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <HomeStackNav.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <HomeStackNav.Screen
        name="Visitors"
        component={VisitorsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <HomeStackNav.Screen
        name="Follows"
        component={FollowsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <HomeStackNav.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </HomeStackNav.Navigator>
  );
}

/** ===== 커뮤니티 탭 안의 스택 ===== */
function CommunityStack() {
  return (
    <CommunityStackNav.Navigator
      initialRouteName="CommunityMain"
      screenOptions={{ headerShown: false }}
    >
      <CommunityStackNav.Screen name="CommunityMain" component={CommunityFeedScreen} />
      <CommunityStackNav.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <CommunityStackNav.Screen
        name="ProfileDetail"
        component={ProfileDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <CommunityStackNav.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </CommunityStackNav.Navigator>
  );
}

/** ===== 라이브 탭 안의 스택 ===== */
function LiveStack() {
  return (
    <LiveStackNav.Navigator
      initialRouteName="LiveMain"
      screenOptions={{ headerShown: false }}
    >
      <LiveStackNav.Screen name="LiveMain" component={LiveScreen} />
    </LiveStackNav.Navigator>
  );
}

/** ===== 대화 탭 안의 스택 ===== */
function ChatsStack() {
  return (
    <ChatsStackNav.Navigator
      initialRouteName="ChatsMain"
      screenOptions={{ headerShown: false }}
    >
      <ChatsStackNav.Screen name="ChatsMain" component={ChatsScreen} />
      <ChatsStackNav.Screen
        name="ProfileDetail"
        component={ProfileDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <ChatsStackNav.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <ChatsStackNav.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <ChatsStackNav.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </ChatsStackNav.Navigator>
  );
}

/** ===== 마이페이지 스택 ===== */
function MyPageStack() {
  return (
    <MyPageStackNav.Navigator screenOptions={{ headerShown: false }}>
      <MyPageStackNav.Screen name="MyPageMain" component={MyPageScreen} />
      <MyPageStackNav.Screen
        name="ProfileDetail"
        component={ProfileDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MyPageStackNav.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MyPageStackNav.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MyPageStackNav.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MyPageStackNav.Screen
        name="CommunityFeed"
        component={CommunityFeedScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MyPageStackNav.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MyPageStackNav.Screen
        name="Settlement"
        component={SettlementScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MyPageStackNav.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MyPageStackNav.Screen
        name="Visitors"
        component={VisitorsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MyPageStackNav.Screen
        name="Follows"
        component={FollowsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MyPageStackNav.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </MyPageStackNav.Navigator>
  );
}

import TabNavigator from './TabNavigator';

/** ===== 로그인 후 메인 앱 플로우 (라이브 룸 풀화면 분리) ===== */
const AppStackNav = createNativeStackNavigator();

function AppFlow() {
  return (
    <AppStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AppStackNav.Screen name="MainTabs" component={TabNavigator} />
      <AppStackNav.Screen
        name="LiveRoom"
        component={LiveRoomScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'fullScreenModal',
        }}
      />
    </AppStackNav.Navigator>
  );
}

/** ===== 루트 ===== */
export default function RootNavigator() {
  const { user, token, initializing, isOffline } = useAuth();
  useAuthStoreSync();

  const [checkingOnboarding, setCheckingOnboarding] = React.useState(true);
  const [isOnboarded, setIsOnboarded] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    async function checkOnboarding() {
      try {
        const flag = await AsyncStorage.getItem('@dagaon_onboarded');
        if (isMounted) {
          setIsOnboarded(flag === 'true');
        }
      } catch (err) {
        console.warn('[RootNavigator] check onboarding error:', err);
      } finally {
        if (isMounted) {
          setCheckingOnboarding(false);
        }
      }
    }
    checkOnboarding();
    return () => {
      isMounted = false;
    };
  }, []);

  // 초기화 중이거나 온보딩 상태 검사 중: 깔끔한 tokens.colors.background(#F8FAFC) + #FF3B6B 스피너 렌더링
  if (initializing || checkingOnboarding) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashBrandBox}>
          <View style={styles.splashIconCircle}>
            <Ionicons name="sparkles" size={32} color={tokens.colors.primary} />
          </View>
          <Text style={styles.splashTitle}>다가온</Text>
          <Text style={styles.splashSubtitle}>새로운 인연이 다가옵니다</Text>
        </View>
        <ActivityIndicator size="large" color={tokens.colors.primary} style={styles.splashSpinner} />
      </View>
    );
  }

  const tokenExists = Boolean(token);
  const userHasIdentifier = Boolean(user) && Boolean(user.id || user._id);
  const isSignedIn = tokenExists || userHasIdentifier;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      {isOffline && (
        <View style={styles.offlineNoticeBar}>
          <Ionicons name="cloud-offline" size={13} color="#92400E" />
          <Text style={styles.offlineNoticeText}>
            서버 연결 확인 중입니다. 캐시된 프로필로 작동 중입니다.
          </Text>
        </View>
      )}
      {isSignedIn ? (
        <AppFlow />
      ) : (
        <AuthFlow initialRoute={isOnboarded ? 'Login' : 'Onboarding'} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  splashBrandBox: {
    alignItems: 'center',
  },
  splashIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE4E8',
    shadowColor: '#FF3B6B',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  splashTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },
  splashSpinner: {
    marginTop: 36,
  },
  offlineNoticeBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offlineNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
});
