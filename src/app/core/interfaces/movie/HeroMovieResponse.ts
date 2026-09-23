export interface HeroMovieResponse {
  id: number;
  title: string;
  releaseDate: string;
  thumbnail: string;
  backdropUrl: string;
  overview: string;
  rating?: number | null;
  trailerUrl?: string | null;
  trailer?: string | null;
  genres: string[];
}
