import Dexie, { type Table } from 'dexie';

export interface Session {
  id?: number;
  date: number;
  trackName: string;
  trackType: 'Circuit' | 'Sprint';
  bestLapTime: number | null;
}

export interface Sample {
  id?: number;
  sessionId: number;
  timestamp: number;
  lat: number;
  lng: number;
  gLat: number;
  gLong: number;
  delta: number;
  speed: number;
}

export class TelemetraDB extends Dexie {
  sessions!: Table<Session>;
  samples!: Table<Sample>;

  constructor() {
    super('TelemetraDB');
    
    this.version(1).stores({
      sessions: '++id, date, trackName, bestLapTime',
      samples: '++id, sessionId, timestamp'
    });
  }
}

export const db = new TelemetraDB();