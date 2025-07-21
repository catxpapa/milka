// 主题管理业务逻辑 - 创建、编辑、排序、置顶等功能
import databaseService from './database.js';

/**
 * 主题服务类 - 处理主题相关的业务逻辑
 * 提供主题的完整生命周期管理
 */
class ThemeService {
  constructor() {
    this.db = databaseService;
    console.log('📚 主题服务初始化完成');
  }

  /**
   * 创建新主题
   * @param {Object} themeData - 主题数据
   * @param {string} themeData.title - 主题标题
   * @param {string} themeData.description - 主题描述
   * @param {string} themeData.styleTheme - 样式主题
   * @returns {Promise<Object>} 创建的主题对象
   */
  async createTheme(themeData) {
    try {
      // 验证输入数据
      this.validateThemeData(themeData);
      
      // 获取当前主题数量，用于设置排序
      const existingThemes = await this.db.getThemes();
      
      const themeToCreate = {
        ...themeData,
        sort_order: existingThemes.length,
        is_pinned: false,
        is_official: false
      };
      
      const newTheme = await this.db.createTheme(themeToCreate);
      
      console.log(`✅ 主题创建成功: ${newTheme.title}`);
      return newTheme;
      
    } catch (error) {
      console.error('❌ 创建主题失败:', error);
      throw new Error(`创建主题失败: ${error.message}`);
    }
  }

  /**
   * 获取所有主题
   * @param {Object} options - 查询选项
   * @param {string} options.search - 搜索关键词
   * @param {boolean} options.pinnedFirst - 是否置顶主题优先
   * @returns {Promise<Array>} 主题列表
   */
  async getAllThemes(options = {}) {
    try {
      let themes = await this.db.getThemes({
        search: options.search
      });
      
      // 如果需要置顶主题优先显示
      if (options.pinnedFirst) {
        themes = this.sortThemesWithPinned(themes);
      }
      
      // 添加主题统计信息
      const themesWithStats = await Promise.all(
        themes.map(async (theme) => {
          const cards = await this.db.getThemeCards(theme.id);
          return {
            ...theme,
            cardCount: cards.length,
            lastStudied: this.getLastStudiedTime(theme.id)
          };
        })
      );
      
      console.log(`📚 获取主题列表: ${themesWithStats.length} 个主题`);
      return themesWithStats;
      
    } catch (error) {
      console.error('❌ 获取主题列表失败:', error);
      throw new Error(`获取主题列表失败: ${error.message}`);
    }
  }

  /**
   * 根据ID获取主题详情
   * @param {string} themeId - 主题ID
   * @returns {Promise<Object>} 主题详情
   */
  async getThemeById(themeId) {
    try {
      const theme = await this.db.getThemeById(themeId);
      const cards = await this.db.getThemeCards(themeId);
      
      const themeDetail = {
        ...theme,
        cards: cards,
        cardCount: cards.length,
        lastStudied: this.getLastStudiedTime(themeId),
        createdDate: new Date(theme.created_at).toLocaleDateString(),
        updatedDate: new Date(theme.updated_at).toLocaleDateString()
      };
      
      console.log(`📚 获取主题详情: ${theme.title} (${cards.length} 张卡片)`);
      return themeDetail;
      
    } catch (error) {
      console.error('❌ 获取主题详情失败:', error);
      throw new Error(`获取主题详情失败: ${error.message}`);
    }
  }

  /**
   * 更新主题信息
   * @param {string} themeId - 主题ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的主题
   */
  async updateTheme(themeId, updateData) {
    try {
      // 验证更新数据
      if (updateData.title) {
        this.validateThemeData(updateData);
      }
      
      const updatedTheme = await this.db.updateTheme(themeId, updateData);
      
      console.log(`✅ 主题更新成功: ${updatedTheme.title}`);
      return updatedTheme;
      
    } catch (error) {
      console.error('❌ 更新主题失败:', error);
      throw new Error(`更新主题失败: ${error.message}`);
    }
  }

  /**
   * 删除主题
   * @param {string} themeId - 主题ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteTheme(themeId) {
    try {
      // 获取主题信息用于日志
      const theme = await this.db.getThemeById(themeId);
      
      const result = await this.db.deleteTheme(themeId);
      
      console.log(`✅ 主题删除成功: ${theme.title} (包含 ${result.deletedCardsCount} 张卡片)`);
      return result;
      
    } catch (error) {
      console.error('❌ 删除主题失败:', error);
      throw new Error(`删除主题失败: ${error.message}`);
    }
  }

  /**
   * 置顶/取消置顶主题
   * @param {string} themeId - 主题ID
   * @param {boolean} isPinned - 是否置顶
   * @returns {Promise<Object>} 更新后的主题
   */
  async toggleThemePin(themeId, isPinned) {
    try {
      const updatedTheme = await this.db.updateTheme(themeId, {
        is_pinned: isPinned
      });
      
      console.log(`📌 主题${isPinned ? '置顶' : '取消置顶'}成功: ${updatedTheme.title}`);
      return updatedTheme;
      
    } catch (error) {
      console.error('❌ 切换主题置顶状态失败:', error);
      throw new Error(`切换主题置顶状态失败: ${error.message}`);
    }
  }

  /**
   * 更新主题排序
   * @param {Array} themeIds - 按新顺序排列的主题ID数组
   * @returns {Promise<Array>} 更新后的主题列表
   */
  async updateThemeOrder(themeIds) {
    try {
      const updatePromises = themeIds.map((themeId, index) => 
        this.db.updateTheme(themeId, { sort_order: index })
      );
      
      const updatedThemes = await Promise.all(updatePromises);
      
      console.log(`📋 主题排序更新成功: ${themeIds.length} 个主题`);
      return updatedThemes;
      
    } catch (error) {
      console.error('❌ 更新主题排序失败:', error);
      throw new Error(`更新主题排序失败: ${error.message}`);
    }
  }

  /**
   * 复制主题
   * @param {string} themeId - 要复制的主题ID
   * @param {string} newTitle - 新主题标题
   * @returns {Promise<Object>} 复制的主题
   */
  async duplicateTheme(themeId, newTitle) {
    try {
      const originalTheme = await this.getThemeById(themeId);
      
      // 创建新主题
      const newTheme = await this.createTheme({
        title: newTitle || `${originalTheme.title} (副本)`,
        description: originalTheme.description,
        styleTheme: originalTheme.style_config?.theme || 'minimalist-white'
      });
      
      // 复制所有卡片
      let copiedCardsCount = 0;
      for (const card of originalTheme.cards) {
        await this.db.createCard(
          newTheme.id,
          card.front.main_text,
          card.back.main_text,
          card.front.notes || ''
        );
        copiedCardsCount++;
      }
      
      console.log(`📋 主题复制成功: ${newTheme.title} (${copiedCardsCount} 张卡片)`);
      
      return {
        ...newTheme,
        copiedCardsCount
      };
      
    } catch (error) {
      console.error('❌ 复制主题失败:', error);
      throw new Error(`复制主题失败: ${error.message}`);
    }
  }

  /**
   * 搜索主题
   * @param {string} query - 搜索关键词
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} 搜索结果
   */
  async searchThemes(query, filters = {}) {
    try {
      const allThemes = await this.getAllThemes({ search: query });
      
      let filteredThemes = allThemes;
      
      // 应用过滤条件
      if (filters.minCards !== undefined) {
        filteredThemes = filteredThemes.filter(theme => 
          theme.cardCount >= filters.minCards
        );
      }
      
      if (filters.maxCards !== undefined) {
        filteredThemes = filteredThemes.filter(theme => 
          theme.cardCount <= filters.maxCards
        );
      }
      
      if (filters.styleTheme) {
        filteredThemes = filteredThemes.filter(theme => 
          theme.style_config?.theme === filters.styleTheme
        );
      }
      
      if (filters.isPinned !== undefined) {
        filteredThemes = filteredThemes.filter(theme => 
          theme.is_pinned === filters.isPinned
        );
      }
      
      console.log(`🔍 主题搜索完成: "${query}" 找到 ${filteredThemes.length} 个结果`);
      return filteredThemes;
      
    } catch (error) {
      console.error('❌ 搜索主题失败:', error);
      throw new Error(`搜索主题失败: ${error.message}`);
    }
  }

  /**
   * 导出主题数据
   * @param {string} themeId - 主题ID
   * @param {Object} options - 导出选项
   * @returns {Promise<Object>} 导出数据
   */
  async exportTheme(themeId, options = {}) {
    try {
      const exportData = await this.db.exportThemeData(themeId);
      
      // 添加导出元数据
      exportData.metadata = {
        exportedBy: 'Milka App',
        exportVersion: '1.0.0',
        exportOptions: options,
        themeId: themeId
      };
      
      console.log(`📤 主题导出成功: ${exportData.theme.title}`);
      return exportData;
      
    } catch (error) {
      console.error('❌ 导出主题失败:', error);
      throw new Error(`导出主题失败: ${error.message}`);
    }
  }

  /**
   * 导入主题数据
   * @param {Object} importData - 导入数据
   * @param {Object} options - 导入选项
   * @returns {Promise<Object>} 导入结果
   */
  async importTheme(importData, options = {}) {
    try {
      // 验证导入数据
      this.validateImportData(importData);
      
      const result = await this.db.importThemeData(importData);
      
      console.log(`📥 主题导入成功: ${result.theme.title} (${result.importedCardsCount} 张卡片)`);
      return result;
      
    } catch (error) {
      console.error('❌ 导入主题失败:', error);
      throw new Error(`导入主题失败: ${error.message}`);
    }
  }

  /**
   * 获取主题统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getThemeStatistics() {
    try {
      const themes = await this.getAllThemes();
      
      const stats = {
        totalThemes: themes.length,
        pinnedThemes: themes.filter(t => t.is_pinned).length,
        officialThemes: themes.filter(t => t.is_official).length,
        totalCards: themes.reduce((sum, theme) => sum + theme.cardCount, 0),
        averageCardsPerTheme: themes.length > 0 
          ? Math.round(themes.reduce((sum, theme) => sum + theme.cardCount, 0) / themes.length)
          : 0,
        themesByStyle: this.groupThemesByStyle(themes),
        recentThemes: themes
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5),
        lastUpdated: new Date().toISOString()
      };
      
      console.log('📊 主题统计信息:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ 获取主题统计失败:', error);
      throw new Error(`获取主题统计失败: ${error.message}`);
    }
  }

  // 私有辅助方法

  /**
   * 验证主题数据
   * @param {Object} themeData - 主题数据
   */
  validateThemeData(themeData) {
    if (!themeData.title || typeof themeData.title !== 'string') {
      throw new Error('主题标题不能为空且必须是字符串');
    }
    
    if (themeData.title.length > 100) {
      throw new Error('主题标题不能超过100个字符');
    }
    
    if (themeData.description && themeData.description.length > 500) {
      throw new Error('主题描述不能超过500个字符');
    }
    
    const validStyleThemes = ['minimalist-white', 'night-black'];
    if (themeData.styleTheme && !validStyleThemes.includes(themeData.styleTheme)) {
      throw new Error(`无效的样式主题: ${themeData.styleTheme}`);
    }
  }

  /**
   * 验证导入数据
   * @param {Object} importData - 导入数据
   */
  validateImportData(importData) {
    if (!importData || typeof importData !== 'object') {
      throw new Error('导入数据格式不正确');
    }
    
    if (!importData.theme || !importData.cards) {
      throw new Error('导入数据缺少必要字段');
    }
    
    if (!Array.isArray(importData.cards)) {
      throw new Error('卡片数据必须是数组格式');
    }
    
    this.validateThemeData(importData.theme);
  }

  /**
   * 按置顶状态排序主题
   * @param {Array} themes - 主题列表
   * @returns {Array} 排序后的主题列表
   */
  sortThemesWithPinned(themes) {
    return themes.sort((a, b) => {
      // 置顶主题优先
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      
      // 相同置顶状态下按排序字段
      return a.sort_order - b.sort_order;
    });
  }

  /**
   * 按样式分组主题
   * @param {Array} themes - 主题列表
   * @returns {Object} 分组结果
   */
  groupThemesByStyle(themes) {
    return themes.reduce((groups, theme) => {
      const style = theme.style_config?.theme || 'minimalist-white';
      if (!groups[style]) {
        groups[style] = 0;
      }
      groups[style]++;
      return groups;
    }, {});
  }

  /**
   * 获取最后学习时间（模拟数据）
   * @param {string} themeId - 主题ID
   * @returns {string|null} 最后学习时间
   */
  getLastStudiedTime(themeId) {
    // 这里可以集成实际的学习记录功能
    // 目前返回模拟数据
    const studyRecords = JSON.parse(localStorage.getItem('milka_study_records') || '{}');
    return studyRecords[themeId] || null;
  }

  /**
   * 记录学习时间
   * @param {string} themeId - 主题ID
   */
  recordStudyTime(themeId) {
    try {
      const studyRecords = JSON.parse(localStorage.getItem('milka_study_records') || '{}');
      studyRecords[themeId] = new Date().toISOString();
      localStorage.setItem('milka_study_records', JSON.stringify(studyRecords));
      
      console.log(`📖 记录学习时间: ${themeId}`);
    } catch (error) {
      console.warn('记录学习时间失败:', error);
    }
  }
}

// 创建主题服务实例
const themeService = new ThemeService();

// 导出服务实例和类
export default themeService;
export { ThemeService };
