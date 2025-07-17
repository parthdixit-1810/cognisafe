const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({ data: { twoFactorEnabled: true } });
  console.log('2FA enabled for all users!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect()); 