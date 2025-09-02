# 合约部署说明

由于 Node.js v22.15.0 与当前 Truffle 版本存在兼容性问题，建议使用以下方法之一部署合约：

## 方法 1: 使用 Remix IDE （推荐）

1. 访问 [Remix IDE](https://remix.ethereum.org/)
2. 创建新文件并复制以下合约代码：
   - `DataStorage.sol` 
   - `TransferWithMessage.sol`
3. 编译合约（Solidity 版本选择 0.8.21）
4. 连接 MetaMask 到 Sepolia 测试网
5. 部署合约

## 方法 2: 降级 Node.js 版本

```bash
# 安装 Node.js v18.x
fnm install 18.17.0
fnm use 18.17.0

# 重新尝试部署
truffle migrate --network sepolia --reset
```

## 方法 3: 使用 Hardhat

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
# 然后配置 Hardhat 进行部署
```

## 部署后需要更新的文件

合约部署成功后，请更新以下文件中的合约地址：

1. **前端配置** (`frontend/src/components/ContractTransferForm.tsx`):
   ```typescript
   const TRANSFER_CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
   ```

2. **Subgraph 配置** (`onchain-data-subgraph/subgraph.yaml`):
   ```yaml
   source:
     address: "YOUR_DEPLOYED_CONTRACT_ADDRESS"
     startBlock: YOUR_DEPLOYMENT_BLOCK_NUMBER
   ```

## 测试部署的合约

部署完成后，你可以：
1. 在前端测试新的"合约转账"功能
2. 重新部署 subgraph 到 The Graph
3. 在"链上数据"页面查看历史交易记录

## 当前实现状态

✅ 智能合约已完成
✅ 前端界面已完成  
✅ The Graph 集成已完成
⏳ 等待合约部署