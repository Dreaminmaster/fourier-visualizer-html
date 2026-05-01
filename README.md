# Fourier Visualizer HTML

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open-blue?style=for-the-badge)](https://dreaminmaster.github.io/fourier-visualizer-html/)
[![Chinese](https://img.shields.io/badge/README-%E4%B8%AD%E6%96%87-green?style=for-the-badge)](./README.zh-CN.md)

A lightweight browser-based Fourier epicycle visualizer for drawing a path, decomposing it into frequency components, and replaying it as a chain of rotating circles.

## Live Demo

- **Open Demo:** https://dreaminmaster.github.io/fourier-visualizer-html/

## Why this project

This project turns freehand 2D drawing into a Fourier-based reconstruction process that is both mathematical and visual:

- draw a path directly in the browser
- decompose it into epicycles
- replay the shape as rotating circles
- save and restore the exact reconstruction state

It is designed as a small, portable static web app that works across desktop and mobile browsers.

## Features

- Draw a continuous path in the browser
- Convert the path into Fourier epicycles
- Replay the shape with animated rotating circles
- Adjust the number of retained terms
- Copy reproducible JSON data
- Export and import JSON for exact replay
- Import replay data from a JSON file
- Responsive layout for desktop and mobile use

## Quick Start

### Run locally

Open `index.html` directly in a browser.

### Deploy as a static site

Upload the folder to any static host, such as:

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel

## Project Structure

```text
index.html         # UI structure
style.css          # responsive layout and styling
app.js             # drawing, transform, animation, import/export logic
README.md          # English documentation
README.zh-CN.md    # Chinese documentation
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
- FFT can be introduced later as a performance optimization without changing the target transform.
- The current version is best suited for single-stroke continuous paths.

## Roadmap

Possible next steps:

- FFT-based acceleration
- SVG path import
- Better sampling around sharp turns
- Multi-stroke / multi-contour support
- Local persistence for recent drawings

## License

MIT
