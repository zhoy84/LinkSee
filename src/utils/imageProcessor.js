/**
 * 图片处理器 - 纯前端图片转换与压缩工具
 * 支持格式互转、智能压缩、SVG 矢量化、批量处理
 */

import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * 支持的输入格式
 */
export const SUPPORTED_INPUT_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/heic', 'image/heif'];

/**
 * 支持的目标格式
 */
export const TARGET_FORMATS = [
  { value: 'image/jpeg', label: 'JPG', ext: '.jpg' },
  { value: 'image/png', label: 'PNG', ext: '.png' },
  { value: 'image/webp', label: 'WEBP', ext: '.webp' },
  { value: 'image/svg+xml', label: 'SVG (矢量)', ext: '.svg' },
  { value: 'image/x-icon', label: 'ICO', ext: '.ico' },
];

/**
 * 压缩配置默认值
 */
export const DEFAULT_COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  quality: 0.8,
  initialQuality: 80, // 用于 UI 滑块 (0-100)
};

/**
 * 获取文件名和扩展名
 */
const getFileName = (file) => {
  const lastDot = file.name.lastIndexOf('.');
  return lastDot >= 0 ? file.name.substring(0, lastDot) : file.name;
};

/**
 * 获取文件扩展名
 */
const getFileExtension = (file) => {
  const lastDot = file.name.lastIndexOf('.');
  return lastDot >= 0 ? file.name.substring(lastDot) : '';
};

/**
 * 将 File 对象转换为 Blob
 */
const fileToBlob = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Blob([reader.result], { type: file.type }));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 将 Blob 转换为 File
 */
const blobToFile = (blob, originalFile, newExt) => {
  const fileName = getFileName(originalFile) + newExt;
  return new File([blob], fileName, { type: blob.type });
};

/**
 * 处理 HEIC 格式转换（转为 JPG）
 */
export const convertHeicToJpeg = async (file) => {
  try {
    const blob = await heic2any({
      blob: await fileToBlob(file),
      toType: 'image/jpeg',
      quality: 0.9,
    });
    return blobToFile(blob, file, '.jpg');
  } catch (error) {
    console.error('HEIC 转换失败:', error);
    throw new Error('HEIC 格式转换失败，请重试');
  }
};

/**
 * 压缩图片
 */
export const compressImage = async (file, options) => {
  const compressionOptions = {
    maxSizeMB: options.maxSizeMB || DEFAULT_COMPRESSION_OPTIONS.maxSizeMB,
    maxWidthOrHeight: options.maxWidthOrHeight || DEFAULT_COMPRESSION_OPTIONS.maxWidthOrHeight,
    useWebWorker: DEFAULT_COMPRESSION_OPTIONS.useWebWorker,
    quality: (options.quality || DEFAULT_COMPRESSION_OPTIONS.initialQuality) / 100,
    fileType: options.targetFormat || file.type,
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    return compressedFile;
  } catch (error) {
    console.error('压缩失败:', error);
    throw new Error('图片压缩失败，请重试');
  }
};

/**
 * 转换图片格式
 */
export const convertImageFormat = async (file, targetFormat) => {
  // 如果是 HEIC 格式，先转为 JPG
  let sourceFile = file;
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    sourceFile = await convertHeicToJpeg(file);
  }

  // 如果目标格式是 SVG，使用矢量化
  if (targetFormat === 'image/svg+xml') {
    return await traceToSVG(sourceFile);
  }

  // 如果目标格式是 ICO，需要特殊处理
  if (targetFormat === 'image/x-icon') {
    return await convertToICO(sourceFile);
  }

  // 普通格式转换：创建 canvas 绘制并导出
  return await convertWithCanvas(sourceFile, targetFormat);
};

/**
 * 使用 Canvas 转换格式
 */
const convertWithCanvas = async (file, targetFormat) => {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const ext = TARGET_FORMATS.find(f => f.value === targetFormat)?.ext || '.jpg';
          resolve(blobToFile(blob, file, ext));
        } else {
          reject(new Error('格式转换失败'));
        }
      },
      targetFormat,
      0.92
    );
  });
};

/**
 * 转换为 ICO 格式（生成 32x32 和 64x64 两个尺寸）
 */
const convertToICO = async (file) => {
  const bitmap = await createImageBitmap(file);
  
  // 生成 32x32 尺寸
  const canvas32 = document.createElement('canvas');
  canvas32.width = 32;
  canvas32.height = 32;
  const ctx32 = canvas32.getContext('2d');
  ctx32.drawImage(bitmap, 0, 0, 32, 32);
  
  // 生成 64x64 尺寸
  const canvas64 = document.createElement('canvas');
  canvas64.width = 64;
  canvas64.height = 64;
  const ctx64 = canvas64.getContext('2d');
  ctx64.drawImage(bitmap, 0, 0, 64, 64);
  
  // 简单处理：返回 PNG（浏览器通常支持将 PNG 作为 ICO 使用）
  return new Promise((resolve) => {
    canvas64.toBlob(
      (blob) => {
        if (blob) {
          resolve(blobToFile(blob, file, '.ico'));
        }
      },
      'image/png'
    );
  });
};

/**
 * SVG 矢量化（使用 imagetracerjs）
 */
const traceToSVG = async (file) => {
  // 动态导入 imagetracerjs（按需加载）
  const ImageTracer = (await import('imagetracerjs')).default;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imgData = reader.result;
        ImageTracer.imageToSVG(
          imgData,
          (svgString) => {
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            resolve(blobToFile(blob, file, '.svg'));
          },
          {
            ltres: 1,
            qtres: 1,
            pathomit: 8,
            rightangleenhance: false,
            colorsampling: 2,
            numberofcolors: 16,
            mincolorratio: 0,
            colorquantcycles: 3,
          }
        );
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 调整图片尺寸（保持比例）
 */
export const resizeImage = async (file, maxWidth, maxHeight) => {
  const bitmap = await createImageBitmap(file);
  
  let { width, height } = bitmap;
  
  // 计算缩放比例
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blobToFile(blob, file, getFileExtension(file)));
        }
      },
      file.type,
      0.95
    );
  });
};

/**
 * 批量处理图片
 */
export const processBatch = async (files, options, onProgress) => {
  const results = [];
  const total = files.length;
  
  for (let i = 0; i < files.length; i++) {
    try {
      const file = files[i];
      let processedFile = file;
      
      // 调整尺寸
      if (options.resize && (options.maxWidth || options.maxHeight)) {
        processedFile = await resizeImage(
          processedFile,
          options.maxWidth || 4096,
          options.maxHeight || 4096
        );
      }
      
      // 格式转换
      if (options.targetFormat && options.targetFormat !== file.type) {
        processedFile = await convertImageFormat(processedFile, options.targetFormat);
      }
      
      // 压缩
      if (options.quality !== undefined && options.quality < 100) {
        processedFile = await compressImage(processedFile, {
          quality: options.quality,
          targetFormat: options.targetFormat,
        });
      }
      
      results.push({
        original: file,
        processed: processedFile,
        success: true,
      });
    } catch (error) {
      results.push({
        original: file,
        error: error.message,
        success: false,
      });
    }
    
    // 进度回调
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }
  
  return results;
};

/**
 * 打包下载多个文件
 */
export const downloadAsZip = async (files, zipName = 'images.zip') => {
  const zip = new JSZip();
  
  files.forEach((file) => {
    zip.file(file.name, file);
  });
  
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipName);
};

/**
 * 下载单个文件
 */
export const downloadFile = (file) => {
  saveAs(file);
};

/**
 * 估算压缩后文件大小
 */
export const estimateFileSize = async (file, quality) => {
  // 简单估算：原大小 * (质量 / 100)
  const estimatedSize = Math.round(file.size * (quality / 100));
  return formatFileSize(estimatedSize);
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * 获取图片信息
 */
export const getImageInfo = async (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        type: file.type,
        size: file.size,
        name: file.name,
      });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
