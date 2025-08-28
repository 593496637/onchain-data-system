// src/App.tsx
import { useState } from "react";
import { WalletConnect } from "./components/WalletConnect";
import { LogForm } from "./components/LogForm";
import { TransferForm } from "./components/TransferForm";
import { TokenForm } from './components/TokenForm';
import { DataList } from "./components/DataList";
import "./App.css";

// 定义 Tab 的类型，方便管理
type Tab = "log" | "transfer" | "token";

function App() {
  // --- 状态管理 ---
  // 当前激活的 Tab，默认为 'log'
  const [activeTab, setActiveTab] = useState<Tab>("log");

  return (
    <div className="app-container">
      <header>
        <h1>数据上链系统</h1>
        <WalletConnect />
      </header>

      <main>
        {/* --- Tab 导航 --- */}
        <div className="tabs">
          <button
            className={activeTab === "log" ? "active" : ""}
            onClick={() => setActiveTab("log")}
          >
            日志方式
          </button>
          <button
            className={activeTab === "transfer" ? "active" : ""}
            onClick={() => setActiveTab("transfer")}
          >
            转账方式
          </button>
          <button
            className={activeTab === "token" ? "active" : ""}
            onClick={() => setActiveTab("token")}
          >
            Token 方式 (选修)
          </button>
        </div>

        {/* --- 根据 Tab 显示不同内容 --- */}
        <div className="content">
          {activeTab === "log" && (
            <div className="form-container">
              <h2>通过日志记录数据</h2>
              {/* 日志方式的表单将放在这里 */}
              <LogForm />
            </div>
          )}

          {activeTab === "transfer" && (
            <div className="form-container">
              <h2>通过转账附加数据</h2>
              {/* 转账方式的表单将放在这里 */}
              <TransferForm />
            </div>
          )}

          {activeTab === "token" && (
            <div className="form-container">
              <h2>通过 Token 交易记录</h2>
              {/* Token 方式的表单将放在这里 */}
              <TokenForm />
            </div>
          )}
        </div>

        {/* --- 数据展示区 --- */}
        <div className="data-list-container">
          <h2>链上数据记录</h2>
          {/* 从 The Graph 获取的数据列表将放在这里 */}
          <DataList />
        </div>
      </main>
    </div>
  );
}

export default App;
