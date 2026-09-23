import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../core/interfaces/movie/Movie';
import { MyListService } from '../../core/services/movie/my-list.service';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';

@Component({
  selector: 'app-my-list',
  imports: [MovieCardComponent, RouterLink],
  templateUrl: './my-list.component.html',
  styleUrl: './my-list.component.css'
})
export class MyListComponent {
  readonly movies = signal<Movie[]>([]);
  readonly isLoading = signal(true);

  constructor(private myListService: MyListService) {
    this.myListService.getMovies().subscribe({
      next: (movies) => {
        this.movies.set(movies);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}
