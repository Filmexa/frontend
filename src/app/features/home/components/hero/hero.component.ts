import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HeroMovie } from '../../../../core/interfaces/movie/HeroMovie';
import { MovieService } from '../../../../core/services/movie/movie.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ToastService } from '../../../../shared/services/toast/toast.service';

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
  private touchStartX?: number;

  constructor(
    private movieService: MovieService,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService,
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

  previousMovie(): void {
    const count = this.movies().length;
    if (count > 1) {
      this.selectMovie((this.activeIndex() - 1 + count) % count);
    }
  }

  nextMovie(): void {
    const count = this.movies().length;
    if (count > 1) {
      this.selectMovie((this.activeIndex() + 1) % count);
    }
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0]?.clientX;
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === undefined) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX;
    if (endX !== undefined) {
      const distance = endX - this.touchStartX;
      if (Math.abs(distance) >= 50) {
        distance < 0 ? this.nextMovie() : this.previousMovie();
      }
    }
    this.touchStartX = undefined;
  }

  goToDetails(movie: HeroMovie): void {
    if (!this.authService.isLoggedIn()) {
      this.toastService.error(
        $localize`:@@toast.movieCard.signInRequired:Please sign in to view movie details.`
      );
      return;
    }

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
    if (this.movies().length <= 1) {
      return;
    }

    this.intervalId = setInterval(() => {
      const nextIndex = (this.activeIndex() + 1) % this.movies().length;
      this.activeIndex.set(nextIndex);
    }, this.rotationDelayMs);
  }

  private stopRotation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private restartRotation(): void {
    this.stopRotation();
    this.startRotation();
  }
}
