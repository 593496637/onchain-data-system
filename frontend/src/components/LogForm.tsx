// src/components/LogForm.tsx
import { useState } from "react";
import { ethers } from "ethers";
// 引入我们准备好的 ABI
import DataStorageABI from "../abi/DataStorage.json";

// !!! 重要: 在下方填入你部署的合约地址 !!!
const contractAddress = "0x41dCf4E34eB2C231Cb03663D6e47ff271f621C4A";

export const LogForm = () => {
  // --- 表单状态 ---
  const [message, setMessage] = useState("");

  // --- 交易状态 ---
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      // 用户取消交易
      if (error.message.includes('rejected') || 
          error.message.includes('denied') || 
          error.message.includes('ACTION_REJECTED') ||
          error.message.includes('User denied')) {
        return "交易已取消";
      }
      
      // 余额不足
      if (error.message.includes('insufficient funds')) {
        return "余额不足，请确认账户有足够的ETH支付gas费用";
      }
      
      // 网络错误
      if (error.message.includes('network')) {
        return "网络连接异常，请检查网络状态";
      }
      
      // 合约执行错误
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
