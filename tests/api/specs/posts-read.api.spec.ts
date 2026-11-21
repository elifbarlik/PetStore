import { test, expect } from '../../fixtures/auth.fixture';
import type { ApiResponse, PostDto } from '../clients/types';

test.describe('GET /api/post/*', () => {
  test('API-READ-01 GetAllPosts lists a newly created post @smoke', async ({ session, seedPost, postApi }) => {
    const seeded = await seedPost(session);

    const res = await postApi.getAll();

    expect(res.status()).toBe(200);
    const body = (await res.json()) as ApiResponse<PostDto[]>;
    expect(body).toMatchObject({ isSuccess: true, statusCode: 200 });
    expect(body.result!.map((p) => p.postId)).toContain(seeded.postId);
  });

  test('API-READ-02 GetAllPosts is ordered newest first', async ({ session, seedPost, postApi }) => {
    const older = await seedPost(session);
    const newer = await seedPost(session);

    const ids = ((await (await postApi.getAll()).json()) as ApiResponse<PostDto[]>).result!.map((p) => p.postId);

    expect(ids.indexOf(newer.postId)).toBeLessThan(ids.indexOf(older.postId));
  });

  test('API-READ-03 GetPostById returns the post with its owner and a UTC timestamp', async ({
    session, seedPost, postApi,
  }) => {
    const before = Date.now();
    const seeded = await seedPost(session, { petType: 'Köpek' });

    const body = (await (await postApi.getById(seeded.postId)).json()) as ApiResponse<PostDto>;

    expect(body.isSuccess).toBe(true);
    expect(body.result).toMatchObject({
      postId: seeded.postId,
      title: seeded.title,
      petName: seeded.petName,
      petType: 'Köpek',
      isAdopted: false,
      userId: session.userId,
    });
    expect(body.result!.user).toMatchObject({ id: session.userId, userName: session.credentials.userName });
    // Serialized as UTC ("Z"), so every client converts it to its own time zone correctly
    expect(body.result!.postTime).toMatch(/Z$/);
    expect(Math.abs(Date.parse(body.result!.postTime) - before)).toBeLessThan(60_000);
  });

  test('API-READ-04 [F-05 fixed] GetPostById returns HTTP 404 for a missing post', async ({ postApi }) => {
    const res = await postApi.getById(2_147_000_000);

    expect(res.status()).toBe(404);
    expect(await res.json()).toMatchObject({ isSuccess: false, statusCode: 404, message: 'İlan bulunamadı' });
  });

  test('API-READ-05 GetPostById rejects a non-numeric id via the route constraint', async ({ api }) => {
    const res = await api.get('post/GetPostById/abc');
    expect(res.status()).toBe(404);
  });

  test("API-READ-06 GetPostsByUserId returns only that user's posts", async ({ createSession, seedPost, postApi }) => {
    const alice = await createSession();
    const bob = await createSession();
    const a1 = await seedPost(alice);
    const a2 = await seedPost(alice);
    await seedPost(bob);

    const body = (await (await postApi.getByUserId(alice.userId)).json()) as ApiResponse<PostDto[]>;

    expect(body.isSuccess).toBe(true);
    expect(body.result!.map((p) => p.postId)).toEqual([a2.postId, a1.postId]);
    expect(body.result!.every((p) => p.userId === alice.userId)).toBe(true);
  });

  test('API-READ-07 [F-06 fixed] a user without posts gets an empty list, not an error', async ({
    session, postApi,
  }) => {
    const res = await postApi.getByUserId(session.userId);

    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ isSuccess: true, statusCode: 200, result: [] });
  });
});
