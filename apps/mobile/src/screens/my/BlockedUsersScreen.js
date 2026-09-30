// src/screens/my/BlockedUsersScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { apiClient } from '../../api/client';

export default function BlockedUsersScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [unblockingId, setUnblockingId] = useState(null);

  const loadBlockedUsers = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await apiClient.getBlockedUsers();
      const nextItems = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.items)
        ? response.items
        : [];

      setItems(nextItems);
    } catch (error) {
      setErrorMessage(
        error?.message || '차단한 회원 목록을 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const handleUnblock = useCallback(
    (item) => {
      if (unblockingId) {
        return;
      }

      const blockedUserId = item?.blockedUserId || item?.user?.id;

      if (!blockedUserId) {
        Alert.alert(
          '차단 해제 실패',
          '차단 해제할 회원 정보를 찾을 수 없습니다.',
        );
        return;
      }

      const profile = item?.user?.profile ?? {};
      const name =
        profile?.nickname ||
        item?.user?.displayName ||
        '이 회원';

      Alert.alert(
        '차단 해제',
        `${name}님의 차단을 해제하시겠습니까?`,
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '차단 해제',
            onPress: async () => {
              setUnblockingId(blockedUserId);

              try {
                await apiClient.unblockUser(blockedUserId);

                setItems((previous) =>
                  previous.filter(
                    (blockedItem) =>
                      (blockedItem?.blockedUserId ||
                        blockedItem?.user?.id) !== blockedUserId,
                  ),
                );

                Alert.alert(
                  '차단 해제 완료',
                  '회원 차단이 해제되었습니다.',
                );
              } catch (error) {
                Alert.alert(
                  '차단 해제 실패',
                  error?.message || '회원 차단을 해제하지 못했습니다.',
                );
              } finally {
                setUnblockingId(null);
              }
            },
          },
        ],
      );
    },
    [unblockingId],
  );

  const renderItem = ({ item }) => {
    const user = item?.user ?? {};
    const profile = user?.profile ?? {};
    const name =
      profile?.nickname ||
      user?.displayName ||
      '회원';

    const region =
      [user?.region1, user?.region2]
        .filter(Boolean)
        .join(' · ') || '지역 미설정';

    const isUnblocking =
      unblockingId === (item?.blockedUserId || user?.id);

    return (
      <View style={styles.memberRow}>
        <Avatar
          size={52}
          name={name}
          uri={profile?.avatarUri}
          showBorder
        />

        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{name}</Text>
          <Text style={styles.memberRegion}>{region}</Text>
          {!!profile?.headline && (
            <Text
              style={styles.memberHeadline}
              numberOfLines={1}
            >
              {profile.headline}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.unblockButton,
            isUnblocking && styles.unblockButtonDisabled,
          ]}
          onPress={() => handleUnblock(item)}
          disabled={isUnblocking}
          activeOpacity={0.8}
        >
          {isUnblocking ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />
          ) : (
            <Text style={styles.unblockButtonText}>
              차단 해제
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          내가 차단한 회원
        </Text>

        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
        </View>
      ) : errorMessage ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {errorMessage}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadBlockedUsers}
          >
            <Text style={styles.retryButtonText}>
              다시 시도
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) =>
            String(item?.id || item?.blockedUserId)
          }
          contentContainerStyle={
            items.length > 0
              ? styles.list
              : styles.emptyList
          }
          ItemSeparatorComponent={() => (
            <View style={styles.separator} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="ban-outline"
                size={42}
                color={colors.textTertiary}
              />

              <Text style={styles.emptyTitle}>
                차단한 회원이 없습니다.
              </Text>

              <Text style={styles.emptyDescription}>
                차단한 회원은 이곳에서 확인하고 해제할 수 있습니다.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  headerButton: {
    width: 52,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  memberRegion: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textSecondary,
  },
  memberHeadline: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textTertiary,
  },
  unblockButton: {
    minWidth: 74,
    height: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockButtonDisabled: {
    opacity: 0.6,
  },
  unblockButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  separator: {
    height: 10,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  emptyDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: colors.error,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },
});