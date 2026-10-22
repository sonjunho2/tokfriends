import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import {
  MARKET_CATEGORIES,
  createMarketProduct,
} from '../../services/marketService';

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
];

export default function MarketCreateScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<'C2C_USED' | 'B2C_GROUP'>('C2C_USED');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('DIGITAL');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [targetQuantity, setTargetQuantity] = useState('20');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('역삼1동');
  const [images, setImages] = useState<string[]>([SAMPLE_IMAGES[0]]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddSampleImage = () => {
    if (images.length >= 10) {
      Alert.alert('알림', '사진은 최대 10장까지 등록할 수 있습니다.');
      return;
    }
    const nextImg = SAMPLE_IMAGES[images.length % SAMPLE_IMAGES.length];
    setImages([...images, nextImg]);
  };

  const handleRemoveImage = (index: number) => {
    if (images.length === 1) {
      Alert.alert('알림', '최소 1장의 사진이 필요합니다.');
      return;
    }
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('입력 오류', '상품명을 입력해주세요.');
      return;
    }
    const numPrice = parseInt(price.replace(/[^0-9]/g, ''), 10);
    if (!numPrice || numPrice <= 0) {
      Alert.alert('입력 오류', '올바른 판매 가격을 입력해주세요.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('입력 오류', '상품 설명을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await createMarketProduct({
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        price: numPrice,
        originalPrice: type === 'B2C_GROUP' ? parseInt(originalPrice.replace(/[^0-9]/g, ''), 10) || numPrice * 1.3 : undefined,
        targetQuantity: type === 'B2C_GROUP' ? parseInt(targetQuantity, 10) || 10 : undefined,
        currentQuantity: type === 'B2C_GROUP' ? 1 : undefined,
        images,
        status: 'ACTIVE',
        locationName: locationName.trim() || '역삼1동',
        distanceKm: 0.5,
        seller: {
          id: 'my-user-id',
          nickname: '나 (판매자)',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          trustScore: 99.0,
        },
      });

      Alert.alert('등록 완료', '상품이 성공적으로 등록되었습니다.', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      Alert.alert('오류', '물품 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 1. 상단 56px 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === 'C2C_USED' ? '중고거래 물품 등록' : '핫딜 공동구매 등록'}
        </Text>
        <TouchableOpacity
          style={styles.submitTopBtn}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FF3B6B" />
          ) : (
            <Text style={styles.submitTopText}>완료</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. 등록 유형 선택 */}
        <View style={styles.typeSelectorRow}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'C2C_USED' && styles.typeBtnActive]}
            onPress={() => setType('C2C_USED')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="cart-outline"
              size={18}
              color={type === 'C2C_USED' ? '#FF3B6B' : '#64748B'}
            />
            <Text style={[styles.typeBtnText, type === 'C2C_USED' && styles.typeBtnTextActive]}>
              동네 중고거래 (C2C)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeBtn, type === 'B2C_GROUP' && styles.typeBtnActive]}
            onPress={() => setType('B2C_GROUP')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="flame"
              size={18}
              color={type === 'B2C_GROUP' ? '#FF5722' : '#64748B'}
            />
            <Text style={[styles.typeBtnText, type === 'B2C_GROUP' && styles.typeBtnTextActive]}>
              핫딜 공동구매 (B2C)
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. 사진 등록 슬롯 */}
        <Text style={styles.sectionLabel}>사진 등록 ({images.length}/10)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
          <TouchableOpacity
            style={styles.addPhotoBox}
            onPress={handleAddSampleImage}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={24} color="#64748B" />
            <Text style={styles.addPhotoText}>사진 추가</Text>
          </TouchableOpacity>

          {images.map((img, idx) => (
            <View key={idx} style={styles.photoThumbBox}>
              <Image source={{ uri: img }} style={styles.photoThumb} />
              {idx === 0 && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>대표</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => handleRemoveImage(idx)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* 4. 상품 제목 */}
        <Text style={styles.sectionLabel}>상품명</Text>
        <TextInput
          style={styles.textInput}
          placeholder="상품명을 입력하세요"
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />

        {/* 5. 카테고리 선택 */}
        <Text style={styles.sectionLabel}>카테고리</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {MARKET_CATEGORIES.filter((c) => c.id !== 'ALL').map((c) => {
            const isSelected = category === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setCategory(c.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 6. 판매 가격 (1 ON = 1원 안내) */}
        <Text style={styles.sectionLabel}>판매 가격 (ON 포인트)</Text>
        <View style={styles.priceInputBox}>
          <TextInput
            style={styles.priceInput}
            placeholder="0"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={price}
            onChangeText={(txt) => setPrice(txt.replace(/[^0-9]/g, ''))}
          />
          <Text style={styles.priceUnitLabel}>ON</Text>
        </View>
        <Text style={styles.policyNotice}>
          💡 다가온 정책: <Text style={{ fontWeight: '800' }}>1 ON = 1원(한화)</Text>으로 안전하게 결제 및 정산됩니다.
        </Text>

        {/* B2C 공구 시 추가 필드 */}
        {type === 'B2C_GROUP' && (
          <View style={styles.b2cFieldsBox}>
            <Text style={styles.sectionLabel}>정상가 (원)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="예: 40000"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={originalPrice}
              onChangeText={setOriginalPrice}
            />

            <Text style={[styles.sectionLabel, { marginTop: 12 }]}>목표 인원 (명)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="예: 30"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={targetQuantity}
              onChangeText={setTargetQuantity}
            />
          </View>
        )}

        {/* 7. 거래 희망 장소 */}
        <Text style={styles.sectionLabel}>희망 거래 동네</Text>
        <TextInput
          style={styles.textInput}
          placeholder="예: 역삼1동, 역삼역 3번출구"
          placeholderTextColor="#94A3B8"
          value={locationName}
          onChangeText={setLocationName}
        />

        {/* 8. 상세 설명 */}
        <Text style={styles.sectionLabel}>상품 설명</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          placeholder="상품 상태, 사용감, 직거래 희망 시간 등 자세한 정보를 작성해주세요. 사기 예방을 위해 안전결제를 권장합니다."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        {/* 9. 하단 등록 버튼 */}
        <TouchableOpacity
          style={styles.submitBottomBtn}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBottomText}>
              {type === 'C2C_USED' ? '안전결제 중고물품 등록하기' : '핫딜 공동구매 개설하기'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  submitTopBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  submitTopText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF3B6B',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeBtnActive: {
    backgroundColor: '#FFF0F3',
    borderColor: '#FF3B6B',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  typeBtnTextActive: {
    color: '#FF3B6B',
    fontWeight: '800',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    marginTop: 14,
  },
  imagesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  addPhotoBox: {
    width: 76,
    height: 76,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    marginRight: 10,
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  photoThumbBox: {
    width: 76,
    height: 76,
    borderRadius: 14,
    marginRight: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  primaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  multilineInput: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#0F172A',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  priceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    height: 46,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  priceUnitLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF3B6B',
  },
  policyNotice: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  b2cFieldsBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  submitBottomBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FF3B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    shadowColor: '#FF3B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBottomText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
