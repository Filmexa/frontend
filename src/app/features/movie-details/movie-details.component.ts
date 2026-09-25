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
import { TrailerModalComponent } from '../../shared/components/trailer-modal/trailer-modal.component';
import { StreamSession } from '../../core/interfaces/stream/StreamSession';

@Component({
  selector: 'app-movie-details',
  imports: [ActorRowComponent, CommentsComponent, TrailerModalComponent],
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
  readonly isTrailerOpen = signal(false);
  readonly controlsVisible = signal(true);
  readonly downloadProgress = signal(0);
  readonly downloadedBytes = signal(0);
  readonly downloadSpeedBps = signal(0);
  readonly playableSeconds = signal(0);

  private hls?: Hls;
  private streamSubscription?: Subscription;
  private progressSubscription?: Subscription;
  private masterManifestUrl?: string;
  private controlsTimeout?: ReturnType<typeof setTimeout>;
  private networkRetryCount = 0;
  private readonly maxNetworkRetries = 15;

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

    const imdbId = this.movie.imdbId;
    if (!imdbId) {
      this.toastService.error(
        $localize`:@@toast.movieDetails.missingImdbId:This movie cannot be streamed because its IMDb ID is missing.`
      );
      return;
    }

    this.isPlaying.set(true);
    this.isStreamLoading.set(true);
    this.destroyPlayer();

    this.streamSubscription = this.streamService.waitUntilReady(
      this.movie.id,
      imdbId,
      (session) => this.updateStreamProgress(session),
    ).subscribe({
      next: (session) => {
        this.updateStreamProgress(session);
        this.subtitles.set((session.subtitles ?? []).map((subtitle) => ({
          ...subtitle,
          url: this.streamService.absoluteMediaUrl(subtitle.url),
        })));
        this.qualities.set((session.variants ?? []).map((variant) => ({
          ...variant,
          url: this.streamService.absoluteMediaUrl(variant.url),
        })));
        this.masterManifestUrl = this.streamService.absoluteManifestUrl(session);
        this.progressSubscription = this.streamService.watchProgress(this.movie!.id, imdbId).subscribe({
          next: (progress) => this.updateStreamProgress(progress),
          error: () => undefined,
        });
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

  openTrailer(): void {
    this.isTrailerOpen.set(Boolean(this.movie?.trailer));
  }

  closeTrailer(): void {
    this.isTrailerOpen.set(false);
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
    setTimeout(() => this.raiseSubtitles());
  }

  raiseSubtitles(): void {
    const tracks = this.videoPlayer?.nativeElement.textTracks;
    if (!tracks) {
      return;
    }

    for (let trackIndex = 0; trackIndex < tracks.length; trackIndex++) {
      const cues = tracks[trackIndex].cues;
      if (!cues) {
        continue;
      }
      for (let cueIndex = 0; cueIndex < cues.length; cueIndex++) {
        const cue = cues[cueIndex];
        if ('line' in cue) {
          (cue as VTTCue).line = -3;
        }
      }
    }
  }

  showPlayerControls(): void {
    this.controlsVisible.set(true);
    this.schedulePlayerControlsHide();
  }

  schedulePlayerControlsHide(): void {
    this.clearControlsTimeout();
    if (!this.isPaused() && !this.isStreamLoading()) {
      this.controlsTimeout = setTimeout(() => this.controlsVisible.set(false), 2500);
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
    const wasPaused = this.isPaused();
    this.isPaused.set(video.paused);
    this.currentTime.set(video.currentTime);
    this.videoDuration.set(Number.isFinite(video.duration) ? video.duration : 0);
    this.volume.set(video.volume);
    this.isMuted.set(video.muted);
    if (video.paused) {
      this.clearControlsTimeout();
      this.controlsVisible.set(true);
    } else if (wasPaused) {
      this.schedulePlayerControlsHide();
    }
  }

  formatTime(seconds: number): string {
    if (!Number.isFinite(seconds)) {
      return '0:00';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = Math.floor(seconds % 60).toString().padStart(2, '0');
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${remaining}`
      : `${minutes}:${remaining}`;
  }

  playedPercentage(): number {
    return this.percentage(this.currentTime());
  }

  playablePercentage(): number {
    return Math.max(this.playedPercentage(), this.percentage(this.playableSeconds()));
  }

  private percentage(seconds: number): number {
    const duration = this.videoDuration();
    return duration > 0 ? Math.min(100, Math.max(0, seconds / duration * 100)) : 0;
  }

  private updateStreamProgress(session: StreamSession): void {
    this.downloadProgress.set(Math.min(100, Math.max(0, session.downloadProgressPercentage)));
    if (session.downloadedBytes !== undefined) {
      this.downloadedBytes.set(session.downloadedBytes);
    }
    if (session.downloadSpeedBps !== undefined) {
      this.downloadSpeedBps.set(session.downloadSpeedBps);
    }
    this.playableSeconds.set(Math.max(0, session.playableSeconds ?? 0));
    if (session.durationSeconds && session.durationSeconds > 0) {
      this.videoDuration.set(session.durationSeconds);
    }
  }

  formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  }

  formatSpeed(speedBps: number): string {
    if (!speedBps || speedBps <= 0) return '0 KB/s';
    const kb = speedBps / 1024;
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(1)} MB/s`;
    }
    return `${kb.toFixed(0)} KB/s`;
  }

  private attachStream(manifestUrl: string): void {
    const video = this.videoPlayer?.nativeElement;
    if (!video) {
      this.isStreamLoading.set(false);
      return;
    }

    if (Hls.isSupported()) {
      this.hls = new Hls({
        fragLoadingMaxRetry: 10,
        fragLoadingRetryDelay: 1500,
        fragLoadingMaxRetryTimeout: 64000,
      });
      this.hls.loadSource(manifestUrl);
      this.hls.attachMedia(video);
      this.hls.on(Events.MANIFEST_PARSED, () => {
        this.networkRetryCount = 0;
        this.isStreamLoading.set(false);
        void video.play().catch(() => undefined);
      });
      this.hls.on(Events.ERROR, (_event, data) => this.handleHlsError(data));
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = manifestUrl;
      video.addEventListener('loadedmetadata', () => {
        this.networkRetryCount = 0;
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
        if (this.networkRetryCount < this.maxNetworkRetries) {
          this.networkRetryCount++;
          console.warn(`HLS buffering/network error, retrying (${this.networkRetryCount}/${this.maxNetworkRetries})...`);
          setTimeout(() => {
            this.hls?.startLoad();
          }, 1500);
        } else {
          this.showPlaybackError();
        }
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        console.warn('HLS media error, recovering...');
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
    this.networkRetryCount = 0;
    this.clearControlsTimeout();
    this.streamSubscription?.unsubscribe();
    this.streamSubscription = undefined;
    this.progressSubscription?.unsubscribe();
    this.progressSubscription = undefined;
    this.hls?.destroy();
    this.hls = undefined;
    this.subtitles.set([]);
    this.qualities.set([]);
    this.selectedQuality.set('auto');
    this.selectedSubtitle.set('off');
    this.isPaused.set(true);
    this.currentTime.set(0);
    this.videoDuration.set(0);
    this.downloadProgress.set(0);
    this.downloadedBytes.set(0);
    this.downloadSpeedBps.set(0);
    this.playableSeconds.set(0);
    this.controlsVisible.set(true);
    this.masterManifestUrl = undefined;

    const video = this.videoPlayer?.nativeElement;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  }

  private clearControlsTimeout(): void {
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
      this.controlsTimeout = undefined;
    }
  }

  goBack(): void {
    this.location.back();
  }

}
