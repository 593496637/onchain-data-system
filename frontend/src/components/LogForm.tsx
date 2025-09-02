/**
 * 事件日志记录组件
 * 
 * 这是一个智能合约交互组件，提供以下功能：
 * 1. 通过智能合约事件将数据永久记录到区块链
 * 2. 用户友好的表单界面和交互体验
 * 3. 完整的交易状态管理和错误处理
 * 4. 与区块链浏览器的集成链接
 * 
 * 技术特性：
 * - 使用ethers.js与智能合约交互
 * - 支持交易状态跟踪（pending/success/error）
 * - 智能错误信息解析和用户提示
 * - 自动表单重置和状态管理
 * 
 * 智能合约功能：调用DataStorage合约的writeData函数记录事件
 */

import { useState } from "react";
import { ethers } from "ethers";
// 引入DataStorage智能合约的ABI定义
import DataStorageABI from "../abi/DataStorage.json";

// DataStorage智能合约部署地址（Sepolia测试网）
// 此合约负责接收和记录用户提交的数据事件
const contractAddress = "0x7fEf2BDcc4fbE58BcEFf13f97dE5646B690bcCf2";

/**
 * 事件日志表单主组件
 * 
 * 管理用户输入、智能合约交互和交易状态
 * 提供完整的数据上链功能和用户反馈
 * 
 * @returns React组件 - 事件日志记录表单界面
 */
export const LogForm = () => {
  // === 表单数据状态 ===
  const [message, setMessage] = useState(""); // 用户输入的日志消息内容

  // === 交易状态管理 ===
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle"); // 交易当前状态：闲置/进行中/成功/失败
  const [txHash, setTxHash] = useState(""); // 交易哈希值
  const [errorMessage, setErrorMessage] = useState(""); // 错误信息

  /**
   * 错误信息解析函数
   * 
   * 将各种Web3交易错误转换为用户友好的中文提示
   * 涵盖常见的钱包和区块链交互错误场景
   * 
   * @param error - 未知类型的错误对象
   * @returns 格式化的用户友好错误信息
   */
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      // 用户主动取消交易
      if (error.message.includes('rejected') || 
          error.message.includes('denied') || 
          error.message.includes('ACTION_REJECTED') ||
          error.message.includes('User denied')) {
        return "交易已取消";
      }
      
      // 账户余额不足以支付gas费
      if (error.message.includes('insufficient funds')) {
        return "余额不足，请确认账户有足够的ETH支付gas费用";
      }
      
      // 网络连接问题
      if (error.message.includes('network')) {
        return "网络连接异常，请检查网络状态";
      }
      
      // 智能合约执行失败
      if (error.message.includes('execution reverted')) {
        return "合约执行失败，请检查交易参数";
      }
      
      return error.message;
    }
    return String(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) {
      setErrorMessage("消息不能为空");
      return;
    }

    // 检查 MetaMask 是否安装
    if (!window.ethereum) {
      setErrorMessage("请安装 MetaMask!");
      return;
    }

    try {
      // 重置状态并设置为等待中
      setErrorMessage("");
      setTxStatus("pending");

      // 1. 初始化 Provider 和 Signer (ethers v6)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 2. 创建合约实例
      const contract = new ethers.Contract(
        contractAddress,
        DataStorageABI,
        signer
      );

      // 3. 调用合约的 writeData 函数
      console.log(`正在发送消息: "${message}"`);
      const tx = await contract.writeData(message);

      setTxHash(tx.hash);
      console.log("交易已发送, 哈希:", tx.hash);

      // 4. 等待交易被矿工打包确认
      await tx.wait();

      // 5. 更新状态为成功
      console.log("交易已确认!");
      setTxStatus("success");
      setMessage(""); // 清空输入框
    } catch (error) {
      console.error("交易失败:", error);
      setErrorMessage(getErrorMessage(error));
      setTxStatus("error");
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="message">输入要上链的日志消息:</label>
          <input
            id="message"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hello, Blockchain!"
            disabled={txStatus === "pending"}
          />
        </div>
        <button type="submit" disabled={txStatus === "pending"}>
          {txStatus === "pending" ? "正在写入..." : "写入日志"}
        </button>
      </form>

      {/* --- 交易反馈 --- */}
      {txStatus === "pending" && (
        <div className="feedback">
          <p>交易发送中... 请在钱包中确认。</p>
          {txHash && (
            <p>
              交易哈希:{" "}
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {txHash}
              </a>
            </p>
          )}
        </div>
      )}
      {txStatus === "success" && (
        <div className="feedback success">
          <p>写入成功！</p>
          <p>
            交易哈希:{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {txHash}
            </a>
          </p>
        </div>
      )}
      {txStatus === "error" && (
        <div className="feedback error">
          <p>写入失败。</p>
          <p>错误: {errorMessage}</p>
        </div>
      )}
    </div>
  );
};
