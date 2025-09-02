/**
 * 链上数据查询和展示组件
 * 
 * 这是一个完整的数据查询和可视化组件，主要功能包括：
 * 1. 从The Graph查询智能合约事件数据
 * 2. 展示事件日志和原生转账数据
 * 3. 提供数据过滤和刷新功能
 * 4. 响应式表格设计和数据格式化
 * 5. 与区块链浏览器的集成链接
 * 
 * 技术特性：
 * - 使用GraphQL查询多种类型的链上数据
 * - 实时数据刷新和状态管理
 * - 用户友好的数据展示和错误处理
 * - 响应式设计适配移动设备
 * 
 * 数据源：The Graph Protocol - 去中心化的区块链数据索引服务
 */

import { useState, useEffect, useCallback } from "react";

// The Graph Studio API端点 - 用于查询已索引的链上数据
// 此端点连接到部署在The Graph Network上的子图
const API_URL = `https://api.studio.thegraph.com/query/119398/onchain-data-subgraph/version/latest`;

/**
 * 数据写入事件类型定义
 * 对应智能合约中DataWritten事件的数据结构
 */
interface DataEvent {
  id: string;           // 事件唯一标识符
  eventId: string;      // 合约中的事件ID
  from: string;         // 发送者钱包地址
  message: string;      // 记录的消息内容
  timestamp: string;    // 事件发生时间戳
  transactionHash: string; // 交易哈希值
}

/**
 * 合约转账事件类型定义
 * 对应智能合约中TransferExecuted事件的数据结构
 */
interface TransferEvent {
  id: string;           // 事件唯一标识符
  transferId: string;   // 转账ID
  from: string;         // 发送者钱包地址
  to: string;           // 接收者钱包地址
  amount: string;       // 转账金额（Wei单位）
  message: string;      // 转账附言
  timestamp: string;    // 事件发生时间戳
  transactionHash: string; // 交易哈希值
}

/**
 * GraphQL查询语句
 * 
 * 同时查询两种类型的事件数据：
 * 1. dataWrittenEvents - 智能合约数据写入事件
 * 2. transferWithMessageEvents - 带附言的转账事件
 * 
 * 查询特点：
 * - 按时间戳降序排列（最新的在前）
 * - 每种类型限制返回50条记录
 * - 包含显示所需的所有字段
 */
const combinedQuery = `
  query {
    dataWrittenEvents(orderBy: timestamp, orderDirection: desc, first: 50) {
      id
      eventId
      from
      message
      timestamp
      transactionHash
    }
    transferWithMessageEvents(orderBy: timestamp, orderDirection: desc, first: 50) {
      id
      transferId
      from
      to
      amount
      message
      timestamp
      transactionHash
    }
  }
`;

// 合并事件类型：为每个事件添加类型标识符以便于处理和显示
type CombinedEvent = (DataEvent & { type: 'data' }) | (TransferEvent & { type: 'transfer' });

/**
 * 数据列表主组件
 * 
 * 管理链上数据的查询、显示和用户交互
 * 提供数据过滤、刷新和格式化显示功能
 * 
 * @returns React组件 - 数据查询和展示界面
 */
export const DataList = () => {
  // === 数据状态管理 ===
  const [data, setData] = useState<CombinedEvent[]>([]); // 合并后的事件数据数组
  const [loading, setLoading] = useState(true); // 数据加载状态
  const [error, setError] = useState<string | null>(null); // 错误信息
  const [filter, setFilter] = useState<'all' | 'data' | 'transfer'>('all'); // 数据过滤类型

  /**
   * 数据获取函数
   * 
   * 使用useCallback优化性能，避免不必要的重新渲染
   * 主要功能：
   * 1. 向The Graph API发送GraphQL查询
   * 2. 处理HTTP和GraphQL错误
   * 3. 合并并排序不同类型的事件数据
   * 4. 更新组件状态
   * 
   * 错误处理：
   * - HTTP状态错误
   * - GraphQL查询错误
   * - 网络连接错误
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 向The Graph API发送GraphQL查询请求
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: combinedQuery }),
      });

      // 检查HTTP响应状态
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonResponse = await response.json();

      // 检查GraphQL查询错误
      if (jsonResponse.errors) {
        throw new Error(
          `GraphQL error: ${jsonResponse.errors
            .map((e: { message: string }) => e.message)
            .join(", ")}`
        );
      }

      // 合并两种类型的事件并添加类型标识
      const combinedData: CombinedEvent[] = [
        ...jsonResponse.data.dataWrittenEvents.map((event: DataEvent) => ({ ...event, type: 'data' as const })),
        ...jsonResponse.data.transferWithMessageEvents.map((event: TransferEvent) => ({ ...event, type: 'transfer' as const }))
      ];

      // 按时间戳降序排序（最新的在前）
      combinedData.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

      setData(combinedData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  // 在组件首次加载时自动获取数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // === 渲染逻辑 ===
  
  // 数据加载中状态
  if (loading) {
    return <p>正在从 The Graph 加载数据...</p>;
  }

  // 错误状态显示
  if (error) {
    return <p className="error">加载数据失败: {error}</p>;
  }

  // 根据当前过滤条件筛选数据
  const filteredData = data.filter(event => {
    if (filter === 'all') return true;
    return event.type === filter;
  });

  return (
    <div className="data-container">
      {/* 控制按钮区域：数据刷新和过滤功能 */}
      <div className="controls">
        {/* 手动刷新数据按钮 */}
        <button onClick={fetchData} className="refresh-button">
          刷新数据
        </button>
        
        {/* 数据类型过滤按钮组 */}
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            全部记录
          </button>
          <button 
            className={filter === 'data' ? 'active' : ''} 
            onClick={() => setFilter('data')}
          >
            事件日志
          </button>
          <button 
            className={filter === 'transfer' ? 'active' : ''} 
            onClick={() => setFilter('transfer')}
          >
            合约转账
          </button>
        </div>
      </div>
      
      {filteredData.length === 0 ? (
        <p>还没有任何{filter === 'all' ? '' : filter === 'data' ? '事件日志' : '合约转账'}记录。</p>
      ) : (
        <div className="compact-table-wrapper">
          <table className="compact-table">
            <thead>
              <tr>
                <th className="type-col">类型</th>
                <th className="message-col">消息/附言</th>
                <th className="address-col">发送者</th>
                <th className="address-col">接收者</th>
                <th className="amount-col">金额</th>
                <th className="hash-col">交易Hash</th>
                <th className="time-col">时间</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((event) => (
                <tr key={event.id} className="compact-row">
                  <td className="type-col">
                    <div className={`compact-badge ${event.type}`}>
                      {event.type === 'data' ? '📝' : '💸'}
                      <span>{event.type === 'data' ? '事件' : '转账'}</span>
                    </div>
                  </td>
                  <td className="message-col">
                    <div className="message-text" title={event.message}>
                      {event.message}
                    </div>
                  </td>
                  <td className="address-col">
                    <code className="address-display" title={event.from}>
                      {event.from}
                    </code>
                  </td>
                  <td className="address-col">
                    {event.type === 'transfer' ? (
                      <code className="address-display" title={(event as TransferEvent & { type: 'transfer' }).to}>
                        {(event as TransferEvent & { type: 'transfer' }).to}
                      </code>
                    ) : (
                      <span className="null-value">-</span>
                    )}
                  </td>
                  <td className="amount-col">
                    {event.type === 'transfer' ? (
                      <span className="amount-value">
                        {parseFloat((event as TransferEvent & { type: 'transfer' }).amount) / 1e18} ETH
                      </span>
                    ) : (
                      <span className="null-value">-</span>
                    )}
                  </td>
                  <td className="hash-col">
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${event.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hash-link"
                      title={event.transactionHash}
                    >
                      {event.transactionHash.substring(0, 10)}...{event.transactionHash.substring(56)}
                    </a>
                  </td>
                  <td className="time-col">
                    <span className="time-value">
                      {new Date(parseInt(event.timestamp) * 1000).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit', 
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
