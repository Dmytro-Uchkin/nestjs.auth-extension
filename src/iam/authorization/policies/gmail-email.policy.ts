import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';
import { PolicyHandler } from './interfaces/policy-handler.interface';
import { Policy } from './interfaces/policy.interface';
import { Injectable } from '@nestjs/common';
import { PolicyHandlerStorage } from './policy-handlers.storage';

export class GmailEmailPolicy implements Policy {
  name = 'GmailEmailUser';
}

@Injectable()
export class GmailEmailPolicyHandler
  implements PolicyHandler<GmailEmailPolicy>
{
  constructor(private readonly policyHandlerStorage: PolicyHandlerStorage) {
    this.policyHandlerStorage.add(GmailEmailPolicy, this);
  }

  async handle(policy: GmailEmailPolicy, user: ActiveUserData): Promise<void> {
    const isUserEmailGmail = user.email.endsWith('gmail.com');

    if (!isUserEmailGmail) {
      throw new Error(`User's email is not Gmail`);
    }
  }
}
