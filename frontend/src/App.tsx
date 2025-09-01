import { useState } from "react";
import { WalletConnect } from "./components/WalletConnect";
import { LogForm } from "./components/LogForm";
import { ContractTransferForm } from "./components/ContractTransferForm";
import { TransferForm } from "./components/TransferForm";
import { TokenForm } from "./components/TokenForm";
import { DataList } from "./components/DataList";
import "./App.css";

type ActiveModule = "log" | "contract-transfer" | "transfer" | "token" | "data";

interface ModuleInfo {
  id: ActiveModule;
  title: string;
  description: string;
  icon: string;
  component: React.ComponentType;
}

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
    title: "转账记录", 
    description: "通过ETH转账的附加数据字段存储信息",
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

function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>("log");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentModule = modules.find(m => m.id === activeModule);
  const ActiveComponent = currentModule?.component || LogForm;

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">⛓️</span>
            {!sidebarCollapsed && <span className="logo-text">链上数据系统</span>}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {modules.map((module) => (
            <button
              key={module.id}
              className={`nav-item ${activeModule === module.id ? 'active' : ''}`}
              onClick={() => setActiveModule(module.id)}
              title={sidebarCollapsed ? module.title : ''}
            >
              <span className="nav-icon">{module.icon}</span>
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

      {/* Main Content */}
      <main className="main">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="page-info">
              <div className="page-title-wrapper">
                <button 
                  className="mobile-menu-btn"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  ☰
                </button>
                <h1 className="page-title">
                  <span className="page-icon">{currentModule?.icon}</span>
                  {currentModule?.title}
                </h1>
              </div>
              <p className="page-description">{currentModule?.description}</p>
            </div>
            <div className="header-actions">
              <WalletConnect />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content">
          <div className="content-wrapper">
            <ActiveComponent />
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
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