import { test, expect } from '../../fixtures/auth.fixture';
import { PetDetailPage, PetListPage } from '../../pages';

test.describe('Browsing listings', () => {
  test('UI-LST-01 a new post appears in the public listing @smoke', async ({ page, session, seedPost }) => {
    const post = await seedPost(session);
    const list = new PetListPage(page);

    await list.goto();

    const card = list.card(post.title!);
    await expect(card).toBeVisible();
    await expect(card).toContainText(`🐾 ${post.petName}`);
    await expect(card).toContainText(session.credentials.userName);
    await expect(card).toContainText('Sahiplen');
  });

  test('UI-LST-02 search narrows the listing and reports no matches', async ({ page, session, seedPost }) => {
    const target = await seedPost(session);
    const other = await seedPost(session);
    const list = new PetListPage(page);
    await list.goto();

    await list.search(target.petName!);
    await expect(list.card(target.title!)).toBeVisible();
    await expect(list.card(other.title!)).toBeHidden();

    await list.search('zz-no-such-pet-zz');
    await expect(list.noMatchMessage).toBeVisible();
  });

  test('UI-LST-03 "only unadopted" filter hides adopted pets', async ({
    page, createSession, seedPost, postApi,
  }) => {
    const owner = await createSession();
    const adopter = await createSession();
    const adopted = await seedPost(owner);
    const available = await seedPost(owner);
    await postApi.adopt(adopted.postId, adopter.token);
    const list = new PetListPage(page);
    await list.goto();
    await expect(list.card(adopted.title!)).toContainText('Sahiplenildi');

    await list.onlyUnadoptedCheckbox.check();

    await expect(list.card(adopted.title!)).toBeHidden();
    await expect(list.card(available.title!)).toBeVisible();
  });

  test('UI-LST-04 clicking a card opens its detail page', async ({ page, session, seedPost }) => {
    const post = await seedPost(session);
    const list = new PetListPage(page);
    await list.goto();

    await list.openCard(post.title!);

    const detail = new PetDetailPage(page);
    await expect(page).toHaveURL(new RegExp(`/ilan/${post.postId}$`));
    await expect(detail.title).toHaveText(post.title!);
    await expect(detail.petName(post.petName!)).toBeVisible();
    await expect(page.locator('main')).toContainText(post.description!);
  });

  test('UI-LST-05 anonymous visitors are sent to login before adopting', async ({ page, session, seedPost }) => {
    const post = await seedPost(session);
    const detail = new PetDetailPage(page);
    await detail.goto(post.postId);
    await expect(detail.adoptButton).toBeHidden();

    await detail.loginToAdoptButton.click();

    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('UI-LST-09 search is case-insensitive with Turkish letters (İ/ı)', async ({ page, session, seedPost }) => {
    const post = await seedPost(session, { title: `İzmir'de sevimli kedi ${Date.now()}` });
    const list = new PetListPage(page);
    await list.goto();

    await list.search('İZMİR');
    await expect(list.card(post.title!)).toBeVisible();

    await list.search('izmir');
    await expect(list.card(post.title!)).toBeVisible();
  });

  test('UI-LST-10 cards are real links (keyboard accessible)', async ({ page, session, seedPost }) => {
    const post = await seedPost(session);
    const list = new PetListPage(page);
    await list.goto();

    const link = page.getByRole('link').filter({ has: page.getByRole('heading', { name: post.title!, exact: true }) });
    await expect(link).toHaveAttribute('href', `/ilan/${post.postId}`);

    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/ilan/${post.postId}$`));
  });

  test('UI-LST-06 owners see their post as their own and cannot adopt it', async ({ authedPage, session, seedPost }) => {
    const post = await seedPost(session);
    const detail = new PetDetailPage(authedPage);

    await detail.goto(post.postId);

    await expect(detail.ownPostButton).toBeDisabled();
    await expect(detail.adoptButton).toBeHidden();
  });

  test('UI-LST-07 another user adopts a pet from the detail page', async ({
    authedPage, createSession, seedPost, postApi,
  }) => {
    const owner = await createSession();
    const post = await seedPost(owner);
    const detail = new PetDetailPage(authedPage);
    await detail.goto(post.postId);

    await detail.adoptButton.click();

    await expect(detail.toast(`'${post.petName}' isimli hayvan başarıyla sahiplenildi!`)).toBeVisible();
    await expect(detail.adoptedBadge).toBeVisible();
    await expect(detail.adoptButton).toBeHidden();
    const reloaded = await (await postApi.getById(post.postId)).json();
    expect(reloaded.result.isAdopted).toBe(true);
  });

  test('UI-LST-08 an unknown post id shows a not-found state', async ({ page }) => {
    const detail = new PetDetailPage(page);

    await detail.goto(2_147_000_000);

    await expect(detail.notFoundMessage).toBeVisible();
    await expect(detail.backButton).toBeVisible();
  });
});
