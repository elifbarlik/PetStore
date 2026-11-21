import { test, expect } from '../../fixtures/auth.fixture';
import { buildPost, NOT_AN_IMAGE, PET_IMAGE } from '../../fixtures/test-data';
import type { ApiResponse, FieldErrors, PostDto } from '../clients/types';

test.describe('POST /api/post/CreatePost', () => {
  test('API-CRT-01 creates a post with an uploaded image that is then served @smoke', async ({
    session, postApi, api, trackPostForCleanup,
  }) => {
    const post = buildPost();

    const res = await postApi.create({ userId: session.userId, token: session.token, post, imagePath: PET_IMAGE });

    expect(res.status()).toBe(201);
    const body = (await res.json()) as ApiResponse<PostDto>;
    expect(body).toMatchObject({ isSuccess: true, statusCode: 201, message: 'Post başarıyla oluşturuldu.' });
    trackPostForCleanup(body.result!.postId, session.token);

    expect(body.result).toMatchObject({ ...post, userId: session.userId, isAdopted: false });
    expect(body.result!.imageUrl).toMatch(new RegExp(`/PostImages/${body.result!.postId}\\.png$`));

    const image = await api.get(body.result!.imageUrl!);
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toBe('image/png');
  });

  test('API-CRT-02 falls back to a placeholder image when none is uploaded', async ({
    session, postApi, trackPostForCleanup,
  }) => {
    const res = await postApi.create({ userId: session.userId, token: session.token, post: buildPost() });

    expect(res.status()).toBe(201);
    const body = (await res.json()) as ApiResponse<PostDto>;
    trackPostForCleanup(body.result!.postId, session.token);
    expect(body.result!.imageUrl).toBe('https://placehold.co/600x400');
    expect(body.result!.imageLocalPath).toBeNull();
  });

  test('API-CRT-03 requires authentication', async ({ session, postApi }) => {
    const res = await postApi.create({ userId: session.userId, post: buildPost(), imagePath: PET_IMAGE });
    expect(res.status()).toBe(401);
  });

  test('API-CRT-04 rejects a tampered JWT', async ({ session, postApi }) => {
    const [header, payload] = session.token.split('.');
    const forged = `${header}.${payload}.invalidsignature`;

    const res = await postApi.create({ userId: session.userId, token: forged, post: buildPost() });

    expect(res.status()).toBe(401);
  });

  test('API-CRT-05 returns field errors when UserId is missing', async ({ session, postApi }) => {
    const res = await postApi.create({ token: session.token, post: buildPost() });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as ApiResponse<FieldErrors>;
    expect(body).toMatchObject({ isSuccess: false, statusCode: 400 });
    expect(body.result!.UserId).toEqual(['UserId zorunludur.']);
  });

  test('API-CRT-06 rejects a UserId that is not the caller (e.g. non-existent)', async ({ session, postApi }) => {
    const res = await postApi.create({ userId: 'does-not-exist', token: session.token, post: buildPost() });

    expect(res.status()).toBe(403);
    expect(await res.json()).toMatchObject({ isSuccess: false, statusCode: 403 });
  });

  test('API-CRT-07 rejects a non-image file extension', async ({ session, postApi }) => {
    const res = await postApi.create({
      userId: session.userId, token: session.token, post: buildPost(), imagePath: NOT_AN_IMAGE,
    });

    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({
      isSuccess: false,
      statusCode: 400,
      message: 'Geçersiz dosya formatı. Sadece jpg, jpeg, png, gif dosyaları kabul edilir.',
    });
  });

  test('API-CRT-08 [F-03 fixed] a rejected upload does not persist the post', async ({
    session, postApi, trackPostForCleanup,
  }) => {
    await postApi.create({ userId: session.userId, token: session.token, post: buildPost(), imagePath: NOT_AN_IMAGE });

    const body = (await (await postApi.getByUserId(session.userId)).json()) as ApiResponse<PostDto[]>;
    body.result?.forEach((p) => trackPostForCleanup(p.postId, session.token));
    expect(body.result).toEqual([]);
  });

  test('API-CRT-09 [F-04 fixed] a user cannot create posts on behalf of someone else', async ({
    createSession, postApi, trackPostForCleanup,
  }) => {
    const victim = await createSession();
    const attacker = await createSession();

    const res = await postApi.create({ userId: victim.userId, token: attacker.token, post: buildPost() });

    const body = (await res.json()) as ApiResponse<PostDto>;
    if (body.result) trackPostForCleanup(body.result.postId, victim.token);
    expect(res.status()).toBe(403);
    expect(body).toMatchObject({
      isSuccess: false, statusCode: 403, message: 'Başka bir kullanıcı adına ilan oluşturamazsınız.',
    });
    const victimPosts = (await (await postApi.getByUserId(victim.userId)).json()) as ApiResponse<PostDto[]>;
    expect(victimPosts.result).toEqual([]);
  });

  test('API-CRT-10 [F-09 fixed] requires title, pet name, pet type and description', async ({ session, postApi }) => {
    const res = await postApi.create({
      userId: session.userId,
      token: session.token,
      post: { title: '', petName: '', petType: '', description: '' },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as ApiResponse<FieldErrors>;
    expect(body.result).toMatchObject({
      Title: ['İlan başlığı zorunludur.'],
      PetName: ['Evcil hayvan adı zorunludur.'],
      PetType: ['Evcil hayvan türü zorunludur.'],
      Description: ['Açıklama zorunludur.'],
    });
  });

  test('API-CRT-11 enforces maximum field lengths', async ({ session, postApi }) => {
    const res = await postApi.create({
      userId: session.userId, token: session.token, post: buildPost({ title: 'x'.repeat(101) }),
    });

    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiResponse<FieldErrors>).result!.Title).toEqual([
      'İlan başlığı en fazla 100 karakter olabilir.',
    ]);
  });

  test('API-CRT-12 rejects a file whose content is not an image even with a .png name', async ({
    session, postApi,
  }) => {
    const res = await postApi.create({
      userId: session.userId,
      token: session.token,
      post: buildPost(),
      imageFile: { name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('<script>alert(1)</script>') },
    });

    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiResponse<null>).message).toBe('Dosya içeriği bir resim değil.');
  });

  test('API-CRT-13 rejects images larger than 5 MB', async ({ session, postApi }) => {
    const png = Buffer.alloc(5 * 1024 * 1024 + 1);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png);

    const res = await postApi.create({
      userId: session.userId,
      token: session.token,
      post: buildPost(),
      imageFile: { name: 'big.png', mimeType: 'image/png', buffer: png },
    });

    expect(res.status()).toBe(400);
    expect(((await res.json()) as ApiResponse<null>).message).toBe("Dosya boyutu 5MB'dan büyük olamaz.");
  });
});
