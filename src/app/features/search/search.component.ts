import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Movie } from '../../core/interfaces/movie/Movie';
import { MovieSortOption } from '../../core/interfaces/movie/MovieSearchFilters';
import { MovieCategoryResponse } from '../../core/interfaces/movie/MovieCategoryResponse';
import { MovieService } from '../../core/services/movie/movie.service';
import { MovieCategoryService } from '../../core/services/movie/movie-category.service';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';
import { ToastService } from '../../shared/services/toast/toast.service';
import { ErrorResponse } from '../../shared/interfaces/ErrorResponse';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-search',
  imports: [FormsModule, MovieCardComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrollSentinel') private scrollSentinel?: ElementRef<HTMLElement>;

  query = '';
  selectedGenreId = 'all';
  selectedRating = 'any';
  selectedYear = 'any';
  sort: MovieSortOption = 'popularity';

  genres: MovieCategoryResponse[] = [];
  readonly years: number[];
  results: Movie[] = [];
  hasSearched = false;
  loading = false;
  totalResults = 0;
  totalPages = 0;
  currentPage = 0;
  hasMore = false;

  private searchSubscription?: Subscription;
  private observer?: IntersectionObserver;

  constructor(
    private movieService: MovieService,
    private movieCategoryService: MovieCategoryService,
    private toastService: ToastService,
  ) {
    const currentYear = new Date().getFullYear() + 5;
    this.years = Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index);

    this.movieCategoryService.getCategories().subscribe({
      next: (genres) => this.genres = genres,
      error: () => this.toastService.error(
        $localize`:@@toast.search.genresError:Failed to load genres.`
      ),
    });
  }

  ngAfterViewInit(): void {
    if (!this.scrollSentinel) {
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadNextPage();
      }
    }, { rootMargin: '200px' });
    this.observer.observe(this.scrollSentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.observer?.disconnect();
  }

  get hasActiveFilters(): boolean {
    return (
      this.query.trim() !== '' ||
      this.selectedGenreId !== 'all' ||
      this.selectedRating !== 'any' ||
      this.selectedYear !== 'any'
    );
  }

  applyFilters(): void {
    this.hasSearched = true;
    this.results = [];
    this.totalResults = 0;
    this.totalPages = 0;
    this.currentPage = 0;
    this.hasMore = false;
    this.searchSubscription?.unsubscribe();
    this.loadResults(0);
  }

  private loadNextPage(): void {
    if (this.hasSearched && !this.loading && this.hasMore) {
      this.loadResults(this.currentPage + 1);
    }
  }

  private loadResults(page: number): void {
    this.loading = true;

    this.searchSubscription = this.movieService.searchMovies({
      query: this.query,
      genreId: this.selectedGenreId === 'all' ? undefined : Number(this.selectedGenreId),
      minRating: this.selectedRating === 'any' ? undefined : Number(this.selectedRating),
      year: this.selectedYear === 'any' ? undefined : Number(this.selectedYear),
      sort: this.sort,
    }, page, PAGE_SIZE).subscribe({
      next: (result) => {
        this.results = page === 0
          ? result.content
          : [...this.results, ...result.content];
        this.totalResults = result.totalElements;
        this.totalPages = result.totalPages;
        this.currentPage = result.number;
        this.hasMore = result.number + 1 < result.totalPages;
        this.loading = false;
        setTimeout(() => this.loadIfSentinelVisible());
      },
      error: (error: ErrorResponse) => {
        this.loading = false;
        this.toastService.error(
          error.message || $localize`:@@toast.search.loadError:Failed to search movies.`
        );
      },
    });
  }

  private loadIfSentinelVisible(): void {
    const sentinel = this.scrollSentinel?.nativeElement;
    if (sentinel && sentinel.getBoundingClientRect().top <= window.innerHeight + 200) {
      this.loadNextPage();
    }
  }

  clearFilters(): void {
    this.query = '';
    this.selectedGenreId = 'all';
    this.selectedRating = 'any';
    this.selectedYear = 'any';
    this.sort = 'popularity';
    this.results = [];
    this.hasSearched = false;
    this.loading = false;
    this.totalResults = 0;
    this.totalPages = 0;
    this.currentPage = 0;
    this.hasMore = false;
    this.searchSubscription?.unsubscribe();
  }
}
