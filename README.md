# Fourier Visualizer HTML

Draw a path, decompose it into Fourier epicycles, and replay it as a chain of rotating circles.

一个轻量的 HTML Fourier 可视化工具：手绘轨迹，分解为傅里叶旋转圆，并动态复现原始路径。

## Features

- Draw a continuous path directly in the browser
- Convert the path into Fourier epicycles
- Replay the drawing with animated rotating circles
- Adjust the number of retained terms
- Copy reproducible JSON data
- Export / import JSON for exact replay

## 功能特性

- 在浏览器中直接手绘连续轨迹
- 将轨迹转换为 Fourier / Epicycle 表达
- 通过旋转圆动画重建原始绘制过程
- 可调节保留项数量
- 支持复制可复现 JSON 数据
- 支持导出 / 导入 JSON 并精确复现

## Demo

Open `index.html` in a browser, or host the folder as a static site.

直接在浏览器打开 `index.html`，或将整个目录部署为静态网站。

## Project Structure

```text
index.html   # UI structure
style.css    # styles
app.js       # drawing, transform, animation, import/export logic
```

## How It Works

1. Capture a user-drawn polyline.
2. Resample it into evenly distributed points.
3. Apply a discrete Fourier transform over the 2D path.
4. Convert frequency components into epicycles.
5. Animate the endpoint to reconstruct the original trajectory.

## 原理简介

1. 获取用户绘制的折线路径。
2. 将路径重采样为均匀分布的点。
3. 对二维轨迹执行离散傅里叶变换。
4. 将频率分量转换为旋转圆参数。
5. 通过末端点动画重新绘制原始轨迹。

## Data Format

The import/export format stores:

- raw points
- sampled points
- epicycle coefficients (`frequency`, `amplitude`, `phase`)
- playback settings

这意味着同一份 JSON 可以被复制、保存、分享，并在之后精确复现。

## Notes

- The current prototype uses a straightforward DFT implementation for clarity.
- For heavier workloads, this can be upgraded to FFT.
- Best suited for single-stroke continuous paths in the current version.

## 说明

- 当前原型为了清晰易懂，使用的是直接 DFT 实现。
- 如果需要更高性能，可以继续升级为 FFT。
- 当前版本更适合单笔连续轨迹。

## License

MIT
