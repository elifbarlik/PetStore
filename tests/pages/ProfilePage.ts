import type { Locator, Page } from '@playwright/test';
import { AddPetModal } from './AddPetModal';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  readonly addPostButton: Locator;
  readonly emptyState: Locator;
  readonly addPetModal: AddPetModal;

  constructor(page: Page) {
    super(page);
    this.addPostButton = page.getByRole('button', { name: 'İlan Ekle', exact: true });
    this.emptyState = page.getByText('Henüz hiç ilanınız yok');
    this.addPetModal = new AddPetModal(page);
  }

  async goto() {
    await this.page.goto('/profile');
  }

  async openAddPostModal(): Promise<AddPetModal> {
    await this.addPostButton.click();
    await this.addPetModal.root.waitFor();
    return this.addPetModal;
  }

  deleteButton(title: string): Locator {
    return this.postCard(title).getByRole('button', { name: 'İlanı sil' });
  }

  cancelAdoptionButton(title: string): Locator {
    return this.postCard(title).getByRole('button', { name: 'Sahiplenmeyi iptal et' });
  }

  /** Accepts the next native confirm() dialog (delete / cancel adoption). */
  acceptNextConfirm() {
    this.page.once('dialog', (dialog) => dialog.accept());
  }

  /** A post card on the profile, identified by its (unique) title. */
  postCard(title: string): Locator {
    // UserPostCard root is the only `.group` container holding an h3 title.
    return this.page.locator('main div.group').filter({
      has: this.page.getByRole('heading', { name: title, exact: true }),
    });
  }
}
