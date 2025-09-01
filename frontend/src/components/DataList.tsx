// src/components/DataList.tsx
import { useState, useEffect, useCallback } from "react";

// !!! 重要: 在下方填入你从 The Graph Studio 复制的 API 端点 !!!
const API_URL = `https://api.studio.thegraph.com/query/119398/onchain-data-subgraph/version/latest`;

// 定义从 The Graph 返回的数据条目类型
interface DataEvent {
  id: string;
  eventId: string;
  from: string;
  message: string;
  timestamp: string;
}

interface TransferEvent {
  id: string;
  transferId: string;
  from: string;
  to: string;
  amount: string;
  message: string;
  timestamp: string;
}

// GraphQL 查询语句
const combinedQuery = `
  query {
    dataWrittenEvents(orderBy: timestamp, orderDirection: desc, first: 50) {
      id
      eventId
      from
      message
      timestamp
    }
    transferWithMessageEvents(orderBy: timestamp, orderDirection: desc, first: 50) {
      id
      transferId
      from
      to
      amount
      message
      timestamp
    }
  }
`;

type CombinedEvent = (DataEvent & { type: 'data' }) | (TransferEvent & { type: 'transfer' });

export const DataList = () => {
  // --- 组件状态 ---
  const [data, setData] = useState<CombinedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'data' | 'transfer'>('all');

  // 使用 useCallback 封装数据获取逻辑，以便复用
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: combinedQuery }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonResponse = await response.json();

      if (jsonResponse.errors) {
        throw new Error(
          `GraphQL error: ${jsonResponse.errors
            .map((e: { message: string }) => e.message)
            .join(", ")}`
        );
      }

      // 合并两种类型的事件
      const combinedData: CombinedEvent[] = [
        ...jsonResponse.data.dataWrittenEvents.map((event: DataEvent) => ({ ...event, type: 'data' as const })),
        ...jsonResponse.data.transferWithMessageEvents.map((event: TransferEvent) => ({ ...event, type: 'transfer' as const }))
      ];

      // 按时间戳排序
      combinedData.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

      setData(combinedData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  // 在组件首次加载时获取数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 渲染逻辑 ---
  if (loading) {
    return <p>正在从 The Graph 加载数据...</p>;
  }

  if (error) {
    return <p className="error">加载数据失败: {error}</p>;
  }

  // 过滤数据
  const filteredData = data.filter(event => {
    if (filter === 'all') return true;
    return event.type === filter;
  });

  return (
    <div className="data-container">
      <div className="controls">
        <button onClick={fetchData} className="refresh-button">
          刷新数据
        </button>
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
            转账记录
          </button>
        </div>
      </div>
      
      {filteredData.length === 0 ? (
        <p>还没有任何{filter === 'all' ? '' : filter === 'data' ? '事件日志' : '转账'}记录。</p>
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
                      {event.from.substring(0, 6)}...{event.from.substring(38)}
                    </code>
                  </td>
                  <td className="address-col">
                    {event.type === 'transfer' ? (
                      <code className="address-display" title={(event as TransferEvent & { type: 'transfer' }).to}>
                        {(event as TransferEvent & { type: 'transfer' }).to.substring(0, 6)}...
                        {(event as TransferEvent & { type: 'transfer' }).to.substring(38)}
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
