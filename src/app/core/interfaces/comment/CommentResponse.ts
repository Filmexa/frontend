import { UserInfosSimpleResponse } from '../user/UserInfosSimpleResponse';

export interface CommentResponse {
  id: string;
  movieId: number;
  content: string;
  author: UserInfosSimpleResponse;
  createdAt: string;
  updatedAt: string;
}
