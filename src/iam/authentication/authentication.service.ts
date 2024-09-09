import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import jwtConfig from '../config/jwt.config';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { User } from '../../users/entities/user.entity';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { InvalidatedRefreshTokenError, RedisService } from '../../redis/redis.service';
import { HashingService } from '../hashing/hashing.service';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { OtpAuthenticationService } from './otp-authentication.service';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly otpAuthService: OtpAuthenticationService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    try {
      const user = new User();
      user.email = signUpDto.email;
      user.password = await this.hashingService.hash(signUpDto.password);

      await this.usersRepository.save(user);
    } catch (err) {
      const pgUniqueViolationErrorCode = '23505';
      if (err.code === pgUniqueViolationErrorCode) {
        throw new ConflictException();
      }

      throw err;
    }
  }

  async signIn({ password, email, tfaCode }: SignInDto) {
    const user = await this.usersRepository.findOneBy({
      email: email,
    });

    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    const isValidUserPassword = await this.hashingService.compare(
      password,
      user.password,
    );

    if (!isValidUserPassword) {
      throw new UnauthorizedException('User passowrd does not match');
    }

    if (user.isTfaEnabled) {
      const isValid = this.otpAuthService.verifyCode(tfaCode, user.tfaSecret);

      if (!isValid) {
        throw new UnauthorizedException('Invalud 2FA code');
      }
    }

    return await this.generateTokens(user);
  }

  async refreshTokens({ refreshToken = '' }: RefreshTokenDto) {
    try {
      const { sub } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'>
      >(refreshToken, {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
      });

      const user = await this.usersRepository.findOneByOrFail({ id: sub });
      const isRefreshTokenValid = await this.redisService.validate(
        user.id,
        refreshToken,
      );

      if (isRefreshTokenValid) {
        this.redisService.invalidate(user.id);
      } else {
        throw new Error('Refresh token is invalid');
      }

      return await this.generateTokens(user);
    } catch (err) {
      if (err instanceof InvalidatedRefreshTokenError) {
        // Take action: notify user that his refresh token might have been stolen?
        throw new UnauthorizedException('Access denied');
      }

      throw new UnauthorizedException();
    }
  }

  public async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        { email: user.email, role: user.role, permissions: user.permissions },
      ),
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.refreshTokenTtl,
        { email: user.email, role: user.role, permissions: user.permissions },
      ),
    ]);

    await this.redisService.insertToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }
}
