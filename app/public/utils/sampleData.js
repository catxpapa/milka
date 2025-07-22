// 示例数据生成器 - 为喵卡应用创建预置数据

/**
 * 示例数据生成器类
 * 负责创建应用的预置主题和卡片数据
 */
export class SampleDataGenerator {
  constructor(db) {
    this.db = db;
    this.themesCollection = db.getCollection("themes");
    this.cardFacesCollection = db.getCollection("cardFaces");
    this.associationsCollection = db.getCollection("associations");
  }

  /**
   * 创建所有示例数据
   * @returns {Promise<void>}
   */
  async createAllSampleData() {
    try {
      console.log('🌱 开始创建示例数据...');
      
      // 创建英语学习主题
      await this.createEnglishTheme();
      
      // 创建数学公式主题
      await this.createMathTheme();
      
      // 创建历史知识主题
      await this.createHistoryTheme();
      
      console.log('✅ 所有示例数据创建完成');
      
    } catch (error) {
      console.error('❌ 创建示例数据失败:', error);
      throw error;
    }
  }

  /**
   * 创建英语学习主题
   * @returns {Promise<void>}
   */
  async createEnglishTheme() {
    const themeId = `theme_${Date.now()}_english`;
    
    // 创建英语学习主题
    const englishTheme = {
      id: themeId,
      title: '英语单词学习',
      description: '常用英语单词记忆卡片，帮助提高词汇量和口语表达能力',
      cover_image_url: '',
      style_config: {
        theme: 'minimalist-white',
        custom_styles: {}
      },
      is_official: true,
      sort_order: 0,
      is_pinned: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await this.themesCollection.upsert(englishTheme);
    
    // 英语单词卡片数据
    const englishCards = [
      { 
        front: 'Hello', 
        back: '你好', 
        frontNotes: '最常用的问候语，适用于任何场合',
        backNotes: '发音：/həˈloʊ/ 例句：Hello, how are you?'
      },
      { 
        front: 'Thank you', 
        back: '谢谢', 
        frontNotes: '表达感谢的基本用语',
        backNotes: '发音：/θæŋk juː/ 可简化为 Thanks'
      },
      { 
        front: 'Beautiful', 
        back: '美丽的', 
        frontNotes: '形容词，描述美好的事物',
        backNotes: '发音：/ˈbjuːtɪfl/ 例句：What a beautiful day!'
      },
      { 
        front: 'Knowledge', 
        back: '知识', 
        frontNotes: '不可数名词，表示学问和见识',
        backNotes: '发音：/ˈnɑːlɪdʒ/ 搭配：gain knowledge'
      },
      { 
        front: 'Adventure', 
        back: '冒险', 
        frontNotes: '可数名词，表示刺激的经历',
        backNotes: '发音：/ədˈventʃər/ 例句：Life is an adventure'
      }
    ];
    
    await this.createCardsForTheme(themeId, englishCards);
  }

  /**
   * 创建数学公式主题
   * @returns {Promise<void>}
   */
  async createMathTheme() {
    const themeId = `theme_${Date.now() + 1}_math`;
    
    // 创建数学公式主题
    const mathTheme = {
      id: themeId,
      title: '数学公式记忆',
      description: '常用数学公式和定理，帮助快速记忆和应用',
      cover_image_url: '',
      style_config: {
        theme: 'night-black',
        custom_styles: {}
      },
      is_official: true,
      sort_order: 1,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await this.themesCollection.upsert(mathTheme);
    
    // 数学公式卡片数据
    const mathCards = [
      { 
        front: '勾股定理', 
        back: 'a² + b² = c²', 
        frontNotes: '直角三角形的基本定理',
        backNotes: 'a、b为直角边，c为斜边'
      },
      { 
        front: '二次方程求根公式', 
        back: 'x = (-b ± √(b²-4ac)) / 2a', 
        frontNotes: '解一元二次方程 ax² + bx + c = 0',
        backNotes: '判别式 Δ = b²-4ac 决定根的性质'
      },
      { 
        front: '圆的面积公式', 
        back: 'S = πr²', 
        frontNotes: '圆形区域的面积计算',
        backNotes: 'r为半径，π ≈ 3.14159'
      },
      { 
        front: '导数定义', 
        back: "f'(x) = lim(h→0) [f(x+h)-f(x)]/h", 
        frontNotes: '函数在某点的瞬时变化率',
        backNotes: '几何意义：切线斜率'
      }
    ];
    
    await this.createCardsForTheme(themeId, mathCards);
  }

  /**
   * 创建历史知识主题
   * @returns {Promise<void>}
   */
  async createHistoryTheme() {
    const themeId = `theme_${Date.now() + 2}_history`;
    
    // 创建历史知识主题
    const historyTheme = {
      id: themeId,
      title: '中国历史朝代',
      description: '中国古代历史朝代顺序和重要事件记忆',
      cover_image_url: '',
      style_config: {
        theme: 'minimalist-white',
        custom_styles: {}
      },
      is_official: true,
      sort_order: 2,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await this.themesCollection.upsert(historyTheme);
    
    // 历史朝代卡片数据
    const historyCards = [
      { 
        front: '秦朝', 
        back: '公元前221年-公元前206年', 
        frontNotes: '中国第一个统一的封建王朝',
        backNotes: '秦始皇统一六国，建立中央集权制'
      },
      { 
        front: '汉朝', 
        back: '公元前206年-公元220年', 
        frontNotes: '分为西汉和东汉两个时期',
        backNotes: '丝绸之路开通，文化繁荣发展'
      },
      { 
        front: '唐朝', 
        back: '公元618年-公元907年', 
        frontNotes: '中国古代最强盛的朝代之一',
        backNotes: '贞观之治、开元盛世，诗歌繁荣'
      },
      { 
        front: '明朝', 
        back: '公元1368年-公元1644年', 
        frontNotes: '朱元璋建立，定都南京后迁北京',
        backNotes: '郑和下西洋，紫禁城建成'
      }
    ];
    
    await this.createCardsForTheme(themeId, historyCards);
  }

  /**
   * 为指定主题创建卡片
   * @param {string} themeId - 主题ID
   * @param {Array} cardsData - 卡片数据数组
   * @returns {Promise<void>}
   */
  async createCardsForTheme(themeId, cardsData) {
    for (let i = 0; i < cardsData.length; i++) {
      const card = cardsData[i];
      const timestamp = Date.now() + i;
      const randomId = Math.random().toString(36).substr(2, 9);
      
      // 创建正面卡面
      const frontFace = {
        id: `face_${timestamp}_front_${randomId}`,
        main_text: card.front,
        notes: card.frontNotes || '',
        image_url: '',
        keywords: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 创建背面卡面
      const backFace = {
        id: `face_${timestamp}_back_${randomId}`,
        main_text: card.back,
        notes: card.backNotes || '',
        image_url: '',
        keywords: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 批量插入卡面
      await this.cardFacesCollection.upsert([frontFace, backFace]);
      
      // 创建关联关系
      const association = {
        id: `assoc_${timestamp}_${randomId}`,
        theme_id: themeId,
        front_face_id: frontFace.id,
        back_face_id: backFace.id,
        sort_order: i,
        created_at: new Date().toISOString()
      };
      
      await this.associationsCollection.upsert(association);
    }
    
    console.log(`✅ 为主题 ${themeId} 创建了 ${cardsData.length} 张卡片`);
  }

  /**
   * 检查是否需要创建示例数据
   * @returns {Promise<boolean>}
   */
  async shouldCreateSampleData() {
    try {
      const existingThemes = await this.themesCollection.find({}).fetch();
      return existingThemes.length === 0;
    } catch (error) {
      console.error('检查示例数据状态失败:', error);
      return true; // 出错时默认创建示例数据
    }
  }


 /**
 * 清除所有数据（修复版本 - 使用正确的 MiniDB API 和字段名）
 * @returns {Promise<void>}
 */
async clearAllData() {
  try {
    console.log('🗑️ 开始清除所有数据...');
    
    // 1. 获取所有关联记录并删除
    console.log('正在删除关联记录...');
    const associations = await this.associationsCollection.find({}).fetch();
    if (associations.length > 0) {
      const associationIds = associations.map(item => item._id); // 使用 _id
      await this.associationsCollection.remove(associationIds);
      console.log(`✅ 已删除 ${associations.length} 条关联记录`);
    }
    
    // 2. 获取所有卡面记录并删除
    console.log('正在删除卡面记录...');
    const faces = await this.cardFacesCollection.find({}).fetch();
    if (faces.length > 0) {
      const faceIds = faces.map(item => item._id); // 使用 _id
      await this.cardFacesCollection.remove(faceIds);
      console.log(`✅ 已删除 ${faces.length} 条卡面记录`);
    }
    
    // 3. 获取所有主题记录并删除
    console.log('正在删除主题记录...');
    const themes = await this.themesCollection.find({}).fetch();
    if (themes.length > 0) {
      const themeIds = themes.map(item => item._id); // 使用 _id
      await this.themesCollection.remove(themeIds);
      console.log(`✅ 已删除 ${themes.length} 条主题记录`);
    }
    
    console.log('✅ 所有数据已清除完成');
    
  } catch (error) {
    console.error('❌ 清除数据失败:', error);
    throw error;
  }
}

/**
 * 重新创建示例数据（清除后重建）
 * @returns {Promise<void>}
 */
async recreateSampleData() {
  await this.clearAllData();
  await this.createAllSampleData();
}

/**
 * 检查是否需要创建示例数据
 * @returns {Promise<boolean>}
 */
async shouldCreateSampleData() {
  try {
    const existingThemes = await this.themesCollection.find({}).fetch();
    return existingThemes.length === 0;
  } catch (error) {
    console.error('检查示例数据状态失败:', error);
    return true; // 出错时默认创建示例数据
  }
}
  /**
   * 重新创建示例数据（清除后重建）
   * @returns {Promise<void>}
   */
  async recreateSampleData() {
    await this.clearAllData();
    await this.createAllSampleData();
  }
}

// 导出便捷函数
export async function initializeSampleData(db) {
  const generator = new SampleDataGenerator(db);
  
  if (await generator.shouldCreateSampleData()) {
    await generator.createAllSampleData();
    return true;
  }
  
  return false;
}