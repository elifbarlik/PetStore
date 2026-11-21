import { test, expect } from '../../fixtures/auth.fixture';
import { buildPost, PET_IMAGE } from '../../fixtures/test-data';
import type { ApiResponse, PostDto } from '../clients/types';

test.describe('PUT /api/post/UpdatePost', () => {
  test('API-UPD-01 owner updates the text fields of a post', async ({ session, seedPost, postApi }) => {
    const post = await seedPost(session);
    const changes = buildPost({ petType: 'Kuş' });

    const res = await postApi.update(post.postId, { userId: session.userId, token: session.token, post: changes });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as ApiResponse<PostDto>;
    expect(body).toMatchObject({ isSuccess: true, statusCode: 200, message: 'Post başarıyla güncellendi.' });
    expect(body.result).toMatchObject({ ...changes, postId: post.postId, imageUrl: post.imageUrl });
  });

  test('API-UPD-02 owner replaces the photo and the new file is served', async ({
    session, postApi, api, trackPostForCleanup,
  }) => {
    // Start from a post WITHOUT a photo (placeholder), then upload one
    const created = (await (
      await postApi.create({ userId: session.userId, token: session.token, post: buildPost() })
    ).json()) as ApiResponse<PostDto>;
    const post = created.result!;
    trackPostForCleanup(post.postId, session.token);

    const res = await postApi.update(post.postId, {
      userId: session.userId, token: session.token, post: buildPost(), imagePath: PET_IMAGE,
    });

    const body = (await res.json()) as ApiResponse<PostDto>;
    expect(body.result!.imageUrl).toMatch(new RegExp(`/PostImages/${post.postId}\\.png$`));
    expect((await api.get(body.result!.imageUrl!)).status()).toBe(200);
  });

  test('API-UPD-03 [F-04 fixed] another user cannot update my post', async ({
    createSession, seedPost, postApi,
  }) => {
    const owner = await createSession();
    const other = await createSession();
    const post = await seedPost(owner);

    const res = await postApi.update(post.postId, { userId: other.userId, token: other.token, post: buildPost() });

    expect(res.status()).toBe(403);
    const reloaded = (await (await postApi.getById(post.postId)).json()) as ApiResponse<PostDto>;
    expect(reloaded.result!.title).toBe(post.title);
  });

  test('API-UPD-04 updating a missing post returns 404', async ({ session, postApi }) => {
    const res = await postApi.update(2_147_000_000, {
      userId: session.userId, token: session.token, post: buildPost(),
    });
    expect(res.status()).toBe(404);
  });
});
