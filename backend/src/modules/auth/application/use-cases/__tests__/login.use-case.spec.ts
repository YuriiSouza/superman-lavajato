import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from '../login.use-case';

const mockUser = {
  id: 'user-1',
  email: 'admin@test.com',
  name: 'Admin',
  password: 'hashed',
};

const prisma = { user: { findUnique: jest.fn(), update: jest.fn() } };
const jwtService = { sign: jest.fn().mockReturnValue('token') };
const config = { get: jest.fn().mockReturnValue('secret') };
const bcrypt = { compare: jest.fn(), hash: jest.fn() };
const res = { cookie: jest.fn() };

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LoginUseCase(
      prisma as any,
      jwtService as any,
      config as any,
      bcrypt as any,
    );
  });

  it('should return accessToken and user on valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.user.update.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

    const result = await useCase.execute({ email: mockUser.email, password: 'pass' }, res);

    expect(result.accessToken).toBe('token');
    expect(result.user.id).toBe(mockUser.id);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { hashedRefreshToken: 'token' },
    });
    expect(res.cookie).toHaveBeenCalledTimes(2);
  });

  it('should throw UnauthorizedException if user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(useCase.execute({ email: 'x@x.com', password: 'pass' }, res)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if password is wrong', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    await expect(useCase.execute({ email: mockUser.email, password: 'wrong' }, res)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
