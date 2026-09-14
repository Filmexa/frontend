import { Component } from '@angular/core';
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
  constructor(private myListService: MyListService) { }

  get movies(): Movie[] {
    return this.myListService.getMovies();
  }
}
