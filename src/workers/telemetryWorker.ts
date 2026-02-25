import type { Gate } from "../db/database";

/**
 * TELEMETRY WORKER (CODENAME: VELO)
 * Responsibilities:
 * 1. Sensor Fusion (Kalman Filter) for stable Velocity/Position.
 * 2. Gate Crossing detection via line-segment intersection.
 * 3. High-frequency Delta-time calculation against Reference Lap.
 * 4. Data buffering and batch-dispatching to IndexedDB.
 */

// --- CONFIGURATION ---
const ACCEL_NOISE = 0.5;        // Process noise for Kalman Filter
const GPS_NOISE = 2.0;          // Measurement noise for Kalman Filter
const ACCEL_SMOOTHING = 0.15;   // Low-pass filter for G-ball visualization
const VELOCITY_DEADZONE = 0.05; // M/S threshold to ignore stationary sensor drift
const BATCH_SIZE = 50;           // Samples to buffer before sending to UI/DB

// --- SESSION STATE ---
let isRunning = false;
let trackType: 'Circuit' | 'Sprint' = 'Circuit';
let currentSessionId: number | null = null;
let startGate: { p1: [number, number], p2: [number, number] } | null = null;
let finishGate: { p1: [number, number], p2: [number, number] } | null = null;

// --- KALMAN FILTER & MOTION STATE ---
let velocity = 0;               // m/s (Fused state)
let lastVelocity = 0;           // Speed during the previous GPS tick (for Kinematics)
let variance = 1;               // Uncertainty tracker
let accelBiasY = 0;             // Calibration bias to prevent velocity drift
let filteredGx = 0;             // Smoothed Lateral G
let filteredGy = 0;             // Smoothed Longitudinal G
let distanceTraveled = 0;       // Meters since current lap start
let lastAccelTimestamp: number | null = null;
let lastGpsPosition: [number, number] | null = null;
let lastGpsTimestamp: number | null = null;

// --- LAP TIMING & DELTA STATE ---
let lapStartTime: number | null = null;
let referenceLap: { distance: number; time: number }[] = [];
let lastRefIndex = 0;

// --- PERSISTENCE BUFFER ---
let sampleBuffer: any[] = [];

// --- TYPE DEFINITIONS ---
export type WorkerMessage =
  | { type: 'START_SESSION'; payload: { sessionId: number; trackName: string, trackType: 'Circuit' | 'Sprint'; startGate: Gate | null; finishGate: Gate | null } }
  | { type: 'STOP_SESSION' }
  | { type: 'SET_CALIBRATION'; payload: { biasY: number } } // For syncing bias
  | { type: 'SENSOR_DATA'; payload: { accel: DeviceMotionEventAcceleration; timestamp: number } }
  | { type: 'GPS_DATA'; payload: { lat: number; lng: number; speed: number; timestamp: number } }
  | { type: 'SET_REFERENCE_LAP'; payload: { samples: { distance: number; time: number }[] } };

export type WorkerResponse =
  | { type: 'UPDATE_STATS'; payload: { currentG: { x: number, y: number }, speed: number, distance: number, delta: number } }
  | { type: 'STARTING_LAP'; payload: { startTime: number } }
  | { type: 'LAP_COMPLETED'; payload: { lapTime: number } }
  | { type: 'SAVE_BATCH'; payload: any[] };

/**
 * Calculates if two line segments intersect.
 * Used for detecting if the vehicle crossed the start/finish gate.
 * Returns T (fraction 0..1 along the segment AB)
 */
function getIntersection(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number
): number | null {
  const det = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (det === 0) return null;

  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / det;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / det;

  return (t >= 0 && t <= 1 && u >= 0 && u <= 1) ? t : null;
}

/**
 * Helper function to calculate the distance in meters between two 
 * coordinates (simplified Haversine formula)
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radius of the Earth in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Buffers telemetry samples and dispatches them to the main thread in batches.
 */
function bufferSample(sample: any) {
  if (!currentSessionId) return;

  sampleBuffer.push({
    ...sample,
    sessionId: currentSessionId,
    distance: distanceTraveled
  });

  if (sampleBuffer.length >= BATCH_SIZE) {
    self.postMessage({ type: 'SAVE_BATCH', payload: [...sampleBuffer] });
    sampleBuffer = [];
  }
}

/**
 * Main Message Handler
 */
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const message = e.data;

  switch (message.type) {
    case 'START_SESSION':
      currentSessionId = message.payload.sessionId;
      trackType = message.payload.trackType;
      isRunning = true;
      velocity = 0;
      lastVelocity = 0;
      variance = 1;
      distanceTraveled = 0;
      lastRefIndex = 0;
      lapStartTime = null;

      // Define Gates
      if (message.payload.startGate) {
        startGate = {
          p1: [message.payload.startGate.p1.lat, message.payload.startGate.p1.lng],
          p2: [message.payload.startGate.p2.lat, message.payload.startGate.p2.lng]
        };
      }
      finishGate = message.payload.finishGate ? {
        p1: [message.payload.finishGate.p1.lat, message.payload.finishGate.p1.lng],
        p2: [message.payload.finishGate.p2.lat, message.payload.finishGate.p2.lng]
      } : startGate;
      break;

    case 'SET_CALIBRATION':
      accelBiasY = message.payload.biasY;
      break;

    case 'STOP_SESSION':
      isRunning = false;
      if (sampleBuffer.length > 0) {
        self.postMessage({ type: 'SAVE_BATCH', payload: [...sampleBuffer] });
      }
      sampleBuffer = [];
      break;

    case 'SET_REFERENCE_LAP':
      // Sort reference points by distance to ensure the search pointer logic works
      referenceLap = message.payload.samples.sort((a, b) => a.distance - b.distance);
      lastRefIndex = 0;
      break;

    case 'SENSOR_DATA':
      if (!isRunning) return;
      const { accel, timestamp } = message.payload;
      const dtA = lastAccelTimestamp ? (timestamp - lastAccelTimestamp) / 1000 : 0;
      lastAccelTimestamp = timestamp;

      // 1. G-Force Low Pass Filter (for UI Visualization)
      filteredGx = (accel.x || 0) * ACCEL_SMOOTHING + filteredGx * (1 - ACCEL_SMOOTHING);
      filteredGy = (accel.y || 0) * ACCEL_SMOOTHING + filteredGy * (1 - ACCEL_SMOOTHING);

      // 2. Kalman Filter: Prediction Phase
      if (dtA > 0 && dtA < 0.2) {
        // Apply Calibration Bias to the accelerometer input
        let accelMS2 = ((accel.y || 0) - accelBiasY) * 9.81;
        if (Math.abs(accelMS2) < VELOCITY_DEADZONE) accelMS2 = 0;

        velocity += accelMS2 * dtA;
        if (velocity < 0) velocity = 0;

        distanceTraveled += velocity * dtA;
        variance += dtA * ACCEL_NOISE;
      }

      // 3. High-Frequency Delta Calculation (O(1) amortized search)
      let currentDelta = 0;
      if (referenceLap.length > 0 && lapStartTime !== null) {
        const timeSinceLapStart = timestamp - lapStartTime;

        // Advance the reference pointer based on current distance
        while (lastRefIndex < referenceLap.length - 1 && referenceLap[lastRefIndex].distance < distanceTraveled) {
          lastRefIndex++;
        }
        currentDelta = (timeSinceLapStart - referenceLap[lastRefIndex].time) / 1000;
      }

      self.postMessage({
        type: 'UPDATE_STATS',
        payload: {
          currentG: { x: filteredGx, y: filteredGy },
          speed: velocity * 3.6,
          distance: distanceTraveled,
          delta: currentDelta
        }
      });
      break;

    case 'GPS_DATA':
      if (!isRunning || !finishGate) return;
      const { lat, lng, speed: gpsSpeedMS, timestamp: gpsTimestamp } = message.payload;

      // 1. Kalman Filter: Correction Phase
      const kalmanGain = variance / (variance + GPS_NOISE);
      const currentFilteredVelocity = velocity + kalmanGain * (gpsSpeedMS - velocity);
      velocity = currentFilteredVelocity;
      variance = (1 - kalmanGain) * variance;

      // 2. Gate Crossing Logic
      if (lastGpsPosition && lastGpsTimestamp) {
        const intersectT = getIntersection(lastGpsPosition[0], lastGpsPosition[1], lat, lng, finishGate.p1[0], finishGate.p1[1], finishGate.p2[0], finishGate.p2[1]);

        if (intersectT !== null) {
          // --- KINEMATIC INTERPOLATION (QUADRATIC) ---

          // Calculate physical distance between PREVIOUS point and INTERSECTION
          const segmentDist = getDistance(lastGpsPosition[0], lastGpsPosition[1], lat, lng);
          const distanceToLine = segmentDist * intersectT;

          // Kinematic parameters
          const dt = (gpsTimestamp - lastGpsTimestamp) / 1000; // Delta time in seconds
          const v0 = lastVelocity; // Velocity at start of segment
          const v1 = currentFilteredVelocity; // Velocity at end of segment

          let preciseDeltaTime = 0;

          // If velocity change is negligible or dt is invalid, fallback to Linear
          if (Math.abs(v1 - v0) < 0.1 || dt <= 0) {
            preciseDeltaTime = dt * intersectT;
          } else {
            // Solve d = v0*t + 0.5*a*t^2 for t
            // 0.5*a*t^2 + v0*t - d = 0
            const accel = (v1 - v0) / dt;

            const A = 0.5 * accel;
            const B = v0;
            const C = -distanceToLine;

            const delta = B * B - 4 * A * C;

            if (delta >= 0) {
              const t1 = (-B + Math.sqrt(delta)) / (2 * A);
              const t2 = (-B - Math.sqrt(delta)) / (2 * A);

              // Pick positive solution closest to expected linear time
              if (t1 >= 0 && t1 <= dt * 1.5) preciseDeltaTime = t1;
              else if (t2 >= 0 && t2 <= dt * 1.5) preciseDeltaTime = t2;
              else preciseDeltaTime = dt * intersectT; // Fallback
            } else {
              preciseDeltaTime = dt * intersectT; // Fallback
            }
          }

          // Calculate Exact Time
          const exactTime = lastGpsTimestamp + (preciseDeltaTime * 1000);

          if (lapStartTime === null) {
            lapStartTime = exactTime;
            distanceTraveled = 0;
            lastRefIndex = 0;
            self.postMessage({ type: 'STARTING_LAP', payload: { startTime: exactTime } });
          } else {
            const lapTimeMs = exactTime - lapStartTime;

            // Force the buffer to empty at the finish line (FIX for Issue #3)
            if (sampleBuffer.length > 0) {
              self.postMessage({ type: 'SAVE_BATCH', payload: [...sampleBuffer] });
              sampleBuffer = [];
            }
            
            self.postMessage({ type: 'LAP_COMPLETED', payload: { lapTime: lapTimeMs } });

            // If Sprint, stop the engine after finish line
            if (trackType === 'Sprint') {
              isRunning = false;
              return;
            }

            lapStartTime = exactTime;
            distanceTraveled = 0;
            lastRefIndex = 0;
          }
        }
      }

      // 3. Persistent Storage
      bufferSample({
        timestamp: gpsTimestamp,
        lat,
        lng,
        speed: velocity, // Filtered Speed
        rawSpeed: gpsSpeedMS, // Raw GPS Speed
        gLat: filteredGx,
        gLong: filteredGy
      });

      // 4. Update State for Next Tick
      lastGpsPosition = [lat, lng];
      lastGpsTimestamp = gpsTimestamp;
      lastVelocity = velocity; // Important for v0 in next kinematic calc
      break;
  }
};