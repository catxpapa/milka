// 卡片管理业务逻辑 - 卡面创建、关联、排序等功能
import databaseService from './database.js';

/**
 * 卡片服务类 - 处理卡片相关的业务逻辑
 * 提供卡片的完整生命周期管理
 */
class CardService {
  constructor() {
    this.db = databaseService;
    console.log('🃏 卡片服务初始化完成');
  }

  /**
   * 创建新卡片
   * @param {string} themeId - 主题ID
   * @param {string} frontText - 正面文本
   * @param {string} backText - 背面文本
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 创建的卡片信息
   */
  async createCard(themeId, frontText, backText, options = {}) {
    try {
      // 验证输入数据
      this.validateCardData(frontText, backText);
      
      const result = await this.db.createCard(
        themeId, 
        frontText, 
        backText, 
        options.notes || ''
      );
      
      // 构建返回的卡片对象
      const card = {
        id: result.association.id,
        themeId: result.association.theme_id,
        front: result.frontFace,
        back: result.backFace,
        sortOrder: result.association.sort_order,
        createdAt: result.association.created_at
      };
      
      console.log(`✅ 卡片创建成功: ${card.id} (主题: ${themeId})`);
      return card;
      
    } catch (error) {
      console.error('❌ 创建卡片失败:', error);
      throw new Error(`创建卡片失败: ${error.message}`);
    }
  }

  /**
   * 批量创建卡片
   * @param {string} themeId - 主题ID
   * @param {Array} cardsData - 卡片数据数组
   * @returns {Promise<Array>} 创建的卡片列表
   */
  async createMultipleCards(themeId, cardsData) {
    try {
      const createdCards = [];
      
      for (const cardData of cardsData) {
        this.validateCardData(cardData.frontText, cardData.backText);
        
        const card = await this.createCard(
          themeId,
          cardData.frontText,
          cardData.backText,
          { notes: cardData.notes }
        );
        
        createdCards.push(card);
      }
      
      console.log(`✅ 批量创建卡片成功: ${createdCards.length} 张 (主题: ${themeId})`);
      return createdCards;
      
    } catch (error) {
      console.error('❌ 批量创建卡片失败:', error);
      throw new Error(`批量创建卡片失败: ${error.message}`);
    }
  }

  /**
   * 获取主题的所有卡片
   * @param {string} themeId - 主题ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 卡片列表
   */
  async getThemeCards(themeId, options = {}) {
    try {
      let cards = await this.db.getThemeCards(themeId);
      
      // 应用过滤条件
      if (options.search) {
        cards = this.filterCardsBySearch(cards, options.search);
      }
      
      // 应用排序
      if (options.sortBy) {
        cards = this.sortCards(cards, options.sortBy);
      }
      
      // 添加额外信息
      const cardsWithMetadata = cards.map(card => ({
        ...card,
        wordCount: this.getWordCount(card.front.main_text, card.back.main_text),
        difficulty: this.calculateDifficulty(card),
        lastReviewed: this.getLastReviewTime(card.id)
      }));
      
      console.log(`🃏 获取主题卡片: ${cardsWithMetadata.length} 张 (主题: ${themeId})`);
      return cardsWithMetadata;
      
    } catch (error) {
      console.error('❌ 获取主题卡片失败:', error);
      throw new Error(`获取主题卡片失败: ${error.message}`);
    }
  }

  /**
   * 更新卡片内容
   * @param {string} cardId - 卡片ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的卡片
   */
  async updateCard(cardId, updateData) {
    try {
      // 获取当前卡片信息
      const currentCards = await this.db.getThemeCards(''); // 需要优化：通过cardId直接获取
      const currentCard = currentCards.find(c => c.id === cardId);
      
      if (!currentCard) {
        throw new Error(`卡片不存在: ${cardId}`);
      }
      
      // 更新正面卡面
      if (updateData.frontText !== undefined) {
        this.validateCardText(updateData.frontText);
        await this.db.collections.cardFaces.upsert({
          ...currentCard.front,
          main_text: updateData.frontText,
          notes: updateData.frontNotes || currentCard.front.notes,
          updated_at: new Date().toISOString()
        });
      }
      
      // 更新背面卡面
      if (updateData.backText !== undefined) {
        this.validateCardText(updateData.backText);
        await this.db.collections.cardFaces.upsert({
          ...currentCard.back,
          main_text: updateData.backText,
          updated_at: new Date().toISOString()
        });
      }
      
      // 获取更新后的卡片
      const updatedCards = await this.db.getThemeCards(currentCard.themeId);
      const updatedCard = updatedCards.find(c => c.id === cardId);
      
      console.log(`✅ 卡片更新成功: ${cardId}`);
      return updatedCard;
      
    } catch (error) {
      console.error('❌ 更新卡片失败:', error);
      throw new Error(`更新卡片失败: ${error.message}`);
    }
  }

  /**
   * 删除卡片
   * @param {string} cardId - 卡片ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteCard(cardId) {
    try {
      const result = await this.db.deleteCard(cardId);
      
      console.log(`✅ 卡片删除成功: ${cardId}`);
      return result;
      
    } catch (error) {
      console.error('❌ 删除卡片失败:', error);
      throw new Error(`删除卡片失败: ${error.message}`);
    }
  }

  /**
   * 批量删除卡片
   * @param {Array} cardIds - 卡片ID数组
   * @returns {Promise<Object>} 删除结果
   */
  async deleteMultipleCards(cardIds) {
    try {
      const deletePromises = cardIds.map(cardId => this.deleteCard(cardId));
      await Promise.all(deletePromises);
      
      console.log(`✅ 批量删除卡片成功: ${cardIds.length} 张`);
      return { deletedCount: cardIds.length };
      
    } catch (error) {
      console.error('❌ 批量删除卡片失败:', error);
      throw new Error(`批量删除卡片失败: ${error.message}`);
    }
  }

  /**
   * 更新卡片排序
   * @param {string} themeId - 主题ID
   * @param {Array} cardIds - 按新顺序排列的卡片ID数组
   * @returns {Promise<Array>} 更新后的卡片列表
   */
  async updateCardOrder(themeId, cardIds) {
    try {
      // 更新每个卡片的排序
      const updatePromises = cardIds.map(async (cardId, index) => {
        await this.db.collections.associations.upsert({
          id: cardId,
          sort_order: index,
          updated_at: new Date().toISOString()
        });
      });
      
      await Promise.all(updatePromises);
      
      // 返回更新后的卡片列表
      const updatedCards = await this.getThemeCards(themeId);
      
      console.log(`📋 卡片排序更新成功: ${cardIds.length} 张 (主题: ${themeId})`);
      return updatedCards;
      
    } catch (error) {
      console.error('❌ 更新卡片排序失败:', error);
      throw new Error(`更新卡片排序失败: ${error.message}`);
    }
  }

  /**
   * 复制卡片到其他主题
   * @param {string} cardId - 卡片ID
   * @param {string} targetThemeId - 目标主题ID
   * @returns {Promise<Object>} 复制的卡片
   */
  async copyCardToTheme(cardId, targetThemeId) {
    try {
      // 获取原卡片信息
      const sourceCards = await this.db.getThemeCards(''); // 需要优化
      const sourceCard = sourceCards.find(c => c.id === cardId);
      
      if (!sourceCard) {
        throw new Error(`源卡片不存在: ${cardId}`);
      }
      
      // 创建新卡片
      const newCard = await this.createCard(
        targetThemeId,
        sourceCard.front.main_text,
        sourceCard.back.main_text,
        { notes: sourceCard.front.notes }
      );
      
      console.log(`📋 卡片复制成功: ${cardId} -> ${newCard.id} (目标主题: ${targetThemeId})`);
      return newCard;
      
    } catch (error) {
      console.error('❌ 复制卡片失败:', error);
      throw new Error(`复制卡片失败: ${error.message}`);
    }
  }

  /**
   * 移动卡片到其他主题
   * @param {string} cardId - 卡片ID
   * @param {string} targetThemeId - 目标主题ID
   * @returns {Promise<Object>} 移动结果
   */
  async moveCardToTheme(cardId, targetThemeId) {
    try {
      // 先复制卡片
      const newCard = await this.copyCardToTheme(cardId, targetThemeId);
      
      // 删除原卡片
      await this.deleteCard(cardId);
      
      console.log(`🔄 卡片移动成功: ${cardId} -> ${newCard.id} (目标主题: ${targetThemeId})`);
      return { newCard, originalCardId: cardId };
      
    } catch (error) {
      console.error('❌ 移动卡片失败:', error);
      throw new Error(`移动卡片失败: ${error.message}`);
    }
  }

  /**
   * 搜索卡片
   * @param {string} query - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果
   */
  async searchCards(query, options = {}) {
    try {
      // 获取所有主题的卡片（如果指定了主题ID则只搜索该主题）
      let allCards = [];
      
      if (options.themeId) {
        allCards = await this.getThemeCards(options.themeId);
      } else {
        // 获取所有主题的卡片
        const themes = await this.db.getThemes();
        for (const theme of themes) {
          const themeCards = await this.getThemeCards(theme.id);
          allCards = allCards.concat(themeCards);
        }
      }
      
      // 执行搜索
      const searchResults = this.filterCardsBySearch(allCards, query);
      
      // 应用额外过滤条件
      let filteredResults = searchResults;
      
      if (options.difficulty) {
        filteredResults = filteredResults.filter(card => 
          this.calculateDifficulty(card) === options.difficulty
        );
      }
      
      if (options.hasNotes !== undefined) {
        filteredResults = filteredResults.filter(card => 
          options.hasNotes ? card.front.notes : !card.front.notes
        );
      }
      
      console.log(`🔍 卡片搜索完成: "${query}" 找到 ${filteredResults.length} 个结果`);
      return filteredResults;
      
    } catch (error) {
      console.error('❌ 搜索卡片失败:', error);
      throw new Error(`搜索卡片失败: ${error.message}`);
    }
  }

  /**
   * 获取卡片统计信息
   * @param {string} themeId - 主题ID（可选）
   * @returns {Promise<Object>} 统计信息
   */
  async getCardStatistics(themeId = null) {
    try {
      let cards = [];
      
      if (themeId) {
        cards = await this.getThemeCards(themeId);
      } else {
        // 获取所有卡片
        const themes = await this.db.getThemes();
        for (const theme of themes) {
          const themeCards = await this.getThemeCards(theme.id);
          cards = cards.concat(themeCards);
        }
      }
      
      const stats = {
        totalCards: cards.length,
        averageWordCount: this.calculateAverageWordCount(cards),
        difficultyDistribution: this.getDifficultyDistribution(cards),
        cardsWithNotes: cards.filter(card => card.front.notes).length,
        recentCards: cards
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10),
        oldestCards: cards
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .slice(0, 5),
        lastUpdated: new Date().toISOString()
      };
      
      if (themeId) {
        stats.themeId = themeId;
      }
      
      console.log('📊 卡片统计信息:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ 获取卡片统计失败:', error);
      throw new Error(`获取卡片统计失败: ${error.message}`);
    }
  }

  /**
   * 导入卡片数据
   * @param {string} themeId - 主题ID
   * @param {Array} cardsData - 卡片数据
   * @param {Object} options - 导入选项
   * @returns {Promise<Object>} 导入结果
   */
  async importCards(themeId, cardsData, options = {}) {
    try {
      const importedCards = [];
      const errors = [];
      
      for (let i = 0; i < cardsData.length; i++) {
        try {
          const cardData = cardsData[i];
          
          // 验证卡片数据
          if (!cardData.front || !cardData.back) {
            throw new Error(`第 ${i + 1} 张卡片缺少正面或背面内容`);
          }
          
          const card = await this.createCard(
            themeId,
            cardData.front.main_text || cardData.front,
            cardData.back.main_text || cardData.back,
            { notes: cardData.front.notes || '' }
          );
          
          importedCards.push(card);
          
        } catch (error) {
          errors.push({
            index: i + 1,
            error: error.message,
            data: cardsData[i]
          });
          
          if (!options.continueOnError) {
            break;
          }
        }
      }
      
      const result = {
        importedCount: importedCards.length,
        errorCount: errors.length,
        totalCount: cardsData.length,
        importedCards,
        errors
      };
      
      console.log(`📥 卡片导入完成: ${result.importedCount}/${result.totalCount} 成功`);
      return result;
      
    } catch (error) {
      console.error('❌ 导入卡片失败:', error);
      throw new Error(`导入卡片失败: ${error.message}`);
    }
  }

  // 私有辅助方法

  /**
   * 验证卡片数据
   * @param {string} frontText - 正面文本
   * @param {string} backText - 背面文本
   */
  validateCardData(frontText, backText) {
    this.validateCardText(frontText, '正面');
    this.validateCardText(backText, '背面');
  }

  /**
   * 验证卡片文本
   * @param {string} text - 文本内容
   * @param {string} side - 卡片面（正面/背面）
   */
  validateCardText(text, side = '内容') {
    if (!text || typeof text !== 'string') {
      throw new Error(`卡片${side}不能为空且必须是字符串`);
    }
    
    if (text.trim().length === 0) {
      throw new Error(`卡片${side}不能为空白`);
    }
    
    if (text.length > 1000) {
      throw new Error(`卡片${side}不能超过1000个字符`);
    }
  }

  /**
   * 按搜索关键词过滤卡片
   * @param {Array} cards - 卡片列表
   * @param {string} query - 搜索关键词
   * @returns {Array} 过滤后的卡片列表
   */
  filterCardsBySearch(cards, query) {
    if (!query || query.trim().length === 0) {
      return cards;
    }
    
    const searchTerm = query.toLowerCase().trim();
    
    return cards.filter(card => {
      const frontText = card.front.main_text.toLowerCase();
      const backText = card.back.main_text.toLowerCase();
      const notes = (card.front.notes || '').toLowerCase();
      
      return frontText.includes(searchTerm) || 
             backText.includes(searchTerm) || 
             notes.includes(searchTerm);
    });
  }

  /**
   * 排序卡片
   * @param {Array} cards - 卡片列表
   * @param {string} sortBy - 排序方式
   * @returns {Array} 排序后的卡片列表
   */
  sortCards(cards, sortBy) {
    switch (sortBy) {
      case 'created_asc':
        return cards.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'created_desc':
        return cards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'alphabetical':
        return cards.sort((a, b) => a.front.main_text.localeCompare(b.front.main_text));
      case 'difficulty':
        return cards.sort((a, b) => this.calculateDifficulty(b) - this.calculateDifficulty(a));
      case 'order':
      default:
        return cards.sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }

  /**
   * 计算单词数量
   * @param {string} frontText - 正面文本
   * @param {string} backText - 背面文本
   * @returns {number} 单词总数
   */
  getWordCount(frontText, backText) {
    const frontWords = frontText.trim().split(/\s+/).length;
    const backWords = backText.trim().split(/\s+/).length;
    return frontWords + backWords;
  }

  /**
   * 计算卡片难度（简化算法）
   * @param {Object} card - 卡片对象
   * @returns {number} 难度等级 (1-5)
   */
  calculateDifficulty(card) {
    const frontLength = card.front.main_text.length;
    const backLength = card.back.main_text.length;
    const totalLength = frontLength + backLength;
    
    // 基于文本长度的简单难度计算
    if (totalLength < 20) return 1;
    if (totalLength < 50) return 2;
    if (totalLength < 100) return 3;
    if (totalLength < 200) return 4;
    return 5;
  }

  /**
   * 计算平均单词数
   * @param {Array} cards - 卡片列表
   * @returns {number} 平均单词数
   */
  calculateAverageWordCount(cards) {
    if (cards.length === 0) return 0;
    
    const totalWords = cards.reduce((sum, card) => 
      sum + this.getWordCount(card.front.main_text, card.back.main_text), 0
    );
    
    return Math.round(totalWords / cards.length);
  }

  /**
   * 获取难度分布
   * @param {Array} cards - 卡片列表
   * @returns {Object} 难度分布
   */
  getDifficultyDistribution(cards) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    cards.forEach(card => {
      const difficulty = this.calculateDifficulty(card);
      distribution[difficulty]++;
    });
    
    return distribution;
  }

  /**
   * 获取最后复习时间（模拟数据）
   * @param {string} cardId - 卡片ID
   * @returns {string|null} 最后复习时间
   */
  getLastReviewTime(cardId) {
    // 这里可以集成实际的学习记录功能
    const reviewRecords = JSON.parse(localStorage.getItem('milka_review_records') || '{}');
    return reviewRecords[cardId] || null;
  }

  /**
   * 记录复习时间
   * @param {string} cardId - 卡片ID
   * @param {number} performance - 复习表现 (1-5)
   */
  recordReview(cardId, performance = 3) {
    try {
      const reviewRecords = JSON.parse(localStorage.getItem('milka_review_records') || '{}');
      reviewRecords[cardId] = {
        lastReviewed: new Date().toISOString(),
        performance: performance,
        reviewCount: (reviewRecords[cardId]?.reviewCount || 0) + 1
      };
      localStorage.setItem('milka_review_records', JSON.stringify(reviewRecords));
      
      console.log(`📖 记录复习: ${cardId} (表现: ${performance})`);
    } catch (error) {
      console.warn('记录复习时间失败:', error);
    }
  }
}

// 创建卡片服务实例
const cardService = new CardService();

// 导出服务实例和类
export default cardService;
export { CardService };
