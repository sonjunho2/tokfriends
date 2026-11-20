// apps/mobile/src/screens/my/TermsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

type TermTab = 'SERVICE' | 'PRIVACY' | 'FINANCE' | 'LOCATION' | 'YOUTH';

export default function TermsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TermTab>('SERVICE');

  const termsData: Record<TermTab, { title: string; version: string; content: string[] }> = {
    SERVICE: {
      title: 'MOCCO 서비스 이용약관',
      version: '시행일자: 2026년 11월 01일 (v2.1)',
      content: [
        '제1조 (목적)\n본 약관은 주식회사 모꼬(이하 "회사")가 제공하는 실시간 라이브 스트리밍, 1:1 대화, 이웃 중고거래 및 모꼬마켓 커머스 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.',
        '제2조 (용어의 정의)\n1. "회원"이란 본 약관에 동의하고 회사가 정한 절차에 따라 가입하여 서비스를 이용하는 자를 의미합니다.\n2. "모꼬 포인트"란 서비스 내에서 라이브 후원, 1:1 대화방 입장 등에 사용되는 인앱 전자적 지급수단을 의미합니다.\n3. "안전 에스크로"란 중고거래 및 마켓 상품 거래 시 구매자의 대금을 보호하기 위해 제3자로서 안전하게 대금을 예치·정산하는 결제 시스템을 말합니다.',
        '제3조 (회원가입 및 계정 관리)\n1. 회원가입은 이용자가 본 약관 및 개인정보 처리방침에 동의한 후 회사가 요청하는 본인인증(휴대전화 등) 절차를 완료함으로써 성립합니다.\n2. 회원은 본인의 계정 및 비밀번호, 인증정보를 스스로 안전하게 관리할 책임이 있으며, 타인에게 양도 또는 대여할 수 없습니다.',
        '제4조 (거래 안전 및 에스크로 결제)\n1. 회사는 건전한 이웃 직거래 및 택배 안전거래를 위해 에스크로 안전결제를 제공합니다.\n2. 구매자가 물품 수령 후 "구매확정"을 누르거나 배송완료 후 일정 기간(기본 7일) 내 이의제기가 없을 경우 정산 대금이 판매자에게 안전하게 지급됩니다.',
        '제5조 (금지행위 및 제재)\n1. 회원은 불법 물품 거래, 성매매 알선, 혐오 발언, 사기 행위, 타인의 개인정보 도용 등을 하여서는 안 됩니다.\n2. 위반 시 회사는 사전 통보 없이 서비스 이용제한, 계정 영구정지 및 관계 법령에 따른 수사기관 통보 조치를 취할 수 있습니다.',
      ],
    },
    PRIVACY: {
      title: '개인정보 처리방침',
      version: '시행일자: 2026년 11월 01일 (v2.1)',
      content: [
        '1. 수집하는 개인정보의 항목\n- 필수항목: 휴대전화번호, 닉네임, 생년월일(나이), 성별, CI/DI(본인확인정보), 기기식별정보\n- 선택항목: 프로필 사진, 지역 위치정보, 계좌번호(판매자 정산 시), 신분증 사본(고액 정산 시 원천징수용)',
        '2. 개인정보의 수집 및 이용 목적\n- 회원 관리: 본인확인, 서비스 부정 이용 방지, 가입 의사 확인\n- 서비스 제공: 라이브 스트리밍 송출, 위치 기반 이웃 거래 매칭, 안심 결제 및 판매대금 정산\n- 안전 및 보안: AI 사기방지 모니터링, 비매너 회원 제재 및 분쟁 해결',
        '3. 개인정보의 보유 및 파기\n회사는 회원의 탈퇴 시 지체 없이 개인정보를 파기합니다. 단, 전자상거래 등에서의 소비자보호에 관한 법률 등 관계 법령에 따라 보존할 필요가 있는 경우 정해진 기간(계약/청약철회 5년, 대금결제 5년, 소비자의 불만/분쟁처리 3년) 동안 안전하게 분리 보관합니다.',
        '4. 정보주체의 권리 행사\n회원은 언제든지 본인의 개인정보를 열람, 정정, 삭제, 처리정지를 요구할 수 있으며, 마이페이지 > 프로필 수정 또는 고객센터를 통해 즉시 처리하실 수 있습니다.',
      ],
    },
    FINANCE: {
      title: '전자금융거래 이용약관',
      version: '시행일자: 2026년 11월 01일 (v1.8)',
      content: [
        '제1조 (목적)\n본 약관은 회사가 제공하는 전자지급결제대행 서비스 및 선불전자지급수단의 발행·관리 서비스를 이용함에 있어 회사와 이용자 간의 전자금융거래에 관한 기본적인 사항을 정함을 목적으로 합니다.',
        '제2조 (에스크로 결제보호)\n회사는 통신판매중개 서비스를 제공함에 있어 거래의 안전성을 확보하기 위해 구매안전서비스(에스크로)를 운영합니다. 구매자의 결제대금은 물품 인수 확인 시점까지 회사의 안전 에스크로 계좌에 예치됩니다.',
        '제3조 (환불 및 정산)\n미사용 포인트 및 결제 취소 요청은 전자상거래법 및 전자금융거래법이 정하는 바에 따라 정당한 사유가 있는 경우 영업일 기준 3일 이내에 환불 처리됩니다.',
      ],
    },
    LOCATION: {
      title: '위치기반서비스 이용약관',
      version: '시행일자: 2026년 11월 01일 (v1.5)',
      content: [
        '제1조 (목적)\n본 약관은 회사가 위치정보사업자로부터 제공받은 위치정보를 이용하여 제공하는 위치기반서비스(내 동네 중고거래 탐색, 주변 실시간 라이브 추천 등)를 이용함에 있어 회사와 개인위치정보주체의 권리·의무를 규정합니다.',
        '제2조 (서비스의 내용)\n회사는 회원의 현재 GPS 위치 또는 선택된 동네 위치를 기반으로 인근 이웃의 판매 물품, 실시간 수다, 동네 라이브 방송 목록을 정렬·제공합니다.',
        '제3조 (위치정보의 보존 및 파기)\n회사는 위치정보의 보호 및 이용 등에 관한 법률 제16조 제2항에 따라 위치정보 이용·제공사실 확인자료를 6개월간 보존하며, 목적 달성 시 즉시 파기합니다.',
      ],
    },
    YOUTH: {
      title: '청소년 보호정책',
      version: '시행일자: 2026년 11월 01일 (v1.2)',
      content: [
        '1. 유해정보로부터의 청소년 보호\n회사는 방송통신심의위원회의 정보통신에 관한 심의규정 및 청소년보호법에 따라 음란물, 폭력물, 사행성 행위 등 청소년 유해매체물의 유통을 엄격히 금지합니다.',
        '2. 유해정보 필터링 및 관리\n회사는 실시간 AI 텍스트 및 이미지 검열 시스템을 가동하여 유해 게시물을 24시간 실시간 차단하며, 청소년보호책임자를 지정하여 건전한 서비스 환경을 유지합니다.',
      ],
    },
  };

  const currentTerm = termsData[activeTab];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={tokens.colors.surface} />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={8}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color={tokens.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>이용약관 및 정책</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 탭 바 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScroll}
        style={styles.tabScrollWrap}
      >
        {(
          [
            { key: 'SERVICE', label: '서비스 이용약관' },
            { key: 'PRIVACY', label: '개인정보 처리방침' },
            { key: 'FINANCE', label: '전자금융거래 약관' },
            { key: 'LOCATION', label: '위치기반서비스' },
            { key: 'YOUTH', label: '청소년 보호정책' },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabChip, isActive && styles.tabChipActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 약관 본문 스크롤 */}
      <ScrollView contentContainerStyle={styles.contentWrap} showsVerticalScrollIndicator={false}>
        <View style={styles.termCard}>
          <Text style={styles.termTitle}>{currentTerm.title}</Text>
          <Text style={styles.termVersion}>{currentTerm.version}</Text>

          <View style={styles.divider} />

          {currentTerm.content.map((paragraph, index) => (
            <View key={index} style={styles.paragraphBox}>
              <Text style={styles.paragraphText}>{paragraph}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textPrimary,
  },
  tabScrollWrap: {
    maxHeight: 50,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  tabScroll: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 8,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.borderRadius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
  },
  tabChipActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  tabChipText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textSecondary,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  tabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: tokens.typography.fontWeight.bold,
  },
  contentWrap: {
    padding: tokens.spacing.md,
    paddingBottom: 40,
  },
  termCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    ...tokens.shadows.sm,
  },
  termTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textPrimary,
    marginBottom: 4,
  },
  termVersion: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textTertiary,
    marginBottom: tokens.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.border,
    marginBottom: tokens.spacing.md,
  },
  paragraphBox: {
    marginBottom: tokens.spacing.md,
  },
  paragraphText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.textSecondary,
    lineHeight: 22,
  },
});
