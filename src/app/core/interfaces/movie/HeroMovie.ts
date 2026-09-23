export interface HeroMovie {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  backdrop: string;
  year: number;
  rating: number;
  trailerUrl?: string;
  genres: string[];
}
