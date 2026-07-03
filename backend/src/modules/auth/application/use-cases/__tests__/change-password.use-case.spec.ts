import { UnauthorizedException } from "@nestjs/common";
import { ChangePasswordUseCase } from "../change-password.use-case";

const mockUser = {
  id: "user-1",
  email: "admin@test.com",
  name: "Admin",
  password: "hashed",
};

const prisma = {
  user: {
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
};
const bcrypt = {
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue("new_hashed"),
};

describe("ChangePasswordUseCase", () => {
  let useCase: ChangePasswordUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ChangePasswordUseCase(prisma as any, bcrypt as any);
  });

  it("should update password when current password is correct", async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

    await useCase.execute("user-1", {
      currentPassword: "old",
      newPassword: "new123",
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { password: "new_hashed" },
    });
  });

  it("should throw UnauthorizedException when current password is wrong", async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      useCase.execute("user-1", {
        currentPassword: "wrong",
        newPassword: "new123",
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
