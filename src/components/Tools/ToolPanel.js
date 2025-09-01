/**
 * 工具面板组件 - 显示已加载的工具和状态
 */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Wrench, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  Clock, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Settings
} from 'lucide-react';
import { toolService } from '../../services/toolService';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const PanelContainer = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const PanelHeader = styled.div`
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  
  .tool-count {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
`;

const ActionButton = styled.button`
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
    transform: scale(1.05);
  }
`;

const PanelContent = styled.div`
  max-height: ${props => props.collapsed ? '0' : '400px'};
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

const ToolList = styled.div`
  padding: 0;
`;

const ToolItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 16px 20px;
  border-bottom: 1px solid #f8f9fa;
  transition: background 0.2s ease;
  
  &:hover {
    background: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const ToolIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${props => {
    switch (props.category) {
      case 'trading': return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      case 'portfolio': return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
      case 'strategy': return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      case 'transfer': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case 'query': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      default: return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }
  }};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
`;

const ToolContent = styled.div`
  flex: 1;
`;

const ToolName = styled.div`
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToolDescription = styled.div`
  color: #6c757d;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 8px;
`;

const ToolStats = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 11px;
  color: #868e96;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatusBadge = styled.div`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'active': return '#d4edda';
      case 'idle': return '#fff3cd';
      case 'error': return '#f8d7da';
      default: return '#e2e3e5';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active': return '#155724';
      case 'idle': return '#856404';
      case 'error': return '#721c24';
      default: return '#383d41';
    }
  }};
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
  
  .icon {
    margin-bottom: 12px;
    opacity: 0.5;
  }
`;

const RefreshIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  color: #6c757d;
  font-size: 12px;
  
  .spinner {
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// 工具分类映射
const getToolCategory = (toolName) => {
  const categoryMap = {
    'execute_trade': 'trading',
    'get_portfolio_status': 'portfolio', 
    'configure_strategy': 'strategy',
    'get_strategy': 'strategy',
    'transfer_money': 'transfer',
    'get_recent_transactions': 'query',
    'get_tutorial_guide': 'query'
  };
  return categoryMap[toolName] || 'default';
};

// 获取工具图标
const getToolIcon = (category) => {
  const iconMap = {
    'trading': <TrendingUp size={18} />,
    'portfolio': <Activity size={18} />,
    'strategy': <Settings size={18} />,
    'transfer': <RefreshCw size={18} />,
    'query': <CheckCircle size={18} />,
    'default': <Wrench size={18} />
  };
  return iconMap[category] || iconMap.default;
};

const ToolPanel = ({ className }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [tools, setTools] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 加载工具列表
  const loadTools = () => {
    setIsRefreshing(true);
    
    setTimeout(() => {
      const toolsList = toolService.getToolsList();
      const history = toolService.getExecutionHistory(50);
      
      // 为每个工具添加统计信息
      const toolsWithStats = toolsList.map(tool => {
        const toolHistory = history.filter(h => h.toolName === tool.name);
        const successCount = toolHistory.filter(h => h.success).length;
        const totalCount = toolHistory.length;
        const lastExecution = toolHistory[0];
        
        return {
          ...tool,
          category: getToolCategory(tool.name),
          stats: {
            totalExecutions: totalCount,
            successRate: totalCount > 0 ? (successCount / totalCount * 100) : 0,
            lastExecution: lastExecution?.timestamp,
            avgExecutionTime: totalCount > 0 
              ? Math.round(toolHistory.reduce((sum, h) => sum + (h.executionTime || 0), 0) / totalCount)
              : 0,
            status: lastExecution 
              ? (lastExecution.success ? 'active' : 'error')
              : 'idle'
          }
        };
      });

      setTools(toolsWithStats);
      setExecutionHistory(history);
      setLastUpdate(new Date());
      setIsRefreshing(false);
    }, 300);
  };

  useEffect(() => {
    loadTools();
    
    // 每10秒自动刷新
    const interval = setInterval(loadTools, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatLastExecution = (timestamp) => {
    if (!timestamp) return '从未使用';
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: zhCN 
    });
  };

  const getSuccessRateColor = (rate) => {
    if (rate >= 90) return '#28a745';
    if (rate >= 70) return '#ffc107';
    return '#dc3545';
  };

  return (
    <PanelContainer className={className}>
      <PanelHeader onClick={() => setCollapsed(!collapsed)}>
        <div className="header-left">
          <Wrench size={20} />
          <HeaderTitle>工具管理面板</HeaderTitle>
          <div className="tool-count">
            {tools.length} 个工具
          </div>
        </div>
        <div className="header-actions">
          <ActionButton onClick={(e) => { e.stopPropagation(); loadTools(); }}>
            <RefreshCw size={16} />
          </ActionButton>
          {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </PanelHeader>

      <PanelContent collapsed={collapsed}>
        {isRefreshing && (
          <RefreshIndicator>
            <RefreshCw size={14} className="spinner" />
            正在刷新工具状态...
          </RefreshIndicator>
        )}

        {tools.length > 0 ? (
          <ToolList>
            {tools.map((tool, index) => (
              <ToolItem key={tool.name}>
                <ToolIcon category={tool.category}>
                  {getToolIcon(tool.category)}
                </ToolIcon>
                <ToolContent>
                  <ToolName>
                    {tool.name}
                    <StatusBadge status={tool.stats.status}>
                      {tool.stats.status === 'active' ? '活跃' : 
                       tool.stats.status === 'error' ? '异常' : '空闲'}
                    </StatusBadge>
                  </ToolName>
                  <ToolDescription>
                    {tool.description}
                  </ToolDescription>
                  <ToolStats>
                    <StatItem>
                      <Activity size={12} />
                      执行 {tool.stats.totalExecutions} 次
                    </StatItem>
                    {tool.stats.totalExecutions > 0 && (
                      <>
                        <StatItem>
                          <CheckCircle size={12} style={{ color: getSuccessRateColor(tool.stats.successRate) }} />
                          成功率 {tool.stats.successRate.toFixed(1)}%
                        </StatItem>
                        <StatItem>
                          <Clock size={12} />
                          平均 {tool.stats.avgExecutionTime}ms
                        </StatItem>
                      </>
                    )}
                    <StatItem>
                      <Clock size={12} />
                      {formatLastExecution(tool.stats.lastExecution)}
                    </StatItem>
                  </ToolStats>
                </ToolContent>
              </ToolItem>
            ))}
          </ToolList>
        ) : (
          <EmptyState>
            <div className="icon">
              <AlertCircle size={32} />
            </div>
            <div>暂无可用工具</div>
          </EmptyState>
        )}
      </PanelContent>
    </PanelContainer>
  );
};

export default ToolPanel;