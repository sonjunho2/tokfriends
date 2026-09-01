// src/screens/my/SettingsScreen.js
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import colors from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1080&q=80';

const MANAGED_FONT_ENDPOINT = 'https://manage.tokfriends.app/api/fonts/latest';

const FALLBACK_MANAGED_FONTS = [
  {
    id: 'nanumGothicBold',
    label: '나눔고딕 Bold',
    value: 'NanumGothic_700Bold',
    uri: 'https://github.com/google/fonts/raw/main/ofl/nanumgothic/NanumGothic-Bold.ttf',
  },
];

export default function SettingsScreen({ navigation }) {
  const { user } = useAuth();

  const nickname = user?.nickname || user?.displayName || user?.name || '회원님';
  const locationLabel = user?.location || '서울, 여자 27살';
  const tagline =
    user?.headline || user?.title || '대화친구 필요하신분? 나이는 상관없어요!';

  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [availableFonts, setAvailableFonts] = useState(() => [
    { id: 'system', label: '시스템 기본', value: 'system' },
    { id: 'notoSansRegular', label: 'Noto Sans KR', value: 'NotoSansKR_400Regular' },
    { id: 'notoSansBold', label: 'Noto Sans KR Bold', value: 'NotoSansKR_700Bold' },
  ]);
  const [selectedFont, setSelectedFont] = useState('system');
  const [fontLoading, setFontLoading] = useState(false);
  const [fontMessage, setFontMessage] = useState('');

  const dynamicFont = useMemo(() => {
    if (selectedFont === 'system') {
      return { heading: null, body: null };
    }
    return {
      heading: { fontFamily: selectedFont },
      body: { fontFamily: selectedFont },
    };
  }, [selectedFont]);

  const balance = useMemo(() => {
    const p = user?.points ?? user?.balance ?? 300;
    if (typeof p === 'number') return p;
    const numeric = parseInt(String(p).replace(/\D/g, ''), 10);
    return Number.isFinite(numeric) ? numeric : 0;
  }, [user]);

  const profilePayload = useMemo(
    () => ({
      name: nickname,
      location: locationLabel,
      title: user?.joinPhrase || '오늘 가입한 회원입니다',
      bio:
        user?.bio ||
        '새로운 인연을 기다리고 있어요. 반려견과 드라이브하는 것을 좋아해요!',
      avatar: user?.avatar || null,
      coverImage: user?.coverImage || FALLBACK_COVER,
    }),
    [nickname, locationLabel, user]
  );

  const quickActions = [
    {
      key: 'charge',
      icon: 'card-outline',
      label: '충전하기',
      value: `${balance} P`,
      accent: colors.primary,
      onPress: () => Alert.alert('충전', '포인트 충전 기능을 준비중입니다.'),
    },
    {
      key: 'attendance',
      icon: 'calendar-outline',
      label: '출석체크',
      value: '매일 도전해요',
      accent: '#3B82F6',
      onPress: () => Alert.alert('출석체크', '오늘의 출석을 기록해보세요!'),
    },
    {
      key: 'push',
      icon: 'notifications-outline',
      label: '푸시알림',
      value: '중요 소식 놓치지 마세요',
      accent: '#A855F7',
      onPress: () => setPushEnabled((prev) => !prev),
    },
  ];

  const supportLinks = [
    { key: 'blocked', icon: 'ban-outline', label: '내가 차단한 회원', value: '0명' },
    { key: 'faq', icon: 'help-circle-outline', label: '자주 묻는 질문' },
    { key: 'support', icon: 'chatbubble-ellipses-outline', label: '영자언니에게 문의하기' },
  ];

    const handleSelectFont = useCallback((value) => {
    setSelectedFont(value);
    setFontMessage('');
  }, []);

  const handleAddManagedFont = useCallback(async () => {
    if (fontLoading) {
      return;
    }

    setFontLoading(true);
    setFontMessage('관리서버에서 새 폰트를 다운로드 중이에요...');

    const existing = new Set(availableFonts.map((font) => font.value));
    let candidate = null;

    try {
      const response = await fetch(MANAGED_FONT_ENDPOINT);
      if (response.ok) {
        const payload = await response.json();
        const entries = [];
        const rawFonts = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.fonts)
          ? payload.fonts
          : Array.isArray(payload?.data?.fonts)
          ? payload.data.fonts
          : payload?.font
          ? [payload.font]
          : [];

        rawFonts.forEach((item, index) => {
          const rawFamily =
            item?.expoFamily ||
            item?.fontFamily ||
            item?.family ||
            item?.value ||
            item?.name ||
            `ManagedFont${index + 1}`;
          const family = String(rawFamily).replace(/[^0-9a-zA-Z_-]/g, '') || `ManagedFont${index + 1}`;
          const uri = item?.uri || item?.url || item?.source;
          if (!uri) return;
          entries.push({
            id: item?.id || family,
            label: item?.displayName || item?.label || item?.name || `커스텀 폰트 ${index + 1}`,
            value: family,
            uri,
          });
        });

        candidate = entries.find((font) => !existing.has(font.value));
      }
    } catch (error) {
      console.warn('Failed to fetch managed font manifest', error);
    }

    if (!candidate) {
      candidate = FALLBACK_MANAGED_FONTS.find((font) => !existing.has(font.value));
    }

    if (!candidate) {
      setFontMessage('추가할 수 있는 새 폰트가 없어요.');
      setFontLoading(false);
      return;
    }

    try {
      await Font.loadAsync({ [candidate.value]: candidate.uri });
      setAvailableFonts((prev) => [...prev, candidate]);
      setSelectedFont(candidate.value);
      setFontMessage(`'${candidate.label}' 폰트를 적용했어요.`);
    } catch (error) {
      console.warn('Failed to load managed font', error);
      setFontMessage('폰트를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setFontLoading(false);
    }
  }, [availableFonts, fontLoading]);

  const handleOpenProfile = () => {
    navigation.navigate('ProfileDetail', {
      profile: profilePayload,
      isSelf: true,
      preferredFont: selectedFont,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicFont.heading]}>마이페이지</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={handleOpenProfile}>
          <View style={styles.profileCard}>
            <Avatar
              size={72}
              name={nickname}
              uri={user?.avatar}
              showBorder
              style={styles.profileAvatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, dynamicFont.heading]}>{nickname}</Text>
              <Text style={[styles.profileMeta, dynamicFont.body]}>{locationLabel}</Text>
              <Text style={[styles.profileNote, dynamicFont.body]}>{tagline}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicFont.heading]}>빠른 설정</Text>
          <View style={styles.card}>
            {quickActions.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.quickItem}
                activeOpacity={0.85}
                onPress={item.onPress}
              >
                <View style={[styles.quickIcon, { backgroundColor: `${item.accent}1A` }]}>
                  <Ionicons name={item.icon} size={18} color={item.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.quickLabel, dynamicFont.body]}>{item.label}</Text>
                  {!!item.value && <Text style={[styles.quickValue, dynamicFont.body]}>{item.value}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicFont.heading]}>환경 설정</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, dynamicFont.body]}>푸시알림</Text>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ true: colors.primaryLight, false: '#E5E7EB' }}
                thumbColor={pushEnabled ? colors.primary : '#ffffff'}
              />
            </View>

            <View style={styles.fontRow}>
              <Text style={[styles.toggleLabel, dynamicFont.body]}>폰트 크기</Text>
              <View style={styles.fontChoiceRow}>
                <TouchableOpacity
                  style={[styles.fontChoice, fontSize === 'medium' && styles.fontChoiceActive]}
                  onPress={() => setFontSize('medium')}
                >
                  <Text
                    style={[styles.fontChoiceText, fontSize === 'medium' && styles.fontChoiceTextActive]}
                  >
                    기본
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fontChoice, fontSize === 'large' && styles.fontChoiceActive]}
                  onPress={() => setFontSize('large')}
                >
                  <Text
                    style={[styles.fontChoiceText, fontSize === 'large' && styles.fontChoiceTextActive]}
                  >
                    크게
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

                                  <View style={styles.fontManagerRow}>
              <Text style={[styles.toggleLabel, dynamicFont.body]}>폰트 스타일</Text>
              <TouchableOpacity
                style={[styles.fontAddButton, fontLoading && styles.fontAddButtonDisabled]}
                onPress={handleAddManagedFont}
                activeOpacity={0.85}
                disabled={fontLoading}
              >
                {fontLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.fontAddButtonText}>폰트 추가</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.fontOptionsWrap}>
              {availableFonts.map((font) => {
                const isSelected = selectedFont === font.value;
                return (
                  <TouchableOpacity
                    key={font.value}
                    style={[styles.fontOption, isSelected && styles.fontOptionActive]}
                    onPress={() => handleSelectFont(font.value)}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.fontOptionText,
                        isSelected && styles.fontOptionTextActive,
                        font.value !== 'system' ? { fontFamily: font.value } : null,
                      ]}
                    >
                      {font.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.fontPreviewCard}>
              <Text style={[styles.fontPreviewLabel, dynamicFont.body]}>폰트 미리보기</Text>
              <Text
                style={[
                  styles.fontPreviewText,
                  selectedFont !== 'system' ? { fontFamily: selectedFont } : null,
                ]}
              >
                좋은 인연은 멀지 않아요. 오늘의 인사를 나눠보세요!
              </Text>
              {!!fontMessage && <Text style={styles.fontStatusText}>{fontMessage}</Text>}
            </View>

            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, dynamicFont.body]}>다크모드</Text>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ true: colors.textSecondary, false: '#E5E7EB' }}
                thumbColor={darkMode ? '#1F2937' : '#ffffff'}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicFont.heading]}>도움말</Text>
          <View style={styles.card}>
            {supportLinks.map((item) => (
              <TouchableOpacity key={item.key} style={styles.supportRow} activeOpacity={0.85}>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={colors.textSecondary}
                  style={{ width: 22 }}
                />
                <Text style={[styles.supportLabel, dynamicFont.body]}>{item.label}</Text>
                {item.value ? (
                  <Text style={[styles.supportValue, dynamicFont.body]}>{item.value}</Text>
                ) : null}
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.footerCard}
          activeOpacity={0.9}
          onPress={handleOpenProfile}
        >
          <Text style={[styles.footerTitle, dynamicFont.heading]}>프로필 전체 보기</Text>
          <Text style={[styles.footerSubtitle, dynamicFont.body]}>
            내 프로필을 확인하고 업데이트하세요.
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  profileCard: {
    marginTop: 16,
    marginHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  profileAvatar: {
    borderWidth: 4,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  profileMeta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  profileNote: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  section: {
    marginTop: 22,
    paddingHorizontal: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  quickValue: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  fontRow: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fontChoiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  fontChoice: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.pillBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fontChoiceActive: {
    backgroundColor: colors.pillActiveBg,
    borderColor: colors.pillActiveBorder,
  },
  fontChoiceText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  fontChoiceTextActive: {
    color: colors.primary,
  },
    fontManagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fontAddButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  fontAddButtonDisabled: {
    opacity: 0.6,
  },
  fontAddButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  fontOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  fontOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.pillBg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  fontOptionActive: {
    backgroundColor: colors.pillActiveBg,
    borderColor: colors.pillActiveBorder,
  },
  fontOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  fontOptionTextActive: {
    color: colors.primary,
  },
  fontPreviewCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  fontPreviewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  fontPreviewText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
  },
  fontStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  supportLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  supportValue: {
    marginRight: 6,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  footerCard: {
    marginTop: 24,
    marginHorizontal: 18,
    backgroundColor: '#FFE0D6',
    borderRadius: 20,
    padding: 20,
    alignItems: 'flex-start',
    gap: 6,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6A55',
  },
  footerSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});
