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

export interface Lap {
    id?: number;
    sessionId: number;
    lapNumber: number;
    timeMs: number;
    isBest: boolean;
}

export interface Sample {
    id?: number;
    sessionId: number;
    timestamp: number;
    lapNumber: number;
    lat: number;
    lng: number;
    speed: number;
    rawSpeed: number;
    distance: number;
    accelX: number;
    accelY: number;
    gLat: number;
    gLong: number;
    gSum: number;
    variance: number;
    kalmanGain: number;
    delta: number;
}

export class TelemetraDB extends Dexie {
    tracks!: Table<Track>;
    sessions!: Table<Session>;
    samples!: Table<Sample>;
    laps!: Table<Lap>;

    constructor() {
        super('TelemetraDB');
        this.version(1).stores({
            tracks: '++id, name, type',
            sessions: '++id, date, trackName, bestLapTime',
            samples: '++id, sessionId, timestamp lapNumber',
            laps: '++id, sessionId, lapNumber'
        });
    }
}

export const db = new TelemetraDB();