// apps/mobile/src/utils/pointPolicyHelper.js
import { Alert } from 'react-native';
import { apiClient } from '../api/client';

/**
 * 액션별 포인트 소모 정책을 확인하고,
 * 포인트가 필요한 경우 사용자에게 확인 안내창을 띄워 승인 시에만 작업을 진행합니다.
 * 포인트가 부족할 경우 상점(Shop) 화면으로 이동할 수 있는 옵션을 제공합니다.
 *
 * @param {Object} options
 * @param {'chatRoomCreate' | 'chatRoomJoin' | 'directMessageRequest' | 'liveRoomCreate' | 'liveRoomJoin'} options.actionType
 * @param {string} options.actionName 사용자에게 노출할 기능명 (예: '1:1 채팅방 개설')
 * @param {Object} options.navigation React Navigation 객체 (Shop 이동용)
 * @param {Function} options.onConfirm 포인트 차감 확인 시 실행할 콜백
 */
export async function checkAndConfirmActionPoint({
  actionType,
  actionName,
  navigation,
  onConfirm,
}) {
  try {
    const policy = await apiClient.getActionPointPolicy();
    const actionConfig = policy?.[actionType];

    // 포인트 소모가 비활성화되어 있거나 0P인 경우 즉시 진행
    if (!actionConfig || !actionConfig.enabled || actionConfig.amount <= 0) {
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
      return;
    }

    const requiredAmount = actionConfig.amount;

    // 현재 보유 포인트 잔액 조회
    let currentBalance = 0;
    try {
      const balanceRes = await apiClient.getPointBalance();
      currentBalance = Number(balanceRes?.balance ?? 0);
    } catch {
      currentBalance = 0;
    }

    // 잔액 부족 안내
    if (currentBalance < requiredAmount) {
      Alert.alert(
        '포인트 부족',
        `${actionName}을(를) 진행하려면 ${requiredAmount.toLocaleString()}P가 필요합니다.\n\n현재 보유 포인트: ${currentBalance.toLocaleString()}P\n부족한 포인트: ${(requiredAmount - currentBalance).toLocaleString()}P\n\n포인트 상점으로 이동하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '충전하러 가기',
            onPress: () => {
              if (navigation && typeof navigation.navigate === 'function') {
                navigation.navigate('Shop');
              }
            },
          },
        ]
      );
      return;
    }

    // 잔액 충분 - 소모 확인 안내창
    const remainingAfter = currentBalance - requiredAmount;
    Alert.alert(
      `${actionName} 안내`,
      `${actionName} 시 ${requiredAmount.toLocaleString()}P가 소모됩니다.\n(현재 보유: ${currentBalance.toLocaleString()}P → ${remainingAfter.toLocaleString()}P)\n\n계속 진행하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            if (typeof onConfirm === 'function') {
              onConfirm();
            }
          },
        },
      ]
    );
  } catch (error) {
    // 정책 확인 중 예기치 못한 에러 발생 시 사용자 작업 차단 방지 위해 기존 플로우 진행
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  }
}
