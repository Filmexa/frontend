export type MovieType = 'movie' | 'tv';

export interface Movie {
  id: number;
  title: string;
  poster: string;
  backdrop: string;
  type: MovieType;
  year: number;
  rating: number;
  duration: string;
  genres: string[];
  description: string;
  category: string;
}
