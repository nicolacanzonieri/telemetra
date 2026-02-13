# 🏎️ Telemetra

> **A sensor-fusion telemetry PWA for motorsport analysis, leveraging Kalman-filtered GPS and IMU data for real-time lap timing and G-load visualization.**

Telemetra is a lightweight, high-performance Progressive Web App (PWA) designed for track enthusiasts who want professional-grade telemetry without the need for expensive dedicated hardware. By harnessing the power of modern smartphone sensors, Telemetra provides essential insights into your driving performance.

> [!CAUTION]
> **Work in Progress:** Telemetra is currently in active development. Features like sensor calibration and persistent storage are being refined. Use with caution during high-speed activities and always prioritize track safety.

---

## ✨ Key Features

- **Kalman-Filtered Data:** High-precision signal processing that fuses GPS (1Hz-10Hz) and Accelerometer (100Hz+) data to provide fluid, sub-second accuracy.
- **Minimalist "Zen" Dashboard:** High-contrast UI designed for the "200ms glance test" at high speeds.
- **Offline-First Architecture:** Built to work flawlessly on remote race tracks with no internet connection.
- **Pro Metrics:**
  - **Live Delta Bar:** Real-time feedback on your gain/loss against your personal best.
  - **G-Force Circle:** Visual representation of lateral and longitudinal loads.
  - **Session History:** Automatic lap timing with Last and Best lap focus.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Vite + React** | Ultra-fast build tool and reactive UI components. |
| **TailwindCSS** | Optimized styling for high-contrast OLED displays. |
| **Dexie.js** | Robust wrapper for **IndexedDB** for reliable local data storage. |
| **Web Sensors API** | Low-level