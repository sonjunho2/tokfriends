import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
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
import HotRecommendScreen from '../screens/recommend/HotRecommendScreen';
import ChatRoomScreen from '../screens/main/ChatRoomScreen';
import ProfileDetailScreen from '../screens/main/ProfileDetailScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';

const HomeStackNav = createNativeStackNavigator();
const CommunityStackNav = createNativeStackNavigator();
const LiveStackNav = createNativeStackNavigator();
const ChatsStackNav = createNativeStackNavigator();
const MyPageStackNav = createNativeStackNavigator();

/** ===== 홈 탭 스택 ===== */
export function HomeStack() {
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

/** ===== 커뮤니티 탭 스택 ===== */
export function CommunityStack() {
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

/** ===== 라이브 탭 스택 ===== */
export function LiveStack() {
  return (
    <LiveStackNav.Navigator
      initialRouteName="LiveMain"
      screenOptions={{ headerShown: false }}
    >
      <LiveStackNav.Screen name="LiveMain" component={LiveScreen} />
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

/** ===== 대화 탭 스택 ===== */
export function ChatsStack() {
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
export function MyPageStack() {
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
