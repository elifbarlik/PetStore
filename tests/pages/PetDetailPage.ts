import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** /ilan/:id – single post detail page. */
export class PetDetailPage extends BasePage {
  readonly title: Locator;
  readonly adoptButton: Locator;
  readonly loginToAdoptButton: Locator;
  readonly ownPostButton: Locator;
  readonly adoptedBadge: Locator;
  readonly notFoundMessage: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator('main h1');
    this.adoptButton = page.getByRole('button', { name: 'Sahiplen', exact: true });
    this.loginToAdoptButton = page.getByRole('button', { name: 'Sahiplenmek için giriş yapın' });
    this.ownPostButton = page.getByRole('button', { name: 'İlan Size Ait' });
    this.adoptedBadge = page.locator('main').getByText('Sahiplenildi', { exact: true });
    this.notFoundMessage = page.getByText('İlan bulunamadı');
    this.backButton = page.getByRole('button', { name: 'Geri Dön' });
  }

  async goto(postId: number) {
    await this.page.goto(`/ilan/${postId}`);
  }

  petName(name: string): Locator {
    return this.page.locator('main').getByText(`🐾 ${name}`);
  }
}
