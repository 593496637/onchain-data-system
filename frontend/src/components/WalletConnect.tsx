/**
 * 钱包连接组件
 * 
 * 这是一个完整的Web3钱包连接和管理组件，提供以下功能：
 * 1. 钱包连接/断开连接
 * 2. 多链网络支持和切换
 * 3. ENS域名解析和头像显示
 * 4. 钱包地址显示和复制
 * 5. 响应式UI和移动端适配
 * 
 * 技术特性：
 * - 支持MetaMask等以太坊钱包
 * - 自动检测网络变化
 * - ENS域名和头像解析
 * - 用户友好的错误处理
 * - 模态窗口和交互设计
 * 
 * 版本: V11 - 包含弹性ENS查找功能的最终完整版本
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { ethers } from "ethers";

/**
 * 支持的区块链网络配置
 * 
 * 包含应用支持的所有区块链网络信息：
 * - chainId: 网络链ID（十进制）
 * - hexChainId: 网络链ID（十六进制格式，用于钱包API）
 * - name: 网络显示名称
 * - rpcUrl: RPC节点地址
 * - currency: 网络原生代币符号
 */
const supportedChains = [
  {
    chainId: 11155111,
    hexChainId: "0xaa36a7",
    name: "Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    currency: "ETH",
  },
  {
    chainId: 1,
    hexChainId: "0x1",
    name: "Ethereum",
    rpcUrl: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    currency: "ETH",
  },
  {
    chainId: 137,
    hexChainId: "0x89",
    name: "Polygon",
    rpcUrl: "https://polygon-rpc.com",
    currency: "MATIC",
  },
  {
    chainId: 42161,
    hexChainId: "0xa4b1",
    name: "Arbitrum One",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    currency: "ETH",
  },
];

/**
 * 错误信息提取函数
 * 
 * 从各种类型的错误对象中提取可读的错误信息
 * 处理Error对象、字符串错误和具有message属性的对象
 * 
 * @param error - 未知类型的错误对象
 * @returns 格式化的错误信息字符串
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  return "An unknown error occurred.";
};

/**
 * 生成基于钱包地址的默认头像
 * 
 * 当用户没有设置ENS头像时，基于钱包地址生成一个确定性的渐变色头像
 * 算法特点：
 * - 使用地址前2个字符作为头像文本
 * - 基于地址哈希生成确定性的渐变色
 * - 相同地址总是生成相同的头像
 * 
 * @param address - 钱包地址（如：0x1234...）
 * @returns 包含显示文本和背景渐变的头像配置对象
 */
const generateDefaultAvatar = (address: string) => {
  // 提取地址前2个字符作为显示文本（跳过0x前缀）
  const displayText = address.slice(2, 4).toUpperCase();
  
  // 基于地址生成确定性的颜色哈希
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // 生成两个不同的色相值用于渐变效果
  const hue1 = Math.abs(hash % 360);
  const hue2 = Math.abs((hash * 2) % 360);
  
  return {
    text: displayText,
    background: `linear-gradient(135deg, hsl(${hue1}, 70%, 60%) 0%, hsl(${hue2}, 65%, 55%) 100%)`,
  };
};

/**
 * 钱包连接主组件
 * 
 * 管理Web3钱包的连接状态、网络信息和用户交互
 * 提供完整的钱包连接、断开、网络切换等功能
 * 
 * @returns React组件 - 钱包连接UI
 */
export const WalletConnect = () => {
  // === 钱包连接状态管理 ===
  const [userAddress, setUserAddress] = useState<string | null>(null); // 用户钱包地址
  
  // 当前连接的网络信息
  const [network, setNetwork] = useState<{
    chainId: number;
    name: string;
  } | null>(null);
  
  const [isUnsupportedNetwork, setIsUnsupportedNetwork] = useState(false); // 是否为不支持的网络
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // 错误信息
  
  // === ENS相关状态 ===
  const [ensName, setEnsName] = useState<string | null>(null); // ENS域名
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // ENS头像URL
  
  // === UI交互状态 ===
  const [copySuccess, setCopySuccess] = useState(false); // 地址复制成功状态
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false); // 账户模态窗口状态
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false); // 网络切换模态窗口状态

  // === DOM引用（用于点击外部关闭模态窗口） ===
  const accountModalRef = useRef<HTMLDivElement>(null);
  const networkModalRef = useRef<HTMLDivElement>(null);

  // === 计算属性：格式化的钱包地址显示 ===
  // 使用useMemo优化性能，将完整地址格式化为省略形式（如：0x1234...abcd）
  const formattedAddress = useMemo(() => {
    if (!userAddress) return "";
    return `${userAddress.substring(0, 6)}...${userAddress.substring(
      userAddress.length - 4
    )}`;
  }, [userAddress]);

  /**
   * 更新钱包连接状态
   * 
   * 核心功能函数，负责：
   * 1. 检查当前连接的钱包账户
   * 2. 获取网络信息并验证是否支持
   * 3. 尝试解析ENS域名和头像（仅在以太坊主网和Sepolia）
   * 4. 更新所有相关状态
   * 
   * 错误处理：ENS解析失败不会影响主要功能
   */
  const updateState = async () => {
    // 检查浏览器是否安装了以太坊钱包（如MetaMask）
    // window.ethereum 是钱包注入到浏览器的全局对象
    if (!window.ethereum) return;
    
    try {
      // 创建ethers.js的浏览器Provider
      // BrowserProvider 是连接前端应用和钱包的桥梁，用于发送RPC请求
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // 获取当前已连接的钱包账户列表
      // eth_accounts 是标准的以太坊RPC方法，返回用户授权的地址数组
      const accounts = await provider.send("eth_accounts", []);

      // 检查是否有已连接的钱包账户
      if (accounts.length > 0) {
        // 取第一个账户作为当前活跃地址（钱包通常返回多个地址，第一个是主要地址）
        const address = accounts[0];
        
        // 获取当前连接的区块链网络信息
        // getNetwork() 返回包含chainId、name等网络详细信息的对象
        const network = await provider.getNetwork();
        
        // 将BigInt类型的chainId转换为普通数字，便于后续比较和处理
        const chainId = Number(network.chainId);

        // 更新React状态：保存用户地址和网络信息
        setUserAddress(address);
        setNetwork({ chainId, name: network.name });

        // 检查当前连接的网络是否在应用支持的网络列表中
        // supportedChains 数组包含了所有应用支持的区块链网络配置
        // some() 方法检查是否存在至少一个匹配的chainId
        const isSupported = supportedChains.some(
          (chain) => chain.chainId === chainId
        );
        // 更新不支持网络的标记状态（取反：支持=false，不支持=true）
        setIsUnsupportedNetwork(!isSupported);

        // === ENS（以太坊域名服务）解析逻辑 ===
        // ENS只在以太坊主网(chainId=1)和Sepolia测试网(chainId=11155111)上可用
        try {
          if (chainId === 1 || chainId === 11155111) {
            // 反向DNS查找：通过钱包地址查找对应的ENS域名
            // 例如：0x1234... -> alice.eth
            const fetchedEnsName = await provider.lookupAddress(address);
            setEnsName(fetchedEnsName);
            
            if (fetchedEnsName) {
              // 如果找到ENS域名，尝试获取设置的头像
              // ENS支持设置头像记录，可以是IPFS哈希、HTTP URL等
              const fetchedAvatarUrl = await provider.getAvatar(fetchedEnsName);
              setAvatarUrl(fetchedAvatarUrl);
            } else {
              // 地址没有对应的ENS域名，清空头像
              setAvatarUrl(null);
            }
          } else {
            // 当前网络不支持ENS（如Polygon、Arbitrum等），清空ENS相关数据
            setEnsName(null);
            setAvatarUrl(null);
          }
        } catch (ensError) {
          // ENS解析失败是正常现象，不应阻止主要功能
          // 常见失败原因：网络问题、ENS服务不可用、地址未注册ENS等
          console.warn(
            "Could not fetch ENS details (this is expected on non-mainnet chains):",
            ensError
          );
          setEnsName(null);
          setAvatarUrl(null);
        }
      } else {
        // === 无连接账户的情况处理 ===
        // 当钱包未连接或用户断开连接时，eth_accounts返回空数组
        // 此时需要重置所有与钱包相关的状态到初始值
        setUserAddress(null);         // 清空用户地址
        setNetwork(null);             // 清空网络信息
        setIsUnsupportedNetwork(false); // 重置网络支持状态
        setEnsName(null);             // 清空ENS域名
        setAvatarUrl(null);           // 清空ENS头像
      }
    } catch (err) {
      // === 全局错误处理 ===
      // 捕获所有可能的错误：网络请求失败、RPC调用错误、解析异常等
      console.error("Error updating state:", getErrorMessage(err));
      
      // 发生任何错误时都重置状态，确保UI显示的是安全的默认状态
      // 这样可以避免显示过时或错误的钱包信息
      setUserAddress(null);
      setNetwork(null);
      setIsUnsupportedNetwork(false);
      setEnsName(null);
      setAvatarUrl(null);
    }
  };

  /**
   * 连接用户钱包
   * 
   * 执行钱包连接流程：
   * 1. 检查是否安装了MetaMask或其他以太坊钱包
   * 2. 请求用户授权访问钱包账户
   * 3. 成功连接后更新所有相关状态（地址、网络、ENS等）
   * 4. 处理连接过程中的各种错误情况
   * 
   * 错误处理：
   * - 未安装钱包：提示用户安装MetaMask
   * - 用户拒绝连接：显示连接失败错误
   * - 网络问题：显示网络相关错误
   */
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // 请求用户授权访问钱包账户
        await window.ethereum.request({ method: "eth_requestAccounts" });
        // 连接成功后更新钱包状态和网络信息
        await updateState();
      } catch (error) {
        setErrorMessage(`连接失败: ${getErrorMessage(error)}`);
      }
    } else {
      setErrorMessage("请安装 MetaMask 浏览器插件!");
    }
  };

  /**
   * 处理网络切换操作
   * 
   * 智能网络切换逻辑：
   * 1. 首先尝试切换到目标网络
   * 2. 如果网络不存在（错误代码4902），自动添加网络配置
   * 3. 成功后关闭网络选择模态窗口
   * 
   * 支持的操作：
   * - 切换到已存在的网络
   * - 自动添加并切换到新网络
   * - 完整的错误处理和用户反馈
   * 
   * @param chain - 目标网络配置对象，包含chainId、名称、RPC等信息
   */
  const handleSwitchNetwork = async (chain: (typeof supportedChains)[0]) => {
    if (!window.ethereum) return;
    try {
      // 尝试切换到目标网络
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chain.hexChainId }],
      });
      setIsNetworkModalOpen(false);
    } catch (switchError: unknown) {
      // 错误代码4902表示网络未添加到钱包中
      if ((switchError as { code?: number })?.code === 4902) {
        try {
          // 自动添加网络配置到钱包
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chain.hexChainId,
                chainName: chain.name,
                rpcUrls: [chain.rpcUrl],
                nativeCurrency: {
                  name: chain.currency,
                  symbol: chain.currency,
                  decimals: 18,
                },
              },
            ],
          });
          setIsNetworkModalOpen(false);
        } catch (addError) {
          console.error("添加新网络失败:", getErrorMessage(addError));
          setErrorMessage("添加新网络失败");
        }
      } else {
        setErrorMessage("切换网络失败");
      }
    }
  };

  /**
   * 复制钱包地址到剪贴板
   * 
   * 功能特性：
   * 1. 将完整的钱包地址复制到系统剪贴板
   * 2. 显示2秒的成功反馈（"已复制!" 状态）
   * 3. 自动重置按钮文本到默认状态
   * 
   * 用户体验：
   * - 即时反馈：按钮文本立即变为"已复制!"
   * - 自动恢复：2秒后自动恢复为"复制地址"
   * - 防护检查：仅在有有效地址时执行复制操作
   */
  const handleCopyAddress = () => {
    if (userAddress) {
      // 使用现代剪贴板API复制完整地址
      navigator.clipboard.writeText(userAddress);
      // 设置成功状态以显示用户反馈
      setCopySuccess(true);
      // 2秒后自动重置按钮状态
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  /**
   * 断开钱包连接
   * 
   * 执行完整的断开连接流程：
   * 1. 清除所有钱包相关状态（地址、网络信息）
   * 2. 重置ENS域名和头像数据
   * 3. 清除网络支持状态标记
   * 4. 关闭当前打开的账户模态窗口
   * 
   * 注意：这是前端状态重置，不会主动断开钱包本身的连接
   * 用户需要在钱包插件中手动管理站点连接权限
   */
  const handleDisconnect = () => {
    // 重置所有钱包相关状态
    setUserAddress(null);
    setNetwork(null);
    setIsUnsupportedNetwork(false);
    setEnsName(null);
    setAvatarUrl(null);
    // 关闭账户模态窗口
    setIsAccountModalOpen(false);
  };

  /**
   * 组件初始化和事件监听器设置
   * 
   * 执行以下初始化操作：
   * 1. 检测并响应网络切换事件
   * 2. 自动加载已连接的钱包状态
   * 3. 设置模态窗口的点击外部关闭功能
   * 4. 组件卸载时清理所有事件监听器
   * 
   * 事件监听器：
   * - chainChanged: 当用户在钱包中切换网络时自动更新状态
   * - mousedown: 检测模态窗口外部点击以自动关闭窗口
   */
  useEffect(() => {
    if (!window.ethereum) return;

    // 设置网络切换事件监听器
    const handleChainChanged = () => updateState();
    window.ethereum.on("chainChanged", handleChainChanged);
    
    // 组件加载时检查已连接的钱包状态
    updateState();

    // 设置模态窗口外部点击关闭功能
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击是否在账户模态窗口外部
      if (
        accountModalRef.current &&
        !accountModalRef.current.contains(event.target as Node)
      ) {
        setIsAccountModalOpen(false);
      }
      // 检查点击是否在网络选择模态窗口外部
      if (
        networkModalRef.current &&
        !networkModalRef.current.contains(event.target as Node)
      ) {
        setIsNetworkModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // 清理函数：组件卸载时移除所有事件监听器
    return () => {
      window.ethereum.removeListener("chainChanged", handleChainChanged);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // === 主要UI渲染逻辑 ===
  return (
    <div className="wallet-container-v2">
      {/* 钱包连接状态判断：未连接 -> 连接按钮 */}
      {!userAddress ? (
        <button onClick={connectWallet} className="connect-button">
          连接钱包
        </button>
      ) : isUnsupportedNetwork ? (
        /* 已连接但网络不支持 -> 网络错误提示 */
        <button
          onClick={() => setIsNetworkModalOpen(true)}
          className="wrong-network-button-large"
        >
          网络错误
        </button>
      ) : (
        /* 已连接且网络支持 -> 显示完整的钱包信息 */
        <div className="profile-container">
          {/* 网络信息显示按钮 */}
          {network && (
            <button
              onClick={() => setIsNetworkModalOpen(true)}
              className="network-button"
            >
              {network.name === "unknown"
                ? `Chain ID: ${network.chainId}`
                : network.name}
            </button>
          )}
          {/* 用户账户信息按钮 */}
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="profile-button"
          >
            {/* 头像显示优先级：ENS头像 > 生成头像 > 占位符 */}
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="avatar" />
            ) : userAddress ? (
              <div 
                className="avatar-placeholder" 
                style={{ background: generateDefaultAvatar(userAddress).background }}
              >
                {generateDefaultAvatar(userAddress).text}
              </div>
            ) : (
              <div className="avatar-placeholder" />
            )}
            {/* 显示优先级：ENS域名 > 格式化地址 */}
            <span>{ensName || formattedAddress}</span>
          </button>
        </div>
      )}

      {/* 账户详情模态窗口 - 使用Portal渲染到body */}
      {isAccountModalOpen && userAddress && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" ref={accountModalRef}>
            {/* 模态窗口关闭按钮 */}
            <button
              onClick={() => setIsAccountModalOpen(false)}
              className="close-button"
            >
              &times;
            </button>
            {/* 用户信息展示区域 */}
            <div className="modal-header">
              {/* 头像显示（同主界面逻辑） */}
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="modal-avatar" />
              ) : userAddress ? (
                <div 
                  className="modal-avatar-placeholder" 
                  style={{ background: generateDefaultAvatar(userAddress).background }}
                >
                  {generateDefaultAvatar(userAddress).text}
                </div>
              ) : (
                <div className="modal-avatar-placeholder" />
              )}
              {/* 主要身份显示：ENS域名或格式化地址 */}
              <span className="modal-ens">{ensName || formattedAddress}</span>
              {/* 如果有ENS域名，同时显示原始地址 */}
              {ensName && (
                <span className="modal-address">{formattedAddress}</span>
              )}
            </div>
            {/* 操作按钮区域 */}
            <div className="modal-actions">
              <button onClick={handleCopyAddress} className="action-button">
                {copySuccess ? "已复制!" : "复制地址"}
              </button>
              <button
                onClick={handleDisconnect}
                className="action-button disconnect"
              >
                断开连接
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 网络选择模态窗口 - 使用Portal渲染到body */}
      {isNetworkModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" ref={networkModalRef}>
            {/* 模态窗口关闭按钮 */}
            <button
              onClick={() => setIsNetworkModalOpen(false)}
              className="close-button"
            >
              &times;
            </button>
            {/* 模态窗口标题 */}
            <h3 className="modal-title">切换网络</h3>
            {/* 支持的网络列表 */}
            <div className="network-list">
              {supportedChains.map((chain) => (
                <button
                  key={chain.chainId}
                  className={`network-item ${
                    network?.chainId === chain.chainId ? "active" : ""
                  }`}
                  onClick={() => handleSwitchNetwork(chain)}
                >
                  {/* 网络名称 */}
                  {chain.name}
                  {/* 当前连接网络的指示器 */}
                  {network?.chainId === chain.chainId && (
                    <span className="connected-indicator"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 错误信息显示区域 */}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
};
