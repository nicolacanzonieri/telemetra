import type { Gate } from "../db/database";

let isRunning = false;

// Session related 
let startGate: { p1: [number, number], p2: [number, number] } | null = null;
let finishGate: { p1: [number, number], p2: [number, number] } | null = null;
let lastPosition: [number, number] | null = null;
let lastTimestamp: number | null = null;
let sessionStartTime: number | null = null;

// Database related
let sampleBuffer: any[] = [];
const BATCH_SIZE = 50; // Send data every 50 samples or every X seconds
let currentSessionId: number | null = null;

// Kalman and low pass filter
const ACCEL_SMOOTHING = 0.15; // Lower = smoother, but with more lag (0.1 - 0.2 is ideal)
// @ts-ignore
const GPS_TRUST_FACTOR = 0.2; // How much to trust GPS relative to inertial integration

// Filtered values for the G-Ball
let filteredGx = 0;
let filteredGy = 0;

// Fusioned speed between GPS and Accelerometer
let filteredSpeed = 0;

// State for integration (for future velocity and position)
let lastAccelTimestamp: number | null = null;

export type WorkerMessage =
  | { type: 'START_SESSION'; payload: { sessionId: number; trackType: 'Circuit' | 'Sprint'; startGate: Gate | null; finishGate: Gate | null } }
  | { type: 'STOP_SESSION' }
  | { type: 'SENSOR_DATA'; payload: { accel: DeviceMotionEventAcceleration; timestamp: number } }
  | { type: 'GPS_DATA'; payload: { lat: number; lng: number; speed: number; timestamp: number } };

export type WorkerResponse =
  | { type: 'UPDATE_STATS'; payload: { currentG: { x: number, y: number }, lapTime?: string } }
  | { type: 'STARTING_LAP'; payload: { startTime: number } }
  | { type: 'LAP_COMPLETED'; payload: { lapTime: number } };


/**
 * Calculates the intersection point between two line segments (AB and CD).
 * Returns the interpolation factor 't' (0 to 1) along segment AB if they intersect,
 * otherwise returns null.
 */
function getIntersection(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number
): number | null {
  const det = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (det === 0) return null; // Parallel lines

  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / det;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / det;

  // If t and u are between 0 and 1, the segments intersect
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return t;
  }
  return null;
}

function addToBuffer(sample: any) {
  if (!currentSessionId) return;

  sampleBuffer.push({
    ...sample,
    sessionId: currentSessionId
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
      const { payload } = message;

      currentSessionId = message.payload.sessionId;
      sampleBuffer = [];
      isRunning = true;
      
      if (payload.startGate) {
        startGate = {
          p1: [payload.startGate.p1.lat, payload.startGate.p1.lng],
          p2: [payload.startGate.p2.lat, payload.startGate.p2.lng]
        };
      }
      if (payload.finishGate) {
        finishGate = {
          p1: [payload.finishGate.p1.lat, payload.finishGate.p1.lng],
          p2: [payload.finishGate.p2.lat, payload.finishGate.p2.lng]
        };
      } else {
        // If it's a circuit, the finish gate coincides with the start gate
        finishGate = startGate;
      }

      sessionStartTime = null; // Will be set on the first pass through the start gate
      break;

    case 'STOP_SESSION':
      isRunning = false;
      console.log("Worker: stopped session");
      break;

    case 'SENSOR_DATA':
      if (!isRunning) return;

      const { accel, timestamp } = message.payload;

      // Apply low-pass-filter (EMA) for the G-Meter
      filteredGx = (accel.x || 0) * ACCEL_SMOOTHING + filteredGx * (1 - ACCEL_SMOOTHING);
      filteredGy = (accel.y || 0) * ACCEL_SMOOTHING + filteredGy * (1 - ACCEL_SMOOTHING);

      // @ts-ignore
      const dt = lastAccelTimestamp ? (timestamp - lastAccelTimestamp) / 1000 : 0;
      lastAccelTimestamp = timestamp;

      if (dt > 0 && dt < 0.2) {
        // Integrate acceleration to estimate speed (v = v0 + a*dt)
        filteredSpeed += (filteredGy * 9.81) * dt;
        // Prevent negative speed due to sensor noise or calibration drift
        if (filteredSpeed < 0) filteredSpeed = 0;
      }

      self.postMessage({
        type: 'UPDATE_STATS',
        payload: {
          currentG: {
            x: filteredGx,
            y: filteredGy
          }
        }
      });
      break;

    case 'GPS_DATA':
      if (!isRunning || !finishGate) return;

      const currentPos: [number, number] = [message.payload.lat, message.payload.lng];
      const currentTimestamp = message.payload.timestamp;

      if (lastPosition) {
        // Check for intersection between (lastPosition -> currentPos) and finishGate
        const intersectT = getIntersection(
          lastPosition[0], lastPosition[1], currentPos[0], currentPos[1],
          finishGate.p1[0], finishGate.p1[1], finishGate.p2[0], finishGate.p2[1]
        );

        // Driver crossed the line
        if (intersectT !== null) {
          console.log("WORKER: FINISH LINE CROSSED");
          // Calculate the exact millisecond by interpolating between the two timestamps
          const exactTime = lastTimestamp! + (currentTimestamp - lastTimestamp!) * intersectT;

          if (sessionStartTime === null) {
            // First pass: start the timer
            sessionStartTime = exactTime;
            
            self.postMessage({
              type: 'STARTING_LAP',
              payload: { startTime: exactTime }
            });
          } else {
            // Subsequent passes: calculate lap time
            const lapTimeMs = exactTime - sessionStartTime;
            sessionStartTime = exactTime; // Reset for the next lap

            self.postMessage({
              type: 'LAP_COMPLETED',
              payload: { lapTime: lapTimeMs }
            });
          }
        }
      }

      addToBuffer({
        timestamp: message.payload.timestamp,
        lat: message.payload.lat,
        lng: message.payload.lng,
        speed: message.payload.speed,
      });

      lastPosition = currentPos;
      lastTimestamp = currentTimestamp;
      break;
  }
};