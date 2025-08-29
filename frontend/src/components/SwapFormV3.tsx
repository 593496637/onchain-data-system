// src/components/SwapFormV3.tsx
// ** V4 - Fixed ABI for QuoterV2 and result handling **
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import SwapAndMemoV3ABI from "../abi/SwapAndMemoV3.json";

const swapContractAddress = "0x1f5423d29193b95Fd09233C2dfB3879C981a14a4";
const usdcContractAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const WETHAddress = "0x7b79995E5f793A07bC00C21412e50EaAE098e7F9";
const quoterAddress = "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3";

const quoterAbi = [
  {
    name: "quoteExactInputSingle",
    type: "function",
    stateMutability: "view",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "amountIn", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" },
      { name: "gasEstimate", type: "uint256" },
    ],
  },
];

export const SwapFormV3 = () => {
  const [ethAmount, setEthAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [quote, setQuote] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const getQuote = async () => {
      if (
        !ethAmount ||
        isNaN(Number(ethAmount)) ||
        Number(ethAmount) <= 0 ||
        !window.ethereum
      ) {
        setQuote("");
        return;
      }
      setIsQuoting(true);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const quoter = new ethers.Contract(quoterAddress, quoterAbi, provider);

        const amountIn = ethers.parseEther(ethAmount);
        const params = {
          tokenIn: WETHAddress,
          tokenOut: usdcContractAddress,
          fee: 3000,
          amountIn: amountIn,
          sqrtPriceLimitX96: 0,
        };

        const result = await quoter.quoteExactInputSingle.staticCall(params);
        const amountOutBigInt = result[0];
        const amountOut = ethers.formatUnits(amountOutBigInt, 6);
        setQuote(amountOut);
      } catch (err) {
        console.error("Failed to get quote:", err);
        setQuote("获取报价失败 (可能流动性不足)");
      }
      setIsQuoting(false);
    };

    const debounce = setTimeout(getQuote, 500);
    return () => clearTimeout(debounce);
  }, [ethAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !ethAmount ||
      !recipient ||
      !message ||
      !quote ||
      quote.includes("失败")
    ) {
      setErrorMessage("请填写所有字段并获取有效报价");
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
      const swapContract = new ethers.Contract(
        swapContractAddress,
        SwapAndMemoV3ABI.abi,
        signer
      );

      const amountOutMin = ethers.parseUnits(
        (parseFloat(quote) * 0.99).toFixed(6),
        6
      );
      const amountIn = ethers.parseEther(ethAmount);
      const fee = 3000;

      const tx = await swapContract.swapEthForTokenWithMemoV3(
        amountOutMin,
        usdcContractAddress,
        fee,
        recipient,
        message,
        { value: amountIn }
      );

      setTxHash(tx.hash);
      await tx.wait();
      setTxStatus("success");
      setEthAmount("");
      setRecipient("");
      setMessage("");
      setQuote("");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "交易失败");
      setTxStatus("error");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="eth-amount">支付金额 (ETH):</label>
          <input
            id="eth-amount"
            type="text"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            placeholder="0.01"
          />
          {isQuoting && <small>正在获取报价...</small>}
          {quote && (
            <small>大约收到: {parseFloat(quote).toFixed(4)} USDC</small>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="swap-recipient">收款人地址:</label>
          <input
            id="swap-recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
          />
        </div>
        <div className="form-group">
          <label htmlFor="swap-message">附言:</label>
          <input
            id="swap-message"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Swap and Memo via V3"
          />
        </div>
        <button type="submit" disabled={txStatus === "pending" || isQuoting}>
          {isQuoting
            ? "等待报价..."
            : txStatus === "pending"
            ? "正在处理..."
            : "兑换并记录"}
        </button>
      </form>
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
          <p>兑换成功！</p>
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
          <p>兑换失败。</p>
          <p>错误: {errorMessage}</p>
        </div>
      )}
    </div>
  );
};
