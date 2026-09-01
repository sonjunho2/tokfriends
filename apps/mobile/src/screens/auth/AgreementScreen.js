// src/screens/auth/AgreementScreen.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import ButtonPrimary from '../../components/ButtonPrimary';
import { apiClient } from '../../api/client';

const TERMS = [
  { key: 'privacy', label: '(필수) 개인정보 처리 방침', slug: 'privacy-policy' },
  { key: 'tos', label: '(필수) 이용약관', slug: 'terms-of-service' },
  { key: 'location', label: '(필수) 위치기반서비스', slug: 'location-based-service' },
];

export default function AgreementScreen({ navigation, route }) {
  const initialState = useMemo(() => ({ privacy: false, tos: false, location: false }), []);
  const [checked, setChecked] = useState(initialState);
  const all = checked.privacy && checked.tos && checked.location;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const phone = route?.params?.phone;
  const verificationId = route?.params?.verificationId;
  const formattedPhone = route?.params?.formattedPhone;

  const toggleAll = () => {
    const next = !all;
    setChecked({ privacy: next, tos: next, location: next });
  };
  const toggleOne = (k) => setChecked((s) => ({ ...s, [k]: !s[k] }));

  const openTerm = async (term) => {
    setModalTitle(term.label);
    setModalVisible(true);
    setModalLoading(true);
    setModalError('');
    setModalBody('');
    try {
      const response = await apiClient.getLegalDocument(term.slug);
      const content =
        response?.content ||
        response?.html ||
        response?.body ||
        response?.data?.content ||
        response?.data?.html ||
        response?.text;
      if (typeof content === 'string' && content.trim()) {
        setModalBody(content.trim());
      } else {
        setModalError('등록된 약관 내용을 불러오지 못했습니다. 관리자에서 내용을 확인해 주세요.');
      }
    } catch (error) {
      setModalError(error?.message || '약관을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAgree = () => {
    if (!all) {
      Alert.alert('안내', '필수 항목에 모두 동의해 주세요.');
      return;
    }
    if (!verificationId) {
      Alert.alert('오류', '인증 정보가 만료되었습니다. 처음부터 다시 진행해 주세요.');
      return;
    }
  navigation.navigate('ProfileRegistration', {
    phone,
    verificationId,
    formattedPhone,
    adminOverride: route?.params?.adminOverride || false,
  });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <Text style={styles.title}>MJ톡 이용을 위해{'\n'}약관 내용에 동의가 필요해요.</Text>

      <TouchableOpacity style={styles.all} onPress={toggleAll} activeOpacity={0.9}>
        <Text style={styles.allTxt}>네, 모두 동의합니다</Text>
        <Text style={[styles.check, all && styles.checkOn]}>✓</Text>
      </TouchableOpacity>

      {TERMS.map((t) => {
        const on = !!checked[t.key];
        return (
          <View key={t.key} style={styles.rowWrap}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => toggleOne(t.key)}
              activeOpacity={0.9}
            >
              <Text style={styles.rowTxt}>{t.label}</Text>
              <Text style={[styles.check, on && styles.checkOn]}>✓</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => openTerm(t)}>
              <Text style={styles.linkText}>내용 보기</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={styles.bottom}>
        <ButtonPrimary title="동의" onPress={handleAgree} />
        <Text style={styles.helper}>* 필수 항목에 모두 체크되어야 다음 단계로 이동할 수 있어요.</Text>
      </View>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
          {modalLoading ? (
            <View style={styles.modalBodyCentered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : modalError ? (
            <View style={styles.modalBodyCentered}>
              <Text style={styles.modalError}>{modalError}</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.modalBodyContent}>
              <Text style={styles.modalBodyText}>{modalBody}</Text>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F7F8FA', paddingTop: 40, paddingHorizontal: 16 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text || '#111827', textAlign: 'center', marginBottom: 18 },
  all: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.border || '#E4E7EC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  allTxt: { fontSize: 18, fontWeight: '800', color: colors.text || '#111827' },
  rowWrap: { marginBottom: 12 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.border || '#E4E7EC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTxt: { fontSize: 16, fontWeight: '700', color: colors.text || '#111827' },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border || '#E4E7EC',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: 'transparent',
  },
  checkOn: {
    borderColor: colors.primary || '#F36C93',
    backgroundColor: colors.primaryLight || '#FFD2DE',
    color: colors.primary || '#F36C93',
    fontWeight: '900',
  },
    linkBtn: { alignSelf: 'flex-end', marginTop: 6 },
  linkText: { fontSize: 13, color: colors.primary || '#F36C93', fontWeight: '700' },
  bottom: { marginTop: 'auto', paddingVertical: 16 },
  helper: { marginTop: 8, fontSize: 12, color: colors.textSecondary || '#6B7280', textAlign: 'center' },
    modalContainer: { flex: 1, backgroundColor: colors.background || '#fff' },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#E4E7EC',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text || '#111827' },
  modalClose: { paddingHorizontal: 12, paddingVertical: 6 },
  modalCloseText: { fontSize: 14, color: colors.primary || '#F36C93', fontWeight: '700' },
  modalBodyCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBodyContent: { padding: 20, paddingBottom: 40 },
  modalBodyText: { fontSize: 14, lineHeight: 22, color: colors.text || '#111827' },
  modalError: { fontSize: 14, color: colors.error || '#EF4444', textAlign: 'center', lineHeight: 20 },
});
