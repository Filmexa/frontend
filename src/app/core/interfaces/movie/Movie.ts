import { Actor } from './Actor';

export interface Movie {
  id: number;
  title: string;
  poster: string;
  backdrop: string;
  year: number;
  rating: number;
  duration: string;
  genres: string[];
  description: string;
  category: string;
  actors: Actor[];
  imdbId?: string;
  trailer?: string;
}
