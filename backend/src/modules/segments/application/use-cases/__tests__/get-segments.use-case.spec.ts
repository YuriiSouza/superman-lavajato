import { GetSegmentsUseCase } from "../get-segments.use-case";

const cache = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
};

const now = Date.now();

function daysAgo(n: number) {
  return new Date(now - n * 24 * 60 * 60 * 1000);
}

function makeClient(
  id: string,
  orders: any[],
  vehicleTypes: string[] = ["SEDAN"],
) {
  return {
    id,
    name: `Client ${id}`,
    phone: "11999999999",
    notes: null,
    vehicles: vehicleTypes.map((type, i) => ({ type, id: `v${i}` })),
    orders,
  };
}

function makeOrder(daysBack: number, value = 50) {
  return {
    totalValue: value,
    createdAt: daysAgo(daysBack),
    serviceId: "svc-1",
  };
}

const prisma = { client: { findMany: jest.fn() } };

describe("GetSegmentsUseCase", () => {
  let useCase: GetSegmentsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    cache.get.mockResolvedValue(null);
    useCase = new GetSegmentsUseCase(prisma as any, cache as any);
  });

  it("should classify client with no orders as churn", async () => {
    prisma.client.findMany.mockResolvedValue([makeClient("1", [])]);
    const result = (await useCase.execute()) as any;
    expect(result.churn.clients).toHaveLength(1);
    expect(result.vip.clients).toHaveLength(0);
  });

  it("should classify client last seen 5 days ago with 5+ orders as VIP", async () => {
    const orders = [1, 5, 10, 20, 25].map((d) => makeOrder(d));
    prisma.client.findMany.mockResolvedValue([makeClient("2", orders)]);
    const result = (await useCase.execute()) as any;
    expect(result.vip.clients).toHaveLength(1);
  });

  it("should classify client last seen 35 days ago as churn", async () => {
    prisma.client.findMany.mockResolvedValue([
      makeClient("3", [makeOrder(35)]),
    ]);
    const result = (await useCase.execute()) as any;
    expect(result.churn.clients).toHaveLength(1);
  });

  it("should classify SUV owner as premium", async () => {
    const orders = [makeOrder(5), makeOrder(15)];
    prisma.client.findMany.mockResolvedValue([
      makeClient("4", orders, ["SUV"]),
    ]);
    const result = (await useCase.execute()) as any;
    expect(result.premium.clients).toHaveLength(1);
  });

  it("should classify PICKUP owner as premium", async () => {
    const orders = [makeOrder(5), makeOrder(15)];
    prisma.client.findMany.mockResolvedValue([
      makeClient("5", orders, ["PICKUP"]),
    ]);
    const result = (await useCase.execute()) as any;
    expect(result.premium.clients).toHaveLength(1);
  });
});
