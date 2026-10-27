import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { tokens } from '../theme/tokens';
import {
  HomeStack,
  MarketStack,
  LiveStack,
  ChatsStack,
  MyPageStack,
} from './TabStacks';

const Tab = createBottomTabNavigator();

interface TabBarIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
}

/**
 * 탭 아이콘 및 활성 인디케이터 바
 */
function RegularTabItem({ name, focused, label }: TabBarIconProps) {
  return (
    <View style={styles.tabItemContainer}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? tokens.colors.primary : tokens.colors.textTertiary}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? tokens.colors.primary : tokens.colors.textTertiary },
        ]}
      >
        {label}
      </Text>
      {focused ? <View style={styles.activeIndicator} /> : <View style={styles.inactiveIndicator} />}
    </View>
  );
}

/**
 * 중앙 '라이브' 플로팅 액션 버튼(FAB)
 */
function LiveFabButton({ children, onPress }: any) {
  return (
    <TouchableOpacity
      style={styles.fabWrapper}
      onPress={onPress}
      activeOpacity={0.88}
      hitSlop={{ top: 12, bottom: 8, left: 12, right: 12 }}
    >
      <LinearGradient
        colors={tokens.colors.gradients.primaryPurple}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fabCircle}
      >
        <Ionicons name="radio" size={24} color="#FFFFFF" />
        <Text style={styles.fabLabel}>모꼬 LIVE</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 14 : 20
  );
  const tabHeight = 62 + bottomPadding;

  const getTabBarStyle = (route: any) => {
    const routeName = getFocusedRouteNameFromRoute(route);
    const hideOnScreens = [
      'ProductDetail',
      'MarketCreate',
      'PostDetail',
      'ChatRoom',
      'ProfileDetail',
      'ProfileEdit',
      'Settlement',
      'PointCharge',
      'Shop',
      'Points',
      'Notifications',
      'Friends',
      'Visitors',
      'Follows',
    ];
    if (routeName && hideOnScreens.includes(routeName)) {
      return { display: 'none' as const };
    }
    return [
      styles.tabBar,
      {
        height: tabHeight,
        paddingBottom: bottomPadding,
      },
    ];
  };

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: getTabBarStyle(route),
      })}
    >
      {/* 1. 홈 탭 */}
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <RegularTabItem
              name={focused ? 'home' : 'home-outline'}
              focused={focused}
              label="모꼬홈"
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Home', { screen: 'HomeMain' });
          },
        })}
      />

      {/* 2. 마켓 탭 (C2C 중고거래 & B2C 공동구매) */}
      <Tab.Screen
        name="Market"
        component={MarketStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <RegularTabItem
              name={focused ? 'storefront' : 'storefront-outline'}
              focused={focused}
              label="모꼬마켓"
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Market', { screen: 'MarketMain' });
          },
        })}
      />

      {/* 3. 중앙 돌출 라운드 라이브 FAB */}
      <Tab.Screen
        name="Live"
        component={LiveStack}
        options={{
          tabBarButton: (props) => <LiveFabButton {...props} />,
        }}
      />

      {/* 4. 모꼬지대화 탭 (1줄 토크 타임라인 & 듀얼 대화함) */}
      <Tab.Screen
        name="Chat"
        component={ChatsStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <RegularTabItem
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              focused={focused}
              label="모꼬쳇"
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Chat', { screen: 'ChatsMain' });
          },
        })}
      />

      {/* 5. 마이모꼬 탭 */}
      <Tab.Screen
        name="My"
        component={MyPageStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <RegularTabItem
              name={focused ? 'person' : 'person-outline'}
              focused={focused}
              label="마이모꼬"
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('My', { screen: 'MyPageMain' });
          },
        })}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: tokens.colors.surface,
    borderTopColor: tokens.colors.borderLight,
    borderTopWidth: 1,
    paddingTop: 6,
    ...tokens.shadows.card,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 54,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  activeIndicator: {
    width: 14,
    height: 3,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.primary,
    marginTop: 3,
  },
  inactiveIndicator: {
    width: 14,
    height: 3,
    backgroundColor: 'transparent',
    marginTop: 3,
  },
  fabWrapper: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: tokens.colors.surface,
    ...tokens.shadows.fab,
  },
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
