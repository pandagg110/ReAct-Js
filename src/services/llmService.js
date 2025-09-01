/**
 * LLM服务 - 基于原项目的LLM提供者包装
 */
import { apiClient } from './apiClient';

class LLMServiceError extends Error {
  constructor(message, type = 'UNKNOWN', originalError = null) {
    super(message);
    this.name = 'LLMServiceError';
    this.type = type;
    this.originalError = originalError;
  }
}

class LLMService {
  constructor() {
    this.model = process.env.REACT_APP_LLM_MODEL || 'gpt-4o';
    this.temperature = parseFloat(process.env.REACT_APP_LLM_TEMPERATURE) || 0;
    this.maxTokens = parseInt(process.env.REACT_APP_LLM_MAX_TOKENS) || 4000;
    this.isConnected = false;
  }

  /**
   * 获取聊天完成响应
   * @param {Array} messages - 消息历史
   * @param {Object} options - 可选配置
   */
  async getChatCompletion(messages, options = {}) {
    const {
      model = this.model,
      temperature = this.temperature,
      maxTokens = this.maxTokens,
      stream = false
    } = options;

    try {
      const requestData = {
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        model,
        temperature,
        max_tokens: maxTokens,
        stream
      };

      console.log('🤖 调用LLM服务:', { model, temperature, messageCount: messages.length });

      const response = await apiClient.post('/functions/v1/llm-request', requestData);

      if (response.code === 200) {
        this.isConnected = true;
        return {
          content: response.data.content,
          usage: response.data.usage,
          model: response.data.model
        };
      } else {
        throw new LLMServiceError(
          response.message || 'LLM API返回错误',
          'API_ERROR',
          response
        );
      }
    } catch (error) {
      this.isConnected = false;
      
      if (error instanceof LLMServiceError) {
        throw error;
      }

      if (error.type === 'NETWORK_ERROR') {
        throw new LLMServiceError(
          '无法连接到LLM服务，请检查网络连接和服务状态',
          'CONNECTION_ERROR',
          error
        );
      }

      if (error.type === 'RESPONSE_ERROR') {
        throw new LLMServiceError(
          error.message || 'LLM服务响应错误',
          'API_ERROR',
          error
        );
      }

      throw new LLMServiceError(
        error.message || 'LLM服务调用失败',
        'UNKNOWN',
        error
      );
    }
  }

  /**
   * 流式响应处理
   */
  async getChatCompletionStream(messages, options = {}, onChunk) {
    const streamOptions = { ...options, stream: true };
    
    try {
      // 注意: 这里需要根据实际的流式API实现
      // 目前先返回普通响应
      const result = await this.getChatCompletion(messages, streamOptions);
      if (onChunk) {
        onChunk(result.content);
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const testMessages = [{
        role: 'user',
        content: 'Hello, are you working?'
      }];

      await this.getChatCompletion(testMessages, { 
        model: this.model, 
        temperature: 0,
        maxTokens: 50 
      });
      
      this.isConnected = true;
      return { status: 'healthy', connected: true };
    } catch (error) {
      this.isConnected = false;
      return { 
        status: 'unhealthy', 
        connected: false, 
        error: error.message 
      };
    }
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      model: this.model,
      temperature: this.temperature,
      maxTokens: this.maxTokens
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config) {
    if (config.model) this.model = config.model;
    if (config.temperature !== undefined) this.temperature = config.temperature;
    if (config.maxTokens) this.maxTokens = config.maxTokens;
    
    if (config.apiToken) {
      apiClient.setAuthToken(config.apiToken);
    }
    if (config.baseURL) {
      apiClient.updateConfig({ baseURL: config.baseURL });
    }
  }

  /**
   * 解析ReAct响应格式
   */
  parseReActResponse(text) {
    const thoughtMatch = text.match(/Thought: (.*?)(?=\n|$)/);
    const actionMatch = text.match(/Action: (.*?)(?=\n|$)/);
    const argsMatch = text.match(/Args: ({.*?})(?=\n|$)/);

    if (thoughtMatch && actionMatch && argsMatch) {
      try {
        return {
          type: 'action',
          thought: thoughtMatch[1].trim(),
          action: actionMatch[1].trim(),
          args: JSON.parse(argsMatch[1].trim()),
          raw: text
        };
      } catch (error) {
        return {
          type: 'parse_error',
          error: 'Failed to parse JSON args',
          raw: text
        };
      }
    }

    return {
      type: 'final_answer',
      content: text,
      raw: text
    };
  }
}

// 全局实例
export const llmService = new LLMService();
export { LLMServiceError };
export default LLMService;