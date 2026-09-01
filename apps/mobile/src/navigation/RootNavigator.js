// src/navigation/RootNavigator.js
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useAuthStoreSync } from '../store/auth';
import UniversalListScreen from '../screens/list/UniversalListScreen'; 
// ===== 메인 =====
import HomeScreen from '../screens/main/HomeScreen';
import ExploreScreen from '../screens/explore/ExploreScreen'; 
import ChatsScreen from '../screens/main/ChatsScreen';
import ShopScreen from '../screens/shop/ShopScreen';           
import SettingsScreen from '../screens/my/SettingsScreen';
import ProfileEditScreen from '../screens/my/ProfileEditScreen';

// ===== 서브 =====
import HotRecommendScreen from '../screens/recommend/HotRecommendScreen';
import ChatRoomScreen from '../screens/main/ChatRoomScreen';
import ProfileDetailScreen from '../screens/main/ProfileDetailScreen';
import CreateChatRoomScreen from '../screens/chat/CreateChatRoomScreen';

// ===== 인증 =====
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import PhoneEntryScreen from '../screens/auth/PhoneEntryScreen';
import PhoneVerificationScreen from '../screens/auth/PhoneVerificationScreen';
import AgreementScreen from '../screens/auth/AgreementScreen';
import ProfileRegistrationScreen from '../screens/auth/ProfileRegistrationScreen';

const AuthStack = createNativeStackNavigator();
const HomeStackNav = createNativeStackNavigator();
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
      <HomeStackNav.Screen name="UniversalList" component={UniversalListScreen} />
      <HomeStackNav.Screen name="Explore" component={ExploreScreen} />
      <HomeStackNav.Screen name="HotRecommend" component={HotRecommendScreen} />
      <HomeStackNav.Screen
        name="ProfileDetail"
        component={ProfileDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </HomeStackNav.Navigator>
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
        name="CreateChatRoom"
        component={CreateChatRoomScreen}
        options={{
          animation: 'fade',
          presentation: 'transparentModal',
          contentStyle: { backgroundColor: 'transparent' },
        }}
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
    </MyPageStackNav.Navigator>
  );
}

/** ===== 하단 탭 ===== */
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.backgroundSecondary,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const iconMap = {
            Home: focused ? 'people' : 'people-outline',
            Chats: focused ? 'chatbubbles' : 'chatbubbles-outline',
            Shop: focused ? 'bag' : 'bag-outline',
            MyPage: focused ? 'person' : 'person-outline',
          };
          const name = iconMap[route.name] || (focused ? 'ellipse' : 'ellipse-outline');
          return <Ionicons name={name} size={size} color={color} />;
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
            // 기본 동작(탭 전환)으로 홈 스택의 현재 화면을 유지하면
            // 다른 페이지에 머무르게 되므로 명시적으로 초기 화면으로 이동시킨다.
            e.preventDefault();
            navigation.navigate('Home', { screen: 'HomeMain' });
          },
        })}
      />
      <Tab.Screen name="Chats" component={ChatsStack} options={{ tabBarLabel: '대화' }} />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ tabBarLabel: '상점' }} />
      <Tab.Screen name="MyPage" component={MyPageStack} options={{ tabBarLabel: '마이페이지' }} />
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
