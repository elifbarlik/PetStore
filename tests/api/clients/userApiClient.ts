import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { NewUser } from '../../fixtures/test-data';

/** Thin wrapper around /api/user endpoints. Returns raw responses so specs assert status + body. */
export class UserApiClient {
  constructor(private readonly request: APIRequestContext) {}

  register(user: Partial<NewUser>): Promise<APIResponse> {
    return this.request.post('user/Register', { data: user });
  }

  login(userName: string, password: string): Promise<APIResponse> {
    return this.request.post('user/Login', { data: { userName, password } });
  }
}
