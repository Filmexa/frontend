import { Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import Hls, { ErrorData, Events } from 'hls.js';
import { Movie } from '../../core/interfaces/movie/Movie';
import { MovieService } from '../../core/services/movie/movie.service';
import { StreamService } from '../../core/services/stream/stream.service';
import { CommentsComponent } from './components/comments/comments.component';
import { ActorRowComponent } from './components/actor-row/actor-row.component';
import { ToastService } from '../../shared/services/toast/toast.service';
import { ErrorResponse } from '../../shared/interfaces/ErrorResponse';
import { StreamSubtitle } from '../../core/interfaces/stream/StreamSubtitle';
import { Observable, Subscription } from 'rxjs';
import { StreamVariant } from '../../core/interfaces/stream/StreamVariant';
import { MyListService } from '../../core/services/movie/my-list.service';

@Component({
  selector: 'app-movie-details',
  imports: [ActorRowComponent, CommentsComponent],
  templateUrl: './movie-details.component.html',
  styleUrl: './movie-details.component.css'
})
export class MovieDetailsComponent implements OnDestroy {
  @ViewChild('videoPlayer') private videoPlayer?: ElementRef<HTMLVideoElement>;
  @ViewChild('playerContainer') private playerContainer?: ElementRef<HTMLElement>;

  movie?: Movie;
  readonly isPlaying = signal(false);
  readonly isLoading = signal(true);
  readonly isStreamLoading = signal(false);
  readonly subtitles = signal<StreamSubtitle[]>([]);
  readonly qualities = signal<StreamVariant[]>([]);
  readonly selectedQuality = signal('auto');
  readonly selectedSubtitle = signal('off');
  readonly isPaused = signal(true);
  readonly currentTime = signal(0);
  readonly videoDuration = signal(0);
  readonly volume = signal(1);
  readonly isMuted = signal(false);
  readonly isMyListLoading = signal(false);

  private hls?: Hls;
  private streamSubscription?: Subscription;
  private masterManifestUrl?: string;

  constructor(
    private route: ActivatedRoute,
    private movieService: MovieService,
    private streamService: StreamService,
    protected myListService: MyListService,
    private toastService: ToastService,
    private location: Location,
  ) {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      this.destroyPlayer();
      this.isPlaying.set(false);
      this.isStreamLoading.set(false);
      this.isLoading.set(true);
      this.movie = undefined;

      this.movieService.getMovieDetails(id).subscribe({
        next: (movie) => this.setMovie(movie),
        error: () => this.setMovie(undefined),
      });
    });
  }

  ngOnDestroy(): void {
    this.destroyPlayer();
  }

  private setMovie(movie: Movie | undefined): void {
    this.movie = movie;
    this.isLoading.set(false);
    if (movie) {
      this.isMyListLoading.set(true);
      this.myListService.loadMembership().subscribe({
        next: () => this.isMyListLoading.set(false),
        error: () => this.isMyListLoading.set(false),
      });
    }
  }

  play(): void {
    if (!this.movie || this.isStreamLoading()) {
      return;
    }

    this.isPlaying.set(true);
    this.isStreamLoading.set(true);
    this.destroyPlayer();

    this.streamSubscription = this.streamService.waitUntilReady(this.movie.id).subscribe({
      next: (session) => {
        this.subtitles.set((session.subtitles ?? []).map((subtitle) => ({
          ...subtitle,
          url: this.streamService.absoluteMediaUrl(subtitle.url),
        })));
        this.qualities.set((session.variants ?? []).map((variant) => ({
          ...variant,
          url: this.streamService.absoluteMediaUrl(variant.url),
        })));
        this.masterManifestUrl = this.streamService.absoluteManifestUrl(session);
        setTimeout(() => this.attachStream(this.masterManifestUrl!));
      },
      error: (error: ErrorResponse) => {
        this.closePlayer();
        this.toastService.error(
          error.message || $localize`:@@toast.movieDetails.streamError:Could not start movie playback.`
        );
      },
    });
  }

  toggleMyList(): void {
    if (!this.movie || this.isMyListLoading()) {
      return;
    }

    this.isMyListLoading.set(true);
    const request: Observable<unknown> = this.myListService.isInList(this.movie.id)
      ? this.myListService.remove(this.movie.id)
      : this.myListService.add(this.movie.id);

    request.subscribe({
      next: () => this.isMyListLoading.set(false),
      error: (error: ErrorResponse) => {
        this.isMyListLoading.set(false);
        this.toastService.error(
          error.message || $localize`:@@toast.myList.updateError:Could not update your list.`
        );
      },
    });
  }

  selectQuality(value: string): void {
    this.selectedQuality.set(value);

    if (this.hls) {
      this.hls.currentLevel = value === 'auto'
        ? -1
        : this.hls.levels.findIndex((level) => level.height === Number(value));
      return;
    }

    const video = this.videoPlayer?.nativeElement;
    const source = value === 'auto'
      ? this.masterManifestUrl
      : this.qualities().find((variant) => variant.height === Number(value))?.url;
    if (!video || !source) {
      return;
    }

    const currentTime = video.currentTime;
    const wasPaused = video.paused;
    video.src = source;
    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(currentTime, video.duration || currentTime);
      if (!wasPaused) {
        void video.play().catch(() => undefined);
      }
    }, { once: true });
  }

  selectSubtitle(value: string): void {
    this.selectedSubtitle.set(value);
    const tracks = this.videoPlayer?.nativeElement.textTracks;
    if (!tracks) {
      return;
    }

    for (let index = 0; index < tracks.length; index++) {
      tracks[index].mode = value !== 'off' && index === Number(value)
        ? 'showing'
        : 'disabled';
    }
  }

  togglePlayback(): void {
    const video = this.videoPlayer?.nativeElement;
    if (!video) {
      return;
    }
    video.paused ? void video.play() : video.pause();
  }

  seek(value: string): void {
    const video = this.videoPlayer?.nativeElement;
    if (video) {
      video.currentTime = Number(value);
    }
  }

  setVolume(value: string): void {
    const video = this.videoPlayer?.nativeElement;
    if (video) {
      video.volume = Number(value);
      video.muted = false;
    }
  }

  toggleMute(): void {
    const video = this.videoPlayer?.nativeElement;
    if (video) {
      video.muted = !video.muted;
    }
  }

  toggleFullscreen(): void {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void this.playerContainer?.nativeElement.requestFullscreen();
    }
  }

  updatePlaybackState(): void {
    const video = this.videoPlayer?.nativeElement;
    if (!video) {
      return;
    }
    this.isPaused.set(video.paused);
    this.currentTime.set(video.currentTime);
    this.videoDuration.set(Number.isFinite(video.duration) ? video.duration : 0);
    this.volume.set(video.volume);
    this.isMuted.set(video.muted);
  }

  formatTime(seconds: number): string {
    if (!Number.isFinite(seconds)) {
      return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remaining}`;
  }

  private attachStream(manifestUrl: string): void {
    const video = this.videoPlayer?.nativeElement;
    if (!video) {
      this.isStreamLoading.set(false);
      return;
    }

    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(manifestUrl);
      this.hls.attachMedia(video);
      this.hls.on(Events.MANIFEST_PARSED, () => {
        this.isStreamLoading.set(false);
        void video.play().catch(() => undefined);
      });
      this.hls.on(Events.ERROR, (_event, data) => this.handleHlsError(data));
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = manifestUrl;
      video.addEventListener('loadedmetadata', () => {
        this.isStreamLoading.set(false);
        void video.play().catch(() => undefined);
      }, { once: true });
      video.addEventListener('error', () => this.showPlaybackError(), { once: true });
      return;
    }

    this.closePlayer();
    this.toastService.error(
      $localize`:@@toast.movieDetails.hlsUnsupported:This browser does not support HLS playback.`
    );
  }

  private handleHlsError(data: ErrorData): void {
    if (!data.fatal || !this.hls) {
      return;
    }

    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        this.showPlaybackError();
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        this.hls.recoverMediaError();
        break;
      default:
        this.showPlaybackError();
    }
  }

  private showPlaybackError(): void {
    this.closePlayer();
    this.toastService.error(
      $localize`:@@toast.movieDetails.playbackError:Movie playback failed. Please try again.`
    );
  }

  private closePlayer(): void {
    this.destroyPlayer();
    this.isStreamLoading.set(false);
    this.isPlaying.set(false);
  }

  private destroyPlayer(): void {
    this.streamSubscription?.unsubscribe();
    this.streamSubscription = undefined;
    this.hls?.destroy();
    this.hls = undefined;
    this.subtitles.set([]);
    this.qualities.set([]);
    this.selectedQuality.set('auto');
    this.selectedSubtitle.set('off');
    this.isPaused.set(true);
    this.currentTime.set(0);
    this.videoDuration.set(0);
    this.masterManifestUrl = undefined;

    const video = this.videoPlayer?.nativeElement;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  }

  goBack(): void {
    this.location.back();
  }

}
