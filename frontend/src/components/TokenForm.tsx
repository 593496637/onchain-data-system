// src/components/TokenForm.tsx
import { useState } from "react";
import { ethers } from "ethers";

// Sepolia 测试网上的 USDC 合约地址
const usdcContractAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

// 我们只需要 transfer 函数的 ABI 定义
const erc20Abi = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
];

export const TokenForm = () => {
  // --- 表单状态 ---
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

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
      
      // 代币余额不足
      if (error.message.includes('transfer amount exceeds balance')) {
        return "代币余额不足，请检查您的USDC余额";
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

      // 1. 创建 USDC 合约的实例
      const usdcContract = new ethers.Contract(
        usdcContractAddress,
        erc20Abi,
        signer
      );

      // 2. 处理代币精度 (这是关键！)
      // USDC 和 USDT 通常有 6 位小数，而 ETH 有 18 位。
      // ethers.parseUnits 会将 "10" 这样的字符串和精度 6 转换为 10000000 (10 * 10^6)
      const amountInSmallestUnit = ethers.parseUnits(amount, 6);

      // 3. 调用合约的 transfer 函数
      console.log(`正在发送 ${amount} USDC 到 ${to}...`);
      const tx = await usdcContract.transfer(to, amountInSmallestUnit);

      setTxHash(tx.hash);
      console.log("交易已发送, 哈希:", tx.hash);

      // 4. 等待交易确认
      await tx.wait();

      // 5. 更新状态
      console.log("交易已确认!");
      setTxStatus("success");
      setTo("");
      setAmount("");
    } catch (error) {
      console.error("交易失败:", error);
      setErrorMessage(getErrorMessage(error));
      setTxStatus("error");
    }
  };

  return (
    <div className="form-container">
      <div className="info-box">
        <p>
          <strong>提示:</strong> 你需要先获取一些 Sepolia 测试网的 USDC
          才能发送。
        </p>
        <p>
          请访问{" "}
          <a
            href="https://faucet.circle.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Circle USDC Faucet
          </a>
          ，连接钱包并选择 "Ethereum Sepolia" 来领取。
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="token-to">接收地址:</label>
          <input
            id="token-to"
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x..."
            disabled={txStatus === "pending"}
          />
        </div>
        <div className="form-group">
          <label htmlFor="token-amount">金额 (USDC):</label>
          <input
            id="token-amount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10.0"
            disabled={txStatus === "pending"}
          />
        </div>
        <button type="submit" disabled={txStatus === "pending"}>
          {txStatus === "pending" ? "正在发送..." : "发送 USDC"}
        </button>
      </form>

      {/* --- 交易反馈 --- */}
      {txStatus === "pending" && (
        <div className="feedback">
          <p>交易发送中...</p>
          {txHash && (
            <p>
              哈希:{" "}
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
          <p>发送成功！</p>
          <p>
            哈希:{" "}
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
          <p>发送失败。</p>
          <p>错误: {errorMessage}</p>
        </div>
      )}
    </div>
  );
};
