# Fourier Visualizer HTML

[中文说明 / Chinese Version](./README.zh-CN.md)

A lightweight browser-based Fourier epicycle visualizer for drawing a path, decomposing it into frequency components, and replaying it as a chain of rotating circles.

## Overview

Fourier Visualizer HTML lets users draw a continuous path directly in the browser and reconstruct it using Fourier epicycles. The project is designed as a simple, portable static web app that works across desktop and mobile browsers.

## Features

- Draw a continuous path in the browser
- Convert the path into Fourier epicycles
- Replay the shape with animated rotating circles
- Adjust the number of retained terms
- Copy reproducible JSON data
- Export and import JSON for exact replay
- Responsive layout for desktop and mobile use

## Demo

Open `index.html` locally in a browser, or deploy the folder as a static site.

## Project Structure

```text
index.html   # UI structure
style.css    # responsive layout and styling
app.js       # drawing, transform, animation, import/export logic
```

## How It Works

1. Capture a user-drawn polyline.
2. Resample it into evenly distributed points.
3. Apply a discrete Fourier transform over the 2D path.
4. Convert frequency components into epicycles.
5. Animate the endpoint to reconstruct the original trajectory.

## Data Format

The import/export JSON stores:

- raw points
- sampled points
- epicycle coefficients (`frequency`, `amplitude`, `phase`)
- playback settings

This makes it possible to copy, save, share, and replay the same drawing later.

## Notes

- The current prototype uses a direct DFT implementation for clarity.
- It can be upgraded to FFT for better performance on heavier workloads.
- The current version is best suited for single-stroke continuous paths.

## License

MIT
