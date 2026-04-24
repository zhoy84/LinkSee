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

  // 从 localStorage 加载记录
  const loadRecords = () => {
    const saved = localStorage.getItem('linksee-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecords(parsed);
        console.log('加载历史记录:', parsed.length, '条');
      } catch (e) {
        console.error('读取历史记录失败', e);
      }
    }
  };

  // 初始化时加载记录
  useEffect(() => {
    loadRecords();
    
    // 监听存储事件（当其他标签页或代码更新 localStorage 时）
    const handleStorageChange = (e) => {
      if (e.key === 'linksee-history' || e.type === 'storage') {
        console.log('检测到存储变化，重新加载记录');
        loadRecords();
      }
    };

    // 使用自定义事件监听同一页面内的更新
    const handleCustomStorageChange = () => {
      console.log('检测到自定义存储事件，重新加载记录');
      loadRecords();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('linksee-history-update', handleCustomStorageChange);
    
    // 定期检查（兜底方案）
    const interval = setInterval(() => {
      loadRecords();
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('linksee-history-update', handleCustomStorageChange);
      clearInterval(interval);
    };
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
  if (!isoString) return '';
  
  const date = new Date(isoString);
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '时间未知';
  }
  
  const now = new Date();
  const diff = now - date;
  
  // 刚刚（1 分钟内）
  if (diff < 60000) {
    return '刚刚';
  }
  // 几分钟前
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return mins >= 1 ? `${mins}分钟前` : '1 分钟前';
  }
  // 几小时前
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return hours >= 1 ? `${hours}小时前` : '1 小时前';
  }
  // 几天前
  const days = Math.floor(diff / 86400000);
  if (days < 30) {
    return `${days}天前`;
  }
  // 几个月前
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}个月前`;
  }
  // 几年前
  const years = Math.floor(months / 12);
  return `${years}年前`;
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
          <div className="flex items-center gap-2">
            {/* 复制链接 */}
            <button
              onClick={() => copyLink(record.url)}
              className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
              title="复制链接"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* 查看按钮（始终显示） */}
            <a
              href={record.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
              title="在新标签页打开"
            >
              查看
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
