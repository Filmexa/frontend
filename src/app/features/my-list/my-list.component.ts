import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../core/interfaces/movie/Movie';
import { MyListService } from '../../core/services/movie/my-list.service';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';
import { ToastService } from '../../shared/services/toast/toast.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-my-list',
  imports: [MovieCardComponent, RouterLink],
  templateUrl: './my-list.component.html',
  styleUrl: './my-list.component.css'
})
export class MyListComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrollSentinel') private scrollSentinel?: ElementRef<HTMLElement>;
  readonly movies = signal<Movie[]>([]);
  readonly isLoading = signal(false);
  readonly hasMore = signal(true);
  private page = 0;
  private observer?: IntersectionObserver;

  constructor(
    private myListService: MyListService,
    private toastService: ToastService,
  ) {
    this.loadMore();
  }

  ngAfterViewInit(): void {
    if (!this.scrollSentinel) return;
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) this.loadMore();
    }, { rootMargin: '200px' });
    this.observer.observe(this.scrollSentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private loadMore(): void {
    if (this.isLoading() || !this.hasMore()) return;
    this.isLoading.set(true);
    this.myListService.getMyList(this.page, PAGE_SIZE).subscribe({
      next: (result) => {
        this.movies.update((movies) => [...movies, ...result.content]);
        this.page = result.number + 1;
        this.hasMore.set(this.page < result.totalPages);
        this.isLoading.set(false);
        setTimeout(() => this.loadIfSentinelVisible());
      },
      error: () => {
        this.isLoading.set(false);
        this.hasMore.set(false);
        this.toastService.error($localize`:@@toast.myList.loadError:Failed to load your list.`);
      },
    });
  }

  private loadIfSentinelVisible(): void {
    const sentinel = this.scrollSentinel?.nativeElement;
    if (sentinel && sentinel.getBoundingClientRect().top <= window.innerHeight + 200) {
      this.loadMore();
    }
  }
}
