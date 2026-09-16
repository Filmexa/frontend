import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HeroMovie } from '../../../../core/interfaces/movie/HeroMovie';
import { MovieService } from '../../../../core/services/movie/movie.service';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements OnInit, OnDestroy {
  readonly movies = signal<HeroMovie[]>([]);
  readonly activeIndex = signal(0);
  readonly trailerMovie = signal<HeroMovie | null>(null);

  private intervalId?: ReturnType<typeof setInterval>;
  private readonly rotationDelayMs = 6000;

  constructor(
    private movieService: MovieService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.movieService.getTopMovies().subscribe((movies) => {
      this.movies.set(movies);
      this.startRotation();
    });
  }

  ngOnDestroy(): void {
    this.stopRotation();
  }

  get activeMovie(): HeroMovie | undefined {
    return this.movies()[this.activeIndex()];
  }

  selectMovie(index: number): void {
    this.activeIndex.set(index);
    this.restartRotation();
  }

  goToDetails(movie: HeroMovie): void {
    this.router.navigate(['/movie', movie.id]);
  }

  openTrailer(movie: HeroMovie): void {
    this.trailerMovie.set(movie);
    this.stopRotation();
  }

  closeTrailer(): void {
    this.trailerMovie.set(null);
    this.restartRotation();
  }

  private startRotation(): void {
    this.intervalId = setInterval(() => {
      const nextIndex = (this.activeIndex() + 1) % this.movies().length;
      this.activeIndex.set(nextIndex);
    }, this.rotationDelayMs);
  }

  private stopRotation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private restartRotation(): void {
    this.stopRotation();
    this.startRotation();
  }
}
