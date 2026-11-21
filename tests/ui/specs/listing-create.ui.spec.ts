import { test, expect } from '../../fixtures/auth.fixture';
import { buildPost, PET_IMAGE } from '../../fixtures/test-data';
import type { ApiResponse, PostDto } from '../../api/clients/types';
import { ProfilePage } from '../../pages';

test.describe('Managing listings from the profile page', () => {
  test('UI-CRT-01 a user publishes a new listing with a photo @smoke', async ({
    authedPage, session, trackPostForCleanup,
  }) => {
    const post = buildPost();
    const profile = new ProfilePage(authedPage);
    await profile.goto();

    const modal = await profile.openAddPostModal();
    await modal.fill(post, PET_IMAGE);
    const created = authedPage.waitForResponse((r) => r.url().includes('/post/CreatePost'));
    await modal.submit();
    const response = await created;
    const body = (await response.json()) as ApiResponse<PostDto>;
    trackPostForCleanup(body.result!.postId, session.token);

    expect(response.status()).toBe(201);
    await expect(profile.toast('Post başarıyla oluşturuldu.')).toBeVisible();
    await expect(modal.root).toBeHidden();
    const card = profile.postCard(post.title);
    await expect(card).toBeVisible();
    await expect(card).toContainText(`🐾 ${post.petName}`);
    await expect(card).toContainText(post.petType);
    await expect(card.getByRole('img')).toHaveAttribute('src', /\/PostImages\/\d+\.png$/);

    expect(body.result).toMatchObject({ ...post, userId: session.userId });
  });

  for (const [field, testId] of [
    ['title', 'pet-title-input'],
    ['petName', 'pet-name-input'],
    ['description', 'pet-description-textarea'],
  ] as const) {
    test(`UI-CRT-02 the form blocks submission when "${field}" is empty`, async ({
      authedPage, session, postApi,
    }) => {
      const profile = new ProfilePage(authedPage);
      await profile.goto();
      const modal = await profile.openAddPostModal();

      await modal.fill({ ...buildPost(), [field]: '' }, PET_IMAGE);
      await modal.submit();

      await expect(modal.root).toBeVisible();
      await expect(modal.firstInvalidField()).toHaveAttribute('data-testid', testId);
      const posts = (await (await postApi.getByUserId(session.userId)).json()) as ApiResponse<PostDto[]>;
      expect(posts.result).toEqual([]);
    });
  }

  test('UI-CRT-03 the form requires a photo', async ({ authedPage }) => {
    const profile = new ProfilePage(authedPage);
    await profile.goto();
    const modal = await profile.openAddPostModal();

    await modal.fill(buildPost());
    await modal.submit();

    await expect(modal.root).toBeVisible();
    await expect(modal.firstInvalidField()).toHaveAttribute('data-testid', 'pet-image-input');
  });

  test('UI-CRT-04 cancelling closes the dialog without creating a post', async ({ authedPage }) => {
    const profile = new ProfilePage(authedPage);
    await profile.goto();
    const modal = await profile.openAddPostModal();
    await modal.fill(buildPost());

    await modal.cancelButton.click();

    await expect(modal.root).toBeHidden();
    await expect(profile.emptyState).toBeVisible();
  });

  test('UI-CRT-05 a server-side rejection shows the reason and keeps the form filled', async ({ authedPage }) => {
    const post = buildPost();
    const profile = new ProfilePage(authedPage);
    await profile.goto();
    const modal = await profile.openAddPostModal();

    // Named .png but not an image: passes the browser, rejected by the API's signature check
    await modal.fill(post);
    await modal.imageInput.setInputFiles({
      name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('not really a png'),
    });
    await modal.submit();

    await expect(modal.errorMessage).toHaveText('Dosya içeriği bir resim değil.');
    await expect(modal.root).toBeVisible();
    await expect(modal.titleInput).toHaveValue(post.title);
    await expect(profile.emptyState).toBeVisible();
  });

  test('UI-CRT-06 the owner deletes a listing after confirming', async ({ authedPage, session, seedPost }) => {
    const post = await seedPost(session);
    const profile = new ProfilePage(authedPage);
    await profile.goto();
    await expect(profile.postCard(post.title!)).toBeVisible();

    profile.acceptNextConfirm();
    await profile.deleteButton(post.title!).click();

    await expect(profile.toast('Post başarıyla silindi.')).toBeVisible();
    await expect(profile.postCard(post.title!)).toBeHidden();
    await expect(profile.emptyState).toBeVisible();
  });

  test('UI-CRT-07 an adopted listing offers "cancel adoption" instead of delete', async ({
    authedPage, session, seedPost, createSession, postApi,
  }) => {
    const post = await seedPost(session);
    const adopter = await createSession();
    await postApi.adopt(post.postId, adopter.token);
    const profile = new ProfilePage(authedPage);
    await profile.goto();
    await expect(profile.deleteButton(post.title!)).toBeHidden();

    profile.acceptNextConfirm();
    await profile.cancelAdoptionButton(post.title!).click();

    await expect(profile.toast(`'${post.petName}' isimli hayvanın sahiplenme durumu iptal edildi.`)).toBeVisible();
    await expect(profile.deleteButton(post.title!)).toBeVisible();
    await expect(profile.cancelAdoptionButton(post.title!)).toBeHidden();
  });
});
