/**
 * 工具执行历史组件
 */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  History, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Filter
} from 'lucide-react';
import { toolService } from '../../services/toolService';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const HistoryContainer = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const HistoryHeader = styled.div`
  padding: 16px 20px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: between;
  cursor: pointer;
  user-select: none;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
`;

const FilterButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const HistoryContent = styled.div`
  max-height: ${props => props.collapsed ? '0' : '300px'};
  overflow-y: auto;
  transition: max-height 0.3s ease;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f8f9fa;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #dee2e6;
    border-radius: 2px;
  }
`;

const HistoryList = styled.div`
  padding: 0;
`;

const HistoryItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 12px 20px;
  border-bottom: 1px solid #f8f9fa;
  transition: background 0.2s ease;
  
  &:hover {
    background: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatusIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.success ? '#d4edda' : '#f8d7da'};
  color: ${props => props.success ? '#155724' : '#721c24'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  margin-top: 2px;
  flex-shrink: 0;
`;

const HistoryContent_Item = styled.div`
  flex: 1;
`;

const HistoryItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const ToolName = styled.span`
  font-weight: 600;
  color: #2d3748;
  font-size: 13px;
`;

const ExecutionTime = styled.span`
  font-size: 11px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
`;

const Timestamp = styled.div`
  font-size: 11px;
  color: #868e96;
  margin-bottom: 4px;
`;

const Args = styled.div`
  font-size: 11px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 6px 8px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  word-break: break-all;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ErrorMessage = styled.div`
  font-size: 11px;
  color: #721c24;
  background: #f8d7da;
  padding: 6px 8px;
  border-radius: 4px;
  margin-top: 4px;
`;

const EmptyState = styled.div`
  padding: 30px 20px;
  text-align: center;
  color: #6c757d;
  
  .icon {
    margin-bottom: 8px;
    opacity: 0.5;
  }
  
  .text {
    font-size: 13px;
  }
`;

const FilterDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
  
  .filter-option {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 12px;
    border-bottom: 1px solid #f8f9fa;
    
    &:hover {
      background: #f8f9fa;
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    &.active {
      background: #007bff;
      color: white;
    }
  }
`;

const FilterContainer = styled.div`
  position: relative;
`;

const ToolHistory = ({ className }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('all');

  // 过滤选项
  const filterOptions = [
    { key: 'all', label: '全部', count: 0 },
    { key: 'success', label: '成功', count: 0 },
    { key: 'error', label: '错误', count: 0 },
    { key: 'recent', label: '最近1小时', count: 0 }
  ];

  // 加载历史记录
  const loadHistory = () => {
    const rawHistory = toolService.getExecutionHistory(30);
    setHistory(rawHistory);
    applyFilter(rawHistory, currentFilter);
  };

  // 应用过滤器
  const applyFilter = (data, filter) => {
    let filtered = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    switch (filter) {
      case 'success':
        filtered = data.filter(item => item.success);
        break;
      case 'error':
        filtered = data.filter(item => !item.success);
        break;
      case 'recent':
        filtered = data.filter(item => new Date(item.timestamp) >= oneHourAgo);
        break;
      default:
        filtered = data;
    }

    setFilteredHistory(filtered);

    // 更新过滤选项计数
    filterOptions[0].count = data.length;
    filterOptions[1].count = data.filter(item => item.success).length;
    filterOptions[2].count = data.filter(item => !item.success).length;
    filterOptions[3].count = data.filter(item => new Date(item.timestamp) >= oneHourAgo).length;
  };

  useEffect(() => {
    loadHistory();
    
    // 每5秒刷新一次
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, [currentFilter]);

  const handleFilterChange = (filterKey) => {
    setCurrentFilter(filterKey);
    setShowFilter(false);
    applyFilter(history, filterKey);
  };

  const formatTimestamp = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: zhCN 
    });
  };

  const formatArgs = (args) => {
    if (!args || Object.keys(args).length === 0) return '无参数';
    return JSON.stringify(args);
  };

  return (
    <HistoryContainer className={className}>
      <HistoryHeader onClick={() => setCollapsed(!collapsed)}>
        <div className="header-left">
          <History size={16} />
          <HeaderTitle>执行历史 ({filteredHistory.length})</HeaderTitle>
        </div>
        <div className="header-actions">
          <FilterContainer>
            <FilterButton onClick={(e) => { e.stopPropagation(); setShowFilter(!showFilter); }}>
              <Filter size={14} />
            </FilterButton>
            {showFilter && (
              <FilterDropdown>
                {filterOptions.map(option => (
                  <div
                    key={option.key}
                    className={`filter-option ${currentFilter === option.key ? 'active' : ''}`}
                    onClick={() => handleFilterChange(option.key)}
                  >
                    {option.label} ({option.count})
                  </div>
                ))}
              </FilterDropdown>
            )}
          </FilterContainer>
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </HistoryHeader>

      <HistoryContent collapsed={collapsed}>
        {filteredHistory.length > 0 ? (
          <HistoryList>
            {filteredHistory.map((item, index) => (
              <HistoryItem key={item.id}>
                <StatusIcon success={item.success}>
                  {item.success ? <CheckCircle size={12} /> : <XCircle size={12} />}
                </StatusIcon>
                <HistoryContent_Item>
                  <HistoryItemHeader>
                    <ToolName>{item.toolName}</ToolName>
                    <ExecutionTime>
                      <Clock size={10} style={{ marginRight: '2px' }} />
                      {item.executionTime}ms
                    </ExecutionTime>
                  </HistoryItemHeader>
                  <Timestamp>{formatTimestamp(item.timestamp)}</Timestamp>
                  <Args>{formatArgs(item.args)}</Args>
                  {!item.success && item.error && (
                    <ErrorMessage>❌ {item.error}</ErrorMessage>
                  )}
                </HistoryContent_Item>
              </HistoryItem>
            ))}
          </HistoryList>
        ) : (
          <EmptyState>
            <div className="icon">
              <History size={24} />
            </div>
            <div className="text">暂无执行记录</div>
          </EmptyState>
        )}
      </HistoryContent>
    </HistoryContainer>
  );
};

export default ToolHistory;