# Fourier Visualizer HTML

[![在线演示](https://img.shields.io/badge/Live%20Demo-%E6%89%93%E5%BC%80-blue?style=for-the-badge)](https://dreaminmaster.github.io/fourier-visualizer-html/)
[![English](https://img.shields.io/badge/README-English-green?style=for-the-badge)](./README.md)

一个轻量的浏览器版 Fourier / Epicycle 可视化工具：用户可以直接在页面中手绘一条连续轨迹，将其分解为频率分量，并通过一串旋转圆动态复现原始路径。

## 在线演示

- **打开 Demo：** https://dreaminmaster.github.io/fourier-visualizer-html/

## 为什么做这个项目

这个项目把自由手绘的二维轨迹转化为一个既可视又带有数学意味的 Fourier 重建过程：

- 直接在浏览器中绘制路径
- 将路径分解为旋转圆
- 用旋转圆动态重建图形
- 保存并恢复完全相同的重建状态

整个项目被设计成简单、可移植的静态网页应用，兼顾电脑和手机浏览器使用。

## 功能特性

- 在浏览器中手绘连续轨迹
- 将轨迹转换为 Fourier / Epicycle 表达
- 用旋转圆动画重建原始图形
- 调节保留项数量
- 复制可复现 JSON 数据
- 导出和导入 JSON 以精确复现
- 支持从 JSON 文件导入回放数据
- 响应式布局，兼容桌面端和移动端

## 快速开始

### 本地运行

直接在浏览器中打开 `index.html`。

### 静态部署

可以部署到任意静态托管平台，例如：

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel

## 项目结构

```text
index.html         # 页面结构
style.css          # 响应式布局与样式
app.js             # 绘制、变换、动画、导入导出逻辑
README.md          # 英文文档
README.zh-CN.md    # 中文文档
```

## 原理简介

1. 获取用户绘制的折线路径。
2. 将路径重采样为均匀分布的点。
3. 对二维轨迹执行离散傅里叶变换。
4. 将频率分量转换为旋转圆参数。
5. 通过末端点动画重新绘制原始轨迹。

## 数据格式

导入 / 导出的 JSON 中会保存：

- 原始点集
- 重采样点集
- 旋转圆参数（`frequency`、`amplitude`、`phase`）
- 播放设置

这意味着同一份数据可以被复制、保存、分享，并在之后再次精确复现。

## 说明

- 当前原型为了清晰易懂，使用的是直接 DFT 实现。
- 如果后续引入 FFT，本质上是性能优化，而不是更换目标变换结果。
- 当前版本更适合单笔连续轨迹。

## 路线图

后续可以继续增强：

- FFT 加速
- SVG Path 导入
- 更好的尖角/急转弯采样
- 多笔画 / 多轮廓支持
- 本地自动保存最近绘制内容

## License

MIT
