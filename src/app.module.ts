import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppService } from './app.service';
import { IamModule } from './iam/iam.module';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { CoffeesModule } from './coffees/coffees.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    IamModule,
    CoffeesModule,
    UsersModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'pass123',
      database: 'postgres',
      autoLoadEntities: true,
      synchronize: true,
    }),
    IamModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
