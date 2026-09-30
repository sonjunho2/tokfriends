import React from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
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
import CommunityFeedScreen from '../screens/community/CommunityFeedScreen';

// ===== 서브 =====
import HotRecommendScreen from '../screens/recommend/HotRecommendScreen';
import ChatRoomScreen from '../screens/main/ChatRoomScreen';
import ProfileDetailScreen from '../screens/main/ProfileDetailScreen';
import LiveRoomScreen from '../screens/live/LiveRoomScreen';

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
        name="Points"
        component={ShopScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MyPageStackNav.Screen
        name="Shop"
        component={ShopScreen}
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
  const { user, token, initializing } = useAuth();
  useAuthStoreSync();
  
  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const tokenExists = Boolean(token);
  const userHasIdentifier = Boolean(user) && Boolean(user.id || user._id);
  const isSignedIn = tokenExists || userHasIdentifier;

  return isSignedIn ? <MainTabs /> : <AuthFlow />;
}
