import { MovieSummaryResponse } from './MovieSummaryResponse';

export interface GenreMoviesResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  movies: MovieSummaryResponse[];
}
