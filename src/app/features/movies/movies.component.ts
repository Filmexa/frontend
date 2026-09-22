import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Movie } from '../../core/interfaces/movie/Movie';
import { MovieService } from '../../core/services/movie/movie.service';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';
import { MovieCategoryService } from '../../core/services/movie/movie-category.service';
import { ToastService } from '../../shared/services/toast/toast.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-movies',
  imports: [MovieCardComponent],
  templateUrl: './movies.component.html',
  styleUrl: './movies.component.css'
})
export class MoviesComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrollSentinel') private scrollSentinel?: ElementRef<HTMLElement>;

  category = '';
  movies: Movie[] = [];
  loading = false;
  hasMore = true;

  private page = 0;
  private observer?: IntersectionObserver;

  constructor(
    private route: ActivatedRoute,
    private movieService: MovieService,
    private movieCategoryService: MovieCategoryService,
    private toastService: ToastService,
    private location: Location,
  ) {
    this.route.paramMap.subscribe((params) => {
      const categoryId = params.get('category') ?? '';
      this.category = categoryId;
      this.genreId = undefined;
      this.movies = [];
      this.page = 0;
      this.hasMore = true;
      this.loadCategory(categoryId);
    });
  }

  private genreId?: number;

  private loadCategory(categoryId: string): void {
    this.loading = true;
    this.movieCategoryService.getCategories().subscribe({
      next: (categories) => {
        const normalizedId = this.normalizeCategory(categoryId);
        const category = categories.find((item) =>
          item.id === categoryId ||
          item.name === categoryId ||
          this.normalizeCategory(item.name) === normalizedId
        );
        if (!category) {
          this.loading = false;
          this.hasMore = false;
          this.toastService.error($localize`:@@toast.movies.categoryNotFound:Movie category not found.`);
          return;
        }

        this.category = category.name;
        this.genreId = category.genreId;
        this.loading = false;
        this.loadMore();
      },
      error: () => {
        this.loading = false;
        this.hasMore = false;
        this.toastService.error($localize`:@@toast.movies.categoryError:Failed to load movie category.`);
      },
    });
  }

  private normalizeCategory(value: string): string {
    return value
      .normalize('NFKC')
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, '');
  }

  ngAfterViewInit(): void {
    if (!this.scrollSentinel) {
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadMore();
      }
    }, { rootMargin: '200px' });
    this.observer.observe(this.scrollSentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  loadMore(): void {
    if (this.loading || !this.hasMore || this.genreId === undefined) {
      return;
    }

    this.loading = true;
    this.movieService.getMoviesByGenre(this.genreId, this.category, this.page, PAGE_SIZE).subscribe({
      next: (result) => {
        this.movies = [...this.movies, ...result.content];
        this.page++;
        this.hasMore = this.page < result.totalPages;
        this.loading = false;
        setTimeout(() => this.loadIfSentinelVisible());
      },
      error: () => {
        this.loading = false;
        this.hasMore = false;
        this.toastService.error($localize`:@@toast.movies.loadError:Failed to load movies.`);
      },
    });
  }

  private loadIfSentinelVisible(): void {
    const sentinel = this.scrollSentinel?.nativeElement;
    if (sentinel && sentinel.getBoundingClientRect().top <= window.innerHeight + 200) {
      this.loadMore();
    }
  }

  goBack(): void {
    this.location.back();
  }
}
