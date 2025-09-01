/**
 * 聊天消息组件
 */
import React from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Lightbulb, Wrench, Eye, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const MessageContainer = styled.div`
  display: flex;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const MessageAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  background: ${props => {
    switch (props.type) {
      case 'user': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'assistant': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case 'thought': return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      case 'action': return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      case 'observation': return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
      case 'error': return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
      default: return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }
  }};
  color: white;
  font-size: 18px;
`;

const MessageContent = styled.div`
  flex: 1;
  background: ${props => {
    switch (props.type) {
      case 'user': return '#f8f9fa';
      case 'error': return '#ffeaa7';
      default: return 'white';
    }
  }};
  border: 1px solid ${props => {
    switch (props.type) {
      case 'user': return '#e9ecef';
      case 'thought': return '#74b9ff';
      case 'action': return '#00b894';
      case 'observation': return '#fdcb6e';
      case 'error': return '#e17055';
      default: return '#ddd';
    }
  }};
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
`;

const MessageType = styled.span`
  font-weight: bold;
  color: ${props => {
    switch (props.type) {
      case 'thought': return '#0984e3';
      case 'action': return '#00b894';
      case 'observation': return '#e17055';
      case 'error': return '#d63031';
      default: return '#636e72';
    }
  }};
`;

const MessageTime = styled.span`
  margin-left: auto;
  font-size: 11px;
  opacity: 0.7;
`;

const MessageText = styled.div`
  line-height: 1.6;
  
  /* Markdown样式 */
  h1, h2, h3, h4, h5, h6 {
    margin: 12px 0 8px 0;
    color: #2d3748;
  }
  
  p {
    margin: 8px 0;
  }
  
  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
  }
  
  li {
    margin: 4px 0;
  }
  
  code {
    background: #f1f3f4;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9em;
  }
  
  blockquote {
    border-left: 4px solid #ddd;
    margin: 12px 0;
    padding-left: 16px;
    color: #666;
  }

  /* 表格样式 */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
  }
  
  th, td {
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
  }
  
  th {
    background-color: #f8f9fa;
    font-weight: bold;
  }
`;

const ActionDetails = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-style: italic;
  
  .loading-dots {
    display: flex;
    gap: 2px;
  }
  
  .dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #666;
    animation: bounce 1.4s ease-in-out infinite both;
  }
  
  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
`;

const getMessageIcon = (type) => {
  switch (type) {
    case 'user': return <User size={20} />;
    case 'assistant': return <Bot size={20} />;
    case 'thought': return <Lightbulb size={20} />;
    case 'action': return <Wrench size={20} />;
    case 'observation': return <Eye size={20} />;
    case 'error': return <AlertCircle size={20} />;
    default: return <Bot size={20} />;
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case 'user': return '用户';
    case 'assistant': return '助手';
    case 'thought': return '思考';
    case 'action': return '行动';
    case 'observation': return '观察';
    case 'error': return '错误';
    default: return '消息';
  }
};

const CodeBlock = ({ language, value }) => {
  return (
    <SyntaxHighlighter
      style={vscDarkPlus}
      language={language || 'text'}
      PreTag="div"
      customStyle={{
        margin: '12px 0',
        borderRadius: '8px',
        fontSize: '13px'
      }}
    >
      {value}
    </SyntaxHighlighter>
  );
};

const ChatMessage = ({ message, isLoading = false }) => {
  const { type, content, timestamp, action, args, executionTime } = message;
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <LoadingIndicator>
          <Bot size={16} />
          正在思考中
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </LoadingIndicator>
      );
    }

    return (
      <>
        <MessageText>
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <CodeBlock
                    language={match[1]}
                    value={String(children).replace(/\n$/, '')}
                    {...props}
                  />
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </MessageText>
        
        {/* 显示行动详情 */}
        {type === 'action' && action && args && (
          <ActionDetails>
            <div><strong>工具:</strong> {action}</div>
            <div><strong>参数:</strong> {JSON.stringify(args, null, 2)}</div>
            {executionTime && (
              <div><strong>执行时间:</strong> {executionTime}ms</div>
            )}
          </ActionDetails>
        )}
      </>
    );
  };

  return (
    <MessageContainer>
      <MessageAvatar type={type}>
        {getMessageIcon(type)}
      </MessageAvatar>
      <MessageContent type={type}>
        <MessageHeader>
          <MessageType type={type}>
            {getTypeLabel(type)}
          </MessageType>
          {timestamp && (
            <MessageTime>
              {formatTimestamp(timestamp)}
            </MessageTime>
          )}
        </MessageHeader>
        {renderContent()}
      </MessageContent>
    </MessageContainer>
  );
};

export default ChatMessage;