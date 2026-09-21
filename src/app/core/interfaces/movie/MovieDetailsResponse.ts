import { Actor } from './Actor';

export interface MovieDetailsResponse {
  id: number;
  backdropPath: string;
  genres: string[];
  overview: string;
  releaseDate: string;
  title: string;
  imdbId: string;
  actors: Actor[];
}
