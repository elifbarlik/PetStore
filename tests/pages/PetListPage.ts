import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** /ilanlar – public adoption listing with search and "only unadopted" filter. */
export class PetListPage extends BasePage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly onlyUnadoptedCheckbox: Locator;
  readonly noMatchMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Sahiplendirme İlanları' });
    this.searchInput = page.getByPlaceholder('İlan ara...');
    this.onlyUnadoptedCheckbox = page.getByLabel('Sadece sahiplenilmeyen ilanları göster');
    this.noMatchMessage = page.getByText('Aramanızla eşleşen ilan bulunamadı');
  }

  async goto() {
    await this.page.goto('/ilanlar');
    await this.heading.waitFor();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Card in the listing grid, identified by its (unique) title. */
  card(title: string): Locator {
    // PostBox root is a `.group` container; the click handler sits on its wrapper.
    return this.page.locator('main div.group').filter({
      has: this.page.getByRole('heading', { name: title, exact: true }),
    });
  }

  async openCard(title: string) {
    await this.card(title).click();
  }
}
