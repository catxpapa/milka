// 喵卡应用前端主逻辑 - 基于MiniDB和React组件化设计
import { MiniDB } from "@lazycatcloud/minidb";
import { ThemeEditor, CardEditor } from "./components/editors.js";
import { SettingsPage } from "./pages/settings.js";
import { SampleDataPrompt } from "./pages/sampleDataPrompt.js";



// 全局应用状态和配置
class MilkaApp {
  constructor() {
    // MiniDB 数据库初始化
    this.db = new MiniDB();
    this.themesCollection = this.db.getCollection("themes");
    this.cardFacesCollection = this.db.getCollection("cardFaces");
    this.associationsCollection = this.db.getCollection("associations");
    // 组件实例
this.themeEditor = new ThemeEditor(this);
this.cardEditor = new CardEditor(this);
this.settingsPage = new SettingsPage(this);
this.sampleDataPrompt = new SampleDataPrompt(this);
    // 应用状态
    this.state = {
      currentTheme: null,
      currentMode: 'list', // list | slideshow | edit
      currentView: 'themes', // themes | theme-detail | theme-editor | card-editor
      themes: [],
      currentCards: [],
      currentCardIndex: 0,
      isLoading: false,
      styleTheme: 'minimalist-white', // minimalist-white | night-black
      searchQuery: '',
      selectedCards: new Set(),
      isInitialized: false, // 初始化状态标记
      initError: null, // 初始化错误信息
      selectedThemeStyle: 'minimalist-white' // 表单中选择的主题风格
    };
    
    // 组件实例
    this.themeEditor = new ThemeEditor(this);
    this.cardEditor = new CardEditor(this);
    this.settingsPage = new SettingsPage(this);
    
    // 绑定方法上下文
    this.bindMethods();
    
    // 初始化应用
    this.init();
  }

  // 绑定方法上下文
  bindMethods() {
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleCardClick = this.handleCardClick.bind(this);
    this.handleThemeSelect = this.handleThemeSelect.bind(this);
    this.createTheme = this.createTheme.bind(this);
    this.addCard = this.addCard.bind(this);
    this.showCreateThemeDialog = this.showCreateThemeDialog.bind(this);
    this.showAddCardDialog = this.showAddCardDialog.bind(this);
    this.goBack = this.goBack.bind(this);
    this.toggleTheme = this.toggleTheme.bind(this);
    this.toggleMode = this.toggleMode.bind(this);
    this.dismissError = this.dismissError.bind(this);
    this.flipCard = this.flipCard.bind(this);
    this.nextCard = this.nextCard.bind(this);
    this.previousCard = this.previousCard.bind(this);
    this.flipPreviewCard = this.flipPreviewCard.bind(this);
    this.updateCardPreview = this.updateCardPreview.bind(this);
    this.selectThemeStyle = this.selectThemeStyle.bind(this);
    this.handleThemeSubmit = this.handleThemeSubmit.bind(this);
    this.handleCardSubmit = this.handleCardSubmit.bind(this);
    this.navigateTo = this.navigateTo.bind(this);
  }

  // 应用初始化
 // 应用初始化
async init() {
  try {
    console.log('🐱 喵卡应用初始化中...');
    
    // 显示加载状态
    this.setLoading(true);
    
    // 清除之前的错误状态
    this.state.initError = null;
    
    // 加载主题数据
    await this.loadThemes();
    
    // 检查是否有数据，没有则询问用户是否创建示例数据
    if (this.state.themes.length === 0) {
      console.log('📊 数据库为空，询问用户是否创建示例数据');
      
      // 隐藏加载状态，显示询问界面
      this.setLoading(false);
      const appContainer = document.getElementById('app');
        appContainer.innerHTML = this.sampleDataPrompt.render();
      return; // 等待用户选择
    }
    
    // 标记初始化完成
    this.state.isInitialized = true;
    
    // 隐藏加载状态
    this.setLoading(false);
    
    // 渲染应用界面
    this.render();
    
    // 绑定事件监听器
    this.bindEvents();
    
    // 应用主题
    this.applyTheme();
    
    console.log('✅ 喵卡应用初始化完成');
    
  } catch (error) {
    console.error('❌ 应用初始化失败:', error);
    
    // 设置错误状态，但不阻止应用运行
    this.state.initError = error.message;
    this.state.isInitialized = true; // 仍然标记为已初始化
    
    this.setLoading(false);
    this.render(); // 渲染界面，显示错误但允许继续使用
    
    // 显示友好的错误提示，但不阻止功能
    this.showNotification('初始化时遇到问题，但应用仍可正常使用', 'warning');
  }
  window.settingsPage = this.settingsPage;
}



// 创建示例数据并启动应用
async createSampleDataAndStart() {
  try {
    // 显示加载状态
    this.setLoading(true, '正在创建示例数据...');
    
    // 创建示例数据
    const { initializeSampleData } = await import('./utils/sampleData.js');
    await initializeSampleData(this.db);
    
    // 重新加载主题数据
    await this.loadThemes();
    
    // 完成初始化
    await this.completeInitialization();
    
    this.showNotification('示例数据创建成功，欢迎使用喵卡！', 'success');
    
  } catch (error) {
    console.error('❌ 创建示例数据失败:', error);
    this.setLoading(false);
    this.showNotification('创建示例数据失败: ' + error.message, 'error');
  }
}

// 从空白数据开始
async startWithEmptyData() {
  try {
    // 完成初始化
    await this.completeInitialization();
    
    this.showNotification('应用已启动，您可以开始创建自己的主题和卡片', 'info');
    
  } catch (error) {
    console.error('❌ 启动应用失败:', error);
    this.showNotification('启动应用失败: ' + error.message, 'error');
  }
}

// 完成应用初始化
async completeInitialization() {
  // 标记初始化完成
  this.state.isInitialized = true;
  
  // 隐藏加载状态
  this.setLoading(false);
  
  // 渲染应用界面
  this.render();
  
  // 绑定事件监听器
  this.bindEvents();
  
  // 应用主题
  this.applyTheme();
  
  console.log('✅ 喵卡应用初始化完成');
}

// 修改设置页面的数据管理方法
async clearAllData() {
  try {
    this.setLoading(true, '正在清空数据...');
    
    const { SampleDataGenerator } = await import('./utils/sampleData.js');
    const generator = new SampleDataGenerator(this.db);
    
    await generator.clearAllData();
    
    // 重新加载主题数据
    await this.loadThemes();
    
    this.setLoading(false);
    this.showNotification('所有数据已清空', 'success');
    
    // 如果当前在设置页面，刷新统计数据
    if (this.state.currentView === 'settings') {
      await this.refreshStats();
    }
    
  } catch (error) {
    console.error('❌ 清空数据失败:', error);
    this.setLoading(false);
    this.showNotification('清空数据失败: ' + error.message, 'error');
  }
}

async reinitializeData() {
  try {
    this.setLoading(true, '正在重新初始化数据...');
    
    const { SampleDataGenerator } = await import('./utils/sampleData.js');
    const generator = new SampleDataGenerator(this.db);
    
    await generator.recreateSampleData();
    
    // 重新加载主题数据
    await this.loadThemes();
    
    this.setLoading(false);
    this.showNotification('数据重新初始化成功', 'success');
    
    // 如果当前在设置页面，刷新统计数据
    if (this.state.currentView === 'settings') {
      await this.refreshStats();
    }
    
  } catch (error) {
    console.error('❌ 重新初始化失败:', error);
    this.setLoading(false);
    this.showNotification('重新初始化失败: ' + error.message, 'error');
  }
}

async createSampleData() {
  try {
    this.setLoading(true, '正在创建示例数据...');
    
    const { SampleDataGenerator } = await import('./utils/sampleData.js');
    const generator = new SampleDataGenerator(this.db);
    
    await generator.createAllSampleData();
    
    // 重新加载主题数据
    await this.loadThemes();
    
    this.setLoading(false);
    this.showNotification('示例数据创建成功', 'success');
    
    // 如果当前在设置页面，刷新统计数据
    if (this.state.currentView === 'settings') {
      await this.refreshStats();
    }
    
  } catch (error) {
    console.error('❌ 创建示例数据失败:', error);
    this.setLoading(false);
    this.showNotification('创建示例数据失败: ' + error.message, 'error');
  }
}

// 修改 setLoading 方法支持自定义消息
setLoading(isLoading, message = '正在加载...') {
  this.state.isLoading = isLoading;
  
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    if (isLoading) {
      // 更新加载消息
      const messageElement = loadingElement.querySelector('p');
      if (messageElement) {
        messageElement.textContent = message;
      }
      loadingElement.style.display = 'flex';
    } else {
      loadingElement.style.display = 'none';
    }
  }
}

  // 设置加载状态的统一方法
  setLoading(isLoading) {
    this.state.isLoading = isLoading;
    
    // 更新加载指示器显示状态
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      if (isLoading) {
        loadingElement.style.display = 'flex';
        loadingElement.style.opacity = '1';
      } else {
        loadingElement.style.opacity = '0';
        setTimeout(() => {
          loadingElement.style.display = 'none';
        }, 300);
      }
    }
    
    // 如果不是加载状态，触发重新渲染
    if (!isLoading) {
      this.render();
    }
  }

  // 加载所有主题数据
  async loadThemes() {
    try {
      console.log('📚 开始加载主题数据...');
      
      // 按排序和创建时间加载主题
      this.state.themes = await this.themesCollection
        .find({}, { sort: ["sort_order", "created_at"] })
        .fetch();
      
      console.log(`📚 成功加载了 ${this.state.themes.length} 个主题`);
      
    } catch (error) {
      console.error('❌ 加载主题失败:', error);
      this.showNotification('加载主题失败: ' + error.message, 'error');
      throw error;
    }
  }

  // 加载主题的卡片数据
  async loadThemeCards(themeId) {
    try {
      console.log(`🃏 开始加载主题 ${themeId} 的卡片...`);
      
      // 获取主题关联的卡片
      const associations = await this.associationsCollection
        .find({ theme_id: themeId }, { sort: ["sort_order"] })
        .fetch();
      
      if (associations.length === 0) {
        this.state.currentCards = [];
        console.log('🃏 该主题暂无卡片');
        return;
      }
      
      // 获取所有相关卡面ID
      const faceIds = [...new Set([
        ...associations.map(a => a.front_face_id),
        ...associations.map(a => a.back_face_id)
      ])];
      
      // 批量获取卡面数据
      const faces = await this.cardFacesCollection
        .find({ id: { $in: faceIds } })
        .fetch();
      
      // 构建卡片数据结构
      this.state.currentCards = associations.map(assoc => {
        const frontFace = faces.find(f => f.id === assoc.front_face_id);
        const backFace = faces.find(f => f.id === assoc.back_face_id);
        
        return {
          id: assoc.id,
          themeId: assoc.theme_id,
          front: frontFace,
          back: backFace,
          sortOrder: assoc.sort_order,
          isFlipped: false
        };
      });
      
      console.log(`🃏 成功加载了 ${this.state.currentCards.length} 张卡片`);
      
    } catch (error) {
      console.error('❌ 加载卡片失败:', error);
      this.showNotification('加载卡片失败: ' + error.message, 'error');
      throw error;
    }
  }

  // 主题选择处理
  async handleThemeSelect(themeId) {
    try {
      console.log(`📚 选择主题: ${themeId}`);
      
      // 显示加载状态
      this.setLoading(true);
      
      // 查找并设置当前主题
      this.state.currentTheme = this.state.themes.find(t => t.id === themeId);
      
      if (!this.state.currentTheme) {
        throw new Error('主题不存在');
      }
      
      // 加载主题的卡片
      await this.loadThemeCards(themeId);
      
      // 切换到主题详情视图
      this.state.currentView = 'theme-detail';
      this.state.currentMode = 'list';
      this.state.currentCardIndex = 0;
      
      // 隐藏加载状态并重新渲染
      this.setLoading(false);
      
    } catch (error) {
      console.error('❌ 选择主题失败:', error);
      this.setLoading(false);
      this.showNotification('加载主题失败: ' + error.message, 'error');
    }
  }

  // 显示创建主题对话框
  showCreateThemeDialog() {
    this.state.currentView = 'theme-editor';
    this.state.selectedThemeStyle = this.state.styleTheme; // 使用当前全局主题
    this.render();
  }

  // 显示添加卡片对话框
  showAddCardDialog() {
    if (!this.state.currentTheme) {
      this.showNotification('请先选择一个主题', 'warning');
      return;
    }
    
    this.state.currentView = 'card-editor';
    this.render();
  }

  // 选择主题风格
  selectThemeStyle(style) {
    this.state.selectedThemeStyle = style;
    
    // 更新界面中的选择状态
    const styleOptions = document.querySelectorAll('.style-option');
    styleOptions.forEach(option => {
      option.classList.remove('selected');
    });
    
    const selectedOption = document.querySelector(`.style-option[onclick*="${style}"]`);
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }
  }

  // 处理主题表单提交
  async handleThemeSubmit(event) {
    event.preventDefault();
    
    try {
      const formData = new FormData(event.target);
      const themeData = {
        title: formData.get('title'),
        description: formData.get('description'),
        styleTheme: this.state.styleTheme // 使用当前全局主题
      };
      
      await this.createTheme(themeData);
      
    } catch (error) {
      console.error('❌ 主题提交失败:', error);
      this.showNotification('创建主题失败: ' + error.message, 'error');
    }
  }

  // 处理卡片表单提交
async handleCardSubmit(event, themeId) {
  event.preventDefault();
  
  try {
    const formData = new FormData(event.target);
    const frontText = formData.get('frontText');
    const backText = formData.get('backText');
    const frontNotes = formData.get('frontNotes');
    const backNotes = formData.get('backNotes');
    
    await this.addCard(themeId, frontText, backText, frontNotes, backNotes);
    
    // 返回主题详情页
    this.state.currentView = 'theme-detail';
    this.render();
    
  } catch (error) {
    console.error('❌ 卡片提交失败:', error);
    this.showNotification('添加卡片失败: ' + error.message, 'error');
  }
}


  // 创建新主题
  async createTheme(themeData) {
    try {
      console.log('📚 开始创建新主题...');
      
      // 显示加载状态
      this.setLoading(true);
      
      const theme = {
        id: `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: themeData.title || '新主题',
        description: themeData.description || '',
        cover_image_url: themeData.cover_image_url || '',
        style_config: {
          theme: themeData.styleTheme || 'minimalist-white',
          custom_styles: themeData.customStyles || {}
        },
        is_official: false,
        sort_order: this.state.themes.length,
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 保存到数据库
      await this.themesCollection.upsert(theme);
      console.log(`📚 主题创建成功: ${theme.title}`);
      
      // 重新加载主题列表
      await this.loadThemes();
      
      // 隐藏加载状态并重新渲染
      this.setLoading(false);
      
      // 显示成功通知
      this.showNotification('主题创建成功', 'success');
      
      // 切换到主题列表视图
      this.state.currentView = 'themes';
      this.render();
      
      return theme;
      
    } catch (error) {
      console.error('❌ 创建主题失败:', error);
      this.setLoading(false);
      this.showNotification('创建主题失败: ' + error.message, 'error');
      throw error;
    }
  }

  // 添加卡片到主题
  async addCard(themeId, frontText, backText, frontNotes = '', backNotes = '') {
    try {
      console.log(`🃏 开始添加卡片到主题 ${themeId}...`);
      
      // 显示加载状态
      this.setLoading(true);
      
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      
      // 创建正面卡面
      const frontFace = {
        id: `face_${timestamp}_front_${randomId}`,
        main_text: frontText,
        notes: frontNotes,
        image_url: '',
        keywords: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 创建背面卡面
      const backFace = {
        id: `face_${timestamp}_back_${randomId}`,
        main_text: backText,
        notes: backNotes,
        image_url: '',
        keywords: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 批量插入卡面
      await this.cardFacesCollection.upsert([frontFace, backFace]);
      console.log('🃏 卡面创建成功');
      
      // 创建关联关系
      const association = {
        id: `assoc_${timestamp}_${randomId}`,
        theme_id: themeId,
        front_face_id: frontFace.id,
        back_face_id: backFace.id,
        sort_order: this.state.currentCards.length,
        created_at: new Date().toISOString()
      };
      
      await this.associationsCollection.upsert(association);
      console.log('🃏 关联关系创建成功');
      
      // 重新加载当前主题的卡片
      if (this.state.currentTheme && this.state.currentTheme.id === themeId) {
        await this.loadThemeCards(themeId);
      }
      
      // 隐藏加载状态并重新渲染
      this.setLoading(false);
      
      // 显示成功通知
      this.showNotification('卡片添加成功', 'success');
      
      console.log(`🃏 卡片添加完成: ${frontText} -> ${backText}`);
      
    } catch (error) {
      console.error('❌ 添加卡片失败:', error);
      this.setLoading(false);
      this.showNotification('添加卡片失败: ' + error.message, 'error');
      throw error;
    }
  }

    resetFlipState() {
        try{
            document.querySelector('.flipped').classList.remove('flipped');
        }catch(e){
            console.log('没有卡片被翻转')
        }
    }
  // 翻转卡片
  flipCard(cardIndex) {


    const cardElement = document.querySelector(`[data-card-index="${cardIndex}"]`);
    const cardInner = cardElement.querySelector('.card');
    console.log(cardInner,cardInner.classList.contains('flipped'));

        if ( cardInner.classList.contains('flipped')) {
            this.resetFlipState();
            // cardInner.classList.remove('flipped');
          } else {
            this.resetFlipState();
            cardInner.classList.add('flipped');
          }
           console.log(cardInner.classList.contains('flipped'));
          return;
 
      // 列表模式下允许翻转
      if (cardIndex >= 0 && cardIndex < this.state.currentCards.length) {
        // this.state.currentCards[cardIndex].isFlipped = !this.state.currentCards[cardIndex].isFlipped;
        
        // 更新DOM中的卡片状态
        const cardElement = document.querySelector(`[data-card-index="${cardIndex}"]`);
        if (cardElement) {
          const cardInner = cardElement.querySelector('.card');
        //   if (this.state.currentCards[cardIndex].isFlipped) {
          if ( cardInner.classList.contains('flipped')) {
            cardInner.classList.remove('flipped');
          } else {
            cardInner.classList.add('flipped');
          }
        console.log(cardInner.classList.contains('flipped'))
        
        // 播放翻转音效（可选）
        this.playFlipSound();

        }
      }
    
  }

  // 预览卡片翻转 - 移除此功能
  flipPreviewCard() {
    // 移除预览卡片翻转功能
    console.log('预览卡片不支持翻转');
  }

// 更新卡片预览内容
updateCardPreview(side, content) {
  if (side === 'front') {
    const previewElement = document.getElementById('preview-front');
    if (previewElement) {
      previewElement.textContent = content || '正面内容预览';
    }
  } else if (side === 'back') {
    const previewElement = document.getElementById('preview-back');
    if (previewElement) {
      previewElement.textContent = content || '背面内容预览';
    }
  } else if (side === 'front-notes') {
    const previewElement = document.getElementById('preview-front-notes');
    if (previewElement) {
      previewElement.textContent = content || '正面备注';
    }
  } else if (side === 'back-notes') {
    const previewElement = document.getElementById('preview-back-notes');
    if (previewElement) {
      previewElement.textContent = content || '背面备注';
    }
  }
}


  // 播放翻转音效（可选功能）
  playFlipSound() {
    console.log('🔊 播放翻转音效');
  }

  // 处理卡片点击
  handleCardClick(cardIndex) {
    this.flipCard(cardIndex);
  }

  // 下一张卡片
  nextCard() {
    if (this.state.currentCardIndex < this.state.currentCards.length - 1) {
      this.state.currentCardIndex++;
      this.render();
    }
  }

  // 上一张卡片
  previousCard() {
    if (this.state.currentCardIndex > 0) {
      this.state.currentCardIndex--;
      this.render();
    }
  }

  // 切换模式
  toggleMode() {

    this.state.currentMode = this.state.currentMode === 'list' ? 'slideshow' : 'list';
    this.state.currentCardIndex = 0;
    this.render();
    
   
  }

  // 切换主题
  toggleTheme() {
    this.state.styleTheme = this.state.styleTheme === 'minimalist-white' ? 'night-black' : 'minimalist-white';
    this.applyTheme();
    this.render();
  }

  // 返回上一页
  goBack() {
    switch (this.state.currentView) {
      case 'theme-detail':
        this.state.currentView = 'themes';
        this.state.currentTheme = null;
        this.state.currentCards = [];
        break;
      case 'theme-editor':
      case 'card-editor':
        if (this.state.currentTheme) {
          this.state.currentView = 'theme-detail';
        } else {
          this.state.currentView = 'themes';
        }
        break;
      default:
        this.state.currentView = 'themes';
    }
    this.render();
  }

  // 导航到指定视图
  navigateTo(view, data = null) {
    this.state.currentView = view;
    if (data) {
      Object.assign(this.state, data);
    }
    this.render();
  }

  // 应用主题
  applyTheme() {
    const app = document.getElementById('app');
    if (app) {
      app.className = `milka-app theme-${this.state.styleTheme}`;
    }
  }

  // 绑定事件监听器
  bindEvents() {
    // 键盘事件
    document.addEventListener('keydown', this.handleKeyPress);
    
    // 窗口大小变化
    window.addEventListener('resize', () => {
      this.render();
    });
  }

  // 绑定DOM事件
  bindDOMEvents() {
    // 这里可以添加动态绑定的DOM事件
  }

  // 键盘事件处理
  handleKeyPress(event) {
    switch (event.key) {
      case 'Escape':
        this.goBack();
        break;
      case ' ':
        if (this.state.currentView === 'theme-detail' && this.state.currentMode === 'slideshow') {
          event.preventDefault();
          this.flipCard(this.state.currentCardIndex);
        }
        break;
      case 'ArrowLeft':
        if (this.state.currentView === 'theme-detail' && this.state.currentMode === 'slideshow') {
          this.previousCard();
        }
        break;
      case 'ArrowRight':
        if (this.state.currentView === 'theme-detail' && this.state.currentMode === 'slideshow') {
          this.nextCard();
        }
        break;
    }
  }

  // 显示通知
  showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    // 这里可以实现更复杂的通知系统
  }

  // 错误处理
  dismissError() {
    this.state.initError = null;
    this.render();
  }

  // 获取错误横幅HTML
  getErrorBannerHTML() {
    if (!this.state.initError) return '';
    
    return `
      <div class="error-banner">
        <div class="error-content">
          <span class="error-icon">⚠️</span>
          <span class="error-message">${this.escapeHtml(this.state.initError)}</span>
          <button class="error-close" onclick="app.dismissError()">×</button>
        </div>
      </div>
    `;
  }

  // 界面渲染方法
  render() {
    const app = document.getElementById('app');
    if (!app || this.state.isLoading) return;
    
    app.innerHTML = this.getAppHTML();
    this.bindDOMEvents();
  }

  getAppHTML() {
    if (!this.state.isInitialized) {
      return '<div class="loading">正在初始化应用...</div>';
    }

    return `
      <div class="milka-app theme-${this.state.styleTheme}">
        ${this.getErrorBannerHTML()}
        <header class="app-header">
          <div class="header-left">
            ${this.getHeaderLeftContent()}
          </div>
          <div class="header-right">
            ${this.getHeaderActions()}
            <button class="btn btn-theme-toggle" onclick="app.toggleTheme()">
              <div class="theme-toggle-content">
                <div class="theme-icon"></div>
                <span class="theme-name">${this.state.styleTheme === 'minimalist-white' ? '极简白' : '暗夜黑'}</span>
              </div>
            </button>
            <button class="btn btn-secondary" onclick="app.navigateToSettings()">设置</button>
          </div>
        </header>
        <main class="app-main">
          ${this.getCurrentViewHTML()}
        </main>
      </div>
    `;
  }

  // 获取页头左侧内容
  getHeaderLeftContent() {
    if (this.state.currentView === 'theme-detail' && this.state.currentTheme) {
      // 主题详情页：显示返回箭头叠加在LOGO上 + 主题标题
      return `
        <div class="logo-with-back" onclick="app.goBack()">
          <img src="./assets/logo.png" alt="喵卡" class="app-logo">
          <div class="back-arrow">↩</div>
        </div>
        <h1>${this.escapeHtml(this.state.currentTheme.title)}</h1>
      `;
    } else if (this.state.currentView === 'theme-editor' || this.state.currentView === 'card-editor') {
      // 编辑页面：显示返回箭头叠加在LOGO上 + 产品标题
      return `
        <div class="logo-with-back" onclick="app.goBack()">
          <img src="./assets/logo.png" alt="喵卡" class="app-logo">
          <div class="back-arrow">↩</div>
        </div>
        <h1>喵卡 Milka</h1>
      `;
    } else {
      // 首页：只显示产品标题
      return `
        <h1>
          <img src="./assets/logo.png" alt="喵卡" class="app-logo" onclick="location.reload()">
          喵卡 Milka
        </h1>
      `;
    }
  }

  getHeaderActions() {
    switch (this.state.currentView) {
      case 'themes':
        return `<button class="btn btn-primary" onclick="app.showCreateThemeDialog()">+ 新建主题</button>
         `;
      case 'theme-detail':
        return `
          <button class="btn btn-primary" onclick="app.showAddCardDialog()">+ 添加卡片</button>
          <button class="btn btn-secondary" onclick="app.toggleMode()">
            ${this.state.currentMode === 'list' ? '幻灯片模式' : '列表模式'}
          </button>
         
        `;
      default:
        return '';
    }
  }

  getCurrentViewHTML() {
    switch (this.state.currentView) {
      case 'themes':
        return this.getThemesListHTML();
      case 'theme-detail':
        return this.getThemeDetailHTML();
      case 'theme-editor':
        return this.themeEditor.render();
      case 'card-editor':
        return this.cardEditor.render(null, this.state.currentTheme?.id);
      case 'settings': // 添加这个case
        return this.settingsPage.render();
      default:
        return '<div class="error">未知视图</div>';
    }
  }

  
navigateToSettings() {
  this.state.currentView = 'settings';
  this.render();
  
  // 初始化设置页面
  setTimeout(() => {
    window.settingsPage = this.settingsPage;
    this.settingsPage.init();
  }, 100);
}
  // 主题列表HTML
  getThemesListHTML() {
    if (this.state.themes.length === 0) {
      return `
        <div class="empty-state">
          <h2>🎯 开始创建您的第一个主题</h2>
          <p>主题是一组相关卡片的集合，比如英语单词、历史知识等</p>
          <button class="btn btn-primary" onclick="app.showCreateThemeDialog()">
            + 创建主题
          </button>
        </div>
      `;
    }

    return `
      <div class="themes-container">
        <div class="themes-grid">
          ${this.state.themes.map(theme => `
            <div class="theme-card" onclick="app.handleThemeSelect('${theme.id}')">
              <div class="theme-card-header">
                <h3>${this.escapeHtml(theme.title)}</h3>
                ${theme.is_pinned ? '<span class="pin-badge">📌</span>' : ''}
              </div>
              <div class="theme-card-body">
                <p>${this.escapeHtml(theme.description || '暂无描述')}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 主题详情HTML
  getThemeDetailHTML() {
    if (!this.state.currentTheme) {
      return '<div class="error">主题不存在</div>';
    }

    if (this.state.currentMode === 'slideshow') {
      return this.getSlideshowHTML();
    }

    return this.getCardsListHTML();
  }

// 获取卡片列表HTML
getCardsListHTML() {
  if (this.state.currentCards.length === 0) {
    return ` <div class="empty-state"> <h3>暂无卡片</h3> <p>点击上方"添加卡片"按钮创建第一张卡片</p> </div> `;
  }

  return ` <div class="cards-list"> <div class="cards-grid"> ${this.state.currentCards.map((card, index) => ` <div class="card-item" data-card-index="${index}"> 
  <div class="card" onclick="app.flipCard(${index})">
   <div class="card-face card-front"> <div class="card-content">${this.escapeHtml(card.front?.main_text || '正面内容')}</div> ${card.front?.notes ? `<div class="card-notes">${this.escapeHtml(card.front.notes)}</div>` : ''} </div> <div class="card-face card-back"> <div class="card-content">${this.escapeHtml(card.back?.main_text || '背面内容')}</div> ${card.back?.notes ? `<div class="card-notes">${this.escapeHtml(card.back.notes)}</div>` : ''} </div> </div> </div> `).join('')} </div> </div> `;
}

 // 获取幻灯片模式HTML
getSlideshowHTML() {
  if (this.state.currentCards.length === 0) {
    return ` <div class="empty-state"> <h3>暂无卡片</h3> <p>点击上方"添加卡片"按钮创建第一张卡片</p> </div> `;
  }

  const currentCard = this.state.currentCards[this.state.currentCardIndex];
  
  return ` <div class="slideshow-container"> <div class="slideshow-header">
   <div class="slideshow-counter"> ${this.state.currentCardIndex + 1} / ${this.state.currentCards.length} </div> 
   <div class="slideshow-controls"> </div> </div> 
   <div class="slideshow-card-container" data-card-index="${this.state.currentCardIndex}"> 
   <div class="slideshow-card card ${currentCard.isFlipped ? 'flipped' : ''}" onclick="app.flipCard(${this.state.currentCardIndex})"> 
   <div class="card-face card-front"> <div class="card-content">${this.escapeHtml(currentCard.front?.main_text || '正面内容')}</div> ${currentCard.front?.notes ? `<div class="card-notes">${this.escapeHtml(currentCard.front.notes)}</div>` : ''} </div> <div class="card-face card-back"> <div class="card-content">${this.escapeHtml(currentCard.back?.main_text || '背面内容')}</div> ${currentCard.back?.notes ? `<div class="card-notes">${this.escapeHtml(currentCard.back.notes)}</div>` : ''} </div> </div> </div> <div class="slideshow-navigation"> <button class="btn btn-secondary" onclick="app.previousCard()" ${this.state.currentCardIndex === 0 ? 'disabled' : ''}> ← 上一张 </button> <button class="btn btn-secondary" onclick="app.flipCard(${this.state.currentCardIndex})"> 🔄 翻转 </button> <button class="btn btn-secondary" onclick="app.nextCard()" ${this.state.currentCardIndex === this.state.currentCards.length - 1 ? 'disabled' : ''}> 下一张 → </button> </div> </div> `;
}

  // 工具方法
  formatDate(dateString) {
    if (!dateString) return '未知时间';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return '今天';
      } else if (diffDays === 2) {
        return '昨天';
      } else if (diffDays <= 7) {
        return `${diffDays} 天前`;
      } else {
        return date.toLocaleDateString('zh-CN');
      }
    } catch (error) {
      return '时间格式错误';
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }
}

// 创建全局应用实例
window.app = new MilkaApp();