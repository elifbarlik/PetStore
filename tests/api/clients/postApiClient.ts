import fs from 'node:fs';
import path from 'node:path';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { NewPost } from '../../fixtures/test-data';

export interface UploadFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export interface CreatePostOptions {
  userId?: string;
  post?: Partial<NewPost>;
  /** Absolute path of a file sent as the multipart `Image` part. */
  imagePath?: string;
  /** In-memory file sent as the `Image` part (takes precedence over imagePath). */
  imageFile?: UploadFile;
  token?: string;
}

const auth = (token?: string) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

/**
 * Wrapper around /api/post endpoints.
 *
 * NOTE: CreatePost/UpdatePost bind the PostDto scalar fields from the QUERY STRING and
 * only the image from multipart form data. This mirrors how the real frontend
 * (front_end/src/services/petService.ts) calls the API.
 */
export class PostApiClient {
  constructor(private readonly request: APIRequestContext) {}

  getAll(): Promise<APIResponse> {
    return this.request.get('post/GetAllPosts');
  }

  getById(id: number): Promise<APIResponse> {
    return this.request.get(`post/GetPostById/${id}`);
  }

  getByUserId(userId: string): Promise<APIResponse> {
    return this.request.get(`post/GetPostsByUserId/${encodeURIComponent(userId)}`);
  }

  create({ userId, post = {}, imagePath, imageFile, token }: CreatePostOptions): Promise<APIResponse> {
    const params: Record<string, string> = {};
    if (userId !== undefined) params.UserId = userId;
    for (const [key, value] of Object.entries(post)) {
      if (value !== undefined) params[key.charAt(0).toUpperCase() + key.slice(1)] = String(value);
    }

    const file: UploadFile | undefined =
      imageFile ??
      (imagePath
        ? {
            name: path.basename(imagePath),
            mimeType: imagePath.endsWith('.png') ? 'image/png' : 'text/plain',
            buffer: fs.readFileSync(imagePath),
          }
        : undefined);

    // The frontend always sends a multipart body, even without an image
    const multipart: Record<string, string | UploadFile> = file ? { Image: file } : { _: '' };

    return this.request.post('post/CreatePost', { params, multipart, headers: auth(token) });
  }

  update(postId: number, options: CreatePostOptions): Promise<APIResponse> {
    const { userId, post = {}, imagePath, token } = options;
    const params: Record<string, string> = { PostId: String(postId) };
    if (userId !== undefined) params.UserId = userId;
    for (const [key, value] of Object.entries(post)) {
      if (value !== undefined) params[key.charAt(0).toUpperCase() + key.slice(1)] = String(value);
    }
    const multipart: Record<string, string | UploadFile> = imagePath
      ? { Image: { name: path.basename(imagePath), mimeType: 'image/png', buffer: fs.readFileSync(imagePath) } }
      : { _: '' };
    return this.request.put('post/UpdatePost', { params, multipart, headers: auth(token) });
  }

  delete(id: number, token?: string): Promise<APIResponse> {
    return this.request.delete(`post/DeletePost/${id}`, { headers: auth(token) });
  }

  adopt(id: number, token?: string): Promise<APIResponse> {
    return this.request.post(`post/AdoptPost/${id}`, { headers: auth(token) });
  }

  cancelAdoption(id: number, token?: string): Promise<APIResponse> {
    return this.request.post(`post/CancelAdoption/${id}`, { headers: auth(token) });
  }
}
