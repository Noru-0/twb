import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { User, UserRole } from '../../src/entities/user.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Enable validation pipes như trong main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const validSignupData = {
      email: 'test@example.com',
      password: 'Password123!', // Thỏa mãn tất cả validation rules
      fullName: 'Test User',
      phone: '0987654321', // Vietnamese phone number format
    };

    it('should successfully register a new user', async () => {
      // Mock không tìm thấy user hiện tại
      mockUserRepository.findOne.mockResolvedValue(null);

      const mockUser = {
        id: 1,
        email: validSignupData.email,
        name: validSignupData.fullName,
        phone: validSignupData.phone,
        role: UserRole.CUSTOMER,
        createdAt: new Date(),
        passwordHash: 'hashedPassword',
      };

      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validSignupData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: {
          userId: mockUser.id,
          email: mockUser.email,
          phone: mockUser.phone,
          fullName: mockUser.name,
          role: mockUser.role,
          createdAt: mockUser.createdAt.toISOString(),
        },
        message: 'registration successful',
      });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: validSignupData.email },
      });
    });

    it('should return 409 when email already exists', async () => {
      // Mock tìm thấy user đã tồn tại
      const existingUser = {
        id: 1,
        email: validSignupData.email,
      };
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validSignupData)
        .expect(409);

      expect(response.body).toEqual({
        statusCode: 409,
        message: 'Email already in use',
        error: 'Conflict',
      });

      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        ...validSignupData,
        email: 'invalid-email',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        email: 'test@example.com',
        // Missing password, fullName, phone
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return 400 for password too short', async () => {
      const invalidData = {
        ...validSignupData,
        password: 'Pass1!', // Too short (< 8 characters)
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should reject non-whitelisted properties', async () => {
      const dataWithExtraFields = {
        ...validSignupData,
        hackerField: 'malicious data',
        role: 'ADMIN', // Should not be allowed
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(dataWithExtraFields)
        .expect(400);

      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });
  });
});
