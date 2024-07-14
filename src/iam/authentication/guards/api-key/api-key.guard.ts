import { Repository } from 'typeorm';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ApiKeysService } from '../../api-keys.service';
import { ApiKey } from 'src/users/api-keys/entities/api-key.entity';
import { REQUEST_USER_KEY } from '../../../iam.constants';
import { ActiveUserData } from '../../../interfaces/active-user-data.interface';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    @InjectRepository(ApiKey)
    private readonly apiKeysRepository: Repository<ApiKey>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractKeyFromHeader(request);

    if (!apiKey) {
      throw new UnauthorizedException();
    }

    try {
      const apiKeyEntityId = this.apiKeysService.extractIdFromApiKey(apiKey);
      const apiKeyEntity = await this.apiKeysRepository.findOne({
        where: { uuid: apiKeyEntityId },
        relations: { user: true },
      });

      await this.apiKeysService.validate(apiKey, apiKeyEntity.key);

      request[REQUEST_USER_KEY] = {
        sub: apiKeyEntity.user.id,
        email: apiKeyEntity.user.email,
        role: apiKeyEntity.user.role,
        permissions: apiKeyEntity.user.permissions,
      } as ActiveUserData;
    } catch (err) {
      throw new UnauthorizedException();
    }

    return true;
  }

  extractKeyFromHeader(request: Request): string | undefined {
    const [type, key] = request.headers.authorization?.split(' ') ?? [];

    return type === 'ApiKey' ? key : undefined;
  }
}
