# Fourier Canvas Lab

[![在线演示](https://img.shields.io/badge/Live%20Demo-%E6%89%93%E5%BC%80-blue?style=for-the-badge)](https://dreaminmaster.github.io/fourier-visualizer-html/)
[![English](https://img.shields.io/badge/README-English-green?style=for-the-badge)](./README.md)

一个浏览器版 Fourier 绘图实验工具：手绘轨迹、分解为旋转圆、再通过可平移可缩放的画布视窗进行动态复现。

![项目封面](./assets/cover.png)

## 在线演示

- **打开 Demo：** https://dreaminmaster.github.io/fourier-visualizer-html/

## 演示预览

![Demo GIF](./assets/demo.gif)

## 项目简介

Fourier Canvas Lab 把自由手绘的二维轨迹转化为一个既可视又带有数学意味的 Fourier 重建流程：

- 直接在浏览器中绘制路径
- 将路径分解为旋转圆
- 用旋转圆动态重建图形
- 用 JSON 保存和恢复完全相同的回放状态
- 在更大的虚拟画布中进行平移与缩放浏览

整个项目保持轻量、适合静态托管，并兼顾电脑和手机浏览器使用。

## 功能特性

- 浏览器中连续手绘路径
- Fourier / Epicycle 重建回放
- 可调节保留项数量，用于对比近似程度
- 支持复制与导出回放 JSON
- 支持粘贴 JSON 或导入 JSON 文件
- 固定视窗 + 更大虚拟画布
- 桌面端支持平移 / 缩放
- 移动端支持双指平移与捏合缩放
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

## 操作说明

### 桌面端

- 用鼠标或触控笔绘制
- 按住 `Space` 再拖动可平移视图
- 使用鼠标滚轮缩放

### 移动端

- 单指绘制
- 双指平移
- 双指捏合缩放

## 项目结构

```text
index.html         # 页面结构
style.css          # 响应式布局与样式
app.js             # 绘制、变换、动画、导入导出逻辑
assets/cover.png   # 项目封面图
assets/demo.gif    # 演示动图
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
- 当前视窗状态

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
