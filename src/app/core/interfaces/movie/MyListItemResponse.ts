export interface MyListItemResponse {
  id: string;
  movieId: number;
  title: string;
  posterUrl: string | null;
  releaseDate: string;
  rating: number | null;
  addedAt: string;
}
