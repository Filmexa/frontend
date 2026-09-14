import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Movie } from '../../core/interfaces/movie/Movie';
import { MovieSortOption } from '../../core/interfaces/movie/MovieSearchFilters';
import { MovieService } from '../../core/services/movie/movie.service';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';

@Component({
  selector: 'app-search',
  imports: [FormsModule, MovieCardComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent {
  query = '';
  selectedGenre = 'all';
  selectedRating = 'any';
  selectedYear = 'any';
  sort: MovieSortOption = 'popular';

  readonly genres: readonly string[];
  readonly years: number[];
  results: Movie[] = [];
  hasSearched = false;

  constructor(private movieService: MovieService) {
    this.genres = this.movieService.getGenres();
    this.years = Array.from(new Set(this.movieService.getAllMovies().map((m) => m.year))).sort((a, b) => b - a);
  }

  get hasActiveFilters(): boolean {
    return (
      this.query.trim() !== '' ||
      this.selectedGenre !== 'all' ||
      this.selectedRating !== 'any' ||
      this.selectedYear !== 'any'
    );
  }

  applyFilters(): void {
    this.hasSearched = true;

    this.movieService.searchMovies({
      query: this.query,
      genre: this.selectedGenre,
      minRating: this.selectedRating === 'any' ? undefined : Number(this.selectedRating),
      year: this.selectedYear === 'any' ? undefined : Number(this.selectedYear),
      sort: this.sort,
    }).subscribe((results) => {
      this.results = results;
    });
  }

  clearFilters(): void {
    this.query = '';
    this.selectedGenre = 'all';
    this.selectedRating = 'any';
    this.selectedYear = 'any';
    this.sort = 'popular';
    this.results = [];
    this.hasSearched = false;
  }
}
