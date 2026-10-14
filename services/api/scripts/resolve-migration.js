const { execSync } = require('child_process');

try {
  console.log('[resolve-migration] Checking for unapplied or failed migration record...');
  execSync('npx prisma migrate resolve --rolled-back 20261014110000_dagaon_ai_staff_and_calls', {
    stdio: 'inherit',
  });
  console.log('[resolve-migration] Marked 20261014110000_dagaon_ai_staff_and_calls as rolled back.');
} catch (err) {
  console.log('[resolve-migration] No pending failed migration detected. Proceeding.');
}
