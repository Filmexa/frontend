export type MovieSortOption = 'popularity' | 'rating' | 'releaseDate';

export interface MovieSearchFilters {
  query?: string;
  genreId?: number;
  minRating?: number;
  year?: number;
  sort?: MovieSortOption;
}
