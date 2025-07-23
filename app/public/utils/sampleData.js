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
      
      // 创建喵卡使用说明主题（排在最前面）
      await this.createUsageGuideTheme();
      
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
   * 创建喵卡使用说明主题
   * @returns {Promise<void>}
   */
  async createUsageGuideTheme() {
    const themeId = `theme_${Date.now()}_guide`;
    
    // 创建喵卡使用说明主题
    const guideTheme = {
      id: themeId,
      title: '喵卡使用说明',
      description: '快速了解喵卡的功能和使用方法，让学习更高效',
      cover_image_url: '',
      style_config: {
        theme: 'minimalist-white',
        custom_styles: {}
      },
      is_official: true,
      sort_order: -1, // 确保排在最前面
      is_pinned: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await this.themesCollection.upsert(guideTheme);
    
    // 使用说明卡片数据
    const guideCards = [
      { 
        front: '喵卡是什么？', 
        back: '轻量级记忆闪卡',
        backNotes: '喵卡是一款轻量级的记忆闪卡应用，它可以帮助您高效学习和记忆各种知识。支持自定义主题、卡片管理和多种学习模式，让学习变得更有趣。基于懒猫微服平台开发，数据安全可靠', 
        frontNotes: '点击了解喵卡的核心功能'
      },
      { 
        front: '使用方法', 
        back: '背诵·复习·默想·抢答',
        backNotes: '选择主题进入学习模式，先在心中预想卡面上的知识点，点击卡片即可查看背面答案。也可以多人抢答并揭晓答案。目前支持列表模式和幻灯片模式，可根据学习习惯自由切换。', 
        frontNotes: '简单易用的操作方式'
      },
      { 
        front: '添加自己的内容', 
        back: '灵活分类学习材料', 
        frontNotes: '自定义任何课目的学习内容',
        backNotes: '在主题列表页面点击"+"按钮创建新主题，进入主题后点击"添加卡片"即可创建新的学习内容。备注区可容纳大量文本，适用于各种不同的学科知识结构。'
      },
      { 
        front: '幻灯片模式', 
        back: '快捷键', 
        frontNotes: '键盘操作更加快捷轻松',
        backNotes: '幻灯片模式下：[空格键]翻转卡片 | [左右箭头]切换卡片。任何时候点击logo都会刷新并返回主页，可解决绝大部分报错的问题。'
      },
      { 
        front: '数据管理说明', 
        back: '备份与导入', 
        frontNotes: '数据备份与导入功能',
        backNotes: '在设置页面可以导出所有数据为JSON文件进行备份，也可以导入其他设备的数据。支持增量导入和完全覆盖两种模式，确保数据安全。未来将支持单独的学习数据包导入。'
      }
    ];
    
    await this.createCardsForTheme(themeId, guideCards);
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
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await this.themesCollection.upsert(englishTheme);
    
    // 英语单词卡片数据（front和back对调）
    const englishCards = [
      { 
        front: '你好', 
        back: 'Hello', 
        frontNotes: '最常用的问候语，适用于任何场合',
        backNotes: '发音：/həˈloʊ/ 例句：Hello, how are you?'
      },
      { 
        front: '谢谢', 
        back: 'Thank you', 
        frontNotes: '表达感谢的基本用语',
        backNotes: '发音：/θæŋk juː/ 可简化为 Thanks'
      },
      { 
        front: '美丽的', 
        back: 'Beautiful', 
        frontNotes: '形容词，描述美好的事物',
        backNotes: '发音：/ˈbjuːtɪfl/ 例句：What a beautiful day!'
      },
      { 
        front: '知识', 
        back: 'Knowledge', 
        frontNotes: '不可数名词，表示学问和见识',
        backNotes: '发音：/ˈnɑːlɪdʒ/ 搭配：gain knowledge'
      },
      { 
        front: '冒险', 
        back: 'Adventure', 
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
    
    // 历史朝代卡片数据（增加更丰富的注释内容）
    const historyCards = [
      { 
        front: '秦朝', 
        back: '公元前221年-公元前206年', 
        frontNotes: '中国第一个统一的封建王朝，由秦始皇嬴政建立。秦朝虽然存在时间短暂，但对中国历史产生了深远影响，建立了中央集权制度，统一了文字、货币、度量衡等，为后世王朝奠定了基础。秦朝的政治制度、法律体系和行政管理模式都成为后世借鉴的重要参考。',
        backNotes: '秦始皇统一六国后建立秦朝，实行郡县制，废除分封制。修建万里长城抵御北方游牧民族入侵，统一文字为小篆，统一货币为圆形方孔钱，统一度量衡促进商业发展。焚书坑儒加强思想控制，但也造成了文化损失。秦朝法制严苛，实行严刑峻法，最终因暴政和民不聊生而迅速灭亡。'
      },
      { 
        front: '汉朝', 
        back: '公元前206年-公元220年', 
        frontNotes: '分为西汉（公元前206年-公元8年）和东汉（25年-220年）两个时期，是中国历史上最重要的朝代之一。汉朝奠定了中华民族的基本格局，"汉族"、"汉字"、"汉语"等称谓都源于此。汉朝在政治、经济、文化、科技等各个领域都取得了辉煌成就，对后世产生了深远影响。',
        backNotes: '汉朝开创了丝绸之路，促进了东西方文化交流。文化方面，儒学成为正统思想，太学的建立推动了教育发展。科技方面，发明了造纸术、地动仪等重要发明。经济上实行重农抑商政策，农业生产力大幅提升。军事上，汉武帝时期国力达到鼎盛，北击匈奴，南征百越，西通西域，奠定了中国的基本疆域。'
      },
      { 
        front: '唐朝', 
        back: '公元618年-公元907年', 
        frontNotes: '中国古代最强盛的朝代之一，也是世界历史上最辉煌的帝国之一。唐朝国力强盛，疆域辽阔，文化繁荣，对外开放程度很高。唐朝的政治制度、文化艺术、科学技术都达到了很高的水平，被誉为中国古代文明的巅峰时期，对周边国家和地区产生了深远影响。',
        backNotes: '唐朝经历了贞观之治、开元盛世等繁荣时期，国力达到顶峰。诗歌艺术空前繁荣，涌现出李白、杜甫、白居易等伟大诗人。长安成为世界性大都市，万国来朝。佛教、道教、儒教并存发展，文化包容性强。科举制度完善，选拔人才更加公平。丝绸之路贸易繁荣，对外交流频繁。女皇武则天开创了女性执政的先河。'
      },
      { 
        front: '明朝', 
        back: '公元1368年-公元1644年', 
        frontNotes: '由朱元璋建立的汉族王朝，推翻了蒙古族建立的元朝统治。明朝初期定都南京，后迁都北京。明朝是中国历史上最后一个由汉族建立的大一统王朝，在政治、经济、文化、科技等方面都有重要发展，特别是在海外探险、建筑艺术、文学创作等领域取得了突出成就。',
        backNotes: '明朝永乐年间，郑和七下西洋，展现了中国强大的海上实力和开放的外交政策。紫禁城（故宫）的建成代表了中国古代建筑艺术的最高水平。文学方面，《西游记》、《水浒传》、《三国演义》等四大名著中的三部都产生于明朝。科技方面，《本草纲目》、《天工开物》等科学著作问世。明朝中后期实行海禁政策，限制了对外贸易和文化交流。'
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