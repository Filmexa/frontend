export type MovieSortOption = 'popular' | 'newest' | 'oldest' | 'title';

export interface MovieSearchFilters {
  query?: string;
  genre?: string;
  minRating?: number;
  year?: number;
  sort?: MovieSortOption;
}
