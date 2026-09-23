import { Actor } from './Actor';

export interface MovieDetailsResponse {
  id: number;
  backdropPath: string;
  genres: string[];
  overview: string;
  releaseDate: string;
  rating?: number;
  title: string;
  imdbId: string;
  trailer?: string | null;
  actors: Actor[];
}
