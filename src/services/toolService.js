/**
 * 工具服务 - 基于原项目的工具系统
 */

class ToolServiceError extends Error {
  constructor(message, toolName = null, originalError = null) {
    super(message);
    this.name = 'ToolServiceError';
    this.toolName = toolName;
    this.originalError = originalError;
  }
}

class ToolService {
  constructor() {
    this.tools = new Map();
    this.executionHistory = [];
    this.initializeMockTools();
  }

  /**
   * 注册工具
   */
  registerTool(name, func, description) {
    if (!name || typeof func !== 'function' || !description) {
      throw new Error('工具名称、函数和描述都不能为空');
    }

    this.tools.set(name, {
      name,
      func,
      description,
      registeredAt: new Date().toISOString()
    });

    console.log(`🔧 注册工具: ${name} - ${description}`);
  }

  /**
   * 获取工具列表
   */
  getToolsList() {
    return Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description,
      registeredAt: tool.registeredAt
    }));
  }

  /**
   * 获取工具描述字符串（用于prompt）
   */
  getToolsDescription() {
    return Array.from(this.tools.entries())
      .map(([name, tool]) => `- ${name}: ${tool.description}`)
      .join('\n');
  }

  /**
   * 执行工具
   */
  async executeTool(actionName, args = {}) {
    const startTime = Date.now();
    
    if (!this.tools.has(actionName)) {
      const availableTools = Array.from(this.tools.keys()).join(', ');
      throw new ToolServiceError(
        `工具 '${actionName}' 不存在。可用工具: ${availableTools}`,
        actionName
      );
    }

    try {
      console.log(`🔧 执行工具: ${actionName}`, args);
      
      const tool = this.tools.get(actionName);
      const result = await tool.func(args);
      
      const executionTime = Date.now() - startTime;
      
      // 记录执行历史
      const execution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        toolName: actionName,
        args,
        result,
        executionTime,
        timestamp: new Date().toISOString(),
        success: true
      };
      
      this.executionHistory.unshift(execution);
      
      // 限制历史记录长度
      if (this.executionHistory.length > 100) {
        this.executionHistory = this.executionHistory.slice(0, 100);
      }

      console.log(`✅ 工具执行成功: ${actionName} (${executionTime}ms)`);
      return {
        success: true,
        result: String(result),
        executionTime,
        executionId: execution.id
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // 记录失败执行
      const execution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        toolName: actionName,
        args,
        error: error.message,
        executionTime,
        timestamp: new Date().toISOString(),
        success: false
      };
      
      this.executionHistory.unshift(execution);

      console.error(`❌ 工具执行失败: ${actionName}`, error);
      throw new ToolServiceError(
        `工具执行失败: ${error.message}`,
        actionName,
        error
      );
    }
  }

  /**
   * 获取执行历史
   */
  getExecutionHistory(limit = 20) {
    return this.executionHistory.slice(0, limit);
  }

  /**
   * 清空执行历史
   */
  clearExecutionHistory() {
    this.executionHistory = [];
  }

  /**
   * 初始化模拟工具（基于原项目）
   */
  initializeMockTools() {
    // 交易工具
    this.registerTool('execute_trade', this.mockExecuteTrade, 
      '执行加密货币交易，参数：ticker(代币), amount(数量), side(buy/sell)');
    
    this.registerTool('get_portfolio_status', this.mockGetPortfolioStatus, 
      '查看投资组合持仓和盈亏情况，无参数');
    
    this.registerTool('get_recent_transactions', this.mockGetRecentTransactions, 
      '查询最近交易记录，参数：days(天数), transaction_type(交易类型)');
    
    this.registerTool('configure_strategy', this.mockConfigureStrategy, 
      '配置投资策略并获取回测，参数：strategy_type(类型), target_coins(目标币种), description(描述)');
    
    this.registerTool('get_strategy', this.mockGetStrategy, 
      '获取策略详情或列出所有策略，参数：strategy_name(策略名称，可选)');
    
    this.registerTool('transfer_money', this.mockTransferMoney, 
      '执行转账操作，参数：recipient(收款人), amount(金额)');
    
    this.registerTool('get_tutorial_guide', this.mockGetTutorialGuide, 
      '获取操作引导和帮助信息，参数：topic(主题)');
  }

  // Mock工具实现（简化版本，用于演示）
  mockExecuteTrade = async ({ ticker, amount, side }) => {
    await this.delay(1000); // 模拟API调用
    
    const mockPrices = {
      'SOL': 102.0, 'TRUMP': 15.8, 'WIF': 3.2, 'BTC': 67500.0, 'ETH': 3400.0
    };
    
    const price = mockPrices[ticker?.toUpperCase()] || 100;
    const total = amount * price;
    
    return `✅ **${side === 'buy' ? '买入' : '卖出'}成功**\n\n` +
           `**交易详情**：\n` +
           `• 代币：${ticker}\n` +
           `• 数量：${amount}个\n` +
           `• 成交价：$${price}\n` +
           `• 总金额：${total.toFixed(2)}USDT`;
  };

  mockGetPortfolioStatus = async () => {
    await this.delay(500);
    return `💼 **投资组合状态**\n\n` +
           `**USDT余额**：10,000.00USDT\n\n` +
           `**加密货币持仓**：\n` +
           `🟢 **SOL**\n` +
           `   • 持仓：20.000000个\n` +
           `   • 成本价：$95.000000 | 现价：$102.000000\n` +
           `   • 市值：2040.00USDT | 盈亏：+140.00USDT (+7.37%)`;
  };

  mockGetRecentTransactions = async ({ days = 7 }) => {
    await this.delay(300);
    return `📋 **最近${days}天交易记录**\n\n` +
           `🟢 **1.** 买入 SOL 100个\n` +
           `   • 成交价：$102.00 | 总额：10200.00USDT\n` +
           `   • 时间：2024-01-15 14:25:10\n\n` +
           `📊 **交易统计**\n` +
           `• 买入总额：10,200.00USDT\n` +
           `• 总资产：20,240.00USDT`;
  };

  mockConfigureStrategy = async ({ strategy_type, target_coins = ['BTC', 'ETH'], description = '' }) => {
    await this.delay(2000);
    return `✅ **策略配置成功**\n\n` +
           `**策略信息**：\n` +
           `• 策略名称：策略_1\n` +
           `• 策略类型：${strategy_type}\n` +
           `• 目标代币：${target_coins.join(', ')}\n` +
           `• 策略描述：${description || '无描述'}\n\n` +
           `📊 **回测结果**：\n` +
           `• 总收益率：18.75%\n` +
           `• 年化收益率：19.20%\n` +
           `• 最大回撤：-8.45%\n` +
           `• 夏普比率：1.85`;
  };

  mockGetStrategy = async ({ strategy_name }) => {
    await this.delay(800);
    if (strategy_name) {
      return `📊 **策略详情：${strategy_name}**\n\n` +
             `**基本信息**：\n` +
             `• 策略类型：long_term\n` +
             `• 目标代币：BTC, ETH\n` +
             `• 创建时间：2024-01-15 14:30:25\n` +
             `• 当前状态：运行中`;
    } else {
      return `📋 **策略列表** (共2个)\n\n` +
             `✅ **1. 策略_1**\n` +
             `   • 类型：long_term | 目标：BTC, ETH\n` +
             `   • 状态：稳定运行 (15天)\n\n` +
             `🔄 **2. 策略_2**\n` +
             `   • 类型：short_term | 目标：SOL, TRUMP\n` +
             `   • 状态：运行中 (3天)`;
    }
  };

  mockTransferMoney = async ({ recipient, amount }) => {
    await this.delay(1500);
    return `✅ **转账成功**\n\n` +
           `**交易详情**：\n` +
           `• 收款人：${recipient}\n` +
           `• 转账金额：${amount}.00USDT\n` +
           `• 交易状态：成功\n\n` +
           `**账户余额**：${10000 - amount}.00USDT`;
  };

  mockGetTutorialGuide = async ({ topic = 'general' }) => {
    await this.delay(200);
    const guides = {
      general: `🎯 **智能交易助手使用指南**\n\n📚 **基础功能**\n• 查看投资组合：get_portfolio_status()\n• 查看交易记录：get_recent_transactions()\n• 执行交易：execute_trade(ticker, amount, side)`,
      trading: `📈 **交易操作详细指南**\n\n**参数说明**：\n• ticker: 代币符号 (如 "SOL", "BTC", "ETH")\n• amount: 交易数量\n• side: 交易方向 ("buy" 或 "sell")`,
      strategy: `🧠 **策略配置详细指南**\n\n**策略类型**：\n• long_term: 长期持有策略\n• short_term: 短线交易策略\n• dca: 定期投资策略`
    };
    return guides[topic] || guides.general;
  };

  // 工具函数：模拟延迟
  delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
}

// 全局实例
export const toolService = new ToolService();
export { ToolServiceError };
export default ToolService;