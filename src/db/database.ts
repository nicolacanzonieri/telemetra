import Dexie, { type Table } from 'dexie';

export interface Gate {
    p1: { lat: number; lng: number };
    p2: { lat: number; lng: number };
}

export interface Track {
    id?: number;
    name: string;
    type: 'Circuit' | 'Sprint';
    startGate?: Gate;
    finishGate: Gate;
    createdAt: number;
}

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
    tracks!: Table<Track>;
    sessions!: Table<Session>;
    samples!: Table<Sample>;

    constructor() {
        super('TelemetraDB');
        this.version(1).stores({
            tracks: '++id, name, type',
            sessions: '++id, date, trackName, bestLapTime',
            samples: '++id, sessionId, timestamp'
        });
    }
}

export const db = new TelemetraDB();

if (import.meta.env.DEV) {
    (window as any).db = db;
    console.log("TelemetraDB loaded. Write 'db' in the console to inspect it.");
}