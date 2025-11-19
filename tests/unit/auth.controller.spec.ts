import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { SignUpDto } from '../../src/auth/dto/signup.dto';
import { UserRole } from '../../src/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signUp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    const signUpDto: SignUpDto = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      phone: '1234567890',
    };

    it('should call authService.signUp and return the result', async () => {
      // Arrange
      const expectedResult = {
        success: true,
        data: {
          userId: 1,
          email: signUpDto.email,
          phone: signUpDto.phone,
          fullName: signUpDto.fullName,
          role: UserRole.CUSTOMER,
          createdAt: new Date(),
        },
        message: 'registration successful',
      };

      mockAuthService.signUp.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.signUp(signUpDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockAuthService.signUp).toHaveBeenCalledWith(signUpDto);
      expect(mockAuthService.signUp).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Service error');
      mockAuthService.signUp.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.signUp(signUpDto)).rejects.toThrow('Service error');
      expect(mockAuthService.signUp).toHaveBeenCalledWith(signUpDto);
    });
  });
});