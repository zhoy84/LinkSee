import { useState, useCallback, useRef } from 'react';
import { Upload, Download, Trash2, Settings, Image, Zap, Package } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import {
  SUPPORTED_INPUT_FORMATS,
  TARGET_FORMATS,
  DEFAULT_COMPRESSION_OPTIONS,
  processBatch,
  downloadFile,
  downloadAsZip,
  formatFileSize,
  estimateFileSize,
  getImageInfo,
} from '../utils/imageProcessor';

/**
 * 图片格式转换与压缩大师组件
 */
export default function ImageConverter() {
  // 文件列表
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  // 全局设置
  const [globalSettings, setGlobalSettings] = useState({
    targetFormat: 'image/jpeg',
    quality: 80,
    maxWidth: 1920,
    maxHeight: 1920,
    resize: false,
  });

  const fileInputRef = useRef(null);

  // 处理文件选择
  const handleFileSelect = useCallback(async (selectedFiles) => {
    const newFiles = [];
    
    for (const file of selectedFiles) {
      // 验证文件类型
      if (!SUPPORTED_INPUT_FORMATS.includes(file.type)) {
        alert(`不支持的文件格式：${file.name}`);
        continue;
      }
      
      try {
        const info = await getImageInfo(file);
        newFiles.push({
          id: Math.random().toString(36).substring(7),
          file,
          info,
          processed: null,
          status: 'pending', // pending, processing, done, error
          error: null,
        });
      } catch (error) {
        console.error('读取图片信息失败:', error);
      }
    }
    
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  // 拖拽处理
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith('image/')
    );
    
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 点击上传
  const handleInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      handleFileSelect(selectedFiles);
    }
    // 重置 input 以允许重复选择同一文件
    e.target.value = '';
  };

  // 删除单个文件
  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // 处理单个文件
  const processFile = async (fileItem) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileItem.id ? { ...f, status: 'processing' } : f
      )
    );

    try {
      const results = await processBatch(
        [fileItem.file],
        {
          targetFormat: globalSettings.targetFormat,
          quality: globalSettings.quality,
          maxWidth: globalSettings.maxWidth,
          maxHeight: globalSettings.maxHeight,
          resize: globalSettings.resize,
        }
      );

      const result = results[0];
      
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? {
                ...f,
                processed: result.processed,
                status: result.success ? 'done' : 'error',
                error: result.error,
              }
            : f
        )
      );
    } catch (error) {
      console.error('处理失败:', error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? { ...f, status: 'error', error: error.message }
            : f
        )
      );
    }
  };

  // 批量处理
  const handleProcessAll = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setProcessing(true);
    setProgress({ current: 0, total: pendingFiles.length });

    try {
      const results = await processBatch(
        pendingFiles.map((f) => f.file),
        {
          targetFormat: globalSettings.targetFormat,
          quality: globalSettings.quality,
          maxWidth: globalSettings.maxWidth,
          maxHeight: globalSettings.maxHeight,
          resize: globalSettings.resize,
        },
        (current, total) => {
          setProgress({ current, total });
        }
      );

      // 更新文件状态
      setFiles((prev) => {
        const updated = [...prev];
        let resultIndex = 0;
        
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].status === 'pending' && resultIndex < results.length) {
            const result = results[resultIndex];
            updated[i] = {
              ...updated[i],
              processed: result.processed,
              status: result.success ? 'done' : 'error',
              error: result.error,
            };
            resultIndex++;
          }
        }
        
        return updated;
      });
    } catch (error) {
      console.error('批量处理失败:', error);
      alert('批量处理失败：' + error.message);
    } finally {
      setProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  // 下载单个文件
  const handleDownload = (fileItem) => {
    if (fileItem.processed) {
      downloadFile(fileItem.processed);
    }
  };

  // 批量下载
  const handleDownloadAll = async () => {
    const processedFiles = files
      .filter((f) => f.processed)
      .map((f) => f.processed);
    
    if (processedFiles.length === 0) return;
    
    await downloadAsZip(processedFiles, 'converted-images.zip');
  };

  // 清空所有
  const handleClearAll = () => {
    setFiles([]);
  };

  // 应用设置到单个文件
  const applySettingsToFile = async (fileItem, settings) => {
    // 临时处理单个文件使用不同设置
    await processFile(fileItem);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* 上传区域 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleInputClick}
        className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-800/30"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_INPUT_FORMATS.join(',')}
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
        
        <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-200 mb-2">
          拖拽图片到此处，或点击选择
        </h3>
        <p className="text-gray-400 mb-4">
          支持 JPG, PNG, WEBP, GIF, BMP, HEIC 格式
        </p>
        <p className="text-sm text-gray-500">
          支持批量上传，自动保持原始比例
        </p>
      </div>

      {/* 全局设置 */}
      {files.length > 0 && (
        <div className="mt-8 bg-gray-800/50 rounded-xl border border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-200">全局设置</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 目标格式 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                目标格式
              </label>
              <select
                value={globalSettings.targetFormat}
                onChange={(e) =>
                  setGlobalSettings({ ...globalSettings, targetFormat: e.target.value })
                }
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
              >
                {TARGET_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 质量滑块 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                质量：{globalSettings.quality}%
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={globalSettings.quality}
                onChange={(e) =>
                  setGlobalSettings({ ...globalSettings, quality: parseInt(e.target.value) })
                }
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>更小</span>
                <span>更好</span>
              </div>
            </div>

            {/* 尺寸调整 - 在移动端占满一行 */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="resize"
                  checked={globalSettings.resize}
                  onChange={(e) =>
                    setGlobalSettings({ ...globalSettings, resize: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-500"
                />
                <label htmlFor="resize" className="text-sm text-gray-400">
                  限制尺寸（保持比例）
                </label>
              </div>
              
              {globalSettings.resize && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      最大宽度 (px)
                    </label>
                    <input
                      type="number"
                      value={globalSettings.maxWidth}
                      onChange={(e) =>
                        setGlobalSettings({ ...globalSettings, maxWidth: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      最大高度 (px)
                    </label>
                    <input
                      type="number"
                      value={globalSettings.maxHeight}
                      onChange={(e) =>
                        setGlobalSettings({ ...globalSettings, maxHeight: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      {files.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-sm text-gray-400 whitespace-nowrap">
            共 {files.length} 张图片
            {processing && (
              <span className="ml-2 text-blue-400 block sm:inline">
                处理中：{progress.current} / {progress.total}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3 justify-end">
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap"
            >
              清空所有
            </button>
            
            <button
              onClick={handleProcessAll}
              disabled={processing || files.every((f) => f.status !== 'pending')}
              className={twMerge(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap',
                processing || files.every((f) => f.status !== 'pending')
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              )}
            >
              <Zap className="w-4 h-4 flex-shrink-0" />
              批量处理
            </button>
            
            {files.some((f) => f.processed) && (
              <button
                onClick={handleDownloadAll}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Package className="w-4 h-4 flex-shrink-0" />
                打包下载
              </button>
            )}
          </div>
        </div>
      )}

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          {files.map((fileItem) => (
            <FileCard
              key={fileItem.id}
              fileItem={fileItem}
              onProcess={() => processFile(fileItem)}
              onDownload={() => handleDownload(fileItem)}
              onRemove={() => removeFile(fileItem.id)}
              globalSettings={globalSettings}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 单个文件卡片组件
 */
function FileCard({ fileItem, onProcess, onDownload, onRemove, globalSettings }) {
  const { file, processed, status, error, info } = fileItem;
  
  // 估算处理后大小
  const estimatedSize = status === 'pending' 
    ? estimateFileSize(file.size, globalSettings.quality)
    : formatFileSize(processed?.size || 0);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      {/* 预览图 */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded overflow-hidden flex-shrink-0 bg-gray-700">
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">
          {file.name}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-400">
          <span className="whitespace-nowrap">{info?.width} × {info?.height}</span>
          <span className="hidden sm:inline">•</span>
          <span className="whitespace-nowrap">{formatFileSize(file.size)}</span>
          {status === 'done' && processed && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="text-green-400 whitespace-nowrap">
                {formatFileSize(file.size)} → {estimatedSize}
              </span>
            </>
          )}
        </div>
        
        {/* 状态显示 */}
        {status === 'processing' && (
          <p className="text-xs text-blue-400 mt-1">处理中...</p>
        )}
        {status === 'error' && (
          <p className="text-xs text-red-400 mt-1">错误：{error}</p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
        {status === 'pending' && (
          <button
            onClick={onProcess}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors whitespace-nowrap"
          >
            处理
          </button>
        )}
        
        {status === 'done' && (
          <button
            onClick={onDownload}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <Download className="w-3 h-3" />
            下载
          </button>
        )}
        
        <button
          onClick={onRemove}
          className="p-2 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
