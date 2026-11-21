import { test, expect } from '../../fixtures/auth.fixture';
import { buildUser } from '../../fixtures/test-data';
import { RegisterPage } from '../../pages';

test.describe('Register page', () => {
  test('UI-REG-01 creates an account and redirects to login @smoke', async ({ page, userApi }) => {
    const user = buildUser();
    const registerPage = new RegisterPage(page);

    await registerPage.goto();
    await registerPage.register(user);

    await expect(page.getByText('Kayıt işlemi başarılı. Lütfen hesabınıza giriş yapınız.')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login$/);
    // The account really exists: the API accepts the credentials.
    expect((await userApi.login(user.userName, user.password)).status()).toBe(200);
  });

  test('UI-REG-02 requires name and surname', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.submitButton.click();

    await expect(registerPage.fieldError('İsim gereklidir')).toBeVisible();
    await expect(registerPage.fieldError('Soyisim gereklidir')).toBeVisible();
  });

  test('UI-REG-03 rejects a password without digit, uppercase and special character', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.register(buildUser({ password: 'abcdefg' }));

    await expect(
      registerPage.fieldError('Şifreniz rakam, büyük harf ve özel karakter içermelidir'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/register$/);
  });

  test('UI-REG-04 rejects an invalid e-mail format', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.register(buildUser({ email: 'not-an-email' }));

    await expect(registerPage.fieldError('Doğru email formatı giriniz')).toBeVisible();
  });

  test('UI-REG-05 surfaces the backend error for a taken user name', async ({ page, userApi }) => {
    const existing = buildUser();
    await userApi.register(existing);
    const registerPage = new RegisterPage(page);

    await registerPage.goto();
    await registerPage.register(buildUser({ userName: existing.userName }));

    await expect(registerPage.formError).toHaveText('Username already taken');
    await expect(page).toHaveURL(/\/auth\/register$/);
  });

  test('UI-REG-06 [F-08 fixed] the submit button is labelled "Kayıt Ol"', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await expect(registerPage.submitButton).toHaveText('Kayıt Ol');
  });
});
