import { useState, useCallback } from 'react';
import { Image as ImageIcon, Link as LinkIcon, Sparkles } from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import HistoryList from './components/HistoryList';
import { twMerge } from 'tailwind-merge';

/**
 * 工具函数：根据 URL 生成唯一文件名
 */
const generateFileName = (url) => {
  const parts = url.split('/');
  return parts.pop() || 'image';
};

/**
 * LinkSee 主应用组件
 * 图片转链接工具 - 主入口
 */
function App() {
  // 当前上传结果
  const [currentResult, setCurrentResult] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // 处理上传成功回调
  const handleUploadSuccess = useCallback((result) => {
    setCurrentResult(result);
    setCopySuccess(false);

    // 从 localStorage 读取现有记录
    const saved = localStorage.getItem('linksee-history');
    const existingRecords = saved ? JSON.parse(saved) : [];
    
    // 添加新记录
    const historyItem = {
      url: result.url,
      name: result.name,
      timestamp: result.timestamp,
    };
    
    // 将新记录添加到最前面，保留最近 10 条
    const newRecords = [historyItem, ...existingRecords].slice(0, 10);
    localStorage.setItem('linksee-history', JSON.stringify(newRecords));

    // 触发自定义事件，让 HistoryList 组件知道数据已更新
    window.dispatchEvent(new CustomEvent('linksee-history-update'));
  }, []);

  // 复制链接
  const handleCopy = useCallback(async () => {
    if (currentResult?.url) {
      try {
        await navigator.clipboard.writeText(currentResult.url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('复制失败:', err);
      }
    }
  }, [currentResult]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* 顶部导航 */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <LinkIcon className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                LinkSee
              </h1>
              <p className="text-xs text-gray-400">在线工具箱 - 图片转链接</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Sparkles className="w-4 h-4" />
            <span>极速 · 安全 · 隐私优先</span>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* 功能说明 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            图片一键转链接
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            支持拖拽上传、粘贴板粘贴，自动保存到历史记录。
            所有数据存储在本地，保护您的隐私。
          </p>
        </div>

        {/* 上传组件 */}
        <ImageUploader onUploadSuccess={handleUploadSuccess} />

        {/* 上传结果展示 */}
        {currentResult && (
          <div className="w-full max-w-2xl mx-auto mt-8">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 space-y-4">
              {/* 图片预览 */}
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                  <img
                    src={currentResult.url}
                    alt="预览"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5org91L2RlZmF1bHQtaW1hZ2Uuc2xnIi8+';
                    }}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-200 mb-2">上传成功</h3>
                  <p className="text-sm text-gray-400 truncate">{currentResult.name}</p>
                </div>
              </div>

              {/* 链接输入框 */}
              <div className="relative">
                <input
                  type="text"
                  value={currentResult.url}
                  readOnly
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pr-24 text-sm text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={handleCopy}
                  className={twMerge(
                    'absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                    copySuccess
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  )}
                >
                  {copySuccess ? '已复制' : '复制'}
                </button>
              </div>

              {/* 操作提示 */}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" />
                  <span>支持 JPG、PNG、GIF 等格式</span>
                </div>
                <div className="flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  <span>永久有效链接</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 历史记录 */}
 <HistoryList />
      </main>

      {/* 页脚 */}
      <footer className="border-t border-gray-800 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>LinkSee © 2026 - 灵犀在线工具箱</p>
          <p className="mt-2 text-xs">
            数据存储在本地 · 无广告 · 隐私优先
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
