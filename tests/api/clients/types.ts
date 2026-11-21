/** Envelope returned by every PetStore endpoint (backend `ResponseDto`). */
export interface ApiResponse<T> {
  result: T | null;
  /** Always equal to the HTTP status of the response. */
  statusCode: number;
  isSuccess: boolean;
  message: string;
}

export interface UserDto {
  id: string;
  name: string | null;
  surname: string | null;
  email: string | null;
  userName: string | null;
  posts: unknown[] | null;
}

export interface LoginResult {
  user: UserDto;
  token: string;
}

export interface PostDto {
  postId: number;
  userId: string;
  user: UserDto | null;
  title: string | null;
  petName: string | null;
  petType: string | null;
  description: string | null;
  isAdopted: boolean;
  postTime: string;
  postLatitude: number | null;
  postLongitude: number | null;
  imageUrl: string | null;
  imageLocalPath: string | null;
}

/** `result` of a 400 validation response: field name -> messages. */
export type FieldErrors = Record<string, string[]>;
