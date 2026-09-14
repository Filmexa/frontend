import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Movie } from '../../core/interfaces/movie/Movie';
import { MovieService } from '../../core/services/movie/movie.service';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';

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
    private location: Location,
  ) {
    this.route.paramMap.subscribe((params) => {
      this.category = params.get('category') ?? '';
      this.movies = [];
      this.page = 0;
      this.hasMore = true;
      this.loadMore();
    });
  }

  ngAfterViewInit(): void {
    if (!this.scrollSentinel) {
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadMore();
      }
    });
    this.observer.observe(this.scrollSentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  loadMore(): void {
    if (this.loading || !this.hasMore) {
      return;
    }

    this.loading = true;
    this.movieService.getMoviesByCategory(this.category, this.page, PAGE_SIZE).subscribe((result) => {
      this.movies = [...this.movies, ...result.content];
      this.page++;
      this.hasMore = this.page < result.totalPages;
      this.loading = false;
    });
  }

  goBack(): void {
    this.location.back();
  }
}
