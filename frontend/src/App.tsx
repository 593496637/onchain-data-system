/**
 * 链上数据系统主应用组件
 * 
 * 这是整个应用的核心组件，提供了一个多功能的区块链数据管理系统，包括：
 * 1. 智能合约事件日志记录
 * 2. 以太坊转账功能（直接转账和合约转账）
 * 3. ERC20代币交易
 * 4. 链上数据查询和展示
 * 5. 钱包连接和网络管理
 * 
 * 架构特点：
 * - 模块化设计：每个功能独立组件化
 * - 响应式布局：支持桌面和移动设备
 * - 侧边栏导航：直观的功能切换界面
 * - 状态管理：统一的模块切换和UI状态管理
 */

import { useState } from "react";
import { WalletConnect } from "./components/WalletConnect";
import { LogForm } from "./components/LogForm";
import { ContractTransferForm } from "./components/ContractTransferForm";
import { TransferForm } from "./components/TransferForm";
import { TokenForm } from "./components/TokenForm";
import { DataList } from "./components/DataList";
import "./App.css";

// 定义应用中可用的功能模块类型
type ActiveModule = "log" | "contract-transfer" | "transfer" | "token" | "data";

// 模块信息接口，定义每个功能模块的基本属性
interface ModuleInfo {
  id: ActiveModule;           // 模块唯一标识符
  title: string;              // 模块显示名称
  description: string;        // 模块功能描述
  icon: string;              // 模块图标（使用Emoji）
  component: React.ComponentType; // 模块对应的React组件
}

/**
 * 应用功能模块配置数组
 * 
 * 定义了应用中所有可用的功能模块，每个模块包含：
 * - 唯一标识符和显示信息
 * - 功能描述和图标
 * - 对应的React组件
 * 
 * 模块说明：
 * 1. 事件日志：通过智能合约事件将数据永久记录到区块链
 * 2. 合约转账：使用专门的转账合约，支持附言信息记录
 * 3. 原生转账：直接ETH转账，通过交易data字段附加信息
 * 4. 代币交易：ERC20代币（如USDC）的转账功能
 * 5. 链上数据：使用The Graph查询和展示所有链上记录
 */
const modules: ModuleInfo[] = [
  {
    id: "log",
    title: "事件日志",
    description: "通过智能合约事件记录数据到区块链",
    icon: "📝",
    component: LogForm,
  },
  {
    id: "contract-transfer",
    title: "合约转账",
    description: "通过转账合约发送ETH并记录附言信息",
    icon: "🔗",
    component: ContractTransferForm,
  },
  {
    id: "transfer",
    title: "原生转账", 
    description: "通过ETH原生转账的data字段存储信息",
    icon: "💸",
    component: TransferForm,
  },
  {
    id: "token",
    title: "代币交易",
    description: "通过ERC20代币转账记录交易数据",
    icon: "🪙",
    component: TokenForm,
  },
  {
    id: "data",
    title: "链上数据",
    description: "查看和搜索所有已上链的数据记录",
    icon: "📊",
    component: DataList,
  },
];

/**
 * 主应用组件函数
 * 
 * 管理整个应用的状态和布局，包括：
 * - 当前激活模块的状态管理
 * - 侧边栏展开/收起状态控制
 * - 响应式布局和移动设备适配
 * 
 * @returns React元素 - 完整的应用UI结构
 */
function App() {
  // 当前激活的功能模块，默认为事件日志模块
  const [activeModule, setActiveModule] = useState<ActiveModule>("log");
  
  // 侧边栏是否收起的状态，用于响应式布局
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 根据当前激活模块ID查找对应的模块信息
  const currentModule = modules.find(m => m.id === activeModule);
  
  // 获取当前模块对应的React组件，如果未找到则默认使用LogForm
  const ActiveComponent = currentModule?.component || LogForm;

  return (
    <div className="app">
      {/* 侧边栏导航区域 */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* 侧边栏头部：包含应用logo和收起/展开按钮 */}
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">⛓️</span>
            {/* 仅在侧边栏展开时显示应用名称 */}
            {!sidebarCollapsed && <span className="logo-text">链上数据系统</span>}
          </div>
          {/* 侧边栏收起/展开切换按钮 */}
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* 导航菜单：显示所有功能模块 */}
        <nav className="sidebar-nav">
          {modules.map((module) => (
            <button
              key={module.id}
              className={`nav-item ${activeModule === module.id ? 'active' : ''}`}
              onClick={() => setActiveModule(module.id)}
              title={sidebarCollapsed ? module.title : ''} // 收起时显示悬停提示
            >
              {/* 模块图标 */}
              <span className="nav-icon">{module.icon}</span>
              {/* 仅在侧边栏展开时显示模块详细信息 */}
              {!sidebarCollapsed && (
                <div className="nav-content">
                  <span className="nav-title">{module.title}</span>
                  <span className="nav-desc">{module.description}</span>
                </div>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* 主内容区域 */}
      <main className="main">
        {/* 顶部标题栏 */}
        <header className="header">
          <div className="header-content">
            {/* 页面信息：标题和描述 */}
            <div className="page-info">
              <div className="page-title-wrapper">
                {/* 移动端菜单按钮（仅在小屏幕显示） */}
                <button 
                  className="mobile-menu-btn"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  ☰
                </button>
                {/* 当前模块的标题和图标 */}
                <h1 className="page-title">
                  <span className="page-icon">{currentModule?.icon}</span>
                  {currentModule?.title}
                </h1>
              </div>
              {/* 当前模块的功能描述 */}
              <p className="page-description">{currentModule?.description}</p>
            </div>
            {/* 头部操作区域：包含钱包连接组件 */}
            <div className="header-actions">
              <WalletConnect />
            </div>
          </div>
        </header>

        {/* 主要内容展示区域 */}
        <div className="content">
          <div className="content-wrapper">
            {/* 动态渲染当前激活模块的组件 */}
            <ActiveComponent />
          </div>
        </div>
      </main>

      {/* 移动端遮罩层：当侧边栏展开时显示，点击可关闭侧边栏 */}
      {!sidebarCollapsed && (
        <div 
          className="mobile-overlay"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
}

export default App;