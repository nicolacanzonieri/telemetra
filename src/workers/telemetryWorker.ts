import type { Gate } from "../db/database";

// --- STATE VARIABLES ---
let isRunning = false;

// Session related 
let startGate: { p1: [number, number], p2: [number, number] } | null = null;
let finishGate: { p1: [number, number], p2: [number, number] } | null = null;
let lastPosition: [number, number] | null = null;
let lastTimestamp: number | null = null;
let sessionStartTime: number | null = null;

// Database related
let sampleBuffer: any[] = [];
const BATCH_SIZE = 5; 
let currentSessionId: number | null = null;

// --- KALMAN & FILTER CONFIG ---
const ACCEL_SMOOTHING = 0.15;   // Low-pass filter alpha. Lower = smoother G-ball.
const GPS_TRUST_FACTOR = 0.2;    // Fusion weight. How much we trust GPS vs Accelerometer.
const VELOCITY_DEADZONE = 0.05; // Ignore tiny accelerations to prevent stationary drift.

// --- FILTERED STATE ---
let filteredGx = 0;
let filteredGy = 0;
let filteredSpeed = 0;      // Internally stored in m/s
let distanceTraveled = 0;   // Meters since start of current lap
let lastAccelTimestamp: number | null = null;
let isVelocityInitialized = false;

export type WorkerMessage =
  | { type: 'START_SESSION'; payload: { sessionId: number; trackName: string, trackType: 'Circuit' | 'Sprint'; startGate: Gate | null; finishGate: Gate | null } }
  | { type: 'STOP_SESSION' }
  | { type: 'SENSOR_DATA'; payload: { accel: DeviceMotionEventAcceleration; timestamp: number } }
  | { type: 'GPS_DATA'; payload: { lat: number; lng: number; speed: number; timestamp: number } };

export type WorkerResponse =
  | { type: 'UPDATE_STATS'; payload: { currentG: { x: number, y: number }, speed: number, distance: number } }
  | { type: 'STARTING_LAP'; payload: { startTime: number } }
  | { type: 'LAP_COMPLETED'; payload: { lapTime: number } }
  | { type: 'SAVE_BATCH'; payload: any[] };

/**
 * Line-segment intersection math to detect gate crossing.
 */
function getIntersection(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number
): number | null {
  const det = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (det === 0) return null; 

  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / det;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / det;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return t;
  }
  return null;
}

function addToBuffer(sample: any) {
  if (!currentSessionId) return;
  
  console.log("SAMPLE: ", sample);

  sampleBuffer.push({
    ...sample,
    sessionId: currentSessionId,
    distance: distanceTraveled
  });

  if (sampleBuffer.length >= BATCH_SIZE) {
    flushBuffer();
  }
}

function flushBuffer() {
  if (sampleBuffer.length === 0) return;
  
  const count = sampleBuffer.length;
  console.log(`WORKER: SENDING BATCH OF ${count} SAMPLES TO UI...`);
  
  self.postMessage({
    type: 'SAVE_BATCH',
    payload: [...sampleBuffer]
  });
  
  sampleBuffer = [];
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const message = e.data;

  switch (message.type) {
    case 'START_SESSION':
      currentSessionId = message.payload.sessionId;
      sampleBuffer = [];
      isRunning = true;
      distanceTraveled = 0;
      filteredSpeed = 0;
      isVelocityInitialized = false;
      
      if (message.payload.startGate) {
        startGate = {
          p1: [message.payload.startGate.p1.lat, message.payload.startGate.p1.lng],
          p2: [message.payload.startGate.p2.lat, message.payload.startGate.p2.lng]
        };
      }
      if (message.payload.finishGate) {
        finishGate = {
          p1: [message.payload.finishGate.p1.lat, message.payload.finishGate.p1.lng],
          p2: [message.payload.finishGate.p2.lat, message.payload.finishGate.p2.lng]
        };
      } else {
        finishGate = startGate;
      }
      sessionStartTime = null;
      break;

    case 'STOP_SESSION':
      isRunning = false;
      flushBuffer();
      console.log("WORKER: SESSION STOPPED");
      break;

    case 'SENSOR_DATA':
      if (!isRunning) return;

      const { accel, timestamp } = message.payload;

      // Prediction phase
      // Low-Pass Filter (EMA) for G-Force visualization
      filteredGx = (accel.x || 0) * ACCEL_SMOOTHING + filteredGx * (1 - ACCEL_SMOOTHING);
      filteredGy = (accel.y || 0) * ACCEL_SMOOTHING + filteredGy * (1 - ACCEL_SMOOTHING);

      // Inertial Integration for Speed
      const dt = lastAccelTimestamp ? (timestamp - lastAccelTimestamp) / 1000 : 0;
      lastAccelTimestamp = timestamp;

      if (dt > 0 && dt < 0.2) {
        // Convert longitudinal Gs to m/s^2. 
        // Note: Gy direction depends on device orientation calibration.
        let accelMS2 = filteredGy * 9.81;

        // Apply deadzone to mitigate sensor noise while stationary
        if (Math.abs(accelMS2) < VELOCITY_DEADZONE) accelMS2 = 0;

        // Update velocity (v = v0 + a*dt)
        filteredSpeed += accelMS2 * dt;
        if (filteredSpeed < 0) filteredSpeed = 0;

        // Distance tracking (meters traveled since lap start)
        distanceTraveled += filteredSpeed * dt;
      }

      self.postMessage({
        type: 'UPDATE_STATS',
        payload: {
          currentG: { x: filteredGx, y: filteredGy },
          speed: filteredSpeed * 3.6, // Convert to km/h for possible future UI layouts
          distance: distanceTraveled
        }
      });
      break;

    case 'GPS_DATA':
      if (!isRunning || !finishGate) return;

      const { lat, lng, speed: gpsSpeedMS, timestamp: gpsTimestamp } = message.payload;
      const currentPos: [number, number] = [lat, lng];

      // Sensor Fusion (Correction Phase)
      // Correct the inertial speed drift using absolute GPS data
      if (!isVelocityInitialized) {
        filteredSpeed = gpsSpeedMS;
        isVelocityInitialized = true;
      } else {
        // Blend Accelerometer speed and GPS speed
        filteredSpeed = (filteredSpeed * (1 - GPS_TRUST_FACTOR)) + (gpsSpeedMS * GPS_TRUST_FACTOR);
      }

      // Hard stop speed drift if GPS reports zero movement
      if (gpsSpeedMS < 0.2 && filteredSpeed < 0.4) {
          filteredSpeed = 0;
      }

      // Gate Crossing Logic
      if (lastPosition) {
        const intersectT = getIntersection(
          lastPosition[0], lastPosition[1], currentPos[0], currentPos[1],
          finishGate.p1[0], finishGate.p1[1], finishGate.p2[0], finishGate.p2[1]
        );

        if (intersectT !== null) {
          console.log("WORKER: FINISH LINE CROSSED");
          const exactTime = lastTimestamp! + (gpsTimestamp - lastTimestamp!) * intersectT;

          if (sessionStartTime === null) {
            sessionStartTime = exactTime;
            distanceTraveled = 0; // Reset distance on start line
            self.postMessage({ type: 'STARTING_LAP', payload: { startTime: exactTime } });
          } else {
            const lapTimeMs = exactTime - sessionStartTime;
            sessionStartTime = exactTime;
            distanceTraveled = 0; // Reset distance for new lap
            self.postMessage({ type: 'LAP_COMPLETED', payload: { lapTime: lapTimeMs } });
          }
        }
      }

      addToBuffer({
        timestamp: gpsTimestamp,
        lat: lat,
        lng: lng,
        speed: filteredSpeed,
      });
      console.log(`WORKER: BUFFER SIZE ${sampleBuffer.length}`);

      lastPosition = currentPos;
      lastTimestamp = gpsTimestamp;
      break;
  }
};