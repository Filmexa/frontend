import { Component } from '@angular/core';
import { HeroComponent } from './components/hero/hero.component';
import { MovieRowComponent } from './components/movie-row/movie-row.component';
import { Movie } from '../../core/interfaces/movie/Movie';
import { MovieService } from '../../core/services/movie/movie.service';

@Component({
  selector: 'app-home',
  imports: [HeroComponent, MovieRowComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  readonly categories: readonly string[];
  readonly moviesByCategory = new Map<string, Movie[]>();

  constructor(private movieService: MovieService) {
    this.categories = this.movieService.getCategories();
    for (const category of this.categories) {
      this.movieService.getMoviesByCategory(category, 0, 20).subscribe((page) => {
        this.moviesByCategory.set(category, page.content);
      });
    }
  }
}
