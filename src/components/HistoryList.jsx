import { useState, useEffect } from 'react';
import { Link, Trash2, ExternalLink, Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 历史记录列表组件
 * 显示最近的上传记录，支持复制和删除
 */
export default function HistoryList({ records: initialRecords = [] }) {
  const [records, setRecords] = useState([]);

  // 初始化时从 localStorage 加载
  useEffect(() => {
    const saved = localStorage.getItem('linksee-history');
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error('读取历史记录失败', e);
      }
    }
  }, []);

  // 保存到 localStorage
  const saveToStorage = (newRecords) => {
    localStorage.setItem('linksee-history', JSON.stringify(newRecords));
  };

  // 添加记录
  const addRecord = (record) => {
    const newRecords = [record, ...records].slice(0, 10); // 只保留最近 10 条
    setRecords(newRecords);
    saveToStorage(newRecords);
  };

  // 删除记录
  const deleteRecord = (index) => {
    const newRecords = records.filter((_, i) => i !== index);
    setRecords(newRecords);
    saveToStorage(newRecords);
  };

  // 复制链接
  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      // 可以在这里添加 toast 提示
    } catch (err) {
      console.error('复制失败', err);
    }
  };

  // 格式化时间
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    // 刚刚（1 分钟内）
    if (diff < 60000) {
      return '刚刚';
    }
    // 几分钟前
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    }
    // 几小时前
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    }
    // 几天前
    return `${Math.floor(diff / 86400000)}天前`;
  };

  if (records.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 text-center text-gray-500">
        <p>暂无历史记录</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 space-y-3">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">历史记录</h3>
      
      {records.map((record, index) => (
        <div
          key={index}
          className="group flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
        >
          {/* 图片预览 */}
          <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-700">
            <img
              src={record.url}
              alt={record.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5org91L2RlZmF1bHQtaW1hZ2Uuc2xnIi8+';
              }}
            />
          </div>

          {/* 链接信息 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">
              {record.name || '未命名图片'}
            </p>
            <p className="text-xs text-gray-400 truncate">{record.url}</p>
            <p className="text-xs text-gray-500 mt-1">{formatTime(record.timestamp)}</p>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* 复制链接 */}
            <button
              onClick={() => copyLink(record.url)}
              className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
              title="复制链接"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* 在新标签页打开 */}
            <a
              href={record.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
              title="在新标签页打开"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* 删除 */}
            <button
              onClick={() => deleteRecord(index)}
              className="p-2 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
              title="删除记录"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
