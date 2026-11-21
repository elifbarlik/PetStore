import { test, expect } from '../../fixtures/auth.fixture';
import type { ApiResponse } from '../clients/types';

test.describe('DELETE /api/post/DeletePost/{id}', () => {
  test('API-DEL-01 owner deletes a post and its image file @smoke', async ({ session, seedPost, postApi, api }) => {
    const post = await seedPost(session);

    const res = await postApi.delete(post.postId, session.token);

    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ isSuccess: true, statusCode: 200, message: 'Post başarıyla silindi.' });

    expect((await postApi.getById(post.postId)).status()).toBe(404);
    expect((await api.get(post.imageUrl!)).status()).toBe(404);
  });

  test('API-DEL-02 requires authentication', async ({ session, seedPost, postApi }) => {
    const post = await seedPost(session);

    const res = await postApi.delete(post.postId);

    expect(res.status()).toBe(401);
    expect((await postApi.getById(post.postId)).status()).toBe(200);
  });

  test('API-DEL-03 reports a missing post with HTTP 404', async ({ session, postApi }) => {
    const res = await postApi.delete(2_147_000_000, session.token);

    expect(res.status()).toBe(404);
    expect(await res.json()).toMatchObject({
      isSuccess: false, statusCode: 404, message: 'Silinecek post bulunamadı.',
    });
  });

  test('API-DEL-04 [F-04 fixed] another user cannot delete my post', async ({
    createSession, seedPost, postApi,
  }) => {
    const owner = await createSession();
    const other = await createSession();
    const post = await seedPost(owner);

    const res = await postApi.delete(post.postId, other.token);

    expect(res.status()).toBe(403);
    expect(await res.json()).toMatchObject({
      isSuccess: false, statusCode: 403, message: 'Sadece kendi ilanınızı silebilirsiniz.',
    });
    expect((await postApi.getById(post.postId)).status()).toBe(200);
  });

  test('API-DEL-05 [F-07 fixed] an adopted post cannot be deleted until the adoption is cancelled', async ({
    createSession, seedPost, postApi,
  }) => {
    const owner = await createSession();
    const adopter = await createSession();
    const post = await seedPost(owner);
    await postApi.adopt(post.postId, adopter.token);

    const blocked = await postApi.delete(post.postId, owner.token);
    expect(blocked.status()).toBe(400);
    expect(((await blocked.json()) as ApiResponse<null>).message).toBe(
      'Sahiplenilmiş bir ilan silinemez. Önce sahiplenmeyi iptal edin.',
    );

    await postApi.cancelAdoption(post.postId, owner.token);
    const allowed = await postApi.delete(post.postId, owner.token);
    expect(allowed.status()).toBe(200);
  });
});
