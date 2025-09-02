# API接口文档

## 概述

链上数据系统提供了丰富的API接口，包括智能合约接口、The Graph GraphQL接口、前端组件接口和Web3集成接口。本文档详细说明了所有可用的接口、参数、返回值和使用示例。

## 智能合约接口

### DataStorage合约

**合约地址**: `0x41dCf4E34eB2C231Cb03663D6e47ff271f621C4A` (Sepolia测试网)

#### 1. storeData - 存储数据

**函数签名**:
```solidity
function storeData(string memory _message) public returns (uint256)
```

**参数**:
- `_message` (string): 要存储的消息内容，长度限制1-1000字符

**返回值**:
- `uint256`: 数据记录的唯一ID

**事件**:
```solidity
event DataStored(
    address indexed user,
    string message,
    uint256 timestamp,
    uint256 indexed dataId
);
```

**Gas估算**: 约30,000 - 50,000 Gas

**JavaScript调用示例**:
```typescript
import { ethers } from 'ethers';
import DataStorageABI from './abi/DataStorage.json';

const contractAddress = "0x41dCf4E34eB2C231Cb03663D6e47ff271f621C4A";

async function storeData(message: string): Promise<string> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(contractAddress, DataStorageABI.abi, signer);
  
  try {
    // 估算Gas费用
    const gasEstimate = await contract.storeData.estimateGas(message);
    console.log('预估Gas用量:', gasEstimate.toString());
    
    // 发送交易
    const tx = await contract.storeData(message, {
      gasLimit: gasEstimate * 120n / 100n // 增加20%的Gas缓冲
    });
    
    console.log('交易哈希:', tx.hash);
    
    // 等待交易确认
    const receipt = await tx.wait();
    console.log('交易已确认, 区块号:', receipt.blockNumber);
    
    return tx.hash;
  } catch (error) {
    console.error('存储数据失败:', error);
    throw error;
  }
}

// 使用示例
storeData("Hello, Blockchain!")
  .then(txHash => console.log('存储成功:', txHash))
  .catch(error => console.error('存储失败:', error));
```

**错误处理**:
```typescript
function getStorageErrorMessage(error: any): string {
  if (error.code === 'ACTION_REJECTED') {
    return '用户取消了交易';
  } else if (error.message.includes('insufficient funds')) {
    return '余额不足，无法支付Gas费用';
  } else if (error.message.includes('execution reverted')) {
    return '合约执行失败，请检查输入参数';
  } else if (error.message.includes('network')) {
    return '网络连接异常';
  }
  return `存储失败: ${error.message}`;
}
```

#### 2. getData - 获取数据

**函数签名**:
```solidity
function getData(uint256 _dataId) public view returns (
    address user,
    string memory message,
    uint256 timestamp
)
```

**参数**:
- `_dataId` (uint256): 数据记录ID

**返回值**:
- `user` (address): 数据存储者地址
- `message` (string): 存储的消息内容
- `timestamp` (uint256): 存储时间戳

**JavaScript调用示例**:
```typescript
async function getData(dataId: number): Promise<DataRecord | null> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(contractAddress, DataStorageABI.abi, provider);
  
  try {
    const result = await contract.getData(dataId);
    
    return {
      id: dataId,
      user: result.user,
      message: result.message,
      timestamp: Number(result.timestamp),
      date: new Date(Number(result.timestamp) * 1000)
    };
  } catch (error) {
    console.error('获取数据失败:', error);
    return null;
  }
}

// 使用示例
getData(1)
  .then(data => {
    if (data) {
      console.log('数据内容:', data.message);
      console.log('存储者:', data.user);
      console.log('存储时间:', data.date.toLocaleString());
    } else {
      console.log('数据不存在');
    }
  });
```

#### 3. getDataCount - 获取数据总数

**函数签名**:
```solidity
function getDataCount() public view returns (uint256)
```

**返回值**:
- `uint256`: 当前存储的数据总数

**JavaScript调用示例**:
```typescript
async function getDataCount(): Promise<number> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(contractAddress, DataStorageABI.abi, provider);
  
  const count = await contract.getDataCount();
  return Number(count);
}
```

#### 4. getUserDataIds - 获取用户数据ID列表

**函数签名**:
```solidity
function getUserDataIds(address _user) public view returns (uint256[] memory)
```

**参数**:
- `_user` (address): 用户地址

**返回值**:
- `uint256[]`: 该用户存储的所有数据ID数组

**JavaScript调用示例**:
```typescript
async function getUserDataIds(userAddress: string): Promise<number[]> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(contractAddress, DataStorageABI.abi, provider);
  
  const ids = await contract.getUserDataIds(userAddress);
  return ids.map((id: bigint) => Number(id));
}

// 批量获取用户数据
async function getUserData(userAddress: string): Promise<DataRecord[]> {
  const ids = await getUserDataIds(userAddress);
  const dataPromises = ids.map(id => getData(id));
  const results = await Promise.all(dataPromises);
  
  return results.filter(data => data !== null) as DataRecord[];
}
```

### ERC20代币转账接口

#### 1. transfer - 代币转账

**函数签名**:
```solidity
function transfer(address to, uint256 amount) public returns (bool)
```

**参数**:
- `to` (address): 接收者地址
- `amount` (uint256): 转账数量（最小单位）

**JavaScript调用示例**:
```typescript
const usdcContractAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const erc20ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  }
];

async function transferUSDC(to: string, amount: string): Promise<string> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(usdcContractAddress, erc20ABI, signer);
  
  // 转换金额到正确的单位 (USDC有6位小数)
  const amountInWei = ethers.parseUnits(amount, 6);
  
  const tx = await contract.transfer(to, amountInWei);
  await tx.wait();
  
  return tx.hash;
}
```

#### 2. balanceOf - 查询余额

**函数签名**:
```solidity
function balanceOf(address account) public view returns (uint256)
```

**JavaScript调用示例**:
```typescript
async function getUSDCBalance(address: string): Promise<string> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(usdcContractAddress, erc20ABI, provider);
  
  const balance = await contract.balanceOf(address);
  return ethers.formatUnits(balance, 6); // USDC有6位小数
}
```

## The Graph GraphQL接口

### 端点信息

**Subgraph URL**: `https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID`

**GraphQL Playground**: `https://thegraph.com/hosted-service/subgraph/your-username/onchain-data-system`

### 1. 查询数据存储事件

#### 基础查询

```graphql
query GetDataEvents {
  dataStoredEvents(
    first: 10
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    user
    message
    timestamp
    blockNumber
    transactionHash
  }
}
```

**JavaScript调用示例**:
```typescript
const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID";

interface DataEvent {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

async function fetchDataEvents(
  limit = 10,
  skip = 0
): Promise<{ data: DataEvent[], error?: string }> {
  const query = `
    query GetDataEvents($first: Int!, $skip: Int!) {
      dataStoredEvents(
        first: $first
        skip: $skip
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        user
        message
        timestamp
        blockNumber
        transactionHash
      }
    }
  `;

  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { first: limit, skip }
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      return { data: [], error: result.errors[0].message };
    }

    return { data: result.data.dataStoredEvents };
  } catch (error) {
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// 使用示例
fetchDataEvents(20, 0)
  .then(result => {
    if (result.error) {
      console.error('查询失败:', result.error);
    } else {
      console.log('查询成功:', result.data);
    }
  });
```

#### 高级查询 - 条件过滤

```graphql
query GetFilteredDataEvents(
  $userAddress: String!
  $fromTimestamp: BigInt!
  $toTimestamp: BigInt!
) {
  dataStoredEvents(
    where: {
      user: $userAddress
      timestamp_gte: $fromTimestamp
      timestamp_lte: $toTimestamp
    }
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    user
    message
    timestamp
    blockNumber
    transactionHash
  }
}
```

**JavaScript调用示例**:
```typescript
interface QueryFilters {
  userAddress?: string;
  fromDate?: Date;
  toDate?: Date;
  messageContains?: string;
}

async function fetchFilteredDataEvents(
  filters: QueryFilters,
  limit = 10,
  skip = 0
): Promise<{ data: DataEvent[], error?: string }> {
  // 构建查询条件
  const whereConditions: string[] = [];
  const variables: any = { first: limit, skip };

  if (filters.userAddress) {
    whereConditions.push('user: $userAddress');
    variables.userAddress = filters.userAddress.toLowerCase();
  }

  if (filters.fromDate) {
    whereConditions.push('timestamp_gte: $fromTimestamp');
    variables.fromTimestamp = Math.floor(filters.fromDate.getTime() / 1000).toString();
  }

  if (filters.toDate) {
    whereConditions.push('timestamp_lte: $toTimestamp');
    variables.toTimestamp = Math.floor(filters.toDate.getTime() / 1000).toString();
  }

  if (filters.messageContains) {
    whereConditions.push('message_contains_nocase: $messageContains');
    variables.messageContains = filters.messageContains;
  }

  const whereClause = whereConditions.length > 0 
    ? `where: { ${whereConditions.join(', ')} }`
    : '';

  const query = `
    query GetFilteredDataEvents($first: Int!, $skip: Int!${
      filters.userAddress ? ', $userAddress: String!' : ''
    }${
      filters.fromDate ? ', $fromTimestamp: BigInt!' : ''
    }${
      filters.toDate ? ', $toTimestamp: BigInt!' : ''
    }${
      filters.messageContains ? ', $messageContains: String!' : ''
    }) {
      dataStoredEvents(
        first: $first
        skip: $skip
        ${whereClause}
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        user
        message
        timestamp
        blockNumber
        transactionHash
      }
    }
  `;

  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });

    const result = await response.json();
    
    if (result.errors) {
      return { data: [], error: result.errors[0].message };
    }

    return { data: result.data.dataStoredEvents };
  } catch (error) {
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

### 2. 查询用户统计

```graphql
query GetUserStats($userAddress: String!) {
  userStats(id: $userAddress) {
    id
    totalTransactions
    firstTransactionAt
    lastTransactionAt
  }
}
```

**JavaScript调用示例**:
```typescript
interface UserStats {
  id: string;
  totalTransactions: string;
  firstTransactionAt: string;
  lastTransactionAt: string;
}

async function fetchUserStats(userAddress: string): Promise<UserStats | null> {
  const query = `
    query GetUserStats($userAddress: String!) {
      userStats(id: $userAddress) {
        id
        totalTransactions
        firstTransactionAt
        lastTransactionAt
      }
    }
  `;

  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { userAddress: userAddress.toLowerCase() }
      })
    });

    const result = await response.json();
    return result.data.userStats;
  } catch (error) {
    console.error('获取用户统计失败:', error);
    return null;
  }
}
```

### 3. 实时订阅

```graphql
subscription OnDataStored {
  dataStoredEvents(
    orderBy: timestamp
    orderDirection: desc
    first: 1
  ) {
    id
    user
    message
    timestamp
    transactionHash
  }
}
```

**WebSocket订阅示例**:
```typescript
class GraphQLSubscription {
  private ws: WebSocket | null = null;
  private subscriptionId = 0;

  connect(url: string): void {
    const wsUrl = url.replace('https://', 'wss://').replace('http://', 'ws://');
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket连接已建立');
      this.sendConnectionInit();
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket连接已关闭');
    };
  }

  private sendConnectionInit(): void {
    this.send({ type: 'connection_init' });
  }

  subscribe(query: string, variables?: any, callback?: (data: any) => void): number {
    const id = (++this.subscriptionId).toString();
    
    this.send({
      type: 'start',
      id,
      payload: { query, variables }
    });

    if (callback) {
      this.subscriptionCallbacks.set(id, callback);
    }

    return this.subscriptionId;
  }

  private subscriptionCallbacks = new Map<string, (data: any) => void>();

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'data':
        const callback = this.subscriptionCallbacks.get(message.id);
        if (callback) {
          callback(message.payload);
        }
        break;
      case 'error':
        console.error('订阅错误:', message.payload);
        break;
    }
  }

  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

// 使用示例
const subscription = new GraphQLSubscription();
subscription.connect(SUBGRAPH_URL);

subscription.subscribe(
  `subscription OnDataStored {
    dataStoredEvents(orderBy: timestamp, orderDirection: desc, first: 1) {
      id
      user
      message
      timestamp
      transactionHash
    }
  }`,
  {},
  (data) => {
    console.log('收到新数据:', data.data.dataStoredEvents[0]);
  }
);
```

## 前端组件接口

### 1. WalletConnect组件

```typescript
interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  onNetworkChange?: (chainId: number) => void;
  className?: string;
}

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  onDisconnect,
  onNetworkChange,
  className
}) => {
  // 组件实现...
};

// 使用示例
<WalletConnect
  onConnect={(address) => console.log('钱包已连接:', address)}
  onDisconnect={() => console.log('钱包已断开')}
  onNetworkChange={(chainId) => console.log('网络已切换:', chainId)}
  className="my-wallet-connect"
/>
```

### 2. DataList组件

```typescript
interface DataListProps {
  userAddress?: string;
  limit?: number;
  showFilters?: boolean;
  onDataClick?: (data: DataEvent) => void;
  className?: string;
}

interface DataListState {
  data: DataEvent[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
}

export const DataList: React.FC<DataListProps> = ({
  userAddress,
  limit = 10,
  showFilters = true,
  onDataClick,
  className
}) => {
  // 组件实现...
};

// 使用示例
<DataList
  userAddress="0x742d35Cc6634C0532925a3b8D7389a9bf3be4D"
  limit={20}
  showFilters={true}
  onDataClick={(data) => console.log('点击了数据:', data)}
  className="my-data-list"
/>
```

### 3. LogForm组件

```typescript
interface LogFormProps {
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

interface LogFormState {
  message: string;
  txStatus: 'idle' | 'pending' | 'success' | 'error';
  txHash: string;
  errorMessage: string;
}

export const LogForm: React.FC<LogFormProps> = ({
  onSuccess,
  onError,
  disabled = false,
  className
}) => {
  // 组件实现...
};

// 使用示例
<LogForm
  onSuccess={(txHash) => console.log('存储成功:', txHash)}
  onError={(error) => console.error('存储失败:', error)}
  disabled={!isConnected}
  className="my-log-form"
/>
```

## React Hooks接口

### 1. useWallet Hook

```typescript
interface WalletHookReturn {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
}

export function useWallet(): WalletHookReturn {
  // Hook实现...
}

// 使用示例
const MyComponent: React.FC = () => {
  const { 
    address, 
    isConnected, 
    connect, 
    disconnect, 
    switchNetwork 
  } = useWallet();

  return (
    <div>
      {isConnected ? (
        <div>
          <p>已连接: {address}</p>
          <button onClick={disconnect}>断开连接</button>
          <button onClick={() => switchNetwork(11155111)}>
            切换到Sepolia
          </button>
        </div>
      ) : (
        <button onClick={connect}>连接钱包</button>
      )}
    </div>
  );
};
```

### 2. useContract Hook

```typescript
interface UseContractOptions {
  address: string;
  abi: any[];
  autoConnect?: boolean;
}

interface ContractHookReturn {
  contract: Contract | null;
  loading: boolean;
  error: string | null;
  call: (method: string, ...args: any[]) => Promise<any>;
  send: (method: string, ...args: any[]) => Promise<TransactionResponse>;
}

export function useContract(options: UseContractOptions): ContractHookReturn {
  // Hook实现...
}

// 使用示例
const MyComponent: React.FC = () => {
  const { call, send, loading, error } = useContract({
    address: "0x41dCf4E34eB2C231Cb03663D6e47ff271f621C4A",
    abi: DataStorageABI.abi,
    autoConnect: true
  });

  const handleStoreData = async (message: string) => {
    try {
      const tx = await send('storeData', message);
      console.log('交易哈希:', tx.hash);
    } catch (error) {
      console.error('存储失败:', error);
    }
  };

  const handleGetDataCount = async () => {
    try {
      const count = await call('getDataCount');
      console.log('数据总数:', count.toString());
    } catch (error) {
      console.error('查询失败:', error);
    }
  };

  return (
    <div>
      <button onClick={() => handleStoreData('Hello')}>
        存储数据
      </button>
      <button onClick={handleGetDataCount}>
        获取总数
      </button>
      {loading && <p>处理中...</p>}
      {error && <p>错误: {error}</p>}
    </div>
  );
};
```

### 3. useGraphQuery Hook

```typescript
interface UseGraphQueryOptions<T> {
  query: string;
  variables?: Record<string, any>;
  skip?: boolean;
  pollInterval?: number;
}

interface GraphQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGraphQuery<T = any>(
  options: UseGraphQueryOptions<T>
): GraphQueryResult<T> {
  // Hook实现...
}

// 使用示例
const MyComponent: React.FC = () => {
  const { data, loading, error, refetch } = useGraphQuery<{
    dataStoredEvents: DataEvent[]
  }>({
    query: `
      query GetRecentData($first: Int!) {
        dataStoredEvents(first: $first, orderBy: timestamp, orderDirection: desc) {
          id
          user
          message
          timestamp
        }
      }
    `,
    variables: { first: 10 },
    pollInterval: 30000 // 每30秒轮询一次
  });

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <button onClick={refetch}>刷新</button>
      {data?.dataStoredEvents.map(event => (
        <div key={event.id}>
          <p>{event.message}</p>
          <small>{event.user}</small>
        </div>
      ))}
    </div>
  );
};
```

## 工具函数接口

### 1. 地址验证和格式化

```typescript
/**
 * 验证以太坊地址格式
 */
export function isValidAddress(address: string): boolean {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * 格式化地址显示
 */
export function formatAddress(
  address: string, 
  startLength = 6, 
  endLength = 4
): string {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;
  
  return `${address.substring(0, startLength)}...${address.substring(
    address.length - endLength
  )}`;
}

/**
 * 验证并格式化地址
 */
export function validateAndFormatAddress(address: string): {
  isValid: boolean;
  formatted: string;
  checksum: string;
} {
  try {
    const checksumAddress = ethers.getAddress(address);
    return {
      isValid: true,
      formatted: formatAddress(checksumAddress),
      checksum: checksumAddress
    };
  } catch {
    return {
      isValid: false,
      formatted: '',
      checksum: ''
    };
  }
}
```

### 2. 数值转换工具

```typescript
/**
 * 转换Wei到Ether
 */
export function weiToEther(wei: bigint): string {
  return ethers.formatEther(wei);
}

/**
 * 转换Ether到Wei
 */
export function etherToWei(ether: string): bigint {
  return ethers.parseEther(ether);
}

/**
 * 转换代币单位
 */
export function formatTokenAmount(
  amount: bigint, 
  decimals: number, 
  displayDecimals = 2
): string {
  const formatted = ethers.formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  return num.toFixed(displayDecimals);
}

/**
 * 解析代币金额
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  return ethers.parseUnits(amount, decimals);
}
```

### 3. 时间处理工具

```typescript
/**
 * 时间戳转换为本地时间
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * 格式化显示时间
 */
export function formatDateTime(timestamp: number): string {
  return timestampToDate(timestamp).toLocaleString();
}

/**
 * 计算时间差
 */
export function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - (timestamp * 1000);
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
}
```

### 4. 错误处理工具

```typescript
/**
 * 解析Web3错误信息
 */
export function parseWeb3Error(error: any): {
  code: string;
  message: string;
  userMessage: string;
} {
  if (error.code === 'ACTION_REJECTED') {
    return {
      code: 'USER_REJECTED',
      message: error.message,
      userMessage: '用户取消了交易'
    };
  }
  
  if (error.message.includes('insufficient funds')) {
    return {
      code: 'INSUFFICIENT_FUNDS',
      message: error.message,
      userMessage: '余额不足，请检查ETH余额'
    };
  }
  
  if (error.message.includes('network')) {
    return {
      code: 'NETWORK_ERROR',
      message: error.message,
      userMessage: '网络连接异常，请检查网络'
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || String(error),
    userMessage: '操作失败，请重试'
  };
}

/**
 * 重试机制
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
}
```

## 类型定义

### 基础数据类型

```typescript
// 数据事件类型
export interface DataEvent {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

// 钱包状态类型
export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string;
  ensName: string | null;
  avatarUrl: string | null;
}

// 网络配置类型
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// 交易状态类型
export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

// 查询参数类型
export interface QueryParams {
  userAddress?: string;
  fromBlock?: number;
  toBlock?: number;
  fromDate?: Date;
  toDate?: Date;
  messageContains?: string;
  limit?: number;
  offset?: number;
}

// API响应类型
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
```

### 事件类型定义

```typescript
// 合约事件类型
export interface ContractEvent {
  event: string;
  address: string;
  returnValues: any;
  logIndex: number;
  transactionIndex: number;
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
}

// 钱包事件类型
export interface WalletEventMap {
  'accountsChanged': (accounts: string[]) => void;
  'chainChanged': (chainId: string) => void;
  'connect': (connectInfo: { chainId: string }) => void;
  'disconnect': (error: { code: number; message: string }) => void;
}
```

## 配置选项

### 环境配置

```typescript
export interface EnvironmentConfig {
  // RPC节点配置
  rpcUrls: Record<number, string>;
  
  // The Graph子图端点
  subgraphUrl: string;
  
  // 合约地址
  contracts: {
    dataStorage: string;
    usdcToken: string;
  };
  
  // 默认网络
  defaultChainId: number;
  
  // 支持的网络
  supportedChainIds: number[];
  
  // API配置
  api: {
    timeout: number;
    retryCount: number;
    retryDelay: number;
  };
}

// 生产环境配置示例
export const prodConfig: EnvironmentConfig = {
  rpcUrls: {
    1: 'https://mainnet.infura.io/v3/YOUR_KEY',
    11155111: 'https://sepolia.infura.io/v3/YOUR_KEY'
  },
  subgraphUrl: 'https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID',
  contracts: {
    dataStorage: '0x41dCf4E34eB2C231Cb03663D6e47ff271f621C4A',
    usdcToken: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  },
  defaultChainId: 11155111,
  supportedChainIds: [1, 11155111, 137, 42161],
  api: {
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000
  }
};
```

## 错误码参考

```typescript
export enum ErrorCodes {
  // 钱包相关错误
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  USER_REJECTED = 'USER_REJECTED',
  
  // 网络相关错误
  UNSUPPORTED_NETWORK = 'UNSUPPORTED_NETWORK',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RPC_ERROR = 'RPC_ERROR',
  
  // 交易相关错误
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  
  // 数据相关错误
  INVALID_INPUT = 'INVALID_INPUT',
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  QUERY_FAILED = 'QUERY_FAILED',
  
  // 系统相关错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export const ErrorMessages: Record<ErrorCodes, string> = {
  [ErrorCodes.WALLET_NOT_CONNECTED]: '请先连接钱包',
  [ErrorCodes.WALLET_NOT_FOUND]: '未检测到钱包，请安装MetaMask',
  [ErrorCodes.USER_REJECTED]: '用户取消了操作',
  [ErrorCodes.UNSUPPORTED_NETWORK]: '不支持的网络，请切换到支持的网络',
  [ErrorCodes.NETWORK_ERROR]: '网络连接异常',
  [ErrorCodes.RPC_ERROR]: 'RPC节点连接失败',
  [ErrorCodes.INSUFFICIENT_FUNDS]: '余额不足',
  [ErrorCodes.GAS_ESTIMATION_FAILED]: 'Gas估算失败',
  [ErrorCodes.TRANSACTION_FAILED]: '交易执行失败',
  [ErrorCodes.INVALID_INPUT]: '输入参数无效',
  [ErrorCodes.DATA_NOT_FOUND]: '未找到相关数据',
  [ErrorCodes.QUERY_FAILED]: '数据查询失败',
  [ErrorCodes.UNKNOWN_ERROR]: '未知错误',
  [ErrorCodes.RATE_LIMITED]: '请求过于频繁，请稍后重试',
  [ErrorCodes.SERVICE_UNAVAILABLE]: '服务暂不可用'
};
```

这份API接口文档详细说明了链上数据系统的所有可用接口，包括智能合约接口、GraphQL查询接口、前端组件接口和工具函数。开发者可以根据这份文档快速集成和使用系统的各项功能。