// apps/mobile/src/theme/typography.js
// 한국어 가독성에 최적화된 Noto Sans KR 계층형 타이포그래피 시스템

export default {
  // 거대 헤드라인
  display: {
    fontFamily: 'NotoSansKR_700Bold',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  
  // 페이지 메인 타이틀
  titleLarge: {
    fontFamily: 'NotoSansKR_700Bold',
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  
  // 섹션 제목 / 카드 타이틀
  titleMedium: {
    fontFamily: 'NotoSansKR_700Bold',
    fontSize: 18,
    lineHeight: 25,
    letterSpacing: -0.3,
  },

  // 서브헤더 / 작은 카드 타이틀
  titleSmall: {
    fontFamily: 'NotoSansKR_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },

  // 본문 (기본 강조)
  bodyLarge: {
    fontFamily: 'NotoSansKR_500Medium',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.2,
  },

  // 본문 (일반 텍스트)
  bodyMedium: {
    fontFamily: 'NotoSansKR_400Regular',
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.1,
  },

  // 본문 (소형 텍스트)
  bodySmall: {
    fontFamily: 'NotoSansKR_400Regular',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },

  // 캡션 / 날짜 / 부가 정보
  caption: {
    fontFamily: 'NotoSansKR_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },

  // 초소형 라벨 / 배지
  labelSmall: {
    fontFamily: 'NotoSansKR_500Medium',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.2,
  },

  // 버튼
  buttonMedium: {
    fontFamily: 'NotoSansKR_700Bold',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  buttonSmall: {
    fontFamily: 'NotoSansKR_500Medium',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
  },

  // 기존 호환성용 alias
  H1: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  H2: { fontSize: 20, fontWeight: '700' },
  Body: { fontSize: 15 },
  Caption: { fontSize: 12 },
};
