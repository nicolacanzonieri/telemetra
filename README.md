This is a revised, professional **README.md** for **Telemetra**, incorporating the technical depth found in your source code and the empirical data from your recent testing session.

---

# 🏎️ Telemetra

**Telemetra** is a high-performance, sensor-fusion Progressive Web App (PWA) designed for motorsports enthusiasts. It transforms a standard smartphone into a professional-grade telemetry deck, leveraging advanced signal processing to provide real-time lap timing, G-load analysis, and performance delta tracking without the need for external hardware.

[![Status](https://img.shields.io/badge/Status-Active%20Beta-orange)](#-current-state-of-work)
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20WebWorkers-blue)](#-tech-stack)

---

## ✨ Key Features

-   **Precision Timing:** Detects start/finish gate crossings using line-segment intersection algorithms.
-   **Kalman Filter Fusion:** Merges low-frequency GPS data (1Hz–10Hz) with high-frequency Accelerometer data (100Hz+) to produce smooth, low-latency velocity and position vectors.
-   **Quadratic Kinematic Interpolation:** When a gate is crossed between two GPS points, the system solves the kinematic equation ($d = v_0t + 0.5at^2$) to calculate the crossing time with sub-second accuracy.
-   **Live Performance Delta:** Real-time gain/loss comparison against your Personal Best (PB) using an amortized O(1) search algorithm.
-   **Zen Dashboard:** A high-contrast UI featuring a "G-force ball," live lap timers, and a visual delta bar designed for quick glances at high speed.
-   **Offline-First & Local-First:** All data is stored locally via **IndexedDB**; no internet connection is required at the track.

---

## 🛠️ Tech Stack

-   **Frontend:** React 19, Vite, TailwindCSS (v4).
-   **Background Processing:** Web Workers (Codename: `VELO`) to handle heavy sensor fusion math without blocking the UI thread.
-   **Storage:** Dexie.js (IndexedDB) for robust, relational-like local storage.
-   **Mapping:** Leaflet & OpenStreetMap for track gate selection.
-   **PWA:** `vite-plugin-pwa` for offline capabilities and "Add to Home Screen" support.

---

## ⚠️ Disclaimer

**Safety First.** Telemetra is designed for use on closed circuits. Do not interact with the device while driving. The developer is not responsible for any accidents, injuries, or damage resulting from the use of this application. Always prioritize track safety and obey marshal instructions.