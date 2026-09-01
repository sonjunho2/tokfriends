#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

const repoRoot = path.resolve(__dirname, '..', '..');
const defaultAdminPath = path.resolve(repoRoot, '..', 'tokfriends-admin');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let adminWorkspace = process.env.TOKFRIENDS_ADMIN_PATH
  ? path.resolve(process.env.TOKFRIENDS_ADMIN_PATH)
  : defaultAdminPath;

const menuItems = [
  { key: '1', label: 'git status', command: () => runInAdmin('git', ['status']) },
  { key: '2', label: 'git pull', command: () => runInAdmin('git', ['pull']) },
  {
    key: '3',
    label: 'npm install',
    command: () => runInAdmin(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install']),
  },
  {
    key: '4',
    label: 'npm run dev',
    command: () => runInAdmin(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev']),
  },
  {
    key: '5',
    label: '직접 명령 입력',
    command: () =>
      prompt(`관리자 폴더에서 실행할 명령을 입력하세요\n(ex: npm run build): `, async (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
          console.log('\n⚠️  실행할 명령이 필요합니다.');
          return showMenu();
        }
        await runInAdmin(trimmed, [], { shell: true });
      }),
  },
  {
    key: 'p',
    label: '관리자 폴더 경로 다시 지정',
    command: () =>
      prompt(
        `관리자 프로젝트 경로를 입력하세요\n(현재: ${adminWorkspace || '설정되지 않음'}): `,
        (value) => {
          const resolved = path.resolve(value.trim() || defaultAdminPath);
          if (!isValidAdminPath(resolved)) {
            console.log(`\n⚠️  ${resolved} 경로에서 관리자 프로젝트를 찾을 수 없습니다.`);
            return showMenu();
          }
          adminWorkspace = resolved;
          console.log(`\n✅ 관리자 프로젝트 경로가 ${adminWorkspace} 로 설정됐어요.`);
          showMenu();
        },
      ),
  },
  {
    key: 'o',
    label: '관리자 폴더 경로 표시',
    command: async () => {
      console.log(`\n현재 관리자 프로젝트 경로: ${adminWorkspace}`);
      console.log('터미널에서 다음 명령으로 이동할 수 있어요:');
      console.log(`cd ${adminWorkspace}`);
      showMenu();
    },
  },
  { key: 'q', label: '종료', command: () => rl.close() },
];

function prompt(question, handler) {
  rl.question(question, async (answer) => {
    try {
      await handler(answer ?? '');
    } catch (error) {
      console.error('\n❌ 명령 실행 중 오류가 발생했습니다:', error.message || error);
      showMenu();
    }
  });
}

function isValidAdminPath(targetPath) {
  if (!targetPath) return false;
  try {
    const stats = fs.statSync(targetPath);
    if (!stats.isDirectory()) return false;
    const packageJsonPath = path.join(targetPath, 'package.json');
    return fs.existsSync(packageJsonPath);
  } catch (error) {
    return false;
  }
}

async function runInAdmin(command, args = [], options = {}) {
  if (!ensureAdminPath()) {
    showMenu();
    return;
  }

  return new Promise((resolve) => {
    const spawned = spawn(command, args, {
      cwd: adminWorkspace,
      stdio: 'inherit',
      shell: options.shell || false,
    });

    spawned.on('exit', (code) => {
      if (code === 0) {
        console.log('\n✅ 명령이 정상적으로 완료됐어요.');
      } else {
        console.log(`\n⚠️  명령이 종료 코드 ${code} 로 종료됐어요.`);
      }
      resolve();
      showMenu();
    });

    spawned.on('error', (error) => {
      console.error('\n❌ 명령 실행에 실패했습니다:', error.message || error);
      resolve();
      showMenu();
    });
  });
}

function ensureAdminPath() {
  if (isValidAdminPath(adminWorkspace)) {
    return true;
  }

  console.log('\n⚠️  관리자 프로젝트 경로를 찾을 수 없습니다.');
  console.log('tokfriends-app와 같은 상위 폴더에 tokfriends-admin이 있는지 확인하거나,');
  console.log('메뉴에서 "관리자 폴더 경로 다시 지정" 옵션을 선택해 직접 경로를 입력해 주세요.');
  return false;
}

function showMenu() {
  console.log('\n==============================================');
  console.log(' TokFriends 관리자 작업 프롬프트');
  console.log(' 현재 관리자 경로:', adminWorkspace);
  console.log('==============================================');
  console.log('실행할 작업을 선택하세요:');
  menuItems.forEach((item) => {
    console.log(`  [${item.key}] ${item.label}`);
  });
  rl.question('\n선택: ', async (answer = '') => {
    const choice = answer.trim().toLowerCase();
    const menuItem = menuItems.find((item) => item.key === choice);
    if (!menuItem) {
      console.log('\n⚠️  지원하지 않는 선택입니다. 다시 시도해 주세요.');
      return showMenu();
    }
    try {
      await menuItem.command();
    } catch (error) {
      console.error('\n❌ 작업 실행 중 오류가 발생했습니다:', error.message || error);
      showMenu();
    }
  });
}

rl.on('close', () => {
  console.log('\n👋 관리자 작업 프롬프트를 종료합니다.');
  process.exit(0);
});

console.log('TokFriends 관리자 작업 프롬프트를 시작합니다.');
if (!isValidAdminPath(adminWorkspace)) {
  console.log('\n⚠️  기본 경로에서 관리자 프로젝트를 찾지 못했어요.');
  console.log('메뉴에서 [p] 옵션을 선택해 정확한 경로를 지정해 주세요.');
}
showMenu();
