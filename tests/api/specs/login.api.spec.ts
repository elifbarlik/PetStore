import { test, expect } from '../../fixtures/auth.fixture';
import { buildUser } from '../../fixtures/test-data';
import type { ApiResponse, FieldErrors, LoginResult } from '../clients/types';

const INVALID_CREDENTIALS = 'Kullanıcı adı veya şifre yanlış.';
const LOCKED_OUT =
  'Çok fazla hatalı giriş denemesi. Hesabınız geçici olarak kilitlendi, lütfen daha sonra tekrar deneyin.';

const decodeJwtPayload = (token: string) =>
  JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));

test.describe('POST /api/user/Login', () => {
  test('API-LOG-01 returns a signed JWT for valid credentials @smoke', async ({ userApi }) => {
    const user = buildUser();
    const reg = await (await userApi.register(user)).json();

    const res = await userApi.login(user.userName, user.password);

    expect(res.status()).toBe(200);
    const body = (await res.json()) as ApiResponse<LoginResult>;
    expect(body).toMatchObject({ isSuccess: true, statusCode: 200 });
    expect(body.result!.token.split('.')).toHaveLength(3);

    const claims = decodeJwtPayload(body.result!.token);
    expect(claims.sub).toBe(reg.result.id);
    expect(claims.email).toBe(user.email);
    expect(claims.iss).toBe('mango-auth-api');
    expect(claims.aud).toBe('mango-client');
    expect(claims.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  test('API-LOG-02 rejects a wrong password', async ({ userApi }) => {
    const user = buildUser();
    await userApi.register(user);

    const res = await userApi.login(user.userName, 'Wrong1234!');

    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({
      isSuccess: false, statusCode: 400, message: INVALID_CREDENTIALS, result: null,
    });
  });

  test('API-LOG-03 an unknown user gets the same message (no account enumeration)', async ({ userApi }) => {
    const res = await userApi.login(buildUser().userName, 'Whatever1!');

    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiResponse<null>).message).toBe(INVALID_CREDENTIALS);
  });

  test('API-LOG-04 [F-02 fixed] login response includes the full user profile', async ({ userApi }) => {
    const user = buildUser();
    await userApi.register(user);

    const body = (await (await userApi.login(user.userName, user.password)).json()) as ApiResponse<LoginResult>;

    expect(body.result!.user).toMatchObject({
      name: user.name,
      email: user.email,
      surname: user.surname,
      userName: user.userName,
    });
  });

  test('API-LOG-05 user name is case-insensitive', async ({ userApi }) => {
    const user = buildUser();
    await userApi.register(user);

    const res = await userApi.login(user.userName.toUpperCase(), user.password);

    expect(res.status()).toBe(200);
  });

  test('API-LOG-06 locks the account after 5 failed attempts (brute-force protection)', async ({ userApi }) => {
    const user = buildUser();
    await userApi.register(user);

    for (let attempt = 1; attempt <= 4; attempt++) {
      const res = await userApi.login(user.userName, `Wrong${attempt}234!`);
      expect(((await res.json()) as ApiResponse<null>).message).toBe(INVALID_CREDENTIALS);
    }
    const fifth = await userApi.login(user.userName, 'Wrong5234!');
    expect(((await fifth.json()) as ApiResponse<null>).message).toBe(LOCKED_OUT);

    // Even the correct password is refused while the lockout lasts
    const correct = await userApi.login(user.userName, user.password);
    expect(correct.status()).toBe(400);
    expect(((await correct.json()) as ApiResponse<null>).message).toBe(LOCKED_OUT);
  });

  test('API-LOG-07 a successful login resets the failed-attempt counter', async ({ userApi }) => {
    const user = buildUser();
    await userApi.register(user);

    for (let i = 0; i < 4; i++) await userApi.login(user.userName, 'Wrong1234!');
    expect((await userApi.login(user.userName, user.password)).status()).toBe(200);

    // Counter was reset: 4 more failures still do not lock the account
    for (let i = 0; i < 4; i++) await userApi.login(user.userName, 'Wrong1234!');
    expect((await userApi.login(user.userName, user.password)).status()).toBe(200);
  });

  test('API-LOG-08 missing credentials return field-level validation errors', async ({ api }) => {
    const res = await api.post('user/Login', { data: {} });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as ApiResponse<FieldErrors>;
    expect(body.result).toMatchObject({
      UserName: ['Kullanıcı adı zorunludur.'],
      Password: ['Şifre zorunludur.'],
    });
  });
});
