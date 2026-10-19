import { InMemoryCacheManager, PrivateCallService } from '../src/modules/calls/private-call.service';
import { SnapshotAuditorService } from '../src/modules/streaming/snapshot-auditor.service';
import { CallStatus } from '@prisma/client';

async function runCorePipelineVerification() {
  console.log('================================================================');
  console.log('🚀 [E2E 무결점 검증] 1:1 통화 과금 엔진 & 스냅샷 채증 모듈 테스트');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // =========================================================================
  // 1. InMemoryCacheManager 5분 TTL 인메모리 캐시 테스트
  // =========================================================================
  console.log('--- 1. 인메모리 캐시 매니저 (5분 TTL) 검증 ---');
  const cache = new InMemoryCacheManager();
  await cache.set('TEST_SETTING', '1500', 5000);
  const cachedVal = await cache.get<string>('TEST_SETTING');
  assert(cachedVal === '1500', '캐시 저장 및 즉시 조회 정상');

  await cache.del('TEST_SETTING');
  const deletedVal = await cache.get<string>('TEST_SETTING');
  assert(deletedVal === undefined, '캐시 개별 삭제(del) 정상');

  await cache.set('KEY1', 'val1');
  await cache.set('KEY2', 'val2');
  await cache.reset();
  assert((await cache.get('KEY1')) === undefined, '캐시 전체 초기화(reset) 정상');

  // =========================================================================
  // 2. PrivateCallService 1:1 통화 선차감 과금 엔진 모의 트랜잭션 검증
  // =========================================================================
  console.log('\n--- 2. 1:1 통화 수락 & 첫 1분 선차감 트랜잭션 검증 ---');

  // Mock Prisma State
  const mockDb = {
    users: new Map<string, any>([
      ['guest-1', { id: 'guest-1', nickname: '게스트', pointBalance: 5000, status: 'ACTIVE' }],
      ['guest-poor', { id: 'guest-poor', nickname: '빈곤게스트', pointBalance: 500, status: 'ACTIVE' }],
      ['host-1', { id: 'host-1', nickname: '호스트', pointBalance: 1000, callRatePerMinute: 1500, status: 'ACTIVE' }],
    ]),
    sessions: new Map<string, any>([
      [
        'sess-1',
        {
          id: 'sess-1',
          channelId: 'call_channel_abc123',
          hostId: 'host-1',
          guestId: 'guest-1',
          ratePerMinute: 1500,
          status: CallStatus.RINGING,
          billedMinutes: 0,
          totalDeducted: 0,
          platformFee: 0,
          creatorRevenue: 0,
        },
      ],
      [
        'sess-poor',
        {
          id: 'sess-poor',
          channelId: 'call_channel_poor',
          hostId: 'host-1',
          guestId: 'guest-poor',
          ratePerMinute: 1500,
          status: CallStatus.RINGING,
          billedMinutes: 0,
          totalDeducted: 0,
          platformFee: 0,
          creatorRevenue: 0,
        },
      ],
    ]),
    systemSettings: new Map<string, string>([
      ['DEFAULT_CALL_RATE', '1500'],
      ['PLATFORM_FEE_PERCENT', '35'],
    ]),
  };

  const emittedEvents: Array<{ channel: string; event: string; payload: any }> = [];

  const mockGateway: any = {
    server: {
      to: (channel: string) => ({
        emit: (event: string, payload: any) => {
          emittedEvents.push({ channel, event, payload });
        },
      }),
    },
  };

  const mockPrisma: any = {
    user: {
      findUnique: async ({ where }: any) => mockDb.users.get(where.id),
      update: async ({ where, data }: any) => {
        const u = mockDb.users.get(where.id);
        if (data.pointBalance?.decrement) {
          u.pointBalance -= data.pointBalance.decrement;
        }
        if (data.pointBalance?.increment) {
          u.pointBalance += data.pointBalance.increment;
        }
        mockDb.users.set(where.id, u);
        return u;
      },
    },
    systemSetting: {
      findUnique: async ({ where }: any) => {
        const val = mockDb.systemSettings.get(where.key);
        return val ? { key: where.key, value: val } : null;
      },
    },
    privateCallSession: {
      findUnique: async ({ where, include }: any) => {
        const s = mockDb.sessions.get(where.id);
        if (!s) return null;
        if (include) {
          return {
            ...s,
            host: mockDb.users.get(s.hostId),
            guest: mockDb.users.get(s.guestId),
          };
        }
        return s;
      },
      findMany: async ({ where, include }: any) => {
        const list = Array.from(mockDb.sessions.values()).filter((s) => s.status === where.status);
        if (include) {
          return list.map((s) => ({
            ...s,
            host: mockDb.users.get(s.hostId),
            guest: mockDb.users.get(s.guestId),
          }));
        }
        return list;
      },
      create: async ({ data }: any) => {
        const newSession = { id: `sess-${Date.now()}`, ...data };
        mockDb.sessions.set(newSession.id, newSession);
        return newSession;
      },
      update: async ({ where, data }: any) => {
        const s = mockDb.sessions.get(where.id);
        const updated = {
          ...s,
          ...data,
          billedMinutes: data.billedMinutes?.increment ? (s.billedMinutes || 0) + data.billedMinutes.increment : (data.billedMinutes ?? s.billedMinutes),
          totalDeducted: data.totalDeducted?.increment ? (s.totalDeducted || 0) + data.totalDeducted.increment : (data.totalDeducted ?? s.totalDeducted),
          platformFee: data.platformFee?.increment ? (s.platformFee || 0) + data.platformFee.increment : (data.platformFee ?? s.platformFee),
          creatorRevenue: data.creatorRevenue?.increment ? (s.creatorRevenue || 0) + data.creatorRevenue.increment : (data.creatorRevenue ?? s.creatorRevenue),
        };
        mockDb.sessions.set(where.id, updated);
        return updated;
      },
    },
    $transaction: async (fn: any) => {
      return fn(mockPrisma);
    },
  };

  const callService = new PrivateCallService(mockPrisma, mockGateway);

  // 2-1: 잔액 부족 게스트 통화 수락 시 예외 발생 검증
  try {
    await callService.acceptCall('sess-poor', 'host-1');
    assert(false, '잔액 부족 시 BadRequestException 발생해야 함');
  } catch (err: any) {
    assert(err.message.includes('포인트가 부족'), '잔액 부족 시 적절한 예외 발생');
    assert(mockDb.sessions.get('sess-poor').status === CallStatus.TERMINATED, '잔액 부족 세션 TERMINATED 처리');
  }

  // 2-2: 정상 게스트 첫 1분 선차감 트랜잭션 검증
  const initialGuestBal = mockDb.users.get('guest-1').pointBalance;
  const initialHostBal = mockDb.users.get('host-1').pointBalance;

  const accepted = await callService.acceptCall('sess-1', 'host-1');
  assert(accepted.status === CallStatus.CONNECTED, '통화 상태 CONNECTED로 전환');
  assert(accepted.billedMinutes === 1, '첫 1분 과금 완료');
  assert(accepted.totalDeducted === 1500, '단가 1,500 ON 정확히 차감 기록');
  assert(Boolean(accepted.agoraToken), 'Agora RTC 암호화 토큰 정상 발급');

  const afterGuestBal = mockDb.users.get('guest-1').pointBalance;
  const afterHostBal = mockDb.users.get('host-1').pointBalance;
  assert(afterGuestBal === initialGuestBal - 1500, '게스트 잔액 1,500 ON 즉시 선차감');

  // 수수료 35% 검증: 플랫폼 525, 호스트 975
  const expectedCreatorRevenue = 1500 - Math.floor(1500 * 0.35);
  assert(afterHostBal === initialHostBal + expectedCreatorRevenue, `호스트 정산 수익 +${expectedCreatorRevenue} ON 적립 확인`);

  // =========================================================================
  // 3. 백엔드 실시간 과금 스케줄러 루프 (@Cron('* * * * *')) 검증
  // =========================================================================
  console.log('\n--- 3. 백엔드 실시간 분당 과금 스케줄러 루프 검증 ---');
  await callService.handleCallBillingLoop();

  const currentSess1 = mockDb.sessions.get('sess-1');
  assert(currentSess1.billedMinutes === 2, '2분차 실시간 자동 과금 tick 반영');
  assert(currentSess1.totalDeducted === 3000, '누적 차감 3,000 ON 갱신');

  const billedTickEvent = emittedEvents.find((e) => e.event === 'CALL_BILLED_TICK');
  assert(Boolean(billedTickEvent), '실시간 과금 tick 이벤트(CALL_BILLED_TICK) 소켓 전송 성공');

  // 게스트 잔액을 100원으로 고갈시킨 후 스케줄러 루프 실행 (강제 방 폭파 검증)
  mockDb.users.get('guest-1').pointBalance = 100;
  await callService.handleCallBillingLoop();

  const terminatedSess = mockDb.sessions.get('sess-1');
  assert(terminatedSess.status === CallStatus.TERMINATED, '포인트 고갈 시 통화 세션 즉시 TERMINATED');
  assert(terminatedSess.endReason === 'POINT_DEPLETED', '종료 사유 POINT_DEPLETED 정확히 기록');

  const forceTermEvent = emittedEvents.find((e) => e.event === 'CALL_FORCE_TERMINATED');
  assert(Boolean(forceTermEvent), '강제 방 폭파 브로드캐스트(CALL_FORCE_TERMINATED) 발송 확인');

  // =========================================================================
  // 4. 정상 통화 종료 핸들러 (terminateCall) 검증
  // =========================================================================
  console.log('\n--- 4. 정상 통화 종료 핸들러 (terminateCall) 검증 ---');
  // 새 세션 생성 후 종료 테스트
  const freshSession = {
    id: 'sess-clean-end',
    channelId: 'call_clean_123',
    hostId: 'host-1',
    guestId: 'guest-1',
    ratePerMinute: 1500,
    status: CallStatus.CONNECTED,
    billedMinutes: 3,
    totalDeducted: 4500,
    platformFee: 1575,
    creatorRevenue: 2925,
  };
  mockDb.sessions.set(freshSession.id, freshSession);

  const ended = await callService.terminateCall('sess-clean-end', 'host-1', 'USER_HUNG_UP');
  assert(ended.status === CallStatus.TERMINATED, '호스트 종료 요청 시 TERMINATED 전환');
  assert(ended.endReason === 'USER_HUNG_UP', '종료 사유 USER_HUNG_UP 기록');

  // =========================================================================
  // 5. 스냅샷 감사 및 AI 비전 채증 파이프라인 검증
  // =========================================================================
  console.log('\n--- 5. 아고라 스냅샷 24시간 실시간 AI 채증 파이프라인 검증 ---');
  const mockConfigService: any = {
    get: (key: string) => {
      if (key === 'GEMINI_API_KEY') return 'mock_gemini_key';
      return null;
    },
  };

  const auditor = new SnapshotAuditorService(mockPrisma, mockGateway, mockConfigService);
  const defaultInterval = auditor.getChannelCaptureInterval('room-test');
  assert(defaultInterval === 20, '평시 캡처 주기 20초 기본값 정상');

  console.log('\n================================================================');
  console.log(`🎉 모든 핵심 데이터 파이프라인 검증 통과! (${passedTests}/${totalTests})`);
  console.log('================================================================\n');
}

runCorePipelineVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
