import {
  PrismaClient,
  VehicleType,
  PaymentMethod,
  OrderStatus,
  ExpenseCategory,
  BillStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Referência fixa: hoje = 02/07/2026
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function daysAgo(n: number, fixedHour?: number): Date {
  const d = addDays(TODAY, -n);
  const h = fixedHour ?? (8 + Math.floor(Math.random() * 10));
  d.setHours(h, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function dateStr(daysOffset: number): string {
  return addDays(TODAY, daysOffset).toISOString().split('T')[0];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  // ── limpeza idempotente ───────────────────────────────────────────────────
  await prisma.financialReserve.deleteMany({ where: { description: { startsWith: '[seed]' } } });
  await prisma.bill.deleteMany({ where: { notes: '[seed]' } });
  // cash sessions dos últimos 7 dias (seed recria)
  const seedDates = Array.from({ length: 7 }, (_, i) => dateStr(-6 + i));
  await prisma.cashSession.deleteMany({ where: { date: { in: seedDates } } });
  await prisma.serviceOrder.deleteMany({ where: { notes: { startsWith: '[seed]' } } });
  await prisma.client.deleteMany({ where: { phone: { startsWith: '(11) 99100-' } } });
  // products upserted pelo nome – não precisa deletar

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
    { key: 'lavajato_name',     value: 'Superman Lava-Jato' },
    { key: 'lavajato_phone',    value: '(11) 99999-0000' },
    { key: 'reactivation_days', value: '30' },
    { key: 'whatsapp_template', value: 'Olá {nome}, sentimos sua falta! Faz {dias} dias desde a última visita. Venha dar uma lavada no seu {veiculo} 🚗✨' },
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

  // ── produtos (estoque) ────────────────────────────────────────────────────
  const productDefs = [
    { name: 'Shampoo Automotivo',       unit: 'litro',   quantity: 15,  minQuantity: 5,  costPrice: 12.50 },
    { name: 'Cera Carnaúba Premium',    unit: 'unidade', quantity: 4,   minQuantity: 3,  costPrice: 45.00 },
    { name: 'Desengordurante Multi-uso',unit: 'litro',   quantity: 2,   minQuantity: 5,  costPrice: 18.00 },
    { name: 'Flanela Microfibra',       unit: 'unidade', quantity: 12,  minQuantity: 6,  costPrice: 8.00  },
    { name: 'Produto Limpeza Estofado', unit: 'litro',   quantity: 1,   minQuantity: 3,  costPrice: 25.00 },
    { name: 'Esponja de Lavagem',       unit: 'unidade', quantity: 20,  minQuantity: 10, costPrice: 4.50  },
    { name: 'Polidor de Pintura',       unit: 'unidade', quantity: 6,   minQuantity: 2,  costPrice: 65.00 },
    { name: 'Aromatizante Automotivo',  unit: 'unidade', quantity: 18,  minQuantity: 4,  costPrice: 9.00  },
  ];

  const productRecords: any[] = [];
  for (const p of productDefs) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      const rec = await prisma.product.update({
        where: { id: existing.id },
        data: { quantity: p.quantity, minQuantity: p.minQuantity, costPrice: p.costPrice, unit: p.unit, active: true },
      });
      productRecords.push(rec);
    } else {
      const rec = await prisma.product.create({ data: { ...p, active: true } });
      // Entrada inicial de estoque
      await prisma.stockEntry.create({
        data: { productId: rec.id, quantity: p.quantity, costPrice: p.costPrice, notes: 'Estoque inicial (seed)' },
      });
      productRecords.push(rec);
    }
  }

  // Índice por nome para fácil lookup
  const productByName: Record<string, any> = {};
  for (const p of productRecords) productByName[p.name] = p;

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
    2, 4, 6, 8, 9, 10, 10, 12,
    16, 18, 21, 24, 27, 28, 29,
    32, 35, 38, 42, 45, 50, 55, 58,
    65, 70, 80, 90, 100, 110, 120,
  ];

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

  // ── ordens de serviço ─────────────────────────────────────────────────────
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
    updatedAt?: Date;
  }) {
    const updatedAt = data.status === 'PAGO'
      ? addDays(data.createdAt, 0)   // pago no mesmo dia
      : data.createdAt;

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
        updatedAt: data.updatedAt ?? updatedAt,
      },
    });

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
  const allOrders: any[] = [];

  for (let i = 0; i < clientRecords.length; i++) {
    const client = clientRecords[i];
    const vehicles = vehicleRecords[i];
    const lastVisit = lastVisitDaysAgo[i];

    const mainVehicle = vehicles[0];
    const mainService = pick(serviceRecords);
    const o = await createOrder({
      clientId: client.id,
      vehicleId: mainVehicle.id,
      serviceId: mainService.id,
      totalValue: Number(mainService.price),
      paymentMethod: pick(payments),
      status: 'PAGO',
      notes: '[seed] última visita',
      createdAt: daysAgo(lastVisit),
    });
    allOrders.push(o);
    orderCount++;

    const extraOrders = lastVisit < 30
      ? Math.floor(Math.random() * 4) + 2
      : Math.floor(Math.random() * 2) + 1;

    for (let oi = 0; oi < extraOrders; oi++) {
      const offsetDays = lastVisit + 15 + Math.floor(Math.random() * 60);
      const service = pick(serviceRecords);
      const status = pickStatus();
      const o2 = await createOrder({
        clientId: client.id,
        vehicleId: pick(vehicles).id,
        serviceId: service.id,
        totalValue: Number(service.price),
        paymentMethod: pick(payments),
        status,
        notes: `[seed] histórico ${oi + 1}`,
        createdAt: daysAgo(offsetDays),
      });
      allOrders.push(o2);
      orderCount++;
    }
  }

  // OS avulsas para chegar a ~100+
  const extraTargets = Math.max(0, 100 - orderCount);
  for (let oi = 0; oi < extraTargets; oi++) {
    const ci = Math.floor(Math.random() * clientRecords.length);
    const client = clientRecords[ci];
    const service = pick(serviceRecords);
    const status = pickStatus();
    const o3 = await createOrder({
      clientId: client.id,
      vehicleId: pick(vehicleRecords[ci]).id,
      serviceId: service.id,
      totalValue: Number(service.price),
      paymentMethod: pick(payments),
      status,
      notes: `[seed] avulsa ${oi + 1}`,
      createdAt: daysAgo(Math.floor(Math.random() * 120) + 1),
    });
    allOrders.push(o3);
    orderCount++;
  }

  // OS de hoje (02/07) — aparecem no dashboard
  const todayHours = [8, 9, 10, 11, 13, 14, 15, 16];
  const todayOrders = [
    { client: clientRecords[0], vehicle: vehicleRecords[0][0], service: serviceRecords[0], payment: 'PIX' as PaymentMethod,      status: 'PAGO' as OrderStatus,         hour: 8  },
    { client: clientRecords[1], vehicle: vehicleRecords[1][0], service: serviceRecords[1], payment: 'DINHEIRO' as PaymentMethod,  status: 'PAGO' as OrderStatus,         hour: 9  },
    { client: clientRecords[2], vehicle: vehicleRecords[2][0], service: serviceRecords[2], payment: 'PIX' as PaymentMethod,      status: 'CONCLUIDO' as OrderStatus,    hour: 10 },
    { client: clientRecords[3], vehicle: vehicleRecords[3][0], service: serviceRecords[0], payment: 'CARTAO_DEBITO' as PaymentMethod, status: 'PAGO' as OrderStatus,     hour: 11 },
    { client: clientRecords[4], vehicle: vehicleRecords[4][0], service: serviceRecords[1], payment: 'PIX' as PaymentMethod,      status: 'EM_ANDAMENTO' as OrderStatus, hour: 13 },
    { client: clientRecords[5], vehicle: vehicleRecords[5][0], service: serviceRecords[3], payment: 'CARTAO_CREDITO' as PaymentMethod, status: 'PENDENTE' as OrderStatus, hour: 14 },
  ];

  for (const t of todayOrders) {
    const createdAt = new Date(TODAY);
    createdAt.setHours(t.hour, Math.floor(Math.random() * 30), 0, 0);
    const o = await createOrder({
      clientId: t.client.id,
      vehicleId: t.vehicle.id,
      serviceId: t.service.id,
      totalValue: Number(t.service.price),
      paymentMethod: t.payment,
      status: t.status,
      notes: '[seed] hoje',
      createdAt,
      updatedAt: createdAt,
    });
    allOrders.push(o);
    orderCount++;
  }

  // ── product usages (dados para inteligência de estoque) ───────────────────
  // Usages em orders dos últimos 30 dias para gerar médias diárias realistas

  // Desengordurante: ~15 litros usados em 30d → 0.5/dia → 2 litros restantes → 4d (alerta!)
  // Produto Limpeza Estofado: ~9 litros em 30d → 0.3/dia → 1 litro → ~3d (alerta crítico!)
  // Cera Carnaúba: ~9 unidades em 30d → 0.3/dia → 4 unidades → ~13d (atenção ≤14d)
  // Shampoo: ~12 litros em 30d → 0.4/dia → 15 litros → 37d (ok)

  const recentPaidOrders = allOrders
    .filter((o) => o.status === 'PAGO')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 40);

  // Mapeamento: produto → {totalUsage em 30d, quantidade por OS}
  const usagePlan: { productName: string; totalQty: number; perOrder: number }[] = [
    { productName: 'Shampoo Automotivo',        totalQty: 12.0, perOrder: 0.30 },
    { productName: 'Cera Carnaúba Premium',     totalQty: 9.0,  perOrder: 0.30 },
    { productName: 'Desengordurante Multi-uso', totalQty: 15.0, perOrder: 0.50 },
    { productName: 'Flanela Microfibra',        totalQty: 4.0,  perOrder: 0.10 },
    { productName: 'Produto Limpeza Estofado',  totalQty: 9.0,  perOrder: 0.30 },
    { productName: 'Esponja de Lavagem',        totalQty: 3.0,  perOrder: 0.10 },
  ];

  for (const plan of usagePlan) {
    const product = productByName[plan.productName];
    if (!product) continue;

    let remaining = plan.totalQty;
    for (const order of recentPaidOrders) {
      if (remaining <= 0) break;
      const qty = Math.min(plan.perOrder, remaining);
      await prisma.productUsage.create({
        data: {
          serviceOrderId: order.id,
          productId: product.id,
          quantity: qty,
          createdAt: order.createdAt,
        },
      });
      remaining -= qty;
    }
  }

  // ── caixa: sessões dos últimos 6 dias + hoje aberto ───────────────────────
  type SessionSpec = {
    daysOffset: number;
    openingBalance: number;
    physicalCount?: number;
    outflows: { amount: number; reason: string; category: ExpenseCategory }[];
  };

  const sessionSpecs: SessionSpec[] = [
    {
      daysOffset: -6,
      openingBalance: 120,
      physicalCount: 680,
      outflows: [{ amount: 50,  reason: 'Compra de esponja e flanela', category: 'PRODUTO' }],
    },
    {
      daysOffset: -5,
      openingBalance: 150,
      physicalCount: 920,
      outflows: [{ amount: 80,  reason: 'Abastecimento da moto',        category: 'COMBUSTIVEL' }],
    },
    {
      daysOffset: -4,
      openingBalance: 200,
      physicalCount: 1100,
      outflows: [
        { amount: 60,  reason: 'Compra de shampoo',            category: 'PRODUTO' },
        { amount: 30,  reason: 'Vale funcionário',              category: 'SALARIO' },
      ],
    },
    {
      daysOffset: -3,
      openingBalance: 180,
      physicalCount: 750,
      outflows: [],
    },
    {
      daysOffset: -2,
      openingBalance: 150,
      physicalCount: 980,
      outflows: [{ amount: 45,  reason: 'Manutenção da lavadora elétrica', category: 'MANUTENCAO' }],
    },
    {
      daysOffset: -1, // ontem
      openingBalance: 200,
      physicalCount: 1340,
      outflows: [
        { amount: 90,  reason: 'Compra de cera e polidor',     category: 'PRODUTO' },
        { amount: 50,  reason: 'Lanche equipe',                category: 'OUTRO' },
      ],
    },
    {
      daysOffset: 0, // hoje (aberto)
      openingBalance: 200,
      outflows: [{ amount: 35, reason: 'Compra de desengordurante',     category: 'PRODUTO' }],
    },
  ];

  for (const spec of sessionSpecs) {
    const isToday = spec.daysOffset === 0;
    const sessionDate = dateStr(spec.daysOffset);
    const openedAt = addDays(TODAY, spec.daysOffset);
    openedAt.setHours(8, 0, 0, 0);

    const session = await prisma.cashSession.create({
      data: {
        date: sessionDate,
        openingBalance: spec.openingBalance,
        operatorName: 'Administrador',
        openedAt,
        closedAt: isToday ? null : (() => {
          const c = addDays(TODAY, spec.daysOffset); c.setHours(18, 30, 0, 0); return c;
        })(),
        physicalCount: spec.physicalCount ?? null,
      },
    });

    for (const outflow of spec.outflows) {
      const outflowTime = addDays(TODAY, spec.daysOffset);
      outflowTime.setHours(11 + Math.floor(Math.random() * 5), 0, 0, 0);
      await prisma.cashOutflow.create({
        data: {
          sessionId: session.id,
          amount: outflow.amount,
          reason: outflow.reason,
          category: outflow.category,
          createdAt: outflowTime,
          date: outflowTime,
        },
      });
    }
  }

  // ── contas a pagar ────────────────────────────────────────────────────────
  type BillSpec = {
    name: string;
    category: ExpenseCategory;
    amount: number;
    dueDate: Date;
    status: BillStatus;
    paidAt?: Date;
    notes: string;
    recurring?: boolean;
  };

  const billSpecs: BillSpec[] = [
    // Próximas a vencer (aparecem no dashboard — ≤5 dias)
    {
      name: 'Aluguel do Espaço',
      category: 'ALUGUEL',
      amount: 1800.00,
      dueDate: addDays(TODAY, 1), // 03/07
      status: 'PENDENTE',
      notes: '[seed]',
      recurring: true,
    },
    {
      name: 'Conta de Água',
      category: 'CONTA',
      amount: 245.00,
      dueDate: addDays(TODAY, 2), // 04/07
      status: 'PENDENTE',
      notes: '[seed]',
      recurring: true,
    },
    {
      name: 'Salário Lavador — Bruno',
      category: 'SALARIO',
      amount: 1400.00,
      dueDate: addDays(TODAY, 3), // 05/07
      status: 'PENDENTE',
      notes: '[seed]',
    },
    {
      name: 'Internet Fibra',
      category: 'CONTA',
      amount: 119.90,
      dueDate: addDays(TODAY, 4), // 06/07
      status: 'PENDENTE',
      notes: '[seed]',
      recurring: true,
    },
    {
      name: 'Energia Elétrica',
      category: 'CONTA',
      amount: 680.00,
      dueDate: addDays(TODAY, 5), // 07/07
      status: 'PENDENTE',
      notes: '[seed]',
      recurring: true,
    },
    // Vencidas
    {
      name: 'Material de Limpeza — NF 3871',
      category: 'PRODUTO',
      amount: 350.00,
      dueDate: addDays(TODAY, -7), // 25/06
      status: 'VENCIDO',
      notes: '[seed]',
    },
    {
      name: 'Manutenção Compressor',
      category: 'MANUTENCAO',
      amount: 420.00,
      dueDate: addDays(TODAY, -4), // 28/06
      status: 'VENCIDO',
      notes: '[seed]',
    },
    // Pagas no mês anterior (entram no DRE de junho)
    {
      name: 'Aluguel do Espaço — Jun/26',
      category: 'ALUGUEL',
      amount: 1800.00,
      dueDate: addDays(TODAY, -32), // 01/06
      status: 'PAGO',
      paidAt: addDays(TODAY, -32),
      notes: '[seed]',
      recurring: true,
    },
    {
      name: 'Salários Junho',
      category: 'SALARIO',
      amount: 2800.00,
      dueDate: addDays(TODAY, -17), // 15/06
      status: 'PAGO',
      paidAt: addDays(TODAY, -17),
      notes: '[seed]',
    },
    {
      name: 'Energia Elétrica — Jun/26',
      category: 'CONTA',
      amount: 720.00,
      dueDate: addDays(TODAY, -22), // 10/06
      status: 'PAGO',
      paidAt: addDays(TODAY, -22),
      notes: '[seed]',
      recurring: true,
    },
    {
      name: 'Conta de Água — Jun/26',
      category: 'CONTA',
      amount: 230.00,
      dueDate: addDays(TODAY, -28), // 04/06
      status: 'PAGO',
      paidAt: addDays(TODAY, -28),
      notes: '[seed]',
      recurring: true,
    },
    // Paga em maio (entra no DRE de maio)
    {
      name: 'Aluguel do Espaço — Mai/26',
      category: 'ALUGUEL',
      amount: 1800.00,
      dueDate: addDays(TODAY, -62),
      status: 'PAGO',
      paidAt: addDays(TODAY, -62),
      notes: '[seed]',
      recurring: true,
    },
    {
      name: 'Salários Maio',
      category: 'SALARIO',
      amount: 2800.00,
      dueDate: addDays(TODAY, -48),
      status: 'PAGO',
      paidAt: addDays(TODAY, -48),
      notes: '[seed]',
    },
  ];

  const billByName: Record<string, string> = {};
  for (const b of billSpecs) {
    const created = await prisma.bill.create({
      data: {
        name: b.name,
        category: b.category,
        amount: b.amount,
        dueDate: b.dueDate,
        status: b.status,
        paidAt: b.paidAt ?? null,
        notes: b.notes,
        recurring: b.recurring ?? false,
      },
    });
    billByName[b.name] = created.id;
  }

  // ── reservas financeiras (vinculadas a contas específicas) ────────────────
  const aluguelId = billByName['Aluguel do Espaço'];
  const salarioId = billByName['Salário Lavador — Bruno'];
  const energiaId = billByName['Energia Elétrica'];
  const manutId   = billByName['Manutenção Compressor'];

  const reserveSpecs = [
    { amount: 900.00,  description: '[seed] 1ª parte do aluguel', billId: aluguelId },
    { amount: 600.00,  description: '[seed] 2ª parte do aluguel', billId: aluguelId },
    { amount: 700.00,  description: '[seed] Adiantamento do salário Bruno', billId: salarioId },
    { amount: 300.00,  description: '[seed] Reserva parcial energia', billId: energiaId },
    { amount: 420.00,  description: '[seed] Pagamento manutenção compressor', billId: manutId },
  ];

  for (const r of reserveSpecs) {
    if (!r.billId) continue;
    await prisma.financialReserve.create({
      data: { amount: r.amount, description: r.description, billId: r.billId },
    });
  }

  // ── summary ───────────────────────────────────────────────────────────────
  const pendenteBills  = billSpecs.filter((b) => b.status === 'PENDENTE').length;
  const vencidaBills   = billSpecs.filter((b) => b.status === 'VENCIDO').length;
  const pagaBills      = billSpecs.filter((b) => b.status === 'PAGO').length;
  const totalReserves  = reserveSpecs.reduce((s, r) => s + r.amount, 0);
  void totalReserves;

  console.log('✅ Seed concluído:');
  console.log(`   👥 ${clientRecords.length} clientes`);
  console.log(`   🚗 ${vehicleRecords.flat().length} veículos`);
  console.log(`   📋 ${orderCount} ordens de serviço`);
  console.log(`      🗓️  ${todayOrders.length} OS de hoje (02/07) — aparecem no dashboard`);
  console.log(`   📦 ${productDefs.length} produtos (2 com alerta ≤7d: Desengordurante ~4d, Limpeza Estofado ~3d)`);
  console.log(`   🏦 7 sessões de caixa (6 fechadas + hoje aberto com saldo R$ 200,00)`);
  console.log(`   💳 ${billSpecs.length} contas — ${pendenteBills} pendentes, ${vencidaBills} vencidas, ${pagaBills} pagas`);
  console.log(`      📅 5 contas vencem nos próximos 5 dias (aparecem no dashboard)`);
  console.log(`   🐷 ${reserveSpecs.length} reservas ativas = R$ ${totalReserves.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log('');
  console.log('   Usuários:');
  console.log('   📧 admin@supermanlavajato.com.br    → admin123    (ADMIN)');
  console.log('   📧 caixa@supermanlavajato.com.br    → caixa123    (CAIXA)');
  console.log('   📧 operador@supermanlavajato.com.br → operador123 (OPERADOR)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
