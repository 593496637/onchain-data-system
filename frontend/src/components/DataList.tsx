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

// GraphQL 查询语句
const dataQuery = `
  query {
    dataWrittenEvents(orderBy: timestamp, orderDirection: desc, first: 100) {
      id
      eventId
      from
      message
      timestamp
    }
  }
`;

export const DataList = () => {
  // --- 组件状态 ---
  const [data, setData] = useState<DataEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用 useCallback 封装数据获取逻辑，以便复用
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: dataQuery }),
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

      setData(jsonResponse.data.dataWrittenEvents);
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

  return (
    <div className="data-list">
      <button onClick={fetchData} className="refresh-button">
        刷新数据
      </button>
      {data.length === 0 ? (
        <p>还没有任何数据记录。</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>消息</th>
              <th>发送者</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {data.map((event) => (
              <tr key={event.id}>
                <td>{event.message}</td>
                <td>{event.from}</td>
                <td>
                  {new Date(parseInt(event.timestamp) * 1000).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
