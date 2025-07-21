// MiniDB数据库服务 - 懒猫微服官方轻量级文档式数据库集成
import { MiniDB } from "@lazycatcloud/minidb";

/**
 * 数据库服务类 - 封装 MiniDB 操作
 * 提供统一的数据访问接口和错误处理
 */
class DatabaseService {
  constructor() {
    // 初始化 MiniDB 实例
    this.db = new MiniDB();
    
    // 获取集合引用
    this.collections = {
      themes: this.db.getCollection("themes"),
      cardFaces: this.db.getCollection("cardFaces"), 
      associations: this.db.getCollection("associations")
    };
    
    // 重试配置
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000 // 1秒
    };
    
    console.log('📊 MiniDB 数据库服务初始化完成');
  }

  /**
   * 带重试机制的操作执行器
   * @param {Function} operation - 要执行的操作
   * @param {string} operationName - 操作名称（用于日志）
   * @returns {Promise} 操作结果
   */
  async withRetry(operation, operationName = '数据库操作') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ ${operationName} 在第 ${attempt} 次尝试后成功`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ ${operationName} 第 ${attempt} 次尝试失败:`, error.message);
        
        if (attempt < this.retryConfig.maxRetries) {
          // 等待后重试
          await new Promise(resolve => 
            setTimeout(resolve, this.retryConfig.retryDelay * attempt)
          );
        }
      }
    }
    
    console.error(`❌ ${operationName} 在 ${this.retryConfig.maxRetries} 次尝试后仍然失败`);
    throw lastError;
  }

  /**
   * 生成唯一ID
   * @param {string} prefix - ID前缀
   * @returns {string} 唯一ID
   */
  generateId(prefix = 'item') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * 验证数据格式
   * @param {Object} data - 要验证的数据
   * @param {Array} requiredFields - 必需字段列表
   * @throws {Error} 验证失败时抛出错误
   */
  validateData(data, requiredFields = []) {
    if (!data || typeof data !== 'object') {
      throw new Error('数据必须是有效的对象');
    }
    
    for (const field of requiredFields) {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        throw new Error(`缺少必需字段: ${field}`);
      }
    }
    
    return true;
  }

  /**
   * 主题相关操作
   */
  
  /**
   * 创建主题
   * @param {Object} themeData - 主题数据
   * @returns {Promise<Object>} 创建的主题
   */
  async createTheme(themeData) {
    return this.withRetry(async () => {
      this.validateData(themeData, ['title']);
      
      const theme = {
        id: this.generateId('theme'),
        title: themeData.title,
        description: themeData.description || '',
        cover_image_url: themeData.cover_image_url || '',
        style_config: {
          theme: themeData.styleTheme || 'minimalist-white',
          custom_styles: themeData.customStyles || {}
        },
        is_official: themeData.is_official || false,
        sort_order: themeData.sort_order || 0,
        is_pinned: themeData.is_pinned || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await this.collections.themes.upsert(theme);
      console.log(`📚 创建主题成功: ${theme.title} (${theme.id})`);
      
      return theme;
    }, '创建主题');
  }

  /**
   * 获取所有主题
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 主题列表
   */
  async getThemes(options = {}) {
    return this.withRetry(async () => {
      const { 
        sortBy = ['sort_order', 'created_at'],
        filter = {},
        limit = null 
      } = options;
      
      let query = this.collections.themes.find(filter, { sort: sortBy });
      
      const themes = await query.fetch();
      
      // 如果有限制，截取结果
      const result = limit ? themes.slice(0, limit) : themes;
      
      console.log(`📚 获取主题列表: ${result.length} 个主题`);
      return result;
    }, '获取主题列表');
  }

  /**
   * 根据ID获取主题
   * @param {string} themeId - 主题ID
   * @returns {Promise<Object|null>} 主题对象
   */
  async getThemeById(themeId) {
    return this.withRetry(async () => {
      const theme = await this.collections.themes.findOne({ id: themeId });
      
      if (theme) {
        console.log(`📚 获取主题: ${theme.title} (${themeId})`);
      } else {
        console.warn(`⚠️ 主题不存在: ${themeId}`);
      }
      
      return theme;
    }, `获取主题 ${themeId}`);
  }

  /**
   * 更新主题
   * @param {string} themeId - 主题ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的主题
   */
  async updateTheme(themeId, updateData) {
    return this.withRetry(async () => {
      const existingTheme = await this.getThemeById(themeId);
      if (!existingTheme) {
        throw new Error(`主题不存在: ${themeId}`);
      }
      
      const updatedTheme = {
        ...existingTheme,
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      await this.collections.themes.upsert(updatedTheme);
      console.log(`📚 更新主题成功: ${updatedTheme.title} (${themeId})`);
      
      return updatedTheme;
    }, `更新主题 ${themeId}`);
  }

  /**
   * 删除主题
   * @param {string} themeId - 主题ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  async deleteTheme(themeId) {
    return this.withRetry(async () => {
      // 首先删除相关的关联关系
      const associations = await this.collections.associations
        .find({ theme_id: themeId })
        .fetch();
      
      // 获取所有相关卡面ID
      const faceIds = [...new Set([
        ...associations.map(a => a.front_face_id),
        ...associations.map(a => a.back_face_id)
      ])];
      
      // 删除关联关系
      for (const assoc of associations) {
        await this.collections.associations.remove({ id: assoc.id });
      }
      
      // 删除卡面（注意：这里简化处理，实际应该检查卡面是否被其他主题使用）
      for (const faceId of faceIds) {
        await this.collections.cardFaces.remove({ id: faceId });
      }
      
      // 删除主题
      await this.collections.themes.remove({ id: themeId });
      
      console.log(`🗑️ 删除主题成功: ${themeId}`);
      return true;
    }, `删除主题 ${themeId}`);
  }

  /**
   * 卡面相关操作
   */
  
  /**
   * 创建卡面
   * @param {Object} faceData - 卡面数据
   * @returns {Promise<Object>} 创建的卡面
   */
  async createCardFace(faceData) {
    return this.withRetry(async () => {
      this.validateData(faceData, ['main_text']);
      
      const face = {
        id: this.generateId('face'),
        main_text: faceData.main_text,
        notes: faceData.notes || '',
        image_url: faceData.image_url || '',
        keywords: faceData.keywords || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await this.collections.cardFaces.upsert(face);
      console.log(`🃏 创建卡面成功: ${face.main_text.substring(0, 20)}... (${face.id})`);
      
      return face;
    }, '创建卡面');
  }

  /**
   * 批量创建卡面
   * @param {Array} facesData - 卡面数据数组
   * @returns {Promise<Array>} 创建的卡面列表
   */
  async createCardFaces(facesData) {
    return this.withRetry(async () => {
      const faces = facesData.map(faceData => {
        this.validateData(faceData, ['main_text']);
        
        return {
          id: this.generateId('face'),
          main_text: faceData.main_text,
          notes: faceData.notes || '',
          image_url: faceData.image_url || '',
          keywords: faceData.keywords || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      
      await this.collections.cardFaces.upsert(faces);
      console.log(`🃏 批量创建卡面成功: ${faces.length} 个卡面`);
      
      return faces;
    }, '批量创建卡面');
  }

  /**
   * 获取卡面
   * @param {Array} faceIds - 卡面ID数组
   * @returns {Promise<Array>} 卡面列表
   */
  async getCardFaces(faceIds) {
    return this.withRetry(async () => {
      if (!faceIds || faceIds.length === 0) {
        return [];
      }
      
      const faces = await this.collections.cardFaces
        .find({ id: { $in: faceIds } })
        .fetch();
      
      console.log(`🃏 获取卡面: ${faces.length} 个卡面`);
      return faces;
    }, '获取卡面');
  }

  /**
   * 关联关系相关操作
   */
  
  /**
   * 创建卡片关联
   * @param {Object} associationData - 关联数据
   * @returns {Promise<Object>} 创建的关联
   */
  async createAssociation(associationData) {
    return this.withRetry(async () => {
      this.validateData(associationData, ['theme_id', 'front_face_id', 'back_face_id']);
      
      const association = {
        id: this.generateId('assoc'),
        theme_id: associationData.theme_id,
        front_face_id: associationData.front_face_id,
        back_face_id: associationData.back_face_id,
        sort_order: associationData.sort_order || 0,
        created_at: new Date().toISOString()
      };
      
      await this.collections.associations.upsert(association);
      console.log(`🔗 创建关联成功: ${association.id}`);
      
      return association;
    }, '创建卡片关联');
  }

  /**
   * 获取主题的所有卡片
   * @param {string} themeId - 主题ID
   * @returns {Promise<Array>} 卡片列表（包含正反面数据）
   */
  async getThemeCards(themeId) {
    return this.withRetry(async () => {
      // 获取主题的所有关联
      const associations = await this.collections.associations
        .find({ theme_id: themeId }, { sort: ['sort_order'] })
        .fetch();
      
      if (associations.length === 0) {
        console.log(`🃏 主题 ${themeId} 没有卡片`);
        return [];
      }
      
      // 获取所有相关卡面ID
      const faceIds = [...new Set([
        ...associations.map(a => a.front_face_id),
        ...associations.map(a => a.back_face_id)
      ])];
      
      // 批量获取卡面数据
      const faces = await this.getCardFaces(faceIds);
      const faceMap = new Map(faces.map(face => [face.id, face]));
      
      // 构建完整的卡片数据
      const cards = associations.map(assoc => ({
        id: assoc.id,
        themeId: assoc.theme_id,
        front: faceMap.get(assoc.front_face_id),
        back: faceMap.get(assoc.back_face_id),
        sortOrder: assoc.sort_order,
        createdAt: assoc.created_at
      }));
      
      console.log(`🃏 获取主题卡片: ${cards.length} 张卡片`);
      return cards;
    }, `获取主题 ${themeId} 的卡片`);
  }

  /**
   * 添加卡片到主题
   * @param {string} themeId - 主题ID
   * @param {string} frontText - 正面文本
   * @param {string} backText - 背面文本
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 创建的卡片信息
   */
  async addCardToTheme(themeId, frontText, backText, options = {}) {
    return this.withRetry(async () => {
      // 验证主题是否存在
      const theme = await this.getThemeById(themeId);
      if (!theme) {
        throw new Error(`主题不存在: ${themeId}`);
      }
      
      // 创建正反面卡面
      const [frontFace, backFace] = await this.createCardFaces([
        {
          main_text: frontText,
          notes: options.frontNotes || '',
          keywords: options.frontKeywords || []
        },
        {
          main_text: backText,
          notes: options.backNotes || '',
          keywords: options.backKeywords || []
        }
      ]);
      
      // 获取当前主题的卡片数量，用于设置排序
      const existingCards = await this.getThemeCards(themeId);
      const sortOrder = options.sortOrder !== undefined ? options.sortOrder : existingCards.length;
      
      // 创建关联关系
      const association = await this.createAssociation({
        theme_id: themeId,
        front_face_id: frontFace.id,
        back_face_id: backFace.id,
        sort_order: sortOrder
      });
      
      const cardInfo = {
        id: association.id,
        themeId: themeId,
        front: frontFace,
        back: backFace,
        sortOrder: sortOrder
      };
      
      console.log(`🃏 添加卡片到主题成功: ${frontText.substring(0, 20)}...`);
      return cardInfo;
    }, `添加卡片到主题 ${themeId}`);
  }

  /**
   * 数据统计和维护
   */
  
  /**
   * 获取数据库统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics() {
    return this.withRetry(async () => {
      const [themes, cardFaces, associations] = await Promise.all([
        this.collections.themes.find({}).fetch(),
        this.collections.cardFaces.find({}).fetch(),
        this.collections.associations.find({}).fetch()
      ]);
      
      const stats = {
        themes: {
          total: themes.length,
          pinned: themes.filter(t => t.is_pinned).length,
          official: themes.filter(t => t.is_official).length
        },
        cardFaces: {
          total: cardFaces.length
        },
        associations: {
          total: associations.length
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('📊 数据库统计:', stats);
      return stats;
    }, '获取数据库统计');
  }

  /**
   * 清理孤立数据
   * @returns {Promise<Object>} 清理结果
   */
  async cleanupOrphanedData() {
    return this.withRetry(async () => {
      // 获取所有数据
      const [themes, cardFaces, associations] = await Promise.all([
        this.collections.themes.find({}).fetch(),
        this.collections.cardFaces.find({}).fetch(),
        this.collections.associations.find({}).fetch()
      ]);
      
      const themeIds = new Set(themes.map(t => t.id));
      const usedFaceIds = new Set([
        ...associations.map(a => a.front_face_id),
        ...associations.map(a => a.back_face_id)
      ]);
      
      // 清理孤立的关联关系（主题不存在）
      let cleanedAssociations = 0;
      for (const assoc of associations) {
        if (!themeIds.has(assoc.theme_id)) {
          await this.collections.associations.remove({ id: assoc.id });
          cleanedAssociations++;
        }
      }
      
      // 清理孤立的卡面（没有被任何关联使用）
      let cleanedFaces = 0;
      for (const face of cardFaces) {
        if (!usedFaceIds.has(face.id)) {
          await this.collections.cardFaces.remove({ id: face.id });
          cleanedFaces++;
        }
      }
      
      const result = {
        cleanedAssociations,
        cleanedFaces,
        timestamp: new Date().toISOString()
      };
      
      console.log('🧹 数据清理完成:', result);
      return result;
      
    }, '清理孤立数据');
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} 健康状态
   */
  async healthCheck() {
    try {
      // 测试基本连接
      await this.collections.themes.find({}).fetch();
      
      const stats = await this.getStatistics();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'MiniDB',
        collections: Object.keys(this.collections),
        statistics: stats
      };
      
    } catch (error) {
      console.error('❌ 数据库健康检查失败:', error);
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * 创建示例数据
   * @returns {Promise<Object>} 创建结果
   */
  async createSampleData() {
    return this.withRetry(async () => {
      console.log('🌱 开始创建示例数据...');
      
      // 创建示例主题
      const sampleThemes = [
        {
          title: '英语单词学习',
          description: '常用英语单词记忆卡片，帮助提高词汇量',
          styleTheme: 'minimalist-white',
          is_pinned: true
        },
        {
          title: '日语五十音',
          description: '日语假名学习卡片，包含平假名和片假名',
          styleTheme: 'night-black'
        }
      ];
      
      const createdThemes = [];
      for (const themeData of sampleThemes) {
        const theme = await this.createTheme(themeData);
        createdThemes.push(theme);
      }
      
      // 为英语单词主题添加示例卡片
      const englishTheme = createdThemes[0];
      const englishWords = [
        { front: 'Hello', back: '你好' },
        { front: 'World', back: '世界' },
        { front: 'Computer', back: '计算机' },
        { front: 'Programming', back: '编程' },
        { front: 'Database', back: '数据库' }
      ];
      
      for (const word of englishWords) {
        await this.addCardToTheme(englishTheme.id, word.front, word.back);
      }
      
      // 为日语主题添加示例卡片
      const japaneseTheme = createdThemes[1];
      const japaneseChars = [
        { front: 'あ', back: 'a' },
        { front: 'か', back: 'ka' },
        { front: 'さ', back: 'sa' },
        { front: 'た', back: 'ta' },
        { front: 'な', back: 'na' }
      ];
      
      for (const char of japaneseChars) {
        await this.addCardToTheme(japaneseTheme.id, char.front, char.back);
      }
      
      const result = {
        themes: createdThemes.length,
        cards: englishWords.length + japaneseChars.length,
        timestamp: new Date().toISOString()
      };
      
      console.log('🌱 示例数据创建完成:', result);
      return result;
      
    }, '创建示例数据');
  }
}

// 创建全局数据库服务实例
const databaseService = new DatabaseService();

// 导出服务实例和类
export default databaseService;
export { DatabaseService };