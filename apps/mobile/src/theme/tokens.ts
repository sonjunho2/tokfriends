/**
 * DAGAON Global Foundation Design Tokens
 * Single Source of Truth for App Styling & Consistent Design System
 */

export const colors = {
  // Brand Primary & Sub-tones
  primary: '#FF3B6B',           // 네온 코랄 핑크 (Main Accent)
  primaryHover: '#E02956',
  primaryDark: '#C91D46',
  primaryLight: '#FFEBF0',
  primaryMuted: 'rgba(255, 59, 107, 0.12)',
  primaryGlow: 'rgba(255, 59, 107, 0.35)',

  // Secondary Purple Sub-tones
  secondary: '#8B5CF6',         // 서브 퍼플
  secondaryLight: '#F3E8FF',
  secondaryDark: '#6D28D9',
  secondaryMuted: 'rgba(139, 92, 246, 0.12)',

  // Backgrounds & Surface
  background: '#F8FAFC',        // 글로벌 메인 배경
  surface: '#FFFFFF',           // 카드 및 시트 기본 표면
  surfaceSecondary: '#F1F5F9',  // 연한 회색 레이어
  surfaceMuted: '#E2E8F0',      // 구분선 및 디바이더 인접 표면
  card: '#FFFFFF',

  // Text Hierarchy
  text: '#0F172A',              // Slate-900 메인 텍스트
  textPrimary: '#0F172A',
  textSecondary: '#475569',      // Slate-600 보조 텍스트
  textTertiary: '#94A3B8',       // Slate-400 안내 및 플레이스홀더
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Status & Badges
  status: {
    online: '#10B981',          // 🟢 온라인
    live: '#FF3B6B',            // 🔴 라이브 방송 중
    busy: '#F59E0B',            // 🟡 통화중 / 자리비움
    offline: '#94A3B8',         // ⚪ 오프라인
  },

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderMedium: '#CBD5E1',
  borderStrong: '#CBD5E1',
  borderFocus: '#FF3B6B',

  // Shadows
  shadowColor: '#0F172A',

  // Semantic UI
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Gradients
  gradients: {
    primary: ['#FF3B6B', '#FF758C'] as const,
    primaryPink: ['#FF3B6B', '#FF758C'] as const,
    pink: ['#FF3B6B', '#FF758C'] as const,
    primaryPurple: ['#FF3B6B', '#8B5CF6'] as const,
    purple: ['#8B5CF6', '#6366F1'] as const,
    live: ['#FF3B6B', '#E11D48'] as const,
    darkOverlay: ['transparent', 'rgba(15, 23, 42, 0.75)'] as const,
    cardOverlay: ['transparent', 'rgba(15, 23, 42, 0.9)'] as const,
    heroGlow: ['rgba(255, 59, 107, 0.25)', 'transparent'] as const,
  },
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  card: 16,     // 16px 기본 카드 라운드
  button: 16,   // 16px 기본 버튼 라운드
  lg: 20,
  xl: 24,
  sheet: 24,    // 24px 바텀시트 탑 라운드
  pill: 9999,   // 캡슐/알약 라운드
  full: 9999,
};

export const radii = radius;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  float: {
    shadowColor: '#FF3B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  fab: {
    shadowColor: '#FF3B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  sheet: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
  },
};

export const typography = {
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: colors.text,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: colors.text,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: colors.text,
  },
  body1: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: colors.text,
  },
  body2: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.1,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 15,
    letterSpacing: 0,
    color: colors.textMuted,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: -0.1,
  },
};

export const badges = {
  live: {
    backgroundColor: colors.status.live,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  online: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.status.online,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tag: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  primaryPill: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
};

export const tokens = {
  colors,
  radius,
  radii,
  spacing,
  shadows,
  typography,
  badges,
};

export default tokens;
