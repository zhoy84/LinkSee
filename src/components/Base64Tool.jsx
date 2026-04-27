import { useState, useCallback } from 'react';
import { Copy, Check, AlertCircle, ArrowRightLeft, Lock, Unlock } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

/**
 * Base64 编解码组件
 * 支持：编码、解码、URL安全编码
 */
export default function Base64Tool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [inputError, setInputError] = useState('');
  const [mode, setMode] = useState('encode'); // encode | decode | url
  const [copied, setCopied] = useState(false);

  // 处理 Base64 操作
  const processBase64 = useCallback(() => {
    setError('');
    setOutput('');
    setInputError('');

    if (!input.trim()) {
      setInputError('请输入内容');
      return;
    }

    try {
      switch (mode) {
        case 'encode':
          // 普通 Base64 编码
          setOutput(btoa(unescape(encodeURIComponent(input))));
          break;
        case 'decode':
          // Base64 解码
          setOutput(decodeURIComponent(escape(atob(input.trim()))));
          break;
        case 'url':
          // URL 安全的 Base64 编码
          setOutput(btoa(unescape(encodeURIComponent(input))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
          break;
        default:
          break;
      }
    } catch (err) {
      setError('操作失败: 输入内容格式不正确');
    }
  }, [input, mode]);

  // 复制结果
  const handleCopy = useCallback(async () => {
    if (output) {
      try {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('复制失败:', err);
      }
    }
  }, [output]);

  // 粘贴
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      console.error('粘贴失败:', err);
    }
  }, []);

  // 交换输入输出
  const handleSwap = useCallback(() => {
    if (output) {
      setInput(output);
      setOutput('');
      setError('');
      setInputError('');
    }
  }, [output]);

  const modes = [
    { id: 'encode', label: '编码', icon: Lock },
    { id: 'decode', label: '解码', icon: Unlock },
    { id: 'url', label: 'URL安全', icon: Lock },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 模式选择 + 操作按钮 */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="inline-flex bg-gray-800/50 rounded-xl p-1 border border-gray-700">
          {modes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={twMerge(
                'px-2 sm:px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap',
                mode === id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={processBase64}
          className="px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all flex items-center gap-1.5 text-xs sm:text-sm"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          开始处理
        </button>
      </div>

      {/* 输入输出区域 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 输入 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300 whitespace-nowrap">输入内容</label>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePaste}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <ArrowRightLeft className="w-3 h-3" />
                粘贴
              </button>
              <button
                onClick={handleSwap}
                disabled={!output}
                className={twMerge(
                  'text-xs flex items-center gap-1 transition-all',
                  output ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600 cursor-not-allowed'
                )}
              >
                <ArrowRightLeft className="w-3 h-3 rotate-90" />
                交换
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setInputError(''); }}
            placeholder="请输入要处理的内容..."
            className={twMerge(
              'w-full h-64 bg-gray-800/50 border rounded-xl p-4 text-sm font-mono text-gray-200 placeholder-gray-500 focus:outline-none resize-none',
              inputError ? 'border-red-500/50' : 'border-gray-700 focus:border-blue-500'
            )}
          />
          {inputError && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {inputError}
            </p>
          )}
        </div>

        {/* 输出 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300 whitespace-nowrap">输出结果</label>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={twMerge(
                'text-xs flex items-center gap-1 transition-all',
                output ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600 cursor-not-allowed'
              )}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <textarea
            value={output || error}
            readOnly
            placeholder="结果将显示在这里"
            className={twMerge(
              'w-full h-64 bg-gray-800/30 border rounded-xl p-4 text-sm font-mono resize-none focus:outline-none',
              error
                ? 'border-red-500/50 text-red-400'
                : 'border-gray-700 text-gray-200'
            )}
          />
        </div>
      </div>
    </div>
  );
}