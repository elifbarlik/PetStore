import type { Locator, Page } from '@playwright/test';
import type { NewPost } from '../fixtures/test-data';

/** "Yeni İlan Ekle" dialog opened from the profile page. */
export class AddPetModal {
  readonly root: Locator;
  readonly titleInput: Locator;
  readonly petNameInput: Locator;
  readonly petTypeInput: Locator;
  readonly descriptionInput: Locator;
  readonly imageInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  /** Inline error shown inside the dialog (server rejection, file too large, ...). */
  readonly errorMessage: Locator;

  constructor(page: Page) {
    // Headless UI's role="dialog" wrapper has no box of its own (Playwright treats it as
    // hidden), so the visible root is the form inside the named dialog.
    this.root = page.getByRole('dialog', { name: 'Yeni İlan Ekle' }).locator('form');
    this.titleInput = this.root.getByTestId('pet-title-input');
    this.petNameInput = this.root.getByTestId('pet-name-input');
    this.petTypeInput = this.root.getByTestId('pet-type-input');
    this.descriptionInput = this.root.getByTestId('pet-description-textarea');
    this.imageInput = this.root.getByTestId('pet-image-input');
    this.saveButton = this.root.getByRole('button', { name: 'Kaydet' });
    this.cancelButton = this.root.getByRole('button', { name: 'İptal' });
    this.errorMessage = this.root.getByRole('alert');
  }

  async fill(post: Partial<NewPost>, imagePath?: string) {
    if (post.title !== undefined) await this.titleInput.fill(post.title);
    if (post.petName !== undefined) await this.petNameInput.fill(post.petName);
    if (post.petType !== undefined) await this.petTypeInput.fill(post.petType);
    if (post.description !== undefined) await this.descriptionInput.fill(post.description);
    if (imagePath) await this.imageInput.setInputFiles(imagePath);
  }

  async submit() {
    await this.saveButton.click();
  }

  /** First field the browser's native constraint validation flags as invalid. */
  firstInvalidField(): Locator {
    return this.root.locator(':invalid').first();
  }
}
