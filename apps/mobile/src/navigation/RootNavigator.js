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
import ShopScreen from '../screens/shop/ShopScreen';           
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
import HotRecommendScreen from '../screens/recommend/HotRecommendScreen';
import ChatRoomScreen from '../screens/main/ChatRoomScreen';
import ProfileDetailScreen from '../screens/main/ProfileDetailScreen';
import LiveRoomScreen from '../screens/live/LiveRoomScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';

// ===== 인증 =====
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
function AuthFlow() {
  return (
    <AuthStack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
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
      <HomeStackNav.Screen name="HotRecommend" component={HotRecommendScreen} />
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
        name="LiveRoom"
        component={LiveRoomScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <HomeStackNav.Screen
        name="Points"
        component={ShopScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <HomeStackNav.Screen
        name="Shop"
        component={ShopScreen}
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
      <CommunityStackNav.Screen
        name="Points"
        component={ShopScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <CommunityStackNav.Screen
        name="Shop"
        component={ShopScreen}
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
      <LiveStackNav.Screen
        name="LiveRoom"
        component={LiveRoomScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <LiveStackNav.Screen
        name="Points"
        component={ShopScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <LiveStackNav.Screen
        name="Shop"
        component={ShopScreen}
        options={{ animation: 'slide_from_right' }}
      />
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
        name="HotRecommend"
        component={HotRecommendScreen}
        options={{ animation: 'slide_from_right' }}
      />
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
      <ChatsStackNav.Screen
        name="Points"
        component={ShopScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <ChatsStackNav.Screen
        name="Shop"
        component={ShopScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </ChatsStackNav.Navigator>
  );
}

/** ===== 마이페이지 스택 ===== */
function MyPageStack() {
  return (
    <MyPageStackNav.Navigator screenOptions={{ headerShown: false }}>
      <MyPageStackNav.Screen name="MyPageMain" component={SettingsScreen} />
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
        name="Points"
        component={ShopScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MyPageStackNav.Screen
        name="Shop"
        component={ShopScreen}
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

/** ===== 하단 탭 (5개 표준: 홈, 커뮤니티, 라이브, 대화, 마이) ===== */
function MainTabs() {
  const insets = useSafeAreaInsets();
  // 안드로이드 3버튼 소프트키(48~56dp) 및 아이폰 홈 인디케이터에 맞춘 안전 영역 확보
  const bottomPadding = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 16 : 24
  );
  const tabHeight = 56 + bottomPadding;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#191919',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F2F3F5',
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconMap = {
            Home: focused ? 'home' : 'home-outline',
            Community: focused ? 'people' : 'people-outline',
            Live: focused ? 'radio' : 'radio-outline',
            Chat: focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
            My: focused ? 'person' : 'person-outline',
          };
          const name = iconMap[route.name] || (focused ? 'ellipse' : 'ellipse-outline');
          const isLiveTab = route.name === 'Live';
          const iconColor = isLiveTab && focused ? '#EF4444' : color;
          return <Ionicons name={name} size={21} color={iconColor} />;
        },
      })}
    >
      {/* 홈 탭은 내부에 HomeStack을 둔다 */}
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: '홈' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Home', { screen: 'HomeMain' });
          },
        })}
      />
      <Tab.Screen
        name="Community"
        component={CommunityStack}
        options={{ tabBarLabel: '커뮤니티' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Community', { screen: 'CommunityMain' });
          },
        })}
      />
      <Tab.Screen
        name="Live"
        component={LiveStack}
        options={{
          tabBarLabel: '라이브',
        }}
      />
      <Tab.Screen name="Chat" component={ChatsStack} options={{ tabBarLabel: '대화' }} />
      <Tab.Screen name="My" component={MyPageStack} options={{ tabBarLabel: '마이' }} />
    </Tab.Navigator>
  );
}

/** ===== 루트 ===== */
export default function RootNavigator() {
  const { user, token, initializing, isOffline } = useAuth();
  useAuthStoreSync();
  
  if (initializing) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashBrandBox}>
          <View style={styles.splashIconCircle}>
            <Ionicons name="sparkles" size={32} color="#191919" />
          </View>
          <Text style={styles.splashTitle}>다가온</Text>
          <Text style={styles.splashSubtitle}>새로운 인연이 다가옵니다</Text>
        </View>
        <ActivityIndicator size="small" color="#191919" style={styles.splashSpinner} />
      </View>
    );
  }

  const tokenExists = Boolean(token);
  const userHasIdentifier = Boolean(user) && Boolean(user.id || user._id);
  const isSignedIn = tokenExists || userHasIdentifier;

  return (
    <View style={{ flex: 1 }}>
      {isOffline && (
        <View style={styles.offlineNoticeBar}>
          <Ionicons name="cloud-offline" size={13} color="#92400E" />
          <Text style={styles.offlineNoticeText}>
            서버 연결 확인 중입니다. 캐시된 프로필로 작동 중입니다.
          </Text>
        </View>
      )}
      {isSignedIn ? <MainTabs /> : <AuthFlow />}
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  splashBrandBox: {
    alignItems: 'center',
  },
  splashIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE500',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FEE500',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#191919',
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 6,
  },
  splashSpinner: {
    marginTop: 32,
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
