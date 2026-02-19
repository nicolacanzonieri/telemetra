export type WorkerMessage =
  | { type: 'START_SESSION'; payload: { trackType: 'Circuit' | 'Sprint' } }
  | { type: 'STOP_SESSION' }
  | { type: 'SENSOR_DATA'; payload: { accel: DeviceMotionEventAcceleration; timestamp: number } }
  | { type: 'GPS_DATA'; payload: { lat: number; lng: number; speed: number; timestamp: number } };

export type WorkerResponse =
  | { type: 'UPDATE_STATS'; payload: { currentG: { x: number, y: number }, lapTime?: string } }
  | { type: 'LAP_COMPLETED'; payload: { lapTime: number } };

let isRunning = false;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const message = e.data;

  switch (message.type) {
    case 'START_SESSION':
      isRunning = true;
      console.log("Worker: started session", message.payload.trackType);
      break;

    case 'STOP_SESSION':
      isRunning = false;
      console.log("Worker: stopped session");
      break;

    case 'SENSOR_DATA':
      if (!isRunning) return;
      // TODO: Kalman filter
      self.postMessage({
        type: 'UPDATE_STATS',
        payload: {
          currentG: {
            x: message.payload.accel.x || 0,
            y: message.payload.accel.y || 0
          }
        }
      });
      break;

    case 'GPS_DATA':
      if (!isRunning) return;
      // TODO: Manage GPS data
      break;
  }
};