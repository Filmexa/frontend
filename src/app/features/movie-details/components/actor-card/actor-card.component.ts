import { Component, Input } from '@angular/core';
import { Actor } from '../../../../core/interfaces/movie/Actor';

@Component({
  selector: 'app-actor-card',
  imports: [],
  templateUrl: './actor-card.component.html',
  styleUrl: './actor-card.component.css'
})
export class ActorCardComponent {
  @Input({ required: true }) actor!: Actor;

  readonly defaultProfile = '/assets/default-actor.svg';

  get profileUrl(): string {
    return this.actor.profile?.trim() || this.defaultProfile;
  }

  useDefaultProfile(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith(this.defaultProfile)) {
      image.src = this.defaultProfile;
    }
  }
}
