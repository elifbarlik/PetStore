import path from 'node:path';
import { randomBytes } from 'node:crypto';

/**
 * Test data factory.
 *
 * There is no DB reset between runs, so every test creates its own uniquely named
 * users and posts. Collisions are avoided with a timestamp + random suffix.
 */

/** Satisfies both the frontend zod regex and ASP.NET Identity defaults. */
export const VALID_PASSWORD = 'Test1234!';

export interface NewUser {
  name: string;
  surname: string;
  userName: string;
  email: string;
  password: string;
}

export const uniqueSuffix = (): string =>
  `${Date.now().toString(36)}${randomBytes(3).toString('hex')}`;

export function buildUser(overrides: Partial<NewUser> = {}): NewUser {
  const id = uniqueSuffix();
  return {
    name: 'Test',
    surname: 'User',
    userName: `qa_${id}`,
    email: `qa_${id}@petstore.test`,
    password: VALID_PASSWORD,
    ...overrides,
  };
}

export interface NewPost {
  title: string;
  petName: string;
  petType: string;
  description: string;
}

export function buildPost(overrides: Partial<NewPost> = {}): NewPost {
  const id = uniqueSuffix();
  return {
    title: `QA ilan ${id}`,
    petName: `Pamuk-${id}`,
    petType: 'Kedi',
    description: 'Playwright tarafından oluşturulan test ilanı.',
    ...overrides,
  };
}

// PNG only: the backend stores uploads as wwwroot/PostImages/{postId}{ext}, and a
// tracked file `1.jpg` already lives there; PNG uploads never overwrite it.
export const ASSETS_DIR = path.resolve(__dirname, '..', 'assets');
export const PET_IMAGE = path.join(ASSETS_DIR, 'pet.png');
export const NOT_AN_IMAGE = path.join(ASSETS_DIR, 'not-an-image.txt');
