import type { Locator, Page } from '@playwright/test';
import type { NewUser } from '../fixtures/test-data';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  readonly nameInput: Locator;
  readonly surnameInput: Locator;
  readonly userNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly formError: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.getByLabel('Adınız', { exact: true });
    this.surnameInput = page.getByLabel('Soyadınız', { exact: true });
    this.userNameInput = page.getByLabel('Kullanıcı Adı', { exact: true });
    this.emailInput = page.getByLabel('Email', { exact: true });
    this.passwordInput = page.getByLabel('Şifre', { exact: true });
    this.submitButton = page.locator('main').getByRole('button', { name: 'Kayıt Ol' });
    this.formError = page.locator('main .bg-red-50');
  }

  async goto() {
    await this.page.goto('/auth/register');
  }

  async fill(user: Partial<NewUser>) {
    if (user.name !== undefined) await this.nameInput.fill(user.name);
    if (user.surname !== undefined) await this.surnameInput.fill(user.surname);
    if (user.userName !== undefined) await this.userNameInput.fill(user.userName);
    if (user.email !== undefined) await this.emailInput.fill(user.email);
    if (user.password !== undefined) await this.passwordInput.fill(user.password);
  }

  async register(user: Partial<NewUser>) {
    await this.fill(user);
    await this.submitButton.click();
  }

  fieldError(message: string): Locator {
    return this.page.locator('main').getByText(message, { exact: true });
  }
}
