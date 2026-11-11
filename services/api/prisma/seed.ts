// services/api/prisma/seed.ts
import { PrismaClient, Prisma } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

async function seedAdminUser() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim()
  const plain = process.env.SEED_ADMIN_PASSWORD

  if (!email || !plain) {
    console.log(
      'ℹ️ SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD not set. Skipping admin user seeding.'
    )
    return
  }

  const passwordHash = await argon2.hash(plain)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'admin',
      status: 'active',
      provider: 'email',
      displayName: 'Super Admin',
      trustScore: 100,
      lang: 'ko',
    },
    create: {
      email,
      passwordHash,
      role: 'admin',
      status: 'active',
      provider: 'email',
      displayName: 'Super Admin',
      trustScore: 100,
      lang: 'ko',
    },
  })

  await prisma.adminProfile.upsert({
    where: { userId: user.id },
    update: {
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      permissions: ['users.manage', 'reports.view', 'content.manage', 'settings.manage'],
    },
    create: {
      userId: user.id,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      permissions: ['users.manage', 'reports.view', 'content.manage', 'settings.manage'],
    },
  })

  console.log(`Seeded/updated admin user: ${email}`)
}

async function seedTopics() {
  const topics = ['일상', '연애', '취미', '여행', '운동', '반려동물', '요리', '음악', '게임', '진로']
  for (const name of topics) {
    await prisma.topic.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
}

async function seedAnnouncements() {
  // 테이블이 아직 없을 수 있으므로 안전하게 시도-캐치
  try {
    await prisma.announcement.upsert({
      where: { id: 'seed-welcome' },
      update: {},
      create: {
        id: 'seed-welcome',
        title: '관리자 패널 오픈',
        body: '딱친 관리자 패널이 준비되었습니다.',
        isActive: true,
        startsAt: new Date(),
      },
    })
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021') {
      // The table `Announcement` does not exist
      console.log('ℹ️ Announcement table not found. Skipping announcements seeding.')
      return
    }
    throw e
  }
}

async function seedSystemSettings() {
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'DEFAULT_CALL_RATE_PER_MINUTE' },
      update: {},
      create: {
        key: 'DEFAULT_CALL_RATE_PER_MINUTE',
        value: '1500',
        description: '1:1 영상 통화 기본 분당 요금(포인트)',
      },
    })
    console.log('Seeded SystemSetting: DEFAULT_CALL_RATE_PER_MINUTE=1500')
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021') {
      console.log('ℹ️ SystemSetting table not found. Skipping system settings seeding.')
      return
    }
    throw e
  }
}

async function seedTestUsers() {
  const passwordHash = await argon2.hash('12345678');

  // test01 (스트리머/호스트 - 일반 사용자)
  await prisma.user.upsert({
    where: { email: 'test01@te.te' },
    update: {
      passwordHash,
      role: 'user',
      status: 'active',
      nickname: '테스터01',
      displayName: '테스터01(스트리머)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      bio: '모꼬 공식 라이브 스트리머 테스트 계정',
      pointBalance: 100000,
    },
    create: {
      email: 'test01@te.te',
      passwordHash,
      role: 'user',
      status: 'active',
      nickname: '테스터01',
      displayName: '테스터01(스트리머)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      bio: '모꼬 공식 라이브 스트리머 테스트 계정',
      pointBalance: 100000,
    },
  });

  // test02 (시청자 - 일반 사용자)
  await prisma.user.upsert({
    where: { email: 'test02@te.te' },
    update: {
      passwordHash,
      role: 'user',
      status: 'active',
      nickname: '테스터02',
      displayName: '테스터02(시청자)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      bio: '모꼬 라이브 시청 및 꿀떡 선물 테스트 계정',
      pointBalance: 500000,
    },
    create: {
      email: 'test02@te.te',
      passwordHash,
      role: 'user',
      status: 'active',
      nickname: '테스터02',
      displayName: '테스터02(시청자)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      bio: '모꼬 라이브 시청 및 꿀떡 선물 테스트 계정',
      pointBalance: 500000,
    },
  });

  console.log('✅ Seeded test01 and test02 as regular users (role: user)');
}

async function main() {
  await seedAdminUser()
  await seedTestUsers()
  await seedTopics()
  await seedAnnouncements()
  await seedSystemSettings()
  console.log('✅ Seed completed')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
