import { test, expect } from '../../fixtures/auth.fixture';
import { buildUser } from '../../fixtures/test-data';
import type { ApiResponse, FieldErrors, UserDto } from '../clients/types';

test.describe('POST /api/user/Register', () => {
  test('API-REG-01 registers a new user and returns the created profile @smoke', async ({ userApi }) => {
    const user = buildUser();

    const res = await userApi.register(user);

    expect(res.status()).toBe(200);
    const body = (await res.json()) as ApiResponse<UserDto>;
    expect(body).toMatchObject({ isSuccess: true, statusCode: 200, message: 'Registration successful' });
    expect(body.result).toMatchObject({
      name: user.name,
      surname: user.surname,
      userName: user.userName,
      email: user.email,
    });
    expect(body.result!.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(body)).not.toContain(user.password);
  });

  test('API-REG-02 rejects a duplicate user name', async ({ userApi }) => {
    const first = buildUser();
    await userApi.register(first);

    const res = await userApi.register(buildUser({ userName: first.userName }));

    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({ isSuccess: false, statusCode: 400, message: 'Username already taken' });
  });

  test('API-REG-03 rejects a duplicate e-mail (case-insensitive)', async ({ userApi }) => {
    const first = buildUser();
    await userApi.register(first);

    const res = await userApi.register(buildUser({ email: first.email.toUpperCase() }));

    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiResponse<null>).message).toBe('Email already taken');
  });

  test('API-REG-04 enforces the ASP.NET Identity password policy', async ({ userApi }) => {
    const res = await userApi.register(buildUser({ password: 'abc' }));

    expect(res.status()).toBe(400);
    const { message } = (await res.json()) as ApiResponse<null>;
    expect(message).toContain('at least 6 characters');
    expect(message).toContain('non alphanumeric');
    expect(message).toContain('digit');
    expect(message).toContain('uppercase');
  });

  test('API-REG-05 rejects a user name with characters Identity does not allow', async ({ userApi }) => {
    const res = await userApi.register(buildUser({ userName: 'has space' }));

    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiResponse<null>).message).toBe(
      "Username 'has space' is invalid, can only contain letters or digits.",
    );
  });

  test('API-REG-06 [F-01 fixed] a missing e-mail returns a field-level validation error', async ({ userApi }) => {
    const { email: _omitted, ...withoutEmail } = buildUser();

    const res = await userApi.register(withoutEmail);

    expect(res.status()).toBe(400);
    const body = (await res.json()) as ApiResponse<FieldErrors>;
    expect(body).toMatchObject({ isSuccess: false, statusCode: 400, message: 'Email zorunludur.' });
    expect(body.result!.Email).toEqual(['Email zorunludur.']);
  });

  test('API-REG-07 rejects a malformed e-mail address', async ({ userApi }) => {
    const res = await userApi.register(buildUser({ email: 'not-an-email' }));

    expect(res.status()).toBe(400);
    const body = (await res.json()) as ApiResponse<FieldErrors>;
    expect(body.result!.Email).toEqual(['Geçerli bir email adresi giriniz.']);
  });

  test('API-REG-08 reports every missing required field at once', async ({ userApi }) => {
    const res = await userApi.register({});

    expect(res.status()).toBe(400);
    const body = (await res.json()) as ApiResponse<FieldErrors>;
    expect(Object.keys(body.result!).sort()).toEqual(['Email', 'Name', 'Password', 'Surname', 'UserName']);
  });
});
