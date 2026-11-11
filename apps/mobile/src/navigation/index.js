// src/navigation/index.js
import React from 'react';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import RootNavigator from './RootNavigator';
import colors from '../theme/colors';
import GlobalProfileModal from '../components/GlobalProfileModal';
import { ProfileModalProvider } from '../context/ProfileModalContext';
import { InAppNotificationProvider } from '../components/common/InAppNotificationBanner';

export const navigationRef = createNavigationContainerRef();

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
  prefixes: ['mocco://'],
  config: {
    screens: {
      Home: {
        screens: {
          HomeMain: 'home',
        },
      },
      Live: 'live',
      Market: 'market',
      Chat: {
        screens: {
          ChatsMain: 'chats',
          ChatRoom: 'chat/:id',
        },
      },
      My: {
        screens: {
          MyPageMain: 'mypage',
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
    <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
      <ProfileModalProvider>
        <InAppNotificationProvider>
          <RootNavigator />
          <GlobalProfileModal />
        </InAppNotificationProvider>
      </ProfileModalProvider>
    </NavigationContainer>
  );
}
