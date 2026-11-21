import type { Locator, Page } from '@playwright/test';

/** Elements shared by every page (header rendered by RootLayout). */
export abstract class BasePage {
  readonly header: Locator;
  readonly headerLoginLink: Locator;
  readonly headerProfileLink: Locator;
  readonly logoutButton: Locator;

  constructor(readonly page: Page) {
    this.header = page.locator('header');
    this.headerLoginLink = this.header.getByRole('link', { name: 'Giriş Yap' });
    this.headerProfileLink = this.header.getByRole('link', { name: 'Profil' });
    this.logoutButton = this.header.getByRole('button', { name: 'Çıkış Yap' });
  }

  /** A react-toastify notification (rendered with role="alert") containing the text. */
  toast(text: string | RegExp): Locator {
    return this.page.getByRole('alert').filter({ hasText: text });
  }

  /** Reads the JWT the app persisted after login. */
  storedToken(): Promise<string | null> {
    return this.page.evaluate(() => window.localStorage.getItem('token'));
  }
}
