import { Component } from '@angular/core';
import { HeroComponent } from './components/hero/hero.component';
import { MovieRowComponent } from './components/movie-row/movie-row.component';
import { Movie } from '../../core/interfaces/movie/Movie';
import { MovieService } from '../../core/services/movie/movie.service';
import { MovieCategoryService } from '../../core/services/movie/movie-category.service';
import { MovieCategoryResponse } from '../../core/interfaces/movie/MovieCategoryResponse';
import { ErrorResponse } from '../../shared/interfaces/ErrorResponse';
import { ToastService } from '../../shared/services/toast/toast.service';

@Component({
  selector: 'app-home',
  imports: [HeroComponent, MovieRowComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  categories: MovieCategoryResponse[] = [];
  readonly moviesByCategory = new Map<string, Movie[]>();

  constructor(
    private movieService: MovieService,
    private movieCategoryService: MovieCategoryService,
    private toastService: ToastService,
  ) {
    this.movieCategoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        for (const category of this.categories) {
          this.movieService.getMoviesByCategory(category.name, 0, 20).subscribe({
            next: (page) => {
              this.moviesByCategory.set(category.name, page.content);
            },
            error: (error: ErrorResponse) => {
              this.toastService.error(
                error.message ?? $localize`:@@toast.home.moviesError:Failed to load movies for "${category.name}".`
              );
            },
          });
        }
      },
      error: (error: ErrorResponse) => {
        this.toastService.error(
          error.message ?? $localize`:@@toast.home.categoriesError:Failed to load movie categories.`
        );
      },
    });
  }
}
