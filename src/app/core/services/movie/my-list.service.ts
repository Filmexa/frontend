import { Injectable, signal } from '@angular/core';
import { Movie } from '../../interfaces/movie/Movie';
import { MovieService } from './movie.service';

const STORAGE_KEY = 'filmexa_my_list';

@Injectable({
  providedIn: 'root'
})
export class MyListService {
  private readonly movieIds = signal<number[]>(this.loadFromStorage());

  constructor(private movieService: MovieService) { }

  isInList(id: number): boolean {
    return this.movieIds().includes(id);
  }

  toggle(id: number): void {
    this.movieIds.update((ids) =>
      ids.includes(id) ? ids.filter((existingId) => existingId !== id) : [...ids, id],
    );
    this.saveToStorage(this.movieIds());
  }

  remove(id: number): void {
    this.movieIds.update((ids) => ids.filter((existingId) => existingId !== id));
    this.saveToStorage(this.movieIds());
  }

  getMovies(): Movie[] {
    return this.movieIds()
      .map((id) => this.movieService.getMovieById(id))
      .filter((movie): movie is Movie => movie !== undefined);
  }

  private loadFromStorage(): number[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(ids: number[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // ignore storage errors (private browsing, quota, etc.)
    }
  }
}
