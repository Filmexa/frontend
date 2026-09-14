import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Movie } from '../../../core/interfaces/movie/Movie';

@Component({
  selector: 'app-movie-card',
  imports: [],
  templateUrl: './movie-card.component.html',
  styleUrl: './movie-card.component.css'
})
export class MovieCardComponent {
  @Input({ required: true }) movie!: Movie;

  constructor(private router: Router) { }

  goToDetails(): void {
    this.router.navigate(['/movie', this.movie.id]);
  }
}
