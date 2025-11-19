import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../../src/auth/auth.service';
import { User, UserRole } from '../../src/entities/user.entity';
import { SignUpDto } from '../../src/auth/dto/signup.dto';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    const signUpDto: SignUpDto = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      phone: '1234567890',
    };

    it('should successfully create a new user', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);
      mockBcrypt.genSalt.mockResolvedValue('salt' as never);
      mockBcrypt.hash.mockResolvedValue('hashedPassword' as never);

      const mockUser = {
        id: 1,
        email: signUpDto.email,
        name: signUpDto.fullName,
        phone: signUpDto.phone,
        role: UserRole.CUSTOMER,
        createdAt: new Date(),
        passwordHash: 'hashedPassword',
      };

      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.signUp(signUpDto);

      // Assert
      expect(result).toEqual({
        success: true,
        data: {
          userId: mockUser.id,
          email: mockUser.email,
          phone: mockUser.phone,
          fullName: mockUser.name,
          role: mockUser.role,
          createdAt: mockUser.createdAt,
        },
        message: 'registration successful',
      });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: signUpDto.email },
      });
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const existingUser = {
        id: 1,
        email: signUpDto.email,
      };
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.signUp(signUpDto)).rejects.toThrow(
        new ConflictException('Email already in use'),
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: signUpDto.email },
      });
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });
});
