/**
 * API客户端 - 统一处理HTTP请求
 */
import axios from 'axios';

class ApiClient {
  constructor(config = {}) {
    // 开发环境使用代理，生产环境使用完整URL
    this.baseURL = config.baseURL || process.env.REACT_APP_API_URL || 
      (process.env.NODE_ENV === 'development' ? '' : 'https://xhfljjpfjwbixxbfummv.supabase.co');
    this.timeout = config.timeout || 30000;
    this.apiToken = config.apiToken || process.env.REACT_APP_API_TOKEN;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiToken && { 'Authorization': `Bearer ${this.apiToken}` })
      }
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log('🚀 发送请求:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('❌ 请求错误:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        console.log('✅ 响应成功:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('❌ 响应错误:', error.response?.status, error.config?.url);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  handleError(error) {
    if (error.response) {
      // 服务器响应错误
      return {
        type: 'RESPONSE_ERROR',
        status: error.response.status,
        message: error.response.data?.message || '服务器错误',
        data: error.response.data
      };
    } else if (error.request) {
      // 网络错误
      return {
        type: 'NETWORK_ERROR',
        message: '网络连接失败，请检查网络设置',
        originalError: error
      };
    } else {
      // 其他错误
      return {
        type: 'UNKNOWN_ERROR',
        message: error.message || '未知错误',
        originalError: error
      };
    }
  }

  async post(url, data = {}) {
    try {
      const response = await this.client.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async get(url, params = {}) {
    try {
      const response = await this.client.get(url, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // 设置认证token
  setAuthToken(token) {
    this.apiToken = token;
    if (token) {
      this.client.defaults.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers['Authorization'];
    }
  }

  // 更新配置
  updateConfig(newConfig) {
    if (newConfig.baseURL) {
      this.client.defaults.baseURL = newConfig.baseURL;
    }
    if (newConfig.timeout) {
      this.client.defaults.timeout = newConfig.timeout;
    }
  }
}

// 全局实例
export const apiClient = new ApiClient();
export default ApiClient;