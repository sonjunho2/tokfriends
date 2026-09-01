// src/navigation/index.js
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import RootNavigator from './RootNavigator';
import colors from '../theme/colors';
import GlobalProfileModal from '../components/GlobalProfileModal';
import { ProfileModalProvider } from '../context/ProfileModalContext';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.backgroundSecondary,
    border: colors.border,
    text: colors.text || '#111827',
    primary: colors.primary,
  },
};

const linking = {
  prefixes: ['ddakchin://'],
  config: {
    screens: {
      Home: {
        screens: {
          HomeMain: 'home',
          Explore: 'home/explore',
          UniversalList: 'home/list',
          HotRecommend: 'home/hot',
          ProfileDetail: 'home/profile',
        },
      },
      Chats: {
        screens: {
          ChatsMain: 'chats',
          ChatRoom: 'chat/:id',
          CreateChatRoom: 'chat/create',
        },
      },
      Shop: 'shop',
      MyPage: {
        screens: {
          MyPageMain: 'mypage',
          ProfileDetail: 'mypage/profile',
          ProfileEdit: 'mypage/edit',
        },
      },
      Welcome: 'welcome',
      PhoneEntry: 'phone',
      PhoneVerification: 'phone/verify',
      Agreement: 'agreement',
      ProfileRegistration: 'profile-registration',
    },
  },
};

export default function Navigation() {
  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <ProfileModalProvider>
        <RootNavigator />
        <GlobalProfileModal />
      </ProfileModalProvider>
    </NavigationContainer>
  );
}
