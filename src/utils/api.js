/**
 * 图片上传 API 调用模块
 * 调用第三方图床接口实现图片上传功能
 */

const API_URL = 'https://img.131213.xyz/upload';

/**
 * 上传图片到图床
 * @param {File} file - 要上传的图片文件
 * @param {Function} onProgress - 上传进度回调函数
 * @returns {Promise<{url: string, name: string}>} 返回图片 URL 和名称
 * @throws {Error} 上传失败时抛出错误
 */
export async function uploadImage(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`上传失败：${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // 解析返回的 JSON，提取 url 字段
    if (data.url) {
      return {
        url: data.url,
        name: file.name,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('API 返回的数据中缺少 url 字段');
    }
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('网络错误：无法连接到图床服务器，请检查网络连接');
    }
    throw error;
  }
}
