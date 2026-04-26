import { useState, useCallback } from 'react';
import { Copy, Check, AlertCircle, ArrowRightLeft, FileCode, Compress, Expand } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

/**
 * JSON 格式化组件
 * 支持：格式化、压缩、校验、JSON转TypeScript
 */
export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('format'); // format | compress | validate | typescript
  const [copied, setCopied] = useState(false);

  // 处理 JSON 操作
  const processJson = useCallback(() => {
    setError('');
    setOutput('');

    if (!input.trim()) {
      setError('请输入 JSON 内容');
      return;
    }

    try {
      let parsed = JSON.parse(input);

      switch (mode) {
        case 'format':
          setOutput(JSON.stringify(parsed, null, 2));
          break;
        case 'compress':
          setOutput(JSON.stringify(parsed));
          break;
        case 'validate':
          setOutput('✅ JSON 格式有效');
          break;
        case 'typescript':
          setOutput(jsonToTypeScript(parsed, 'Root'));
          break;
        default:
          break;
      }
    } catch (err) {
      setError(`解析错误: ${err.message}`);
    }
  }, [input, mode]);

  // JSON 转 TypeScript 类型
  const jsonToTypeScript = (obj, name = 'Root', indent = 0) => {
    const spaces = '  '.repeat(indent);
    
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    
    const type = typeof obj;
    
    if (type === 'string') return 'string';
    if (type === 'number') return 'number';
    if (type === 'boolean') return 'boolean';
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'any[]';
      const itemType = jsonToTypeScript(obj[0], name + 'Item', indent);
      return `${itemType}[]`;
    }
    
    if (type === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) return 'Record<string, any>';
      
      const properties = keys.map(key => {
        const valueType = jsonToTypeScript(obj[key], key.charAt(0).toUpperCase() + key.slice(1), indent + 1);
        const optional = Array.isArray(obj) ? '' : '?';
        return `${spaces}  ${key}${optional}: ${valueType};`;
      }).join('\n');
      
      return `{\n${properties}\n${spaces}}`;
    }
    
    return 'any';
  };

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

  const modes = [
    { id: 'format', label: '格式化', icon: Expand },
    { id: 'compress', label: '压缩', icon: Compress },
    { id: 'validate', label: '校验', icon: AlertCircle },
    { id: 'typescript', label: '转TS类型', icon: FileCode },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 模式选择 */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-800/50 rounded-xl p-1 border border-gray-700">
          {modes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={twMerge(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                mode === id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 输入输出区域 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 输入 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">输入 JSON</label>
            <button
              onClick={handlePaste}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <ArrowRightLeft className="w-3 h-3" />
              粘贴
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"name": "LinkSee", "version": 1.0}'
            className="w-full h-64 bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-sm font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* 输出 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">输出结果</label>
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

      {/* 操作按钮 */}
      <div className="flex justify-center">
        <button
          onClick={processJson}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all flex items-center gap-2"
        >
          <ArrowRightLeft className="w-5 h-5" />
          开始处理
        </button>
      </div>
    </div>
  );
}