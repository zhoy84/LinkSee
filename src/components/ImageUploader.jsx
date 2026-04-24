import { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadImage } from '../utils/api';

/**
 * 图片上传组件
 * 支持拖拽上传、点击选择和粘贴板粘贴
 */
export default function ImageUploader({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  // 处理文件上传
  const handleUpload = useCallback(async (file) => {
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    setIsUploading(true);
    setError('');
    setProgress(0);

    try {
      // 模拟进度条（因为实际 API 不支持进度回调）
      let simulatedProgress = 0;
      const progressInterval = setInterval(() => {
        simulatedProgress += 10;
        if (simulatedProgress <= 90) {
          setProgress(simulatedProgress);
        }
      }, 100);

      const result = await uploadImage(file);
      
      clearInterval(progressInterval);
      setProgress(100);

      // 延迟一下让进度条完成
      setTimeout(() => {
        onUploadSuccess(result);
        setIsUploading(false);
        setProgress(0);
      }, 300);
    } catch (err) {
      setError(err.message);
      setIsUploading(false);
      setProgress(0);
    }
  }, [onUploadSuccess]);

  // 拖拽事件处理
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  }, [handleUpload]);

  // 点击上传
  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        handleUpload(files[0]);
      }
    };
    input.click();
  }, [handleUpload]);

  // 粘贴上传
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleUpload(file);
            break;
          }
        }
      }
    }
  }, [handleUpload]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center
          transition-all duration-200 cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-500/10 scale-105' 
            : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isUploading ? handleClick : undefined}
        onPaste={handlePaste}
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          className="hidden"
          id="file-input"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full bg-gray-700 ${isUploading ? 'animate-pulse' : ''}`}>
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-200">
              {isUploading ? '上传中...' : '点击或拖拽上传图片'}
            </p>
            <p className="text-sm text-gray-400">
              支持粘贴板粘贴，支持 JPG、PNG、GIF 等格式
            </p>
          </div>
        </div>

        {/* 进度条 */}
        {isUploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b-xl overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
          <X className="w-5 h-5 text-red-500" />
          <span className="text-red-400">{error}</span>
        </div>
      )}
    </div>
  );
}
