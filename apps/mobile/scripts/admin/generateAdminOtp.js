#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const generateRandomCode = () => String(Math.floor(Math.random() * 900000) + 100000);

console.log('TokFriends 관리자 인증번호 생성 도우미');
console.log('-----------------------------------');
console.log('직접 6자리 숫자를 입력하거나, 비워 두면 무작위로 생성돼요.');

rl.question('사용할 관리자 인증번호를 입력하세요 (선택): ', (answer) => {
  const sanitized = String(answer || '')
    .replace(/\D/g, '')
    .slice(0, 6);
  const code = sanitized || generateRandomCode();

  console.log('\n생성된 관리자 인증번호:', code);
  console.log('\n앱에서 사용하려면 다음 환경 변수를 설정하세요:');
  console.log(`EXPO_PUBLIC_ADMIN_OVERRIDE_CODES=${code}`);
  console.log('\n여러 코드를 사용하려면 콤마로 구분하세요. 예: EXPO_PUBLIC_ADMIN_OVERRIDE_CODES=123456,654321');
  console.log('환경 변수를 추가한 뒤 앱을 다시 빌드하거나 재실행하면 즉시 적용돼요.');

  rl.close();
});

rl.on('close', () => process.exit(0));
