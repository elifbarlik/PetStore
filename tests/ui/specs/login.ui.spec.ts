import { test, expect } from '../../fixtures/auth.fixture';
import { buildUser } from '../../fixtures/test-data';
import { LoginPage } from '../../pages';

test.describe('Login page', () => {
  test('UI-LOG-01 a registered user logs in and lands on the home page @smoke', async ({ page, userApi }) => {
    const user = buildUser();
    await userApi.register(user);
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(user.userName, user.password);

    await expect(page).toHaveURL('/');
    await expect(loginPage.headerProfileLink).toBeVisible();
    await expect(loginPage.headerLoginLink).toBeHidden();
    expect(await loginPage.storedToken()).toMatch(/^ey[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  test('UI-LOG-02 shows the backend error for a wrong password', async ({ page, userApi }) => {
    const user = buildUser();
    await userApi.register(user);
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(user.userName, 'Wrong1234!');

    await expect(loginPage.formError).toHaveText('Kullanıcı adı veya şifre yanlış.');
    await expect(page).toHaveURL(/\/auth\/login$/);
    expect(await loginPage.storedToken()).toBeNull();
  });

  test('UI-LOG-03 validates required fields on submit', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.submitButton.click();

    await expect(loginPage.fieldError('Kullanıcı adı gereklidir')).toBeVisible();
    await expect(loginPage.fieldError('Şifre gereklidir')).toBeVisible();
  });

  test('UI-LOG-04 validates minimum lengths', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('ab', '12345');

    await expect(loginPage.fieldError('Kullanıcı adı en az 3 karakter olmalıdır')).toBeVisible();
    await expect(loginPage.fieldError('Şifre en az 6 karakter olmalıdır')).toBeVisible();
  });

  test('UI-LOG-05 logging out clears the session', async ({ authedPage }) => {
    const loginPage = new LoginPage(authedPage);
    await authedPage.goto('/');
    await expect(loginPage.headerProfileLink).toBeVisible();

    await loginPage.logoutButton.click();

    await expect(loginPage.headerLoginLink).toBeVisible();
    expect(await loginPage.storedToken()).toBeNull();
    expect(await authedPage.evaluate(() => window.localStorage.getItem('user'))).toBeNull();
  });

  test('UI-LOG-06 a logged-in user opening the login page is sent home', async ({ authedPage }) => {
    await authedPage.goto('/auth/login');
    await expect(authedPage).toHaveURL('/');
  });

  test('UI-LOG-07 a failed login error does not leak onto the register page', async ({ page, userApi }) => {
    const user = buildUser();
    await userApi.register(user);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(user.userName, 'Wrong1234!');
    await expect(loginPage.formError).toBeVisible();

    await loginPage.registerLink.click();

    await expect(page).toHaveURL(/\/auth\/register$/);
    await expect(page.locator('main .bg-red-50')).toBeHidden();
  });
});
