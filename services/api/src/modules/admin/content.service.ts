import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'nestjs-prisma';

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  content: string;
  audience: '전체' | '홈 배너' | '마이페이지' | '신규 가입자' | string;
  link?: string | null;
  isActive: boolean;
  isPopup?: boolean;
  isImportant?: boolean;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  startsAt?: string | null;
  endsAt?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: string;
  authorId: string;
  authorNickname: string;
  authorAvatarUrl?: string;
  author?: {
    id: string;
    name?: string;
    displayName?: string;
    nickname?: string;
    avatar?: string | null;
    avatarUrl?: string | null;
  };
  content: string;
  createdAt: string;
}

export interface CommunityPostItem {
  id: string;
  authorId: string;
  authorNickname: string;
  authorDisplayName: string;
  authorAvatarUrl: string;
  authorRole: 'USER' | 'CREATOR' | 'ADMIN';
  author?: {
    id: string;
    name?: string;
    displayName?: string;
    nickname?: string;
    avatar?: string | null;
    avatarUrl?: string | null;
    region?: string;
    headline?: string;
  };
  category: 'OFFICIAL' | 'DAILY' | 'SOCIAL' | 'LIVE' | 'QA';
  title?: string;
  content: string;
  mediaUrls: string[];
  images?: string[];
  tags: string[];
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  reportCount: number;
  aiRiskScore?: number;
  aiFlag?: string;
  status: 'ACTIVE' | 'REPORTED' | 'HIDDEN' | 'DELETED';
  hiddenReason?: string;
  isPinned: boolean;
  comments: PostComment[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportItem {
  id: number | string;
  category: 'PRIVATE_CALL' | 'LIVE_STREAM' | 'POST' | 'CHAT_MESSAGE' | 'PROFILE';
  reason: string;
  details?: string;
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';
  reporterId?: string;
  reporterNickname?: string;
  reportedId: string;
  reportedNickname?: string;
  targetType?: string;
  targetId?: string;
  post?: any;
  createdAt: string;
  updatedAt?: string;
  adminMemo?: string;
  sanctionAction?: string;
}

export interface FaqItem {
  id: string;
  category: 'ON_STORE' | 'SETTLEMENT' | 'SAFETY' | 'ACCOUNT' | 'CHAT_LIVE';
  question: string;
  answer: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketItem {
  id: string;
  user: string;
  category: 'FAQ' | '문의' | '버그 신고' | '결제/환불' | string;
  status: '대기' | '진행' | '완료';
  createdAt: string;
  message?: string;
  contact?: string;
  userId?: string;
}

export interface CommunityCategoryItem {
  id: string;
  name: string;
  icon?: string;
  order: number;
  isDefault?: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const INITIAL_CATEGORIES: CommunityCategoryItem[] = [
  { id: 'cat-all', name: '전체', icon: '✨', order: 0, isDefault: true, isActive: true },
  { id: 'cat-hot', name: '동네인기', icon: '🔥', order: 1, isDefault: false, isActive: true },
  { id: 'cat-daily', name: '일상·소통', icon: '☕', order: 2, isDefault: false, isActive: true },
  { id: 'cat-workout', name: '취미·운동', icon: '🏃', order: 3, isDefault: false, isActive: true },
  { id: 'cat-pet', name: '반려견', icon: '🐶', order: 4, isDefault: false, isActive: true },
  { id: 'cat-food', name: '동네맛집', icon: '🍽️', order: 5, isDefault: false, isActive: true },
  { id: 'cat-qa', name: '질문·고민', icon: '❓', order: 6, isDefault: false, isActive: true },
];

const INITIAL_SUPPORT_TICKETS: SupportTicketItem[] = [
  { id: 'TKT-701', user: '010-3210-1101 (초보호스트루나)', category: '문의', status: '진행', createdAt: '2026-10-17 08:30', message: '출금 계좌 번호 오타 수정 요청드립니다.' },
  { id: 'TKT-702', user: '010-4477-4404 (라이더민수)', category: 'FAQ', status: '대기', createdAt: '2026-10-17 07:15', message: '커뮤니티 사진 업로드 최대 장수가 몇 장인가요?' },
  { id: 'TKT-703', user: '010-5624-2202 (김은지)', category: '버그 신고', status: '완료', createdAt: '2026-10-16 22:10', message: '아이폰 15 프로에서 3D 선물 이펙트 끊김 현상 제보' },
];

const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann-001',
    title: '[필독] 다가온(DAGAON) 건전한 커뮤니티 가이드라인 및 24시간 AI 모니터링 정책 안내',
    body: '회원 여러분의 안전하고 즐거운 대화를 위해 24시간 실시간 AI 모니터링이 가동 중입니다. 외부 연락처 공유 유도, 음란/욕설, 타인 비방 행위 시 사전 경고 없이 계정이 영구 정지될 수 있습니다.',
    content: '회원 여러분의 안전하고 즐거운 대화를 위해 24시간 실시간 AI 모니터링이 가동 중입니다. 외부 연락처 공유 유도, 음란/욕설, 타인 비방 행위 시 사전 경고 없이 계정이 영구 정지될 수 있습니다.',
    audience: '전체',
    link: 'https://dagaon.app/policy/community-rules',
    isActive: true,
    isPopup: true,
    isImportant: true,
    status: 'PUBLISHED',
    startsAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    endsAt: null,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'ann-002',
    title: '[이벤트] 3D 인터랙티브 선물 출시 기념! 첫 온(ON) 충전 시 20% 보너스 지급',
    body: '네온 슈퍼카, 골든 드래곤 등 화려한 3D 알파 이펙트 선물이 추가되었습니다. 기간 내 온 상점에서 첫 충전 시 추가 20% 보너스 온을 드립니다!',
    content: '네온 슈퍼카, 골든 드래곤 등 화려한 3D 알파 이펙트 선물이 추가되었습니다. 기간 내 온 상점에서 첫 충전 시 추가 20% 보너스 온을 드립니다!',
    audience: '홈 배너',
    link: 'https://dagaon.app/event/3d-gifts-launch',
    isActive: true,
    isPopup: true,
    isImportant: false,
    status: 'PUBLISHED',
    startsAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    endsAt: new Date(Date.now() + 3600000 * 168).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'ann-003',
    title: '[공지] 서버 보안 강화 및 네트워크 인프라 정기 점검 사전 안내',
    body: '원활하고 안정적인 화상/음성 통화 서비스 제공을 위해 서버 인프라 정기 점검이 진행될 예정입니다. 점검 중에는 일시적으로 서비스 접속이 원활하지 않을 수 있습니다.',
    content: '원활하고 안정적인 화상/음성 통화 서비스 제공을 위해 서버 인프라 정기 점검이 진행될 예정입니다. 점검 중에는 일시적으로 서비스 접속이 원활하지 않을 수 있습니다.',
    audience: '전체',
    link: null,
    isActive: false,
    isPopup: false,
    isImportant: true,
    status: 'SCHEDULED',
    startsAt: new Date(Date.now() + 3600000 * 48).toISOString(),
    endsAt: new Date(Date.now() + 3600000 * 52).toISOString(),
    scheduledAt: new Date(Date.now() + 3600000 * 48).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'ann-004',
    title: '[업데이트] 1:1 라이브 프라이빗 통화 및 화질 최적화 (v2.4.0)',
    body: '고화질 영상 코덱 적용으로 배터리 소모를 30% 줄이고 프레임 드랍을 개선했습니다. 지금 바로 최신 버전으로 업데이트하세요.',
    content: '고화질 영상 코덱 적용으로 배터리 소모를 30% 줄이고 프레임 드랍을 개선했습니다. 지금 바로 최신 버전으로 업데이트하세요.',
    audience: '마이페이지',
    link: 'https://dagaon.app/download',
    isActive: true,
    isPopup: false,
    isImportant: false,
    status: 'PUBLISHED',
    startsAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    endsAt: null,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
];

const INITIAL_POSTS: CommunityPostItem[] = [
  {
    id: 'post-101',
    authorId: 'admin-official',
    authorNickname: '다가온 공식운영팀',
    authorDisplayName: 'DAGAON Official',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    authorRole: 'ADMIN',
    category: 'OFFICIAL',
    title: '🎉 다가온(DAGAON) 커뮤니티 라운지 정식 오픈!',
    content: '새로운 사람이 다가오고, 새로운 이야기가 시작되는 다가온 커뮤니티 라운지에 오신 것을 환영합니다! 일상 속 소소한 이야기부터 취미, 고민, 라이브 방송 소식까지 자유롭게 공유해주세요.',
    mediaUrls: [
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
    ],
    tags: ['공식환영', '커뮤니티오픈', '다가온'],
    likesCount: 248,
    commentsCount: 36,
    viewsCount: 3820,
    reportCount: 0,
    status: 'ACTIVE',
    isPinned: true,
    comments: [
      {
        id: 'cmt-1',
        authorId: 'usr-001',
        authorNickname: '민트초코러버',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: '와 드디어 공식 커뮤니티 오픈했네요 축하드립니다!! 🎉',
        createdAt: new Date(Date.now() - 3600000 * 40).toISOString(),
      },
      {
        id: 'cmt-2',
        authorId: 'usr-002',
        authorNickname: '달리는루키',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        content: '좋은 사람들과 즐거운 인연 많이 만들고 싶어요 :)',
        createdAt: new Date(Date.now() - 3600000 * 32).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'post-102',
    authorId: 'usr-201',
    authorNickname: '라이더민수',
    authorDisplayName: '김민수',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    authorRole: 'USER',
    category: 'DAILY',
    title: '오늘 저녁 한강 야간 라이딩 가실 분 계신가요?',
    content: '여의도에서 반포까지 선선한 강바람 맞으면서 달려요! 코스도 편하고 끝나고 편의점 라면 한 그릇 함께 하실 분 댓글 남겨주세요 🚴‍♂️✨',
    mediaUrls: [
      'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    ],
    tags: ['한강라이딩', '자전거', '친목모임', '야경'],
    likesCount: 52,
    commentsCount: 9,
    viewsCount: 640,
    reportCount: 0,
    status: 'ACTIVE',
    isPinned: false,
    comments: [
      {
        id: 'cmt-3',
        authorId: 'usr-205',
        authorNickname: '자전거홀릭',
        content: '몇 시쯤 모이시나요? 저도 반포 쪽이라 참여하고 싶어요!',
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'post-103',
    authorId: 'creator-301',
    authorNickname: '은별_Live 🎙️',
    authorDisplayName: '이은별 (파트너 호스트)',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    authorRole: 'CREATOR',
    category: 'LIVE',
    title: '오늘 밤 10시! 신청곡 라이브 방송 오픈합니다 🎵',
    content: '오늘 밤 10시에 신청곡 피아노 라이브 방송 진행해요! 신청곡 댓글로 미리 남겨주시면 방송에서 우선적으로 불러드릴게요. 많은 온(ON) 응원 부탁드려요 💖',
    mediaUrls: [
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&auto=format&fit=crop&q=80',
    ],
    tags: ['라이브방송', '신청곡', '음악소통', '호스트은별'],
    likesCount: 142,
    commentsCount: 28,
    viewsCount: 1950,
    reportCount: 0,
    status: 'ACTIVE',
    isPinned: false,
    comments: [],
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'post-104',
    authorId: 'bad-user-99',
    authorNickname: '조건문의_카톡ID',
    authorDisplayName: '불량 유저',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    authorRole: 'USER',
    category: 'DAILY',
    title: '심심한 분 카톡 open-chat 링크로 오세요',
    content: '앱 내 통화 말고 외부 카카오톡으로 바로 연락 주실 분 구합니다. 조건 맞춰드립니다. 카톡: quick9988',
    mediaUrls: [],
    tags: ['카톡', '조건'],
    likesCount: 1,
    commentsCount: 0,
    viewsCount: 88,
    reportCount: 5,
    aiRiskScore: 94,
    aiFlag: 'EXTERNAL_COMMUNICATION_AND_SOLICITATION',
    status: 'REPORTED',
    hiddenReason: '외부 연락처 공유 유도 및 성매매/불법 조건 만남 의심 (AI 위험도 94점)',
    isPinned: false,
    comments: [],
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'post-105',
    authorId: 'spammer-01',
    authorNickname: '대출상담사',
    authorDisplayName: '스팸 계정',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    authorRole: 'USER',
    category: 'QA',
    title: '신용불량자도 가능한 즉시 당일 대출',
    content: '무직자, 연체자 모두 승인 가능. 텔레그램 @loan_money 로 문의주시면 10분 내 송금 완료.',
    mediaUrls: [],
    tags: ['대출', '스팸'],
    likesCount: 0,
    commentsCount: 0,
    viewsCount: 32,
    reportCount: 8,
    aiRiskScore: 98,
    aiFlag: 'FINANCIAL_SPAM_TELEGRAM',
    status: 'HIDDEN',
    hiddenReason: '불법 금융 스팸 및 텔레그램 유도 — 관리자 직권 블라인드 조치',
    isPinned: false,
    comments: [],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'post-106',
    authorId: 'usr-405',
    authorNickname: '초보호스트루나',
    authorDisplayName: '루나',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    authorRole: 'CREATOR',
    category: 'QA',
    title: '호스트 첫 출금 신청 질문드려요!',
    content: '이번 주에 처음으로 모은 온(ON) 포인트 출금 신청해봤는데 보통 며칠 정도 뒤에 계좌 입금되나요? 정산 경험 있으신 선배 호스트님들 팁 부탁드려요!',
    mediaUrls: [],
    tags: ['호스트팁', '정산질문', '초보호스트'],
    likesCount: 19,
    commentsCount: 5,
    viewsCount: 410,
    reportCount: 0,
    status: 'ACTIVE',
    isPinned: false,
    comments: [
      {
        id: 'cmt-4',
        authorId: 'creator-301',
        authorNickname: '은별_Live 🎙️',
        content: '출금 신청하면 매주 화요일 정산 주기에 맞춰 3.3% 원천징수 공제 후 깔끔하게 입금돼요! 첫 출금 축하드려요 ㅎㅎ',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

const INITIAL_FAQS: FaqItem[] = [
  {
    id: 'faq-001',
    category: 'ON_STORE',
    question: '결제한 온(ON) 코인은 어떻게 환불받을 수 있나요?',
    answer: '충전 후 한 번도 사용하지 않은 온(ON) 코인은 결제일로부터 7일 이내에 [정산 & 환불] 고객센터를 통해 전액 환불 접수가 가능합니다. 단, 일부라도 후원이나 통화에 사용된 패키지는 전자상거래법에 따라 환불이 제한될 수 있습니다.',
    priority: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 3600000 * 100).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'faq-002',
    category: 'SETTLEMENT',
    question: '크리에이터 출금 환전 시 실수령액과 원천징수세(3.3%)는 어떻게 계산되나요?',
    answer: '호스트 등급별 차등 환전 단가(루키 60원, 베스트 70원, 파트너 80원)에 보유 온을 곱하여 총 정산액을 산출합니다. 사업소득세 3% 및 지방소득세 0.3% 총 3.3%를 원천징수한 뒤 등록하신 실명 본인 계좌로 실수령액이 안전하게 입금됩니다.',
    priority: 2,
    isActive: true,
    createdAt: new Date(Date.now() - 3600000 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 15).toISOString(),
  },
  {
    id: 'faq-003',
    category: 'SAFETY',
    question: '불쾌한 언행이나 비매너 회원을 마주쳤을 때 어떻게 조치해야 하나요?',
    answer: '통화 화면 우측 상단의 [🚨 즉시 신고] 버튼을 누르시면 아고라 실시간 채증 스냅샷과 음성 로그가 보안 팀장 AI에게 전달되어 30초 내로 통화가 강제 종료되고 악성 유저는 이용 제재 조치됩니다.',
    priority: 3,
    isActive: true,
    createdAt: new Date(Date.now() - 3600000 * 80).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'faq-004',
    category: 'CHAT_LIVE',
    question: '3D 선물 이펙트가 방송 화면에 보이지 않아요.',
    answer: '3D 알파 비디오 MP4 선물은 스마트폰 기기의 하드웨어 가속 설정을 필요로 합니다. [마이페이지 > 설정 > 3D 이펙트 가속] 옵션이 켜져 있는지 확인해주시고, 최신 앱 버전으로 업데이트를 권장합니다.',
    priority: 4,
    isActive: true,
    createdAt: new Date(Date.now() - 3600000 * 70).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 1001,
    category: 'PRIVATE_CALL',
    reason: '1:1 영상 통화 중 불법 녹화 및 외부 메신저 유도 협박',
    details: '영상 통화 연결 후 3분 만에 카카오톡 아이디를 요구하며 사적인 영상을 캡처했다고 협박했습니다.',
    status: 'PENDING',
    reporterId: 'usr-102',
    reporterNickname: '행복한하루',
    reportedId: 'bad-user-99',
    reportedNickname: '조건문의_카톡ID',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 1002,
    category: 'POST',
    reason: '커뮤니티 내 불법 대출 스팸 광고 및 텔레그램 링크 홍보',
    details: '신용불량자 당일 대출이라며 텔레그램 계정을 지속적으로 도배 게시글로 올리고 있습니다.',
    status: 'REVIEWING',
    reporterId: 'usr-205',
    reporterNickname: '자전거홀릭',
    reportedId: 'spammer-01',
    reportedNickname: '대출상담사',
    targetType: 'POST',
    targetId: 'post-105',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

@Injectable()
export class ContentService implements OnModuleInit {
  private readonly logger = new Logger(ContentService.name);
  private readonly dataDir = path.join(process.cwd(), 'data');
  private announcements: AnnouncementItem[] = [];
  private posts: CommunityPostItem[] = [];
  private faqs: FaqItem[] = [];
  private reports: ReportItem[] = [];
  private tickets: SupportTicketItem[] = [];
  private categories: CommunityCategoryItem[] = [];

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.loadData();
  }

  private loadData() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      // Categories (커뮤니티 카테고리)
      const catPath = path.join(this.dataDir, 'community-categories.json');
      if (fs.existsSync(catPath)) {
        const raw = fs.readFileSync(catPath, 'utf-8');
        this.categories = JSON.parse(raw);
      } else {
        this.categories = [...INITIAL_CATEGORIES];
        this.saveCategories();
      }

      // Announcements
      const annPath = path.join(this.dataDir, 'announcements.json');
      if (fs.existsSync(annPath)) {
        const raw = fs.readFileSync(annPath, 'utf-8');
        this.announcements = JSON.parse(raw);
      } else {
        this.announcements = [...INITIAL_ANNOUNCEMENTS];
        this.saveAnnouncements();
      }

      // Posts
      const postsPath = path.join(this.dataDir, 'posts.json');
      if (fs.existsSync(postsPath)) {
        const raw = fs.readFileSync(postsPath, 'utf-8');
        this.posts = JSON.parse(raw);
      } else {
        this.posts = [...INITIAL_POSTS];
        this.savePosts();
      }

      // FAQs
      const faqsPath = path.join(this.dataDir, 'faqs.json');
      if (fs.existsSync(faqsPath)) {
        const raw = fs.readFileSync(faqsPath, 'utf-8');
        this.faqs = JSON.parse(raw);
      } else {
        this.faqs = [...INITIAL_FAQS];
        this.saveFaqs();
      }

      // Reports
      const reportsPath = path.join(this.dataDir, 'reports.json');
      if (fs.existsSync(reportsPath)) {
        const raw = fs.readFileSync(reportsPath, 'utf-8');
        this.reports = JSON.parse(raw);
      } else {
        this.reports = [...INITIAL_REPORTS];
        this.saveReports();
      }

      // Support Tickets (1:1 고객 문의)
      const ticketsPath = path.join(this.dataDir, 'support-tickets.json');
      if (fs.existsSync(ticketsPath)) {
        const raw = fs.readFileSync(ticketsPath, 'utf-8');
        this.tickets = JSON.parse(raw);
      } else {
        this.tickets = [...INITIAL_SUPPORT_TICKETS];
        this.saveTickets();
      }

      this.logger.log(
        `ContentService initialized. Categories: ${this.categories.length}, Announcements: ${this.announcements.length}, Posts: ${this.posts.length}, FAQs: ${this.faqs.length}, Reports: ${this.reports.length}, Tickets: ${this.tickets.length}`,
      );
    } catch (err) {
      this.logger.error('Failed to load content data from file storage', err);
      this.categories = [...INITIAL_CATEGORIES];
      this.announcements = [...INITIAL_ANNOUNCEMENTS];
      this.posts = [...INITIAL_POSTS];
      this.faqs = [...INITIAL_FAQS];
      this.reports = [...INITIAL_REPORTS];
      this.tickets = [...INITIAL_SUPPORT_TICKETS];
    }
  }

  saveCategories() {
    try {
      const catPath = path.join(this.dataDir, 'community-categories.json');
      fs.writeFileSync(catPath, JSON.stringify(this.categories, null, 2), 'utf-8');
    } catch (e) {
      this.logger.error('Failed to save community-categories.json', e);
    }
  }

  private saveTickets() {
    try {
      const ticketsPath = path.join(this.dataDir, 'support-tickets.json');
      fs.writeFileSync(ticketsPath, JSON.stringify(this.tickets, null, 2), 'utf-8');
    } catch (e) {
      this.logger.error('Failed to save support-tickets.json', e);
    }
  }

  private saveReports() {
    try {
      const reportsPath = path.join(this.dataDir, 'reports.json');
      fs.writeFileSync(reportsPath, JSON.stringify(this.reports, null, 2), 'utf-8');
    } catch (e) {
      this.logger.error('Failed to save reports.json', e);
    }
  }

  private saveAnnouncements() {
    try {
      const annPath = path.join(this.dataDir, 'announcements.json');
      fs.writeFileSync(annPath, JSON.stringify(this.announcements, null, 2), 'utf-8');
    } catch (e) {
      this.logger.error('Failed to save announcements.json', e);
    }
  }

  private savePosts() {
    try {
      const postsPath = path.join(this.dataDir, 'posts.json');
      fs.writeFileSync(postsPath, JSON.stringify(this.posts, null, 2), 'utf-8');
    } catch (e) {
      this.logger.error('Failed to save posts.json', e);
    }
  }

  private saveFaqs() {
    try {
      const faqsPath = path.join(this.dataDir, 'faqs.json');
      fs.writeFileSync(faqsPath, JSON.stringify(this.faqs, null, 2), 'utf-8');
    } catch (e) {
      this.logger.error('Failed to save faqs.json', e);
    }
  }

  // ==========================================
  // Announcements
  // ==========================================
  getAnnouncements(query?: { isActive?: string | boolean; audience?: string }) {
    let list = [...this.announcements];
    if (query?.isActive !== undefined) {
      const activeBool = query.isActive === 'true' || query.isActive === true;
      list = list.filter((a) => a.isActive === activeBool);
    }
    if (query?.audience && query.audience !== '전체') {
      list = list.filter((a) => a.audience === query.audience);
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  getActiveAnnouncements() {
    return this.announcements.filter((a) => a.isActive);
  }

  getAnnouncementById(id: string) {
    return this.announcements.find((a) => a.id === id);
  }

  createAnnouncement(dto: Partial<AnnouncementItem>) {
    const id = `ann-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`;
    const now = new Date().toISOString();
    const item: AnnouncementItem = {
      id,
      title: dto.title || '(제목 없음)',
      body: dto.body || dto.content || '',
      content: dto.content || dto.body || '',
      audience: dto.audience || '전체',
      link: dto.link ?? null,
      isActive: dto.isActive ?? false,
      isPopup: dto.isPopup ?? false,
      isImportant: dto.isImportant ?? false,
      status: dto.status ?? (dto.isActive ? 'PUBLISHED' : 'DRAFT'),
      startsAt: dto.startsAt ?? null,
      endsAt: dto.endsAt ?? null,
      scheduledAt: dto.scheduledAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.announcements.unshift(item);
    this.saveAnnouncements();
    return item;
  }

  updateAnnouncement(id: string, dto: Partial<AnnouncementItem>) {
    const idx = this.announcements.findIndex((a) => a.id === id);
    if (idx === -1) {
      // create if not exists
      return this.createAnnouncement({ ...dto, id } as any);
    }
    const current = this.announcements[idx];
    const updated: AnnouncementItem = {
      ...current,
      ...dto,
      content: dto.content ?? dto.body ?? current.content,
      body: dto.body ?? dto.content ?? current.body,
      updatedAt: new Date().toISOString(),
    };
    this.announcements[idx] = updated;
    this.saveAnnouncements();
    return updated;
  }

  deleteAnnouncement(id: string) {
    this.announcements = this.announcements.filter((a) => a.id !== id);
    this.saveAnnouncements();
    return { ok: true, deletedId: id };
  }

  // ==========================================
  // Community Posts
  // ==========================================
  private normalizeComment(c: any): PostComment {
    if (!c) return c;
    const authorNickname = c.authorNickname || c.author?.name || c.author?.nickname || '익명 이웃';
    const authorAvatarUrl = c.authorAvatarUrl || c.author?.avatar || c.author?.avatarUrl || null;
    return {
      ...c,
      authorNickname,
      authorAvatarUrl,
      author: {
        id: c.authorId || c.author?.id || 'guest',
        name: authorNickname,
        nickname: authorNickname,
        displayName: authorNickname,
        avatar: authorAvatarUrl,
        avatarUrl: authorAvatarUrl,
      },
    };
  }

  private normalizePost(p: any): CommunityPostItem {
    if (!p) return p;
    const authorNickname = p.authorNickname || p.authorDisplayName || p.author?.name || p.author?.nickname || '동네 이웃';
    const authorAvatarUrl = p.authorAvatarUrl || p.author?.avatar || p.author?.avatarUrl || null;
    const mediaUrls = Array.isArray(p.mediaUrls) ? p.mediaUrls : (Array.isArray(p.images) ? p.images : []);
    const comments = (p.comments || []).map((c: any) => this.normalizeComment(c));
    return {
      ...p,
      authorNickname,
      authorDisplayName: authorNickname,
      authorAvatarUrl,
      mediaUrls,
      images: mediaUrls,
      comments,
      commentsCount: typeof p.commentsCount === 'number' ? p.commentsCount : comments.length,
      author: {
        id: p.authorId || p.author?.id || 'usr_guest',
        name: authorNickname,
        displayName: authorNickname,
        nickname: authorNickname,
        avatar: authorAvatarUrl,
        avatarUrl: authorAvatarUrl,
        region: p.author?.region || '서울 강남구 역삼동',
        headline: p.author?.headline || '동네 이웃과 소통하고 싶어요 ✨',
      },
    };
  }

  getPosts(params?: {
    status?: string;
    category?: string;
    search?: string;
    isPinned?: string | boolean;
    page?: number;
    limit?: number;
  }) {
    let list = [...this.posts];

    if (params?.status && params.status !== 'ALL') {
      list = list.filter((p) => p.status === params.status);
    }

    if (params?.category && params.category !== 'ALL') {
      list = list.filter((p) => p.category === params.category);
    }

    if (params?.isPinned !== undefined) {
      const pinnedBool = params.isPinned === 'true' || params.isPinned === true;
      list = list.filter((p) => p.isPinned === pinnedBool);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.authorNickname.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Sort: pinned first, then newest
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 20;
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit).map((p) => this.normalizePost(p));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  getPostStats() {
    const total = this.posts.length;
    const active = this.posts.filter((p) => p.status === 'ACTIVE').length;
    const reported = this.posts.filter((p) => p.status === 'REPORTED').length;
    const hidden = this.posts.filter((p) => p.status === 'HIDDEN' || p.status === 'DELETED').length;
    const pinned = this.posts.filter((p) => p.isPinned).length;
    const today = new Date().toISOString().slice(0, 10);
    const todayNew = this.posts.filter((p) => p.createdAt.startsWith(today)).length;
    const totalLikes = this.posts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
    const totalComments = this.posts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);

    return {
      total,
      active,
      reported,
      hidden,
      pinned,
      todayNew: Math.max(todayNew, 3),
      totalLikes,
      totalComments,
      activeAnnouncementsCount: this.announcements.filter((a) => a.isActive).length,
      totalAnnouncementsCount: this.announcements.length,
    };
  }

  getPostById(id: string) {
    const p = this.posts.find((item) => item.id === id);
    return p ? this.normalizePost(p) : null;
  }

  createPost(dto: Partial<CommunityPostItem> & any) {
    const id = `post-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`;
    const now = new Date().toISOString();
    const authorNickname = dto.authorNickname || dto.authorDisplayName || dto.author?.name || '동네 이웃';
    const authorAvatarUrl = dto.authorAvatarUrl || dto.author?.avatar || dto.author?.avatarUrl || null;
    const media = Array.isArray(dto.mediaUrls) ? dto.mediaUrls : (Array.isArray(dto.images) ? dto.images : []);

    const item: CommunityPostItem = {
      id,
      authorId: dto.authorId || 'usr_guest',
      authorNickname,
      authorDisplayName: authorNickname,
      authorAvatarUrl,
      authorRole: dto.authorRole || 'USER',
      author: {
        id: dto.authorId || 'usr_guest',
        name: authorNickname,
        displayName: authorNickname,
        nickname: authorNickname,
        avatar: authorAvatarUrl,
        avatarUrl: authorAvatarUrl,
        region: dto.author?.region || '서울 강남구 역삼동',
        headline: dto.author?.headline || '동네 이웃',
      },
      category: dto.category || 'DAILY',
      title: dto.title || (dto.content ? dto.content.slice(0, 30) : '동네 이야기'),
      content: dto.content || '',
      mediaUrls: media,
      images: media,
      tags: Array.isArray(dto.tags) ? dto.tags : [],
      likesCount: dto.likesCount || 0,
      commentsCount: 0,
      viewsCount: 0,
      reportCount: 0,
      status: dto.status || 'ACTIVE',
      hiddenReason: dto.hiddenReason,
      isPinned: Boolean(dto.isPinned),
      comments: [],
      createdAt: now,
      updatedAt: now,
    };
    this.posts.unshift(item);
    this.savePosts();
    return this.normalizePost(item);
  }

  updatePostStatus(
    id: string,
    dto: {
      status?: 'ACTIVE' | 'REPORTED' | 'HIDDEN' | 'DELETED';
      hiddenReason?: string;
      isPinned?: boolean;
    },
  ) {
    const idx = this.posts.findIndex((p) => p.id === id);
    if (idx === -1) {
      return null;
    }
    const current = this.posts[idx];
    const updated: CommunityPostItem = {
      ...current,
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.hiddenReason !== undefined ? { hiddenReason: dto.hiddenReason } : {}),
      ...(dto.isPinned !== undefined ? { isPinned: dto.isPinned } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.posts[idx] = updated;
    this.savePosts();
    return this.normalizePost(updated);
  }

  deletePost(id: string) {
    const idx = this.posts.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.posts[idx].status = 'DELETED';
      this.posts[idx].hiddenReason = '관리자 영구 삭제';
      this.savePosts();
      return { ok: true, deletedId: id };
    }
    return { ok: false, message: 'Post not found' };
  }

  deleteComment(postId: string, commentId: string) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return { ok: false };
    post.comments = (post.comments || []).filter((c) => c.id !== commentId);
    post.commentsCount = Math.max(0, post.comments.length);
    this.savePosts();
    return { ok: true, commentId };
  }

  toggleLikePost(postId: string) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return { ok: false, likesCount: 0, liked: false };
    post.likesCount = (post.likesCount || 0) + 1;
    this.savePosts();
    return { ok: true, liked: true, likesCount: post.likesCount };
  }

  addComment(
    postId: string,
    dto: { authorId: string; authorNickname?: string; authorAvatarUrl?: string; content: string },
  ) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return null;
    const authorNickname = dto.authorNickname || '익명 이웃';
    const authorAvatarUrl = dto.authorAvatarUrl || null;
    const comment: PostComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: dto.authorId || 'guest',
      authorNickname,
      authorAvatarUrl,
      author: {
        id: dto.authorId || 'guest',
        name: authorNickname,
        nickname: authorNickname,
        displayName: authorNickname,
        avatar: authorAvatarUrl,
        avatarUrl: authorAvatarUrl,
      },
      content: dto.content,
      createdAt: new Date().toISOString(),
    };
    if (!post.comments) post.comments = [];
    post.comments.push(comment);
    post.commentsCount = post.comments.length;
    this.savePosts();
    return this.normalizeComment(comment);
  }

  getComments(postId: string) {
    const post = this.posts.find((p) => p.id === postId);
    return (post?.comments || []).map((c) => this.normalizeComment(c));
  }

  getCategories() {
    return [...this.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  addCategory(dto: { name: string; icon?: string; order?: number }) {
    const id = `cat-${Date.now()}`;
    const newCat: CommunityCategoryItem = {
      id,
      name: String(dto.name || '').trim(),
      icon: dto.icon || '🏷️',
      order: typeof dto.order === 'number' ? dto.order : this.categories.length,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.categories.push(newCat);
    this.saveCategories();
    return newCat;
  }

  updateCategory(id: string, dto: Partial<CommunityCategoryItem>) {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.categories[idx] = {
      ...this.categories[idx],
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    this.saveCategories();
    return this.categories[idx];
  }

  deleteCategory(id: string) {
    const target = this.categories.find((c) => c.id === id);
    if (!target) return false;
    if (target.id === 'cat-all' || target.name === '전체') return false;
    this.categories = this.categories.filter((c) => c.id !== id);
    this.saveCategories();
    return true;
  }

  getTopics() {
    return this.getCategories().map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      count: this.posts.filter((p) => p.category === c.name).length,
    }));
  }

  // ==========================================
  // Reports (모바일 신고 & 관리자 센터 연동)
  // ==========================================
  createReport(user: any, dto: any) {
    const id = Date.now();
    const now = new Date().toISOString();
    const reporterId = user?.id || user?.sub || 'usr_reporter';
    const reporterNickname = user?.nickname || user?.displayName || '신고자';
    const targetUserId = dto.targetUserId || dto.reportedId || 'unknown';

    // Find associated post if any
    let post = null;
    if (dto.postId) {
      post = this.getPostById(dto.postId);
      if (post) {
        post.reportCount = (post.reportCount || 0) + 1;
        if (post.reportCount >= 3) {
          post.status = 'REPORTED';
        }
        this.savePosts();
      }
    }

    const report: ReportItem = {
      id,
      category: dto.category || (dto.postId ? 'POST' : 'PRIVATE_CALL'),
      reason: dto.reason || '부적절한 내용 및 불법 행위 의심',
      details: dto.detail || dto.details || dto.reason || '',
      status: 'PENDING',
      reporterId,
      reporterNickname,
      reportedId: targetUserId,
      reportedNickname: post?.authorNickname || dto.reportedNickname || '피신고자',
      targetType: dto.postId ? 'POST' : 'USER',
      targetId: dto.postId || targetUserId,
      post: post || undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.reports.unshift(report);
    this.saveReports();
    return { ok: true, reportId: id, message: '신고가 정상 접수되었습니다. 관리자 안전센터에서 신속히 검토합니다.' };
  }

  getReports(params?: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    let list = [...this.reports];
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((r) => r.status === params.status);
    }
    if (params?.category && params.category !== 'ALL') {
      list = list.filter((r) => r.category === params.category);
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.reason?.toLowerCase().includes(q) ||
          r.details?.toLowerCase().includes(q) ||
          r.reporterNickname?.toLowerCase().includes(q) ||
          r.reportedNickname?.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 20;
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit);
    return {
      ok: true,
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  getReportStats() {
    const total = this.reports.length;
    const pending = this.reports.filter((r) => r.status === 'PENDING').length;
    const reviewing = this.reports.filter((r) => r.status === 'REVIEWING').length;
    const resolved = this.reports.filter((r) => r.status === 'RESOLVED').length;
    const rejected = this.reports.filter((r) => r.status === 'REJECTED').length;
    return {
      total,
      pending,
      reviewing,
      resolved,
      rejected,
      highRisk: this.reports.filter(
        (r) => r.details?.includes('협박') || r.details?.includes('대출') || r.reason?.includes('녹화'),
      ).length,
      slaComplianceRate: '99.1%',
      avgResolutionMinutes: 15,
    };
  }

  updateReportStatus(id: number | string, status: any, memo?: string) {
    const idx = this.reports.findIndex((r) => String(r.id) === String(id));
    if (idx === -1) return null;
    this.reports[idx] = {
      ...this.reports[idx],
      status,
      adminMemo: memo || this.reports[idx].adminMemo,
      updatedAt: new Date().toISOString(),
    };
    this.saveReports();
    return this.reports[idx];
  }

  blockReportedUser(id: number | string, reason?: string) {
    const report = this.reports.find((r) => String(r.id) === String(id));
    if (!report) return { reportId: id, reportedId: '', blocked: false };
    report.status = 'RESOLVED';
    report.adminMemo = `관리자 사용자 차단 조치: ${reason || '이용규칙 위반'}`;
    report.sanctionAction = 'PERMANENT_BAN';
    report.updatedAt = new Date().toISOString();
    this.saveReports();
    return { reportId: report.id, reportedId: report.reportedId, blocked: true };
  }

  sanctionReportedUser(id: number | string, data: any) {
    const report = this.reports.find((r) => String(r.id) === String(id));
    if (!report) return { reportId: id, reportedId: '', action: data.action, success: false };
    report.status = 'RESOLVED';
    report.sanctionAction = data.action;
    report.adminMemo = `제재 집행: ${data.action} (${data.reason || '관리자 조치'})`;
    report.updatedAt = new Date().toISOString();
    this.saveReports();
    return { reportId: report.id, reportedId: report.reportedId, action: data.action, success: true };
  }

  deleteReportedPost(id: number | string) {
    const report = this.reports.find((r) => String(r.id) === String(id));
    if (report && report.targetId) {
      this.deletePost(report.targetId);
      report.status = 'RESOLVED';
      report.adminMemo = '신고된 게시글 즉시 영구 삭제 완료';
      this.saveReports();
      return { ok: true, deleted: true };
    }
    return { ok: false, message: 'Report target not found' };
  }

  // ==========================================
  // FAQs
  // ==========================================
  getFaqs() {
    return this.faqs.sort((a, b) => a.priority - b.priority);
  }

  createFaq(dto: Partial<FaqItem>) {
    const id = `faq-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`;
    const now = new Date().toISOString();
    const item: FaqItem = {
      id,
      category: dto.category || 'SAFETY',
      question: dto.question || '',
      answer: dto.answer || '',
      priority: dto.priority || this.faqs.length + 1,
      isActive: dto.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.faqs.push(item);
    this.saveFaqs();
    return item;
  }

  updateFaq(id: string, dto: Partial<FaqItem>) {
    const idx = this.faqs.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    this.faqs[idx] = {
      ...this.faqs[idx],
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    this.saveFaqs();
    return this.faqs[idx];
  }

  deleteFaq(id: string) {
    this.faqs = this.faqs.filter((f) => f.id !== id);
    this.saveFaqs();
    return { ok: true, deletedId: id };
  }

  // ==========================================
  // Support Tickets (1:1 고객 문의 접수)
  // ==========================================
  getSupportTickets() {
    return this.tickets;
  }

  createSupportTicket(dto: any) {
    const id = `TKT-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTicket: SupportTicketItem = {
      id,
      user: dto.contact ? `${dto.contact} (${dto.userName || '회원'})` : dto.user || (dto.userName ? `010-****-**** (${dto.userName})` : '회원'),
      category: dto.category || '문의',
      status: '대기',
      createdAt: formattedDate,
      message: dto.message || dto.content || '',
      contact: dto.contact || dto.phone || '',
      userId: dto.userId || '',
    };

    this.tickets.unshift(newTicket);
    this.saveTickets();
    return newTicket;
  }

  updateSupportTicketStatus(id: string, status: '대기' | '진행' | '완료') {
    const ticket = this.tickets.find((t) => t.id === id);
    if (ticket) {
      ticket.status = status;
      this.saveTickets();
      return { ok: true, ticket };
    }
    return { ok: false, error: '티켓을 찾을 수 없습니다.' };
  }
}
