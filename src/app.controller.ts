import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthType } from './iam/authentication/enums/auth-type.enum';
import { Auth } from './iam/authentication/decorators/auth.decorator';

@Controller()
@Auth(AuthType.None)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health-check')
  healthCheck(): Record<string, string> {
    return this.appService.healthCheck();
  }
}