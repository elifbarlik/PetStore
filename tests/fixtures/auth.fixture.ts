import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test';
import { API_URL } from '../config/env';
import { PostApiClient } from '../api/clients/postApiClient';
import { UserApiClient } from '../api/clients/userApiClient';
import type { ApiResponse, LoginResult, PostDto, UserDto } from '../api/clients/types';
import { buildPost, buildUser, PET_IMAGE, type NewPost, type NewUser } from './test-data';

export interface Session {
  credentials: NewUser;
  /** User object exactly as returned by /user/Login (what the frontend stores). */
  user: UserDto;
  userId: string;
  token: string;
}

interface Fixtures {
  /** Request context pointed at the backend, independent of the project's baseURL. */
  api: APIRequestContext;
  userApi: UserApiClient;
  postApi: PostApiClient;
  /** Factory: registers + logs in a brand-new user through the real API. */
  createSession: () => Promise<Session>;
  /** A fresh logged-in user for the current test. */
  session: Session;
  /** Factory: creates a post via the API and deletes it after the test (best effort). */
  seedPost: (session: Session, post?: Partial<NewPost>) => Promise<PostDto>;
  /** Register a post id created by the test (e.g. through the UI) for cleanup. */
  trackPostForCleanup: (postId: number, token: string) => void;
  /** Page with the session's JWT + user injected into localStorage before app boot. */
  authedPage: Page;
}

export const test = base.extend<Fixtures>({
  api: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: `${API_URL}/`,
      extraHTTPHeaders: { Accept: 'application/json' },
    });
    await use(ctx);
    await ctx.dispose();
  },

  userApi: async ({ api }, use) => use(new UserApiClient(api)),
  postApi: async ({ api }, use) => use(new PostApiClient(api)),

  createSession: async ({ userApi }, use) => {
    await use(async () => {
      const credentials = buildUser();
      const reg = await userApi.register(credentials);
      expect(reg.status(), `register ${credentials.userName}`).toBe(200);
      const regBody = (await reg.json()) as ApiResponse<UserDto>;

      const login = await userApi.login(credentials.userName, credentials.password);
      expect(login.status(), `login ${credentials.userName}`).toBe(200);
      const { result } = (await login.json()) as ApiResponse<LoginResult>;

      return {
        credentials,
        user: result!.user,
        userId: regBody.result!.id,
        token: result!.token,
      };
    });
  },

  session: async ({ createSession }, use) => use(await createSession()),

  trackPostForCleanup: async ({ postApi }, use) => {
    const created: Array<{ id: number; token: string }> = [];
    await use((id, token) => created.push({ id, token }));
    for (const { id, token } of created) {
      // Best effort: cleanup failures must never fail the test itself.
      // An adopted post cannot be deleted, so the owner first cancels the adoption.
      const res = await postApi.delete(id, token).catch(() => undefined);
      if (res?.status() === 400) {
        await postApi.cancelAdoption(id, token).catch(() => undefined);
        await postApi.delete(id, token).catch(() => undefined);
      }
    }
  },

  seedPost: async ({ postApi, trackPostForCleanup }, use) => {
    await use(async (session, post) => {
      const res = await postApi.create({
        userId: session.userId,
        token: session.token,
        post: buildPost(post),
        imagePath: PET_IMAGE,
      });
      const body = (await res.json()) as ApiResponse<PostDto>;
      expect(body.isSuccess, body.message).toBe(true);
      trackPostForCleanup(body.result!.postId, session.token);
      return body.result!;
    });
  },

  authedPage: async ({ page, session }, use) => {
    await page.addInitScript(
      ({ token, user }) => {
        window.localStorage.setItem('token', token);
        window.localStorage.setItem('user', JSON.stringify(user));
      },
      { token: session.token, user: session.user },
    );
    await use(page);
  },
});

export { expect };
