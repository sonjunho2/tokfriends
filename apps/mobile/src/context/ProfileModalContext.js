// src/context/ProfileModalContext.js
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ProfileModalContext = createContext({
  visible: false,
  profile: null,
  openProfile: () => {},
  closeProfile: () => {},
});

export function ProfileModalProvider({ children }) {
  const [state, setState] = useState({ visible: false, profile: null });

  const openProfile = useCallback((profile) => {
    setState({ visible: true, profile: profile || null });
  }, []);

  const closeProfile = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const value = useMemo(
    () => ({
      visible: state.visible,
      profile: state.profile,
      openProfile,
      closeProfile,
    }),
    [state.visible, state.profile, openProfile, closeProfile]
  );

  return <ProfileModalContext.Provider value={value}>{children}</ProfileModalContext.Provider>;
}

export const useProfileModal = () => useContext(ProfileModalContext);
