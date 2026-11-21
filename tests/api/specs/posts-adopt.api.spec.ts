import { test, expect } from '../../fixtures/auth.fixture';
import type { ApiResponse, PostDto } from '../clients/types';

test.describe('POST /api/post/AdoptPost & CancelAdoption', () => {
  test('API-ADP-01 another user adopts a post and the flag is persisted @smoke', async ({
    createSession, seedPost, postApi,
  }) => {
    const owner = await createSession();
    const adopter = await createSession();
    const post = await seedPost(owner);

    const res = await postApi.adopt(post.postId, adopter.token);

    expect(res.status()).toBe(200);
    const body = (await res.json()) as ApiResponse<PostDto>;
    expect(body).toMatchObject({ isSuccess: true, statusCode: 200 });
    expect(body.message).toBe(`'${post.petName}' isimli hayvan başarıyla sahiplenildi!`);
    expect(body.result!.isAdopted).toBe(true);

    const reloaded = (await (await postApi.getById(post.postId)).json()) as ApiResponse<PostDto>;
    expect(reloaded.result!.isAdopted).toBe(true);
  });

  test('API-ADP-02 an already adopted post cannot be adopted again', async ({
    createSession, seedPost, postApi,
  }) => {
    const owner = await createSession();
    const adopter = await createSession();
    const post = await seedPost(owner);
    await postApi.adopt(post.postId, adopter.token);

    const res = await postApi.adopt(post.postId, adopter.token);

    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({
      isSuccess: false, statusCode: 400, message: 'Bu ilan zaten sahiplenilmiş.',
    });
  });

  test('API-ADP-03 adopting requires authentication', async ({ session, seedPost, postApi }) => {
    const post = await seedPost(session);
    expect((await postApi.adopt(post.postId)).status()).toBe(401);
  });

  test('API-ADP-04 adopting a missing post returns 404', async ({ session, postApi }) => {
    const res = await postApi.adopt(2_147_000_000, session.token);
    expect(res.status()).toBe(404);
    expect(await res.json()).toMatchObject({ isSuccess: false, statusCode: 404 });
  });

  test('API-ADP-05 the owner cancels an adoption and the flag is reset', async ({
    createSession, seedPost, postApi,
  }) => {
    const owner = await createSession();
    const adopter = await createSession();
    const post = await seedPost(owner);
    await postApi.adopt(post.postId, adopter.token);

    const res = await postApi.cancelAdoption(post.postId, owner.token);

    expect(res.status()).toBe(200);
    expect(((await res.json()) as ApiResponse<PostDto>).result!.isAdopted).toBe(false);
  });

  test('API-ADP-06 cancelling a post that is not adopted is rejected', async ({ session, seedPost, postApi }) => {
    const post = await seedPost(session);

    const res = await postApi.cancelAdoption(post.postId, session.token);

    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({
      isSuccess: false, statusCode: 400, message: 'Bu ilan zaten sahiplenilmemiş durumda.',
    });
  });

  test('API-ADP-07 [F-04 fixed] an owner cannot adopt their own post', async ({ session, seedPost, postApi }) => {
    const post = await seedPost(session);

    const res = await postApi.adopt(post.postId, session.token);

    expect(res.status()).toBe(403);
    expect(await res.json()).toMatchObject({
      isSuccess: false, statusCode: 403, message: 'Kendi ilanınızı sahiplenemezsiniz.',
    });
    const reloaded = (await (await postApi.getById(post.postId)).json()) as ApiResponse<PostDto>;
    expect(reloaded.result!.isAdopted).toBe(false);
  });

  test('API-ADP-08 [F-04 fixed] only the owner can cancel an adoption', async ({
    createSession, seedPost, postApi,
  }) => {
    const owner = await createSession();
    const adopter = await createSession();
    const post = await seedPost(owner);
    await postApi.adopt(post.postId, adopter.token);

    const res = await postApi.cancelAdoption(post.postId, adopter.token);

    expect(res.status()).toBe(403);
    expect(await res.json()).toMatchObject({
      isSuccess: false, statusCode: 403, message: 'Sadece ilan sahibi sahiplenmeyi iptal edebilir.',
    });
    const reloaded = (await (await postApi.getById(post.postId)).json()) as ApiResponse<PostDto>;
    expect(reloaded.result!.isAdopted).toBe(true);
  });

  test('API-ADP-09 concurrent adoption requests: exactly one wins', async ({
    createSession, seedPost, postApi,
  }) => {
    const owner = await createSession();
    const adopters = await Promise.all([createSession(), createSession(), createSession()]);
    const post = await seedPost(owner);

    const responses = await Promise.all(adopters.map((a) => postApi.adopt(post.postId, a.token)));

    const statuses = responses.map((r) => r.status()).sort();
    expect(statuses).toEqual([200, 400, 400]);
  });

  test('API-ADP-10 a post can be adopted again after the adoption was cancelled', async ({
    createSession, seedPost, postApi,
  }) => {
    const owner = await createSession();
    const first = await createSession();
    const second = await createSession();
    const post = await seedPost(owner);
    await postApi.adopt(post.postId, first.token);
    await postApi.cancelAdoption(post.postId, owner.token);

    const res = await postApi.adopt(post.postId, second.token);

    expect(res.status()).toBe(200);
  });
});
