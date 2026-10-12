// apps/mobile/scripts/generate_qr.js
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const IP = '59.0.146.72';
const EXPO_URL = `exp://${IP}:8081`;
const APK_URL = 'https://tmpfiles.org/dl/wOAV6q2QrG2m/dagaon-release.apk';
const WEB_ADMIN_URL = `http://${IP}:3000`;

const ARTIFACT_DIR = path.resolve('C:/Users/sonoo/.gemini/antigravity-ide/brain/a9268c67-4d3a-4065-9327-bcb9dd1f23db');
const ADMIN_PUBLIC_DIR = path.resolve(__dirname, '../../admin/public/downloads');

if (!fs.existsSync(ADMIN_PUBLIC_DIR)) {
  fs.mkdirSync(ADMIN_PUBLIC_DIR, { recursive: true });
}

async function run() {
  console.log('--- Generating QR Codes ---');

  // 1. Expo Go QR Image
  const expoPngArtifact = path.join(ARTIFACT_DIR, 'expo_go_qr.png');
  const expoPngAdmin = path.join(ADMIN_PUBLIC_DIR, 'expo_go_qr.png');
  await QRCode.toFile(expoPngArtifact, EXPO_URL, {
    width: 360,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
  await QRCode.toFile(expoPngAdmin, EXPO_URL, {
    width: 360,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
  console.log(`[1] Expo Go QR Code saved to: ${expoPngArtifact}`);

  // 2. Android APK Download QR Image
  const apkPngArtifact = path.join(ARTIFACT_DIR, 'apk_download_qr.png');
  const apkPngAdmin = path.join(ADMIN_PUBLIC_DIR, 'apk_download_qr.png');
  await QRCode.toFile(apkPngArtifact, APK_URL, {
    width: 360,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
  await QRCode.toFile(apkPngAdmin, APK_URL, {
    width: 360,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
  console.log(`[2] APK Download QR Code saved to: ${apkPngArtifact}`);

  // 3. Terminal ASCII output for Expo Go
  console.log('\n=========================================');
  console.log('📱 [Expo Go] iPhone / Android 접속용 QR 코드:');
  console.log(`URL: ${EXPO_URL}`);
  console.log('=========================================');
  const expoTerminal = await QRCode.toString(EXPO_URL, { type: 'terminal', small: true });
  console.log(expoTerminal);

  // 4. Terminal ASCII output for APK Download
  console.log('=========================================');
  console.log('🤖 [Android 폰] 릴리즈 APK 즉시 다운로드용 QR 코드:');
  console.log(`URL: ${APK_URL}`);
  console.log('=========================================');
  const apkTerminal = await QRCode.toString(APK_URL, { type: 'terminal', small: true });
  console.log(apkTerminal);

  console.log('--- QR Code Generation Completed Successfully ---');
}

run().catch((err) => {
  console.error('Failed to generate QR codes:', err);
  process.exit(1);
});
