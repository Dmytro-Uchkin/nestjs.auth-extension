import Redis from 'ioredis';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import * as session from 'express-session';
import * as passport from 'passport';
import RedisStore from "connect-redis"

import jwtConfig from './config/jwt.config';
import { User } from '../users/entities/user.entity';
import redisConfig from '../redis/config/redis.config';
import { RedisService } from '../redis/redis.service';
import { BcryptService } from './hashing/bcrypt.service';
import { HashingService } from './hashing/hashing.service';
// import { RolesGuard } from './authorization/guards/roles/roles.guard';
// import { PermissionsGuard } from './authorization/guards/permissions.guard';
import { AuthenticationService } from './authentication/authentication.service';
import { AuthenticationController } from './authentication/authentication.controller';
import { AccessTokenGuard } from './authentication/guards/access-token/access-token.guard';
import { AuthenticationGuard } from './authentication/guards/authentication/authentication.guard';
import { GmailEmailPolicyHandler } from './authorization/policies/gmail-email.policy';
import { PolicyHandlerStorage } from './authorization/policies/policy-handlers.storage';
import { PoliciesGuard } from './authorization/guards/policies.guard';
import { ApiKeysService } from './authentication/api-keys.service';
import { ApiKeyGuard } from './authentication/guards/api-key/api-key.guard';
import { ApiKey } from '../users/api-keys/entities/api-key.entity';
import { GoogleAuthenticationService } from './authentication/social/google-authentication.service';
import { GoogleAuthenticationController } from './authentication/social/google-authentication.controller';
import { OtpAuthenticationService } from './authentication/otp-authentication.service';
import { SessionAuthenticationService } from './authentication/session-authentication.service';
import { SessionAuthenticationController } from './authentication/session-authentication.controller';
import { UserSerializer } from './authentication/serializers/user-serializer';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ApiKey]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(redisConfig),
  ],
  providers: [
    RedisService,
    ApiKeyGuard,
    AccessTokenGuard,
    AuthenticationService,
    GoogleAuthenticationService,
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: PermissionsGuard,
    // },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
    PolicyHandlerStorage,
    GmailEmailPolicyHandler,
    ApiKeysService,
    OtpAuthenticationService,
    SessionAuthenticationService,
    UserSerializer,
  ],
  controllers: [AuthenticationController, GoogleAuthenticationController, SessionAuthenticationController],
})
export class IamModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    const redisClient = new Redis(6379, 'localhost');
    const redisStore = new RedisStore({ client: redisClient });

    consumer.apply(
      session({
        store: redisStore,
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          sameSite: true,
          httpOnly: true,
        },
      }),
      passport.initialize(),
      passport.session(),
    ).forRoutes('*');
  }
}
