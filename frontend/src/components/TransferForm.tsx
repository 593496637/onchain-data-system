/**
 * ETH转账记录组件
 * 
 * 这是一个以太坊直接转账组件，提供以下功能：
 * 1. 直接发送ETH到指定地址
 * 2. 通过交易data字段附加信息记录
 * 3. 完整的交易状态管理和用户反馈
 * 4. 与区块链浏览器的集成链接
 * 
 * 技术特性：
 * - 使用以太坊原生转账功能
 * - 支持UTF-8编码的附加数据
 * - 智能的错误处理和用户提示
 * - 自动表单重置和状态管理
 * 
 * 与合约转账的区别：
 * - 直接使用钱包的sendTransaction方法
 * - 通过data字段而非合约事件记录信息
 * - 更简单直接，但查询相对复杂
 */

import { useState } from 'react';
import { ethers } from 'ethers';

export const TransferForm = () => {
  // --- 表单状态 ---
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  // --- 交易状态 ---
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
    if (!to || !amount) {
      setErrorMessage('接收地址和金额不能为空');
      return;
    }

    if (!window.ethereum) {
      setErrorMessage("请安装 MetaMask!");
      return;
    }

    try {
      setErrorMessage('');
      setTxStatus('pending');

      // 1. 初始化 Provider 和 Signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 2. 准备交易数据
      const txData = {
        to: to,
        // ethers.parseEther 将 '0.01' ETH 这样的字符串转为以 Wei 为单位的 BigInt
        value: ethers.parseEther(amount),
        // 这是关键一步: 将留言字符串转换为 UTF-8 字节，然后得到十六进制表示
        data: ethers.hexlify(ethers.toUtf8Bytes(message))
      };

      // 3. 发送交易
      console.log('正在发送转账...', txData);
      const tx = await signer.sendTransaction(txData);

      setTxHash(tx.hash);
      console.log('交易已发送, 哈希:', tx.hash);

      // 4. 等待交易确认
      await tx.wait();

      // 5. 更新状态
      console.log('交易已确认!');
      setTxStatus('success');
      // 清空表单
      setTo('');
      setAmount('');
      setMessage('');

    } catch (error) {
      console.error('交易失败:', error);
      setErrorMessage(getErrorMessage(error));
      setTxStatus('error');
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="to">接收地址:</label>
          <input id="to" type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x..." disabled={txStatus === 'pending'} />
        </div>
        <div className="form-group">
          <label htmlFor="amount">金额 (ETH):</label>
          <input id="amount" type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.01" disabled={txStatus === 'pending'} />
        </div>
        <div className="form-group">
          <label htmlFor="transfer-message">留言 (可选):</label>
          <input id="transfer-message" type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Transaction message" disabled={txStatus === 'pending'} />
        </div>
        <button type="submit" disabled={txStatus === 'pending'}>
          {txStatus === 'pending' ? '正在发送...' : '发送转账'}
        </button>
      </form>

      {/* --- 交易反馈 --- */}
      {txStatus === 'pending' && (
        <div className="feedback">
          <p>交易发送中... 请在钱包中确认。</p>
          {txHash && <p>交易哈希: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash}</a></p>}
        </div>
      )}
      {txStatus === 'success' && (
        <div className="feedback success">
          <p>转账成功！</p>
          <p>交易哈希: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash}</a></p>
        </div>
      )}
      {txStatus === 'error' && (
        <div className="feedback error">
          <p>转账失败。</p>
          <p>错误: {errorMessage}</p>
        </div>
      )}
    </div>
  );
};