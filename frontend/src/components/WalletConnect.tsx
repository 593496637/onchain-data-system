// src/components/WalletConnect.tsx
// ** Ethers v6 Syntax **
import { useState, useEffect, useMemo, useCallback } from "react";
import { ethers } from "ethers";

export const WalletConnect = () => {
  // --- 状态管理 ---
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- 计算派生状态 ---
  const formattedAddress = useMemo(() => {
    if (!userAddress) return "";
    return `${userAddress.substring(0, 6)}...${userAddress.substring(
      userAddress.length - 4
    )}`;
  }, [userAddress]);

  // --- 核心方法 ---
  // 使用 useCallback 避免在每次渲染时重新创建函数
  const updateWalletState = useCallback(async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        // v6: getSigner() 会在需要时触发连接
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();

        setUserAddress(address);
        setNetworkName(network.name);
        setErrorMessage(null);
      } catch (error: unknown) {
        // 如果用户拒绝连接，getSigner() 会抛出错误
        console.error("无法获取钱包状态:", error);
        // 如果用户断开所有连接，listAccounts 可能是更好的静默检查方式
        // 这里我们保持简单，断开时清除状态
        setUserAddress(null);
        setNetworkName(null);
      }
    }
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        // 这行代码会弹出 MetaMask 请求用户连接
        await provider.send("eth_requestAccounts", []);
        // 连接后更新状态
        await updateWalletState();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setErrorMessage(`连接失败: ${message}`);
      }
    } else {
      setErrorMessage("请安装 MetaMask 浏览器插件!");
    }
  };

  const disconnectWallet = () => {
    setUserAddress(null);
    setNetworkName(null);
  };

  // --- 副作用处理 (事件监听) ---
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // 用户断开了连接
          disconnectWallet();
        } else {
          // 切换了账户
          updateWalletState();
        }
      };

      const handleChainChanged = () => {
        // 网络切换后，重新加载页面是最安全的方式
        window.location.reload();
      };

      // 设置事件监听
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      // 初始加载时，静默检查是否已有账户连接
      const checkInitialConnection = async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            await updateWalletState();
          }
        } catch (error) {
          console.error("初始连接检查失败:", error);
        }
      };

      checkInitialConnection();

      // 返回一个清理函数，在组件卸载时移除监听器
      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [updateWalletState]);

  return (
    <div className="wallet-container">
      {!userAddress ? (
        <button onClick={connectWallet}>连接钱包</button>
      ) : (
        <div className="wallet-info">
          <p>
            <strong>网络:</strong> {networkName}
          </p>
          <p>
            <strong>地址:</strong> {formattedAddress}
          </p>
          <button onClick={disconnectWallet}>断开连接</button>
        </div>
      )}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
};
