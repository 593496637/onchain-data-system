/**
 * 合约转账组件
 *
 * 这是一个通过智能合约进行转账的组件，提供以下功能：
 * 1. 通过TransferWithMessage合约发送ETH
 * 2. 自动记录转账事件和附言信息到区块链
 * 3. 结构化的数据存储便于查询
 * 4. 完整的交易状态管理和用户反馈
 *
 * 技术特性：
 * - 使用专门的转账合约
 * - 通过合约事件记录结构化数据
 * - 支持复杂的附言信息存储
 * - 便于The Graph等工具进行数据索引
 *
 * 与直接转账的区别：
 * - 通过合约函数而非直接转账
 * - 事件数据结构化，便于查询
 * - 支持更复杂的业务逻辑
 * - 额外的gas成本但功能更强大
 */

import { useState } from "react";
import { ethers } from "ethers";
import TRANSFER_CONTRACT_ABI from "../abi/TransferWithMessage.json";

// TransferWithMessage智能合约部署地址（Sepolia测试网）
// 此合约专门处理带附言信息的ETH转账功能
const TRANSFER_CONTRACT_ADDRESS = "0x6645582223c6334c60c7b89F1D13cd5Bfb2Ae00e";

export const ContractTransferForm = () => {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      if (
        error.message.includes("rejected") ||
        error.message.includes("denied") ||
        error.message.includes("ACTION_REJECTED") ||
        error.message.includes("User denied")
      ) {
        return "交易已取消";
      }

      if (error.message.includes("insufficient funds")) {
        return "余额不足，请确认账户有足够的ETH支付gas费用";
      }

      if (error.message.includes("network")) {
        return "网络连接异常，请检查网络状态";
      }

      if (error.message.includes("execution reverted")) {
        return "合约执行失败，请检查交易参数";
      }

      return error.message;
    }
    return String(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!TRANSFER_CONTRACT_ADDRESS) {
      setErrorMessage("转账合约尚未部署，请等待合约部署完成");
      return;
    }

    if (!to || !amount) {
      setErrorMessage("接收地址和金额不能为空");
      return;
    }

    if (!window.ethereum) {
      setErrorMessage("请安装 MetaMask!");
      return;
    }

    try {
      setErrorMessage("");
      setTxStatus("pending");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        TRANSFER_CONTRACT_ADDRESS,
        TRANSFER_CONTRACT_ABI,
        signer
      );

      const txData = {
        value: ethers.parseEther(amount),
      };

      console.log("正在通过合约发送转账...", { to, amount, message });
      const tx = await contract.transferWithMessage(to, message || "", txData);

      setTxHash(tx.hash);
      console.log("交易已发送, 哈希:", tx.hash);

      await tx.wait();

      console.log("交易已确认!");
      setTxStatus("success");
      setTo("");
      setAmount("");
      setMessage("");
    } catch (error) {
      console.error("合约转账失败:", error);
      setErrorMessage(getErrorMessage(error));
      setTxStatus("error");
    }
  };

  return (
    <div className="form-container">
      <div className="contract-info">
        <h3>合约转账说明</h3>
        <p>
          通过智能合约进行转账，所有转账信息和附言内容将被永久记录在区块链上，便于后续查询。
        </p>
        {!TRANSFER_CONTRACT_ADDRESS && (
          <div className="contract-status">
            <strong>注意：转账合约尚未部署</strong>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="contract-to">接收地址:</label>
          <input
            id="contract-to"
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x..."
            disabled={txStatus === "pending"}
          />
        </div>

        <div className="form-group">
          <label htmlFor="contract-amount">金额 (ETH):</label>
          <input
            id="contract-amount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.01"
            disabled={txStatus === "pending"}
          />
        </div>

        <div className="form-group">
          <label htmlFor="contract-message">附言信息:</label>
          <textarea
            id="contract-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入转账附言信息（可选）"
            disabled={txStatus === "pending"}
            rows={3}
          />
          <small>
            附言信息将永久记录在区块链上，可通过 The Graph 查询历史记录
          </small>
        </div>

        <button
          type="submit"
          disabled={txStatus === "pending" || !TRANSFER_CONTRACT_ADDRESS}
        >
          {txStatus === "pending" ? "正在发送..." : "通过合约转账"}
        </button>
      </form>

      {txStatus === "pending" && (
        <div className="feedback">
          <p>交易发送中... 请在钱包中确认。</p>
          {txHash && (
            <p>
              交易哈希:
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
          <p>合约转账成功！</p>
          <p>
            交易哈希:
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
          <p>合约转账失败。</p>
          <p>错误: {errorMessage}</p>
        </div>
      )}
    </div>
  );
};
