/**
 * 聊天窗口主组件
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { llmService } from '../../services/llmService';
import { toolService } from '../../services/toolService';
import { imageService } from '../../services/imageService';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
`;

const ChatHeader = styled.div`
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChatTitle = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: ${props => props.connected ? '#28a745' : '#dc3545'};
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.connected ? '#28a745' : '#dc3545'};
    animation: ${props => props.connected ? 'none' : 'pulse 1s infinite'};
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #6c757d;
  
  .emoji {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #2d3748;
  }
  
  .subtitle {
    font-size: 14px;
    margin-bottom: 24px;
  }
  
  .suggestions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    max-width: 600px;
    margin-top: 24px;
  }
`;

const SuggestionCard = styled.button`
  padding: 16px;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  background: white;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
    transform: translateY(-1px);
  }
  
  .suggestion-title {
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 4px;
  }
  
  .suggestion-desc {
    font-size: 12px;
    color: #6c757d;
  }
`;

const StepIndicator = styled.div`
  padding: 8px 16px;
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 8px;
  font-size: 12px;
  color: #1976d2;
  text-align: center;
  margin: 8px 0;
`;

// ReAct系统提示词
const getReActPrompt = (toolsDescription) => {
  return `你是一个智能交易助手，使用ReAct模式进行推理和行动。

可用工具：
${toolsDescription}

请按以下格式响应：

Thought: [描述你的思考过程]
Action: [要执行的工具名称]
Args: [工具参数，JSON格式]

或者当你有最终答案时：
[直接给出最终回复，不需要工具调用]

重要规则：
1. 仔细思考用户需求，选择合适的工具
2. 确保参数格式正确
3. 如果不需要工具调用，直接回复
4. 用中文与用户交流`;
};

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 检查连接状态
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await llmService.healthCheck();
        setIsConnected(status.connected);
      } catch (error) {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // 添加消息
  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, {
      ...message,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString()
    }]);
  }, []);

  // 处理用户消息
  const handleSendMessage = async (messageData) => {
    // 支持传统的字符串格式和新的对象格式
    const isLegacyFormat = typeof messageData === 'string';
    const hasText = isLegacyFormat ? messageData.trim() : messageData.text?.trim();
    const hasImages = !isLegacyFormat && messageData.images && messageData.images.length > 0;
    
    if ((!hasText && !hasImages) || isLoading) return;

    // 处理图片消息
    if (!isLegacyFormat && hasImages) {
      await handleImageMessage(messageData);
    } else {
      // 处理纯文本消息
      const content = isLegacyFormat ? messageData : messageData.text;
      await handleTextMessage(content.trim());
    }
  };

  // 处理纯文本消息
  const handleTextMessage = async (content) => {
    // 添加用户消息
    addMessage({
      type: 'user',
      content: content
    });

    setIsLoading(true);
    setCurrentStep(0);

    // 创建终止控制器
    abortControllerRef.current = new AbortController();

    try {
      await executeReActLoop(content);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error);
        addMessage({
          type: 'error',
          content: `❌ **发生错误**\n\n${error.message || '未知错误'}`
        });
      }
    } finally {
      setIsLoading(false);
      setCurrentStep(0);
    }
  };

  // 处理图片消息
  const handleImageMessage = async (messageData) => {
    const { text, images } = messageData;
    
    // 添加用户消息（包含图片）
    addMessage({
      type: 'user',
      content: text || '请分析这张图片',
      images: images.map(file => ({
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file)
      }))
    });

    setIsLoading(true);
    setCurrentStep(0);

    // 创建终止控制器
    abortControllerRef.current = new AbortController();

    try {
      // 识别图片
      const imageResults = [];
      for (const imageFile of images) {
        try {
          addMessage({
            type: 'assistant',
            content: `🖼️ **正在识别图片: ${imageFile.name}**\n\n请稍候...`
          });

          const result = await imageService.recognizeImage(imageFile);
          
          addMessage({
            type: 'assistant',
            content: `✅ **图片识别完成**\n\n${result.content}`
          });

          imageResults.push({
            fileName: imageFile.name,
            recognition: result.content
          });
        } catch (error) {
          console.error('Image recognition error:', error);
          addMessage({
            type: 'error',
            content: `❌ **图片识别失败: ${imageFile.name}**\n\n${error.message}`
          });
        }
      }

      // 如果有成功识别的图片，继续进行ReAct处理
      if (imageResults.length > 0 && !abortControllerRef.current?.signal.aborted) {
        const imageContext = imageResults.map(result => 
          `图片"${result.fileName}"的识别结果: ${result.recognition}`
        ).join('\n\n');
        
        const fullPrompt = text ? 
          `${text}\n\n图片识别信息:\n${imageContext}` : 
          `请根据以下图片识别结果进行分析:\n${imageContext}`;

        await executeReActLoop(fullPrompt);
      }

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Image message error:', error);
        addMessage({
          type: 'error',
          content: `❌ **处理图片消息时发生错误**\n\n${error.message || '未知错误'}`
        });
      }
    } finally {
      setIsLoading(false);
      setCurrentStep(0);
    }
  };

  // 执行ReAct循环
  const executeReActLoop = async (userInput) => {
    const conversationHistory = [
      {
        role: 'system',
        content: getReActPrompt(toolService.getToolsDescription())
      },
      {
        role: 'user',
        content: userInput
      }
    ];

    const maxSteps = 10;
    let stepCount = 0;

    while (stepCount < maxSteps && !abortControllerRef.current?.signal.aborted) {
      stepCount++;
      setCurrentStep(stepCount);

      try {
        // 调用LLM
        const response = await llmService.getChatCompletion(conversationHistory);
        const parsed = llmService.parseReActResponse(response.content);

        if (parsed.type === 'action') {
          // 显示思考过程
          addMessage({
            type: 'thought',
            content: parsed.thought
          });

          // 显示行动
          addMessage({
            type: 'action',
            content: `🔧 **执行工具: ${parsed.action}**`,
            action: parsed.action,
            args: parsed.args
          });

          // 执行工具
          const toolResult = await toolService.executeTool(parsed.action, parsed.args);
          
          // 显示观察结果
          addMessage({
            type: 'observation',
            content: toolResult.result,
            executionTime: toolResult.executionTime
          });

          // 添加到对话历史
          conversationHistory.push({
            role: 'assistant',
            content: response.content
          });
          conversationHistory.push({
            role: 'assistant',
            content: `Observation: ${toolResult.result}`
          });

        } else if (parsed.type === 'final_answer') {
          // 最终答案
          addMessage({
            type: 'assistant',
            content: parsed.content
          });
          break;

        } else if (parsed.type === 'parse_error') {
          addMessage({
            type: 'error',
            content: `❌ **解析错误**\n\n${parsed.error}\n\n原始响应：\n\`\`\`\n${parsed.raw}\n\`\`\``
          });
          break;
        }

      } catch (error) {
        if (error.name === 'AbortError') {
          break;
        }
        throw error;
      }
    }

    if (stepCount >= maxSteps) {
      addMessage({
        type: 'error',
        content: '⚠️ **达到最大步骤数限制**\n\n为避免无限循环，已停止执行。'
      });
    }
  };

  // 停止执行
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setCurrentStep(0);
  };

  // 预设建议
  const suggestions = [
    {
      title: "查看投资组合",
      desc: "获取当前持仓和盈亏情况",
      text: "显示我的投资组合状态"
    },
    {
      title: "执行交易",
      desc: "买入或卖出加密货币",
      text: "买入100个SOL"
    },
    {
      title: "创建策略",
      desc: "配置投资策略并回测",
      text: "创建一个长期投资策略"
    },
    {
      title: "查看记录",
      desc: "获取最近的交易历史",
      text: "显示最近的交易记录"
    }
  ];

  return (
    <ChatContainer>
      <ChatHeader>
        <ChatTitle>🤖 ReAct 智能交易助手</ChatTitle>
        <StatusIndicator connected={isConnected}>
          <div className="status-dot"></div>
          {isConnected ? 'LLM已连接' : 'LLM未连接'}
        </StatusIndicator>
      </ChatHeader>

      <MessagesContainer>
        {messages.length === 0 ? (
          <EmptyState>
            <div className="emoji">🚀</div>
            <div className="title">欢迎使用ReAct智能助手</div>
            <div className="subtitle">
              我可以帮你进行加密货币交易、查看投资组合、配置策略等操作
            </div>
            <div className="suggestions">
              {suggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={index}
                  onClick={() => handleSendMessage(suggestion.text)}
                >
                  <div className="suggestion-title">{suggestion.title}</div>
                  <div className="suggestion-desc">{suggestion.desc}</div>
                </SuggestionCard>
              ))}
            </div>
          </EmptyState>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && currentStep > 0 && (
              <StepIndicator>
                🔄 正在执行第 {currentStep} 步...
              </StepIndicator>
            )}
            {isLoading && (
              <ChatMessage 
                message={{ type: 'assistant', content: '' }} 
                isLoading={true} 
              />
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </MessagesContainer>

      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onStop={handleStop}
      />
    </ChatContainer>
  );
};

export default ChatWindow;