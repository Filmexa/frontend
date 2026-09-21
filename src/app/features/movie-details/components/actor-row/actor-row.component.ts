import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, signal } from '@angular/core';
import { Actor } from '../../../../core/interfaces/movie/Actor';
import { ActorCardComponent } from '../actor-card/actor-card.component';

@Component({
  selector: 'app-actor-row',
  imports: [ActorCardComponent],
  templateUrl: './actor-row.component.html',
  styleUrl: './actor-row.component.css'
})
export class ActorRowComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) actors: Actor[] = [];

  @ViewChild('rowScroll') private rowScroll?: ElementRef<HTMLElement>;

  readonly canScrollPrev = signal(false);
  readonly canScrollNext = signal(false);
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.updateScrollState();
    const element = this.rowScroll?.nativeElement;
    if (element) {
      this.resizeObserver = new ResizeObserver(() => this.updateScrollState());
      this.resizeObserver.observe(element);
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
    const element = this.rowScroll?.nativeElement;
    if (!element) {
      return;
    }

    element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: 'smooth' });
    setTimeout(() => this.updateScrollState(), 400);
  }

  private updateScrollState(): void {
    const element = this.rowScroll?.nativeElement;
    if (!element) {
      return;
    }

    this.canScrollPrev.set(element.scrollLeft > 4);
    this.canScrollNext.set(element.scrollLeft + element.clientWidth < element.scrollWidth - 4);
  }
}
