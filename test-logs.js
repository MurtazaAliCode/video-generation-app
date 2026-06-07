const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all webhook logs from database...');
  const logs = await prisma.webhookLog.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });
  console.log(`Found ${logs.length} logs:`);
  console.log(JSON.stringify(logs, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
