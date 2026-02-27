# 🏎️ Telemetra

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-ff69b4?logo=progressive-web-apps&logoColor=white)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Telemetra** is a high-performance, sensor-fusion Progressive Web App (PWA) designed for motorsports enthusiasts. It transforms a standard smartphone into a professional-grade telemetry deck, leveraging advanced signal processing to provide real-time lap timing, G-load analysis, and performance tracking without the need for external hardware.

[**Get the app**](https://telemetra.vercel.app)

## ✨ Key Features

- **Precision Timing**: Detects start/finish gate crossings using advanced line-segment intersection algorithms.
- **Kalman Filter Fusion**: Merges low-frequency GPS data (1Hz–10Hz) with high-frequency Accelerometer data (100Hz+) to produce smooth, low-latency velocity and position vectors.
- **Quadratic Kinematic Interpolation**: When a gate is crossed between two GPS points, the system solves the kinematic equation $d = v_0t + 0.5at^2$ to calculate the crossing time with sub-second accuracy.
- **Live Performance Delta**: Real-time gain/loss comparison against your Personal Best (PB) using an amortized O(1) search algorithm.
- **Zen Dashboard**: A high-contrast UI featuring a "G-force ball," live lap timers, and a visual delta bar designed for quick glances at high speeds.
- **Offline-First**: All data is stored locally via IndexedDB; no internet connection is required at the track.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS (v4).
- **Processing**: **Web Workers** to handle heavy sensor fusion math without blocking the UI thread.
- **Storage**: **Dexie.js** (IndexedDB) for robust, relational-like local storage.
- **Mapping**: Leaflet & OpenStreetMap for track gate selection.
- **PWA**: `vite-plugin-pwa` for offline capabilities and "Add to Home Screen" support.

---

## 📡 How it works (The Math)
Telemetra doesn't just rely on raw GPS. Most phones have a 1Hz GPS refresh rate, which is too slow for racing.

- **The Fusion**: Telemetra uses a Kalman Filter to predict the car's state. It uses the accelerometer to fill the gaps between GPS updates.

- **Gate Detection**: The app defines the Start/Finish line as a 2D vector. It constantly checks for intersections between your current trajectory and the gate vector.

- **Sub-tick precision**: By calculating the acceleration at the moment of crossing, it interpolates the exact millisecond you crossed the line, even if it happened between two GPS pings.

## ⚠️ Disclaimer
**Safety First**. Telemetra is designed for use on closed circuits. Do not interact with the device while driving. The developer is not responsible for any accidents, injuries, or damage resulting from the use of this application. Always prioritize track safety and obey marshal instructions.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
