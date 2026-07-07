import { GetDashboardUseCase } from "../get-dashboard.use-case";

const prisma = {
  serviceOrder: { findMany: jest.fn(), count: jest.fn().mockResolvedValue(0) },
  client: { count: jest.fn() },
};

// Mock de cache em memória — nunca retorna valor cacheado nos testes
const cache = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
};

describe("GetDashboardUseCase", () => {
  let useCase: GetDashboardUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    cache.get.mockResolvedValue(null); // garante que nunca usa cache nos testes
    useCase = new GetDashboardUseCase(prisma as any, cache as any);
  });

  it("should return zero metrics when no orders today", async () => {
    prisma.serviceOrder.findMany.mockResolvedValue([]);
    prisma.serviceOrder.count.mockResolvedValue(0);
    prisma.client.count.mockResolvedValue(0);

    const result = (await useCase.execute()) as any;

    expect(result.today.ordersCount).toBe(0);
    expect(result.today.revenue).toBe(0);
    expect(result.today.avgTicket).toBe(0);
  });

  it("should calculate correct revenue and avgTicket from today orders", async () => {
    const orders = [
      { totalValue: 100, paymentMethod: "PIX" },
      { totalValue: 50, paymentMethod: "PIX" },
      { totalValue: 150, paymentMethod: "DINHEIRO" },
    ];
    prisma.serviceOrder.findMany.mockResolvedValue(orders);
    prisma.serviceOrder.count.mockResolvedValue(0);
    prisma.client.count.mockResolvedValue(10);

    const result = (await useCase.execute()) as any;

    expect(result.today.ordersCount).toBe(3);
    expect(result.today.revenue).toBe(300);
    expect(result.today.avgTicket).toBe(100);
  });

  it("should group payments by method", async () => {
    const orders = [
      { totalValue: 100, paymentMethod: "PIX" },
      { totalValue: 50, paymentMethod: "DINHEIRO" },
      { totalValue: 75, paymentMethod: "PIX" },
    ];
    prisma.serviceOrder.findMany.mockResolvedValue(orders);
    prisma.serviceOrder.count.mockResolvedValue(0);
    prisma.client.count.mockResolvedValue(5);

    const result = (await useCase.execute()) as any;

    expect(result.today.byPayment["PIX"]).toBe(175);
    expect(result.today.byPayment["DINHEIRO"]).toBe(50);
  });

  it("should return client totals and order queues", async () => {
    prisma.serviceOrder.findMany.mockResolvedValue([]);
    prisma.serviceOrder.count
      .mockResolvedValueOnce(3) // pendingCount
      .mockResolvedValueOnce(2); // activeCount
    prisma.client.count.mockResolvedValueOnce(20).mockResolvedValueOnce(3);

    const result = (await useCase.execute()) as any;

    expect(result.clients.total).toBe(20);
    expect(result.clients.churn).toBe(3);
    expect(result.orders.pending).toBe(3);
    expect(result.orders.active).toBe(2);
  });
});
