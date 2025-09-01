import { useState } from 'react';
import { ethers } from 'ethers';

const TRANSFER_CONTRACT_ADDRESS = '0x6645582223c6334c60c7b89F1D13cd5Bfb2Ae00e'; // Will be updated after contract deployment

const TRANSFER_CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "message",
        "type": "string"
      }
    ],
    "name": "transferWithMessage",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "transferId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "message",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "TransferExecuted",
    "type": "event"
  }
];

export const ContractTransferForm = () => {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      if (error.message.includes('rejected') || 
          error.message.includes('denied') || 
          error.message.includes('ACTION_REJECTED') ||
          error.message.includes('User denied')) {
        return "交易已取消";
      }
      
      if (error.message.includes('insufficient funds')) {
        return "余额不足，请确认账户有足够的ETH支付gas费用";
      }
      
      if (error.message.includes('network')) {
        return "网络连接异常，请检查网络状态";
      }
      
      if (error.message.includes('execution reverted')) {
        return "合约执行失败，请检查交易参数";
      }
      
      return error.message;
    }
    return String(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!TRANSFER_CONTRACT_ADDRESS) {
      setErrorMessage('转账合约尚未部署，请等待合约部署完成');
      return;
    }
    
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

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        TRANSFER_CONTRACT_ADDRESS,
        TRANSFER_CONTRACT_ABI,
        signer
      );

      const txData = {
        value: ethers.parseEther(amount)
      };

      console.log('正在通过合约发送转账...', { to, amount, message });
      const tx = await contract.transferWithMessage(to, message || "", txData);

      setTxHash(tx.hash);
      console.log('交易已发送, 哈希:', tx.hash);

      await tx.wait();

      console.log('交易已确认!');
      setTxStatus('success');
      setTo('');
      setAmount('');
      setMessage('');

    } catch (error) {
      console.error('合约转账失败:', error);
      setErrorMessage(getErrorMessage(error));
      setTxStatus('error');
    }
  };

  return (
    <div className="form-container">
      <div className="contract-info">
        <h3>合约转账说明</h3>
        <p>通过智能合约进行转账，所有转账记录和附言信息将被永久记录在区块链上，便于后续查询。</p>
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
            disabled={txStatus === 'pending'} 
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
            disabled={txStatus === 'pending'} 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="contract-message">附言信息:</label>
          <textarea 
            id="contract-message" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            placeholder="输入转账附言信息（可选）" 
            disabled={txStatus === 'pending'}
            rows={3}
          />
          <small>附言信息将永久记录在区块链上，可通过 The Graph 查询历史记录</small>
        </div>
        
        <button 
          type="submit" 
          disabled={txStatus === 'pending' || !TRANSFER_CONTRACT_ADDRESS}
        >
          {txStatus === 'pending' ? '正在发送...' : '通过合约转账'}
        </button>
      </form>

      {txStatus === 'pending' && (
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
      
      {txStatus === 'success' && (
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
      
      {txStatus === 'error' && (
        <div className="feedback error">
          <p>合约转账失败。</p>
          <p>错误: {errorMessage}</p>
        </div>
      )}
    </div>
  );
};