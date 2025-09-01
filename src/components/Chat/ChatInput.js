/**
 * 聊天输入组件
 */
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Send, Loader2, Square } from 'lucide-react';

const InputContainer = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px;
  background: white;
  border-top: 1px solid #e9ecef;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
`;

const InputWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 50px;
  max-height: 200px;
  padding: 12px 50px 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  font-family: inherit;
  background: #f8f9fa;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
    background: white;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  &:disabled {
    background: #e9ecef;
    color: #6c757d;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #6c757d;
  }
`;

const SendButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: ${props => props.disabled ? '#6c757d' : '#007bff'};
  color: white;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #0056b3;
    transform: translateY(-50%) scale(1.05);
  }

  &:active:not(:disabled) {
    transform: translateY(-50%) scale(0.95);
  }
`;

const StopButton = styled.button`
  padding: 12px 20px;
  border: 2px solid #dc3545;
  border-radius: 12px;
  background: white;
  color: #dc3545;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #dc3545;
    color: white;
  }
`;

const CharacterCount = styled.div`
  position: absolute;
  bottom: -20px;
  right: 0;
  font-size: 11px;
  color: #6c757d;
`;

const SuggestionContainer = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
`;

const SuggestionItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f8f9fa;
  transition: background 0.2s ease;

  &:hover {
    background: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }

  .suggestion-title {
    font-weight: 500;
    color: #2d3748;
    margin-bottom: 4px;
  }

  .suggestion-desc {
    font-size: 12px;
    color: #6c757d;
  }
`;

const ChatInput = ({ 
  onSendMessage, 
  isLoading = false, 
  onStop,
  placeholder = "输入消息... (Shift + Enter换行，Enter发送)",
  maxLength = 2000 
}) => {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef(null);

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
      text: "创建一个长期投资策略，专注于BTC和ETH"
    },
    {
      title: "查看交易记录",
      desc: "获取最近的交易历史",
      text: "显示最近7天的交易记录"
    },
    {
      title: "转账操作",
      desc: "向他人转账",
      text: "转账1000USDT给张三"
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  const handleSuggestionClick = (suggestionText) => {
    setMessage(suggestionText);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // 当输入为空且不在加载状态时显示建议
  const shouldShowSuggestions = showSuggestions && !message.trim() && !isLoading;

  return (
    <InputContainer>
      <InputWrapper>
        {shouldShowSuggestions && (
          <SuggestionContainer>
            {suggestions.map((suggestion, index) => (
              <SuggestionItem 
                key={index}
                onClick={() => handleSuggestionClick(suggestion.text)}
              >
                <div className="suggestion-title">{suggestion.title}</div>
                <div className="suggestion-desc">{suggestion.desc}</div>
              </SuggestionItem>
            ))}
          </SuggestionContainer>
        )}
        
        <TextArea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          disabled={isLoading}
        />
        
        <SendButton 
          type="button"
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </SendButton>
        
        <CharacterCount>
          {message.length}/{maxLength}
        </CharacterCount>
      </InputWrapper>
      
      {isLoading && onStop && (
        <StopButton onClick={onStop}>
          <Square size={16} />
          停止
        </StopButton>
      )}
    </InputContainer>
  );
};

export default ChatInput;