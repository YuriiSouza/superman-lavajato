import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@supermanlavajato.com.br' },
    update: {},
    create: { email: 'admin@supermanlavajato.com.br', password, name: 'Administrador' },
  });

  const services = [
    { name: 'Lavagem Simples', price: 40, duration: 30 },
    { name: 'Lavagem Completa', price: 80, duration: 60 },
    { name: 'Enceramento Premium', price: 140, duration: 90 },
    { name: 'Detalhamento Herói', price: 280, duration: 180 },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { id: s.name },
      update: {},
      create: s,
    });
  }

  console.log('Seed concluído.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
