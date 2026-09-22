import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../../../core/interfaces/movie/Movie';
import { MovieCardComponent } from '../../../../shared/components/movie-card/movie-card.component';

@Component({
  selector: 'app-movie-row',
  imports: [RouterLink, MovieCardComponent],
  templateUrl: './movie-row.component.html',
  styleUrl: './movie-row.component.css'
})
export class MovieRowComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) movies: Movie[] = [];
  @Input({ required: true }) categoryName!: string;

  @ViewChild('rowScroll') private rowScroll?: ElementRef<HTMLElement>;

  readonly canScrollPrev = signal(false);
  readonly canScrollNext = signal(false);

  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.updateScrollState();

    const el = this.rowScroll?.nativeElement;
    if (el) {
      this.resizeObserver = new ResizeObserver(() => this.updateScrollState());
      this.resizeObserver.observe(el);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  scrollPrev(): void {
    this.scrollByAmount(-1);
  }

  scrollNext(): void {
    this.scrollByAmount(1);
  }

  onScroll(): void {
    this.updateScrollState();
  }

  private scrollByAmount(direction: 1 | -1): void {
    const el = this.rowScroll?.nativeElement;
    if (!el) {
      return;
    }

    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' });
    setTimeout(() => this.updateScrollState(), 400);
  }

  private updateScrollState(): void {
    const el = this.rowScroll?.nativeElement;
    if (!el) {
      return;
    }

    this.canScrollPrev.set(el.scrollLeft > 4);
    this.canScrollNext.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }
}
