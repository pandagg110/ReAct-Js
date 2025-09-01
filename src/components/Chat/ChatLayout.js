/**
 * 聊天布局组件 - 包含聊天窗口和工具面板
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import ChatWindow from './ChatWindow';
import ToolPanel from '../Tools/ToolPanel';
import ToolHistory from '../Tools/ToolHistory';
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  background: #f8f9fa;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  min-width: 0; /* 防止flex子元素溢出 */
`;

const Sidebar = styled.div`
  width: ${props => props.collapsed ? '0' : '350px'};
  background: white;
  border-right: 1px solid #e9ecef;
  transition: all 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    position: absolute;
    top: 0;
    left: ${props => props.collapsed ? '-350px' : '0'};
    height: 100vh;
    z-index: 1000;
    box-shadow: ${props => props.collapsed ? 'none' : '2px 0 10px rgba(0, 0, 0, 0.1)'};
  }
`;

const SidebarHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  
  .title {
    font-weight: 600;
    color: #2d3748;
    margin: 0;
    font-size: 14px;
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
`;

const ToggleButton = styled.button`
  position: absolute;
  top: 20px;
  left: ${props => props.sidebarCollapsed ? '20px' : '370px'};
  z-index: 1001;
  width: 40px;
  height: 40px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #6c757d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: #f8f9fa;
    color: #2d3748;
    transform: scale(1.05);
  }
  
  @media (max-width: 768px) {
    left: ${props => props.sidebarCollapsed ? '20px' : '20px'};
    background: ${props => props.sidebarCollapsed ? 'white' : 'rgba(0, 0, 0, 0.8)'};
    color: ${props => props.sidebarCollapsed ? '#6c757d' : 'white'};
  }
`;

const ResponsiveIndicator = styled.div`
  position: absolute;
  top: 70px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 8px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  color: #6c757d;
  z-index: 1000;
  
  .device-icon {
    color: #007bff;
  }
  
  @media (min-width: 1200px) {
    .device-icon { color: #28a745; }
  }
  
  @media (max-width: 768px) {
    .device-icon { color: #dc3545; }
  }
  
  @media (min-width: 769px) and (max-width: 1199px) {
    .device-icon { color: #ffc107; }
  }
`;

const MobileOverlay = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.show ? 'block' : 'none'};
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 11px;
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const ChatLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const getDeviceInfo = () => {
    const width = window.innerWidth;
    if (width >= 1200) {
      return { icon: <Monitor size={14} />, label: '桌面端' };
    } else if (width >= 769) {
      return { icon: <Tablet size={14} />, label: '平板端' };
    } else {
      return { icon: <Smartphone size={14} />, label: '移动端' };
    }
  };

  const deviceInfo = getDeviceInfo();

  return (
    <LayoutContainer>
      {/* 切换按钮 */}
      <ToggleButton 
        onClick={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      >
        {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </ToggleButton>

      {/* 响应式指示器 */}
      <ResponsiveIndicator>
        <div className="device-icon">{deviceInfo.icon}</div>
        {deviceInfo.label}
      </ResponsiveIndicator>

      {/* 移动端遮罩 */}
      <MobileOverlay show={!sidebarCollapsed} onClick={toggleSidebar} />

      {/* 侧边栏 */}
      <Sidebar collapsed={sidebarCollapsed}>
        <SidebarHeader>
          <h3 className="title">🛠 系统监控</h3>
        </SidebarHeader>
        
        <StatsBar>
          <div className="stat-item">
            <span>运行时长:</span>
            <span>{Math.floor((Date.now() - window.performance.timing.navigationStart) / 1000)}s</span>
          </div>
          <div className="stat-item">
            <span>内存:</span>
            <span>{(performance.memory?.usedJSHeapSize / 1024 / 1024 || 0).toFixed(1)}MB</span>
          </div>
        </StatsBar>
        
        <SidebarContent>
          <ToolPanel />
          <ToolHistory />
        </SidebarContent>
      </Sidebar>

      {/* 主内容区 */}
      <MainContent>
        <ChatWindow />
      </MainContent>
    </LayoutContainer>
  );
};

export default ChatLayout;