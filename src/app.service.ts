import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healthCheck(): Record<string, string> {
    return { status: 'OK' };
  }
}
