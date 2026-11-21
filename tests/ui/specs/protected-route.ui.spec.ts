import { test, expect } from '../../fixtures/auth.fixture';
import { LoginPage, ProfilePage } from '../../pages';

/** A syntactically valid JWT whose `exp` is in the past (the client only decodes it). */
const expiredJwt = () => {
  const encode = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'x', exp: 1_000_000_000 })}.signature`;
};

test.describe('Protected routes & session handling', () => {
  for (const path of ['/profile', '/chat']) {
    test(`UI-PRT-01 anonymous visitor is redirected from ${path} to login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth\/login$/);
    });
  }

  test('UI-PRT-02 authenticated user can open the profile page @smoke', async ({ authedPage, session }) => {
    const profile = new ProfilePage(authedPage);

    await profile.goto();

    await expect(authedPage).toHaveURL(/\/profile$/);
    await expect(
      authedPage.getByRole('heading', { name: `${session.credentials.name} ${session.credentials.surname}` }),
    ).toBeVisible();
    await expect(profile.emptyState).toBeVisible();
  });

  test('UI-PRT-03 after logging in, the user is returned to the page they wanted', async ({ page, session }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/auth\/login$/);

    await new LoginPage(page).login(session.credentials.userName, session.credentials.password);

    await expect(page).toHaveURL(/\/profile$/);
  });

  test('UI-PRT-04 an expired stored token is discarded instead of showing a broken session', async ({ page }) => {
    await page.addInitScript((token) => {
      window.localStorage.setItem('token', token);
      window.localStorage.setItem('user', JSON.stringify({ id: 'x', name: 'Old', surname: 'Session' }));
    }, expiredJwt());

    await page.goto('/profile');

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(new LoginPage(page).headerLoginLink).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem('token'))).toBeNull();
  });
});
