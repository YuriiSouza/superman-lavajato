import { PrismaClient, VehicleType, PaymentMethod, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l = () => letters[Math.floor(Math.random() * letters.length)];
  const d = () => Math.floor(Math.random() * 10);
  return `${l()}${l()}${l()}${d()}${d()}${d()}${d()}`;
}

async function main() {
  // ── usuário admin ─────────────────────────────────────────────────────────
  const password = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@supermanlavajato.com.br' },
    update: {},
    create: { email: 'admin@supermanlavajato.com.br', password, name: 'Administrador' },
  });

  // ── serviços ──────────────────────────────────────────────────────────────
  const serviceDefs = [
    { name: 'Lavagem Simples',      price: 40,  duration: 30  },
    { name: 'Lavagem Completa',     price: 80,  duration: 60  },
    { name: 'Enceramento Premium',  price: 140, duration: 90  },
    { name: 'Detalhamento Herói',   price: 280, duration: 180 },
    { name: 'Lavagem de Motor',     price: 120, duration: 60  },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serviceRecords: any[] = [];
  for (const s of serviceDefs) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    const rec = existing
      ? await prisma.service.update({ where: { id: existing.id }, data: { price: s.price, duration: s.duration, active: true } })
      : await prisma.service.create({ data: { ...s, active: true } });
    serviceRecords.push(rec);
  }

  // ── clientes e veículos ───────────────────────────────────────────────────
  const clientDefs = [
    { name: 'João Silva',       phone: '(11) 99100-0001' },
    { name: 'Maria Oliveira',   phone: '(11) 99100-0002' },
    { name: 'Carlos Santos',    phone: '(11) 99100-0003' },
    { name: 'Ana Costa',        phone: '(11) 99100-0004' },
    { name: 'Pedro Alves',      phone: '(11) 99100-0005' },
    { name: 'Fernanda Lima',    phone: '(11) 99100-0006' },
    { name: 'Roberto Souza',    phone: '(11) 99100-0007' },
    { name: 'Juliana Ferreira', phone: '(11) 99100-0008' },
    { name: 'Lucas Rodrigues',  phone: '(11) 99100-0009' },
    { name: 'Camila Martins',   phone: '(11) 99100-0010' },
    { name: 'Marcelo Gomes',    phone: '(11) 99100-0011' },
    { name: 'Patrícia Nunes',   phone: '(11) 99100-0012' },
    { name: 'Rafael Barbosa',   phone: '(11) 99100-0013' },
    { name: 'Larissa Carvalho', phone: '(11) 99100-0014' },
    { name: 'Felipe Ribeiro',   phone: '(11) 99100-0015' },
    { name: 'Tatiane Melo',     phone: '(11) 99100-0016' },
    { name: 'Rodrigo Correia',  phone: '(11) 99100-0017' },
    { name: 'Vanessa Dias',     phone: '(11) 99100-0018' },
    { name: 'Thiago Araújo',    phone: '(11) 99100-0019' },
    { name: 'Gabriela Moreira', phone: '(11) 99100-0020' },
    { name: 'Bruno Pereira',    phone: '(11) 99100-0021' },
    { name: 'Isabela Cardoso',  phone: '(11) 99100-0022' },
    { name: 'Gustavo Castro',   phone: '(11) 99100-0023' },
    { name: 'Renata Teixeira',  phone: '(11) 99100-0024' },
    { name: 'Daniel Pinto',     phone: '(11) 99100-0025' },
    { name: 'Aline Monteiro',   phone: '(11) 99100-0026' },
    { name: 'Eduardo Ramos',    phone: '(11) 99100-0027' },
    { name: 'Cristina Lopes',   phone: '(11) 99100-0028' },
    { name: 'Fábio Nascimento', phone: '(11) 99100-0029' },
    { name: 'Simone Viana',     phone: '(11) 99100-0030' },
  ];

  const vehicleTypes: VehicleType[] = ['SEDAN', 'SUV', 'HATCH', 'PICKUP', 'MOTO'];
  const vehicleModels = ['HB20', 'Onix', 'Gol', 'Polo', 'Argo', 'Compass', 'HR-V', 'T-Cross',
    'Hilux', 'S10', 'Civic', 'Corolla', 'Renegade', 'Creta', 'Kicks'];
  const colors = ['Preto', 'Branco', 'Prata', 'Cinza', 'Vermelho', 'Azul', 'Verde'];
  const payments: PaymentMethod[] = ['PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO'];

  // Distribuição de últimas visitas para testar reativação:
  // ~8 clientes ativos (últimos 10 dias)
  // ~7 clientes borderline (15-29 dias)
  // ~8 clientes inativos (31-60 dias) → aparecem na fila de 30d
  // ~7 clientes sumidos (61-120 dias) → muito urgentes
  const lastVisitDaysAgo = [
    2, 4, 6, 8, 9, 10, 10, 12,   // ativos
    16, 18, 21, 24, 27, 28, 29,  // borderline
    32, 35, 38, 42, 45, 50, 55, 58, // inativos
    65, 70, 80, 90, 100, 110, 120, // sumidos
  ];

  // Remove dados de seed anteriores na ordem correta (FK constraints)
  await prisma.serviceOrder.deleteMany({ where: { notes: { startsWith: '[seed]' } } });
  await prisma.client.deleteMany({ where: { phone: { startsWith: '(11) 99100-' } } });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientRecords: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vehicleRecords: any[][] = [];

  for (let i = 0; i < clientDefs.length; i++) {
    const def = clientDefs[i];

    // Deixa o Prisma gerar UUID válido
    const client = await prisma.client.create({
      data: { name: def.name, phone: def.phone },
    });
    clientRecords.push(client);

    const numVehicles = i < 10 ? 2 : 1;
    const clientVehicles: any[] = [];

    for (let v = 0; v < numVehicles; v++) {
      const plate = `TST${String(i + 1).padStart(2, '0')}${String(v + 1)}A${v}`;
      const vehicle = await prisma.vehicle.upsert({
        where: { plate },
        update: { clientId: client.id },
        create: {
          plate,
          model: pick(vehicleModels),
          color: pick(colors),
          type: pick(vehicleTypes),
          clientId: client.id,
        },
      });
      clientVehicles.push(vehicle);
    }
    vehicleRecords.push(clientVehicles);
  }

  // ── ordens de serviço ─────────────────────────────────────────────────────

  const statusWeights: { status: OrderStatus; weight: number }[] = [
    { status: 'PAGO',        weight: 60 },
    { status: 'CONCLUIDO',   weight: 20 },
    { status: 'PENDENTE',    weight: 10 },
    { status: 'EM_ANDAMENTO', weight: 7 },
    { status: 'CANCELADO',   weight: 3 },
  ];

  function pickStatus(): OrderStatus {
    const total = statusWeights.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (const { status, weight } of statusWeights) {
      r -= weight;
      if (r <= 0) return status;
    }
    return 'PAGO';
  }

  let orderCount = 0;

  for (let i = 0; i < clientRecords.length; i++) {
    const client = clientRecords[i];
    const vehicles = vehicleRecords[i];
    const lastVisit = lastVisitDaysAgo[i];

    // OS mais recente: na data de "última visita" de cada cliente
    const mainVehicle = vehicles[0];
    const mainService = pick(serviceRecords);
    await prisma.serviceOrder.create({
      data: {
        clientId: client.id,
        vehicleId: mainVehicle.id,
        serviceId: mainService.id,
        totalValue: Number(mainService.price),
        paymentMethod: pick(payments),
        status: 'PAGO',
        notes: '[seed] última visita',
        createdAt: daysAgo(lastVisit),
        updatedAt: daysAgo(lastVisit),
      },
    });
    orderCount++;

    // Histórico: 2-5 OS anteriores para clientes com mais visitas
    const extraOrders = lastVisit < 30 ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 2) + 1;
    for (let o = 0; o < extraOrders; o++) {
      const offsetDays = lastVisit + 15 + Math.floor(Math.random() * 60);
      const vehicle = pick(vehicles);
      const service = pick(serviceRecords);
      await prisma.serviceOrder.create({
        data: {
          clientId: client.id,
          vehicleId: vehicle.id,
          serviceId: service.id,
          totalValue: Number(service.price),
          paymentMethod: pick(payments),
          status: pickStatus(),
          notes: `[seed] histórico ${o + 1}`,
          createdAt: daysAgo(offsetDays),
          updatedAt: daysAgo(offsetDays),
        },
      });
      orderCount++;
    }
  }

  // OS avulsas para preencher até ~100+ e variar os dias
  const extraTargets = Math.max(0, 100 - orderCount);
  for (let o = 0; o < extraTargets; o++) {
    const ci = Math.floor(Math.random() * clientRecords.length);
    const client = clientRecords[ci];
    const vehicles = vehicleRecords[ci];
    const vehicle = pick(vehicles);
    const service = pick(serviceRecords);
    const dayOffset = Math.floor(Math.random() * 120) + 1;
    await prisma.serviceOrder.create({
      data: {
        clientId: client.id,
        vehicleId: vehicle.id,
        serviceId: service.id,
        totalValue: Number(service.price),
        paymentMethod: pick(payments),
        status: pickStatus(),
        notes: `[seed] avulsa ${o + 1}`,
        createdAt: daysAgo(dayOffset),
        updatedAt: daysAgo(dayOffset),
      },
    });
    orderCount++;
  }

  console.log(`✅ Seed concluído:`);
  console.log(`   👥 ${clientRecords.length} clientes`);
  console.log(`   🚗 ${vehicleRecords.flat().length} veículos`);
  console.log(`   📋 ${orderCount} ordens de serviço`);
  console.log(`   🔔 ~15 clientes devem aparecer na fila de reativação (threshold 30d)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
