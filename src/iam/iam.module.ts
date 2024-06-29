import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

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

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(redisConfig)
  ],
  providers: [
    RedisService,
    AccessTokenGuard,
    AuthenticationService,
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
    GmailEmailPolicyHandler
  ],
  controllers: [AuthenticationController],
})
export class IamModule {}
