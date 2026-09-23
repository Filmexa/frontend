import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-trailer-modal',
  imports: [],
  templateUrl: './trailer-modal.component.html',
  styleUrl: './trailer-modal.component.css',
})
export class TrailerModalComponent {
  @Input({ required: true }) title = '';
  @Output() readonly closed = new EventEmitter<void>();

  embedUrl?: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) { }

  @Input({ required: true })
  set trailerUrl(value: string) {
    const videoId = this.youtubeVideoId(value);
    this.embedUrl = videoId
      ? this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`,
      )
      : undefined;
  }

  close(): void {
    this.embedUrl = undefined;
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.close();
  }

  private youtubeVideoId(trailerUrl: string): string | undefined {
    try {
      const url = new URL(trailerUrl);
      const hostname = url.hostname.replace(/^www\./, '');
      if (hostname !== 'youtube.com' && hostname !== 'youtu.be') {
        return undefined;
      }
      const id = hostname === 'youtu.be'
        ? url.pathname.split('/').filter(Boolean)[0]
        : url.searchParams.get('v') ?? url.pathname.match(/^\/embed\/([^/]+)/)?.[1];
      return id && /^[\w-]{6,}$/.test(id) ? id : undefined;
    } catch {
      return undefined;
    }
  }
}
