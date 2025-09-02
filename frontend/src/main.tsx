/**
 * 应用程序入口点
 * 
 * 这个文件是整个React应用的启动文件，负责：
 * 1. 初始化React应用的根节点
 * 2. 启用严格模式以帮助开发时发现潜在问题
 * 3. 渲染主应用组件到DOM中
 * 
 * 文件说明：
 * - 使用React 18的createRoot API进行根节点创建
 * - StrictMode帮助识别不安全的生命周期、废弃的API等问题
 * - 引入全局样式文件index.css
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 创建React应用根节点并渲染主应用组件
// 使用非空断言操作符(!)因为我们确定root元素存在于index.html中
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 主应用组件 - 包含整个链上数据系统的UI */}
    <App />
  </StrictMode>,
)
