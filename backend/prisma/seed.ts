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

async function main() {
  // ── usuários ──────────────────────────────────────────────────────────────
  const hashAdmin = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@supermanlavajato.com.br' },
    update: { role: 'ADMIN' },
    create: { email: 'admin@supermanlavajato.com.br', password: hashAdmin, name: 'Administrador', role: 'ADMIN' },
  });

  const hashCaixa = await bcrypt.hash('caixa123', 10);
  await prisma.user.upsert({
    where: { email: 'caixa@supermanlavajato.com.br' },
    update: { role: 'CAIXA' },
    create: { email: 'caixa@supermanlavajato.com.br', password: hashCaixa, name: 'Operador de Caixa', role: 'CAIXA' },
  });

  const hashOp = await bcrypt.hash('operador123', 10);
  await prisma.user.upsert({
    where: { email: 'operador@supermanlavajato.com.br' },
    update: { role: 'OPERADOR' },
    create: { email: 'operador@supermanlavajato.com.br', password: hashOp, name: 'Lavador', role: 'OPERADOR' },
  });

  // ── configurações padrão ──────────────────────────────────────────────────
  const defaultSettings: { key: string; value: string }[] = [
    { key: 'lavajato_name',      value: 'Superman Lava-Jato' },
    { key: 'lavajato_phone',     value: '(11) 99999-0000' },
    { key: 'reactivation_days',  value: '30' },
    { key: 'whatsapp_template',  value: 'Olá {nome}, sentimos sua falta! Faz {dias} dias desde a última visita. Venha dar uma lavada no seu {veiculo} 🚗✨' },
  ];
  for (const s of defaultSettings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  // ── serviços ──────────────────────────────────────────────────────────────
  const serviceDefs = [
    { name: 'Lavagem Simples',     price: 40,  duration: 30  },
    { name: 'Lavagem Completa',    price: 80,  duration: 60  },
    { name: 'Enceramento Premium', price: 140, duration: 90  },
    { name: 'Detalhamento Herói',  price: 280, duration: 180 },
    { name: 'Lavagem de Motor',    price: 120, duration: 60  },
  ];

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

  // Distribuição de últimas visitas para testar reativação
  const lastVisitDaysAgo = [
    2, 4, 6, 8, 9, 10, 10, 12,           // ativos
    16, 18, 21, 24, 27, 28, 29,          // borderline
    32, 35, 38, 42, 45, 50, 55, 58,      // inativos (aparecem na fila 30d)
    65, 70, 80, 90, 100, 110, 120,       // sumidos (muito urgentes)
  ];

  // Limpa seed anterior (OrderPayment é cascade de ServiceOrder)
  await prisma.serviceOrder.deleteMany({ where: { notes: { startsWith: '[seed]' } } });
  await prisma.client.deleteMany({ where: { phone: { startsWith: '(11) 99100-' } } });

  const clientRecords: any[] = [];
  const vehicleRecords: any[][] = [];

  for (let i = 0; i < clientDefs.length; i++) {
    const client = await prisma.client.create({ data: clientDefs[i] });
    clientRecords.push(client);

    const numVehicles = i < 10 ? 2 : 1;
    const clientVehicles: any[] = [];
    for (let v = 0; v < numVehicles; v++) {
      const plate = `TST${String(i + 1).padStart(2, '0')}${String(v + 1)}A${v}`;
      const vehicle = await prisma.vehicle.upsert({
        where: { plate },
        update: { clientId: client.id },
        create: { plate, model: pick(vehicleModels), color: pick(colors), type: pick(vehicleTypes), clientId: client.id },
      });
      clientVehicles.push(vehicle);
    }
    vehicleRecords.push(clientVehicles);
  }

  // ── ordens de serviço + pagamentos ───────────────────────────────────────
  const statusWeights: { status: OrderStatus; weight: number }[] = [
    { status: 'PAGO',         weight: 60 },
    { status: 'CONCLUIDO',    weight: 20 },
    { status: 'PENDENTE',     weight: 10 },
    { status: 'EM_ANDAMENTO', weight:  7 },
    { status: 'CANCELADO',    weight:  3 },
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

  async function createOrder(data: {
    clientId: string;
    vehicleId: string;
    serviceId: string;
    totalValue: number;
    paymentMethod: PaymentMethod;
    status: OrderStatus;
    notes: string;
    createdAt: Date;
  }) {
    const order = await prisma.serviceOrder.create({
      data: {
        clientId: data.clientId,
        vehicleId: data.vehicleId,
        serviceId: data.serviceId,
        totalValue: data.totalValue,
        paymentMethod: data.paymentMethod,
        status: data.status,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
      },
    });

    // Cria registro de pagamento para ordens pagas
    if (data.status === 'PAGO') {
      await prisma.orderPayment.create({
        data: {
          serviceOrderId: order.id,
          method: data.paymentMethod,
          amount: data.totalValue,
          createdAt: data.createdAt,
        },
      });
    }

    return order;
  }

  let orderCount = 0;

  for (let i = 0; i < clientRecords.length; i++) {
    const client = clientRecords[i];
    const vehicles = vehicleRecords[i];
    const lastVisit = lastVisitDaysAgo[i];

    // OS mais recente: na data de "última visita" de cada cliente
    const mainVehicle = vehicles[0];
    const mainService = pick(serviceRecords);
    await createOrder({
      clientId: client.id,
      vehicleId: mainVehicle.id,
      serviceId: mainService.id,
      totalValue: Number(mainService.price),
      paymentMethod: pick(payments),
      status: 'PAGO',
      notes: '[seed] última visita',
      createdAt: daysAgo(lastVisit),
    });
    orderCount++;

    // Histórico: 2-5 OS anteriores
    const extraOrders = lastVisit < 30
      ? Math.floor(Math.random() * 4) + 2
      : Math.floor(Math.random() * 2) + 1;

    for (let o = 0; o < extraOrders; o++) {
      const offsetDays = lastVisit + 15 + Math.floor(Math.random() * 60);
      const service = pick(serviceRecords);
      const status = pickStatus();
      await createOrder({
        clientId: client.id,
        vehicleId: pick(vehicles).id,
        serviceId: service.id,
        totalValue: Number(service.price),
        paymentMethod: pick(payments),
        status,
        notes: `[seed] histórico ${o + 1}`,
        createdAt: daysAgo(offsetDays),
      });
      orderCount++;
    }
  }

  // OS avulsas para chegar a ~100+
  const extraTargets = Math.max(0, 100 - orderCount);
  for (let o = 0; o < extraTargets; o++) {
    const ci = Math.floor(Math.random() * clientRecords.length);
    const client = clientRecords[ci];
    const service = pick(serviceRecords);
    const status = pickStatus();
    await createOrder({
      clientId: client.id,
      vehicleId: pick(vehicleRecords[ci]).id,
      serviceId: service.id,
      totalValue: Number(service.price),
      paymentMethod: pick(payments),
      status,
      notes: `[seed] avulsa ${o + 1}`,
      createdAt: daysAgo(Math.floor(Math.random() * 120) + 1),
    });
    orderCount++;
  }

  console.log('✅ Seed concluído:');
  console.log(`   👥 ${clientRecords.length} clientes`);
  console.log(`   🚗 ${vehicleRecords.flat().length} veículos`);
  console.log(`   📋 ${orderCount} ordens de serviço (com OrderPayment para as PAGO)`);
  console.log(`   🔔 ~15 clientes devem aparecer na fila de reativação (threshold 30d)`);
  console.log('');
  console.log('   Usuários criados:');
  console.log('   📧 admin@supermanlavajato.com.br  → senha: admin123  (ADMIN)');
  console.log('   📧 caixa@supermanlavajato.com.br  → senha: caixa123  (CAIXA)');
  console.log('   📧 operador@supermanlavajato.com.br → senha: operador123 (OPERADOR)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
