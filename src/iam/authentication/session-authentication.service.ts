import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { User } from '../../users/entities/user.entity';
import { HashingService } from '../hashing/hashing.service';
import { SignInDto } from './dto/sign-in.dto';

@Injectable()
export class SessionAuthenticationService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
  ) {}
  
  async signIn({ password, email }: SignInDto) {
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


    return user;
  }
}
