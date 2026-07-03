import { GetReactivationQueueUseCase } from "../get-reactivation-queue.use-case";

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function makeClient(
  id: string,
  lastOrderDaysAgo: number | null,
  vehicle?: { plate: string; model: string; color?: string },
) {
  return {
    id,
    name:
      id === "c1" ? "João Silva" : id === "c2" ? "Maria Santos" : "Pedro Costa",
    phone: `1199999900${id.slice(-1)}`,
    vehicles: vehicle
      ? [
          {
            plate: vehicle.plate,
            model: vehicle.model,
            color: vehicle.color ?? null,
          },
        ]
      : [],
    orders:
      lastOrderDaysAgo !== null
        ? [{ createdAt: daysAgo(lastOrderDaysAgo), totalValue: 80 }]
        : [],
    reactivationLogs: [],
  };
}

const prisma = {
  client: { findMany: jest.fn() },
  setting: { findUnique: jest.fn().mockResolvedValue(null) },
};

describe("GetReactivationQueueUseCase", () => {
  let useCase: GetReactivationQueueUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetReactivationQueueUseCase(prisma as any);
    prisma.setting.findUnique.mockResolvedValue(null);
    prisma.client.findMany.mockResolvedValue([
      makeClient("c1", 5, { plate: "ABC1234", model: "HB20", color: "Prata" }), // recente → fora
      makeClient("c2", 45, {
        plate: "XYZ9876",
        model: "Corolla",
        color: "Branco",
      }), // sumido → dentro
      makeClient("c3", null), // sem visita → dentro
    ]);
  });

  it("should exclude clients with recent orders", async () => {
    const result = await useCase.execute(30);
    expect(result.queue.map((c) => c.id)).not.toContain("c1");
  });

  it("should include clients whose last order exceeds threshold", async () => {
    const result = await useCase.execute(30);
    expect(result.queue.find((c) => c.id === "c2")).toBeDefined();
  });

  it("should include clients with no orders", async () => {
    const result = await useCase.execute(30);
    expect(result.queue.find((c) => c.id === "c3")).toBeDefined();
  });

  it("should sort by daysSince descending (most overdue first)", async () => {
    const result = await useCase.execute(30);
    const days = result.queue.map((c) => c.daysSince ?? 9999);
    expect(days[0]).toBeGreaterThanOrEqual(days[days.length - 1]);
  });

  it("should generate a whatsapp message with the client first name", async () => {
    const result = await useCase.execute(30);
    const maria = result.queue.find((c) => c.id === "c2");
    expect(maria?.whatsappMessage).toContain("Maria");
    expect(maria?.whatsappMessage).toContain("Corolla");
  });

  it("should return correct total and threshold", async () => {
    const result = await useCase.execute(30);
    expect(result.total).toBe(result.queue.length);
    expect(result.threshold).toBe(30);
  });
});
