import { StreamVariant } from "./StreamVariant";
import { StreamSubtitle } from './StreamSubtitle';

export type StreamState = 'PREPARING' | 'READY';
export type DownloadStatus = 'PENDING' | 'DOWNLOADING' | 'READY_TO_STREAM' | 'COMPLETED' | 'PAUSED' | 'FAILED';

export interface StreamSession {
  movieId: number;
  state: StreamState;
  downloadStatus: DownloadStatus;
  downloadProgressPercentage: number;
  token?: string;
  expiresInSeconds?: number;
  manifestUrl?: string;
  durationSeconds?: number;
  playableSeconds: number;
  variants?: StreamVariant[];
  subtitles?: StreamSubtitle[];
}
