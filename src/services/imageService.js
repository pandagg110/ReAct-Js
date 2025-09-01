/**
 * 图片识别服务
 */
import axios from 'axios';

class ImageService {
  constructor() {
    // 开发环境使用代理，生产环境使用完整URL
    this.baseURL = process.env.REACT_APP_IMAGE_API_URL || 
      (process.env.NODE_ENV === 'development' ? '' : 'https://xhfljjpfjwbixxbfummv.supabase.co');
    this.imageApiToken = process.env.REACT_APP_IMAGE_API_TOKEN;
    
    // 创建专门用于图片识别的axios实例
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000, // 图片识别可能需要更长时间
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log('🖼️ 发送图片识别请求:', config.url);
        return config;
      },
      (error) => {
        console.error('❌ 图片识别请求错误:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        console.log('✅ 图片识别响应成功:', response.status);
        return response;
      },
      (error) => {
        console.error('❌ 图片识别响应错误:', error.response?.status, error.message);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  // 错误处理
  handleError(error) {
    if (error.response) {
      // 服务器响应错误
      return {
        type: 'IMAGE_API_ERROR',
        status: error.response.status,
        message: error.response.data?.message || '图片识别服务错误',
        data: error.response.data
      };
    } else if (error.request) {
      // 网络错误
      return {
        type: 'NETWORK_ERROR',
        message: '无法连接到图片识别服务，请检查网络连接',
        originalError: error
      };
    } else {
      // 其他错误
      return {
        type: 'UNKNOWN_ERROR',
        message: error.message || '图片识别服务未知错误',
        originalError: error
      };
    }
  }

  // 检查token配置
  checkTokenConfig() {
    if (!this.imageApiToken || this.imageApiToken === 'YOUR_JWT_TOKEN') {
      throw new Error('请先在.env文件中配置REACT_APP_IMAGE_API_TOKEN');
    }
  }

  // 识别图片内容
  async recognizeImage(imageFile, options = {}) {
    try {
      // 检查token配置
      this.checkTokenConfig();

      // 验证文件
      if (!imageFile || !(imageFile instanceof File)) {
        throw new Error('请提供有效的图片文件');
      }

      // 检查文件类型
      if (!imageFile.type.startsWith('image/')) {
        throw new Error('文件必须是图片格式');
      }

      // 检查文件大小 (限制10MB)
      const maxSize = 10 * 1024 * 1024;
      if (imageFile.size > maxSize) {
        throw new Error('图片文件大小不能超过10MB');
      }

      console.log('🖼️ 开始识别图片:', {
        name: imageFile.name,
        size: `${Math.round(imageFile.size / 1024)}KB`,
        type: imageFile.type
      });

      // 创建FormData
      const formData = new FormData();
      formData.append('image', imageFile);

      // 添加其他参数
      if (options.prompt) {
        formData.append('prompt', options.prompt);
      }

      // 发送请求
      const response = await this.client.post('/functions/v1/llm-image-request', formData, {
        headers: {
          'Authorization': `Bearer ${this.imageApiToken}`,
          'Content-Type': 'multipart/form-data',
        },
        ...options.axiosOptions
      });

      // 处理响应
      if (response.data && response.data.code === 200) {
        const result = {
          success: true,
          content: response.data.data?.content || '识别完成',
          role: response.data.data?.role || 'assistant',
          message: response.data.message || 'Success',
          status: response.data.status || 'success',
          rawResponse: response.data
        };

        console.log('✅ 图片识别成功:', {
          contentLength: result.content.length,
          role: result.role
        });

        return result;
      } else {
        throw new Error(response.data?.message || '图片识别失败');
      }

    } catch (error) {
      console.error('❌ 图片识别失败:', error);
      
      // 如果是我们自己抛出的错误，直接抛出
      if (error.message.includes('请先在.env文件中配置') || 
          error.message.includes('请提供有效的') ||
          error.message.includes('文件必须是') ||
          error.message.includes('图片文件大小')) {
        throw error;
      }

      // 处理其他错误
      const processedError = typeof error === 'object' && error.type ? error : this.handleError(error);
      throw new Error(processedError.message);
    }
  }

  // 批量识别图片
  async recognizeImages(imageFiles, options = {}) {
    if (!Array.isArray(imageFiles) || imageFiles.length === 0) {
      throw new Error('请提供图片文件数组');
    }

    console.log(`🖼️ 开始批量识别 ${imageFiles.length} 张图片`);

    const results = [];
    const errors = [];

    for (let i = 0; i < imageFiles.length; i++) {
      try {
        const result = await this.recognizeImage(imageFiles[i], options);
        results.push({
          index: i,
          file: imageFiles[i],
          result
        });
      } catch (error) {
        errors.push({
          index: i,
          file: imageFiles[i],
          error: error.message
        });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      total: imageFiles.length,
      successCount: results.length,
      errorCount: errors.length
    };
  }

  // 设置API Token
  setImageApiToken(token) {
    this.imageApiToken = token;
  }

  // 健康检查
  async healthCheck() {
    try {
      // 这里可以调用一个简单的健康检查端点
      // 如果没有专门的健康检查端点，可以尝试访问基础URL
      await this.client.get('/', {
        timeout: 5000
      });
      return {
        connected: true,
        status: 'healthy',
        message: '图片识别服务连接正常'
      };
    } catch (error) {
      return {
        connected: false,
        status: 'unhealthy',
        message: '图片识别服务连接失败'
      };
    }
  }
}

// 全局实例
export const imageService = new ImageService();
export default ImageService;