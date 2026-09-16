import { Component, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { HeroComponent } from './components/hero/hero.component';
import { MovieRowComponent } from './components/movie-row/movie-row.component';
import { Movie } from '../../core/interfaces/movie/Movie';
import { MovieService } from '../../core/services/movie/movie.service';
import { ErrorResponse } from '../../shared/interfaces/ErrorResponse';
import { ToastService } from '../../shared/services/toast/toast.service';

@Component({
  selector: 'app-home',
  imports: [HeroComponent, MovieRowComponent, TitleCasePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  readonly moviesByCategory = signal<Record<string, Movie[]>>({});

  constructor(
    private movieService: MovieService,
    private toastService: ToastService,
  ) {
    this.movieService.getHomeCategories().subscribe({
      next: (categories) => this.moviesByCategory.set(categories),
      error: (error: ErrorResponse) => {
        this.toastService.error(
          error.message ?? $localize`:@@toast.home.moviesError:Failed to load movies.`
        );
      },
    });
  }

  get categories(): string[] {
    return Object.keys(this.moviesByCategory());
  }
}
