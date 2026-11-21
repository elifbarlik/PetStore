import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly userNameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly formError: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    super(page);
    this.userNameInput = page.getByLabel('Kullanıcı Adı', { exact: true });
    this.passwordInput = page.getByLabel('Şifre', { exact: true });
    // The header also has a "Giriş Yap" *link*; the submit control is the only *button*.
    this.submitButton = page.locator('main').getByRole('button', { name: 'Giriş Yap' });
    this.formError = page.locator('main .bg-red-50');
    this.registerLink = page.locator('main').getByRole('link', { name: 'Kayıt Ol' });
  }

  async goto() {
    await this.page.goto('/auth/login');
  }

  async login(userName: string, password: string) {
    await this.userNameInput.fill(userName);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /** Inline zod validation message rendered under a field. */
  fieldError(message: string): Locator {
    return this.page.locator('main').getByText(message, { exact: true });
  }
}
