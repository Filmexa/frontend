import { Injectable, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { Movie } from '../../interfaces/movie/Movie';
import { MovieService } from './movie.service';

const STORAGE_KEY = 'filmexa_my_list';

@Injectable({ providedIn: 'root' })
export class MyListService {
  private readonly movieIds = signal<number[]>(this.loadFromStorage());

  constructor(private movieService: MovieService) { }

  isInList(id: number): boolean {
    return this.movieIds().includes(id);
  }

  toggle(id: number): void {
    this.movieIds.update((ids) =>
      ids.includes(id) ? ids.filter((movieId) => movieId !== id) : [...ids, id],
    );
    this.saveToStorage(this.movieIds());
  }

  getMovies(): Observable<Movie[]> {
    const ids = this.movieIds();
    if (!ids.length) {
      return of([]);
    }

    return forkJoin(ids.map((id) =>
      this.movieService.getMovieDetails(id).pipe(catchError(() => of(null))),
    )).pipe(
      map((movies) => movies.filter((movie): movie is Movie => movie !== null)),
    );
  }

  private loadFromStorage(): number[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(parsed)
        ? parsed.filter((id): id is number => typeof id === 'number' && Number.isFinite(id))
        : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(ids: number[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // The list remains available for this session if browser storage is unavailable.
    }
  }
}
