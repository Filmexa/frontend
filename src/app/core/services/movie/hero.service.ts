import { Injectable, signal } from '@angular/core';
import { HeroMovie } from '../../interfaces/movie/HeroMovie';

@Injectable({
  providedIn: 'root'
})
export class HeroService {
  private readonly movies = signal<HeroMovie[]>([
    {
      id: 9001,
      title: 'Interstellar',
      description:
        'A team of explorers travels through a wormhole in space in an attempt to ensure humanity’s survival.',
      backdrop: 'https://picsum.photos/seed/interstellar/1600/900',
      year: 2014,
      rating: 8.7,
      duration: '2h 49m',
      genres: ['Sci-Fi', 'Drama', 'Adventure'],
    },
    {
      id: 9002,
      title: 'The Dark Knight',
      description:
        'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological tests of his ability to fight injustice.',
      backdrop: 'https://picsum.photos/seed/dark-knight/1600/900',
      year: 2008,
      rating: 9.0,
      duration: '2h 32m',
      genres: ['Action', 'Crime', 'Drama'],
    },
    {
      id: 9003,
      title: 'Inception',
      description:
        'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      backdrop: 'https://picsum.photos/seed/inception/1600/900',
      year: 2010,
      rating: 8.8,
      duration: '2h 28m',
      genres: ['Sci-Fi', 'Action', 'Thriller'],
    },
    {
      id: 9004,
      title: 'The Godfather',
      description:
        'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
      backdrop: 'https://picsum.photos/seed/godfather/1600/900',
      year: 1972,
      rating: 9.2,
      duration: '2h 55m',
      genres: ['Crime', 'Drama'],
    },
    {
      id: 9005,
      title: 'Dune',
      description:
        'A noble family becomes embroiled in a war for control over the galaxy’s most valuable asset while its heir becomes troubled by visions of a dark future.',
      backdrop: 'https://picsum.photos/seed/dune/1600/900',
      year: 2021,
      rating: 8.0,
      duration: '2h 35m',
      genres: ['Sci-Fi', 'Adventure', 'Drama'],
    },
    {
      id: 9006,
      title: 'Oppenheimer',
      description:
        'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
      backdrop: 'https://picsum.photos/seed/oppenheimer/1600/900',
      year: 2023,
      rating: 8.4,
      duration: '3h 0m',
      genres: ['Biography', 'Drama', 'History'],
    },
    {
      id: 9007,
      title: 'The Shawshank Redemption',
      description:
        'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
      backdrop: 'https://picsum.photos/seed/shawshank/1600/900',
      year: 1994,
      rating: 9.3,
      duration: '2h 22m',
      genres: ['Drama'],
    },
    {
      id: 9008,
      title: 'Spider-Man: No Way Home',
      description:
        'With Spider-Man’s identity revealed, Peter asks Doctor Strange for help, but a spell gone wrong brings enemies from other worlds.',
      backdrop: 'https://picsum.photos/seed/spiderman-nwh/1600/900',
      year: 2021,
      rating: 8.2,
      duration: '2h 28m',
      genres: ['Action', 'Adventure', 'Fantasy'],
    },
    {
      id: 9009,
      title: 'Gladiator',
      description:
        'A former Roman general sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.',
      backdrop: 'https://picsum.photos/seed/gladiator/1600/900',
      year: 2000,
      rating: 8.5,
      duration: '2h 35m',
      genres: ['Action', 'Adventure', 'Drama'],
    },
    {
      id: 9010,
      title: 'Parasite',
      description:
        'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
      backdrop: 'https://picsum.photos/seed/parasite/1600/900',
      year: 2019,
      rating: 8.5,
      duration: '2h 12m',
      genres: ['Comedy', 'Drama', 'Thriller'],
    },
  ]);

  getTopMovies(): HeroMovie[] {
    return this.movies();
  }
}
