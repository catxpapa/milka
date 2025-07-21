// 喵卡应用前端主逻辑 - 基于MiniDB和React组件化设计
import { MiniDB } from "@lazycatcloud/minidb";

// 全局应用状态和配置
class MilkaApp {
  constructor() {
    // MiniDB 数据库初始化
    this.db = new MiniDB();
    this.themesCollection = this.db.getCollection("themes");
    this.cardFacesCollection = this.db.getCollection("cardFaces");
    this.associationsCollection = this.db.getCollection("associations");
    
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

  // 应用初始化 - 修复版本
  async init() {
    try {
      console.log('🐱 喵卡应用初始化中...');
      
      // 显示加载状态
      this.setLoading(true);
      
      // 清除之前的错误状态
      this.state.initError = null;
      
      // 加载主题数据
      await this.loadThemes();
      
      // 检查是否有预置数据，没有则创建示例数据
      if (this.state.themes.length === 0) {
        console.log('🌱 创建示例数据...');
        await this.createSampleData();
        await this.loadThemes();
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
  }

  // 创建示例数据
  async createSampleData() {
    try {
      console.log('🌱 开始创建示例数据...');
      
      // 创建示例主题
      const sampleTheme = {
        id: `theme_${Date.now()}_sample`,
        title: '英语单词学习',
        description: '常用英语单词记忆卡片，帮助提高词汇量',
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
      
      await this.themesCollection.upsert(sampleTheme);
      
      // 创建示例卡片
      const sampleCards = [
        { front: 'Hello', back: '你好', notes: '最常用的问候语' },
        { front: 'Thank you', back: '谢谢', notes: '表达感谢' },
        { front: 'Beautiful', back: '美丽的', notes: '形容词，描述美好的事物' }
      ];
      
      for (let i = 0; i < sampleCards.length; i++) {
        const card = sampleCards[i];
        const timestamp = Date.now() + i;
        const randomId = Math.random().toString(36).substr(2, 9);
        
        // 创建卡面
        const frontFace = {
          id: `face_${timestamp}_front_${randomId}`,
          main_text: card.front,
          notes: card.notes,
          image_url: '',
          keywords: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const backFace = {
          id: `face_${timestamp}_back_${randomId}`,
          main_text: card.back,
          notes: '',
          image_url: '',
          keywords: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await this.cardFacesCollection.upsert([frontFace, backFace]);
        
        // 创建关联
        const association = {
          id: `assoc_${timestamp}_${randomId}`,
          theme_id: sampleTheme.id,
          front_face_id: frontFace.id,
          back_face_id: backFace.id,
          sort_order: i,
          created_at: new Date().toISOString()
        };
        
        await this.associationsCollection.upsert(association);
      }
      
      console.log('✅ 示例数据创建完成');
      
    } catch (error) {
      console.error('❌ 创建示例数据失败:', error);
      throw error;
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
    this.state.selectedThemeStyle = 'minimalist-white';
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
        styleTheme: this.state.selectedThemeStyle
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
      const notes = formData.get('notes');
      
      await this.addCard(themeId, frontText, backText, notes);
      
      // 返回主题详情页
      this.state.currentView = 'theme-detail';
      this.render();
      
    } catch (error) {
      console.error('❌ 卡片提交失败:', error);
      this.showNotification('添加卡片失败: ' + error.message, 'error');
    }
  }

  // 创建新主题 - 修复版本
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

  // 添加卡片到主题 - 修复版本
  async addCard(themeId, frontText, backText, notes = '') {
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
        notes: notes,
        image_url: '',
        keywords: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 创建背面卡面
      const backFace = {
        id: `face_${timestamp}_back_${randomId}`,
        main_text: backText,
        notes: '',
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

  // 翻转卡片
  flipCard(cardIndex) {
    if (cardIndex >= 0 && cardIndex < this.state.currentCards.length) {
      this.state.currentCards[cardIndex].isFlipped = !this.state.currentCards[cardIndex].isFlipped;
      
      // 更新DOM中的卡片状态
      const cardElement = document.querySelector(`[data-card-index="${cardIndex}"]`);
      if (cardElement) {
        const cardInner = cardElement.querySelector('.card');
        if (this.state.currentCards[cardIndex].isFlipped) {
          cardInner.classList.add('flipped');
        } else {
          cardInner.classList.remove('flipped');
        }
      }
      
      // 播放翻转音效（可选）
      this.playFlipSound();
    }
  }

  // 预览卡片翻转
  flipPreviewCard() {
    const previewCard = document.getElementById('preview-card');
    if (previewCard) {
      previewCard.classList.toggle('flipped');
    }
  }

  // 更新卡片预览内容
  updateCardPreview(side, content) {
    const previewElement = document.getElementById(`preview-${side}`);
    if (previewElement) {
      previewElement.textContent = content || `${side === 'front' ? '正面' : '背面'}内容预览`;
    }
  }

  // 播放翻转音效（可选功能）
  playFlipSound() {
    // 可以添加简单的音效反馈
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

  // 应用主题
  applyTheme() {
    document.body.className = `theme-${this.state.styleTheme}`;
  }

  // 返回上级
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
  navigateTo(view) {
    this.state.currentView = view;
    this.render();
  }

  // 关闭错误提示
  dismissError() {
    this.state.initError = null;
    this.render();
  }

  // 渲染应用界面
  render() {
    const app = document.getElementById('app');
    if (!app) return;
    
    // 如果正在加载，不更新界面内容
    if (this.state.isLoading) {
      return;
    }
    
    app.innerHTML = this.getAppHTML();
    
    // 重新绑定事件
    this.bindDOMEvents();
  }

  // 获取应用HTML结构
  getAppHTML() {
    // 如果未初始化，显示加载状态
    if (!this.state.isInitialized) {
      return '<div class="loading">正在初始化应用...</div>';
    }

    return `
      <div class="milka-app theme-${this.state.styleTheme}">
        ${this.getErrorBannerHTML()}
        <header class="app-header">
          <div class="header-left">
            ${this.state.currentView !== 'themes' ? 
              '<button class="btn btn-back" onclick="app.goBack()">← 返回</button>' : 
              ''
            }
            <h1>🐱 喵卡 Milka</h1>
          </div>
          <div class="header-right">
            <button class="btn btn-theme-toggle" onclick="app.toggleTheme()">
              ${this.state.styleTheme === 'minimalist-white' ? '🌙' : '☀️'}
            </button>
            ${this.getHeaderActions()}
          </div>
        </header>
        <main class="app-main">
          ${this.getBreadcrumbHTML()}
          ${this.getCurrentViewHTML()}
        </main>
      </div>
    `;
  }

  // 获取错误横幅HTML
  getErrorBannerHTML() {
    if (!this.state.initError) {
      return '';
    }

    return `
      <div class="error-banner" id="error-banner">
        <div class="error-content">
          <span class="error-icon">⚠️</span>
          <span class="error-message">初始化时遇到问题，但应用仍可正常使用</span>
          <button class="error-close" onclick="app.dismissError()">×</button>
        </div>
      </div>
    `;
  }

  // 获取面包屑导航HTML
  getBreadcrumbHTML() {
    const breadcrumbs = [];
    
    switch (this.state.currentView) {
      case 'themes':
        breadcrumbs.push({ text: '我的主题', active: true });
        break;
      case 'theme-detail':
        breadcrumbs.push({ text: '我的主题', link: 'themes' });
        breadcrumbs.push({ text: this.state.currentTheme?.title || '主题详情', active: true });
        break;
      case 'theme-editor':
        breadcrumbs.push({ text: '我的主题', link: 'themes' });
        breadcrumbs.push({ text: '编辑主题', active: true });
        break;
      case 'card-editor':
        breadcrumbs.push({ text: '我的主题', link: 'themes' });
        breadcrumbs.push({ text: this.state.currentTheme?.title || '主题', link: 'theme-detail' });
        breadcrumbs.push({ text: '编辑卡片', active: true });
        break;
    }
    
    if (breadcrumbs.length <= 1) return '';
    
    return `
      <nav class="breadcrumb">
        ${breadcrumbs.map((crumb, index) => `
          <span class="breadcrumb-item ${crumb.active ? 'active' : ''}">
            ${crumb.link ? 
              `<a href="#" onclick="app.navigateTo('${crumb.link}')">${crumb.text}</a>` : 
              crumb.text
            }
            ${index < breadcrumbs.length - 1 ? '<span class="separator">›</span>' : ''}
          </span>
        `).join('')}
      </nav>
    `;
  }

  // 获取头部操作按钮
  getHeaderActions() {
    return '';
  }

  // 获取当前视图的HTML
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
      default:
        return '<div class="error">未知视图</div>';
    }
  }

  // 主题列表HTML
  getThemesListHTML() {
    if (this.state.themes.length === 0) {
      return `
        <div class="empty-state">
          <h2>🎯 开始创建您的第一个主题</h2>
          <p>主题是一组相关卡片的集合，比如"英语单词"、"历史知识"等</p>
          <button class="btn btn-primary" onclick="app.showCreateThemeDialog()">
            ➕ 创建主题
          </button>
        </div>
      `;
    }

    return `
      <div class="themes-container">
        <div class="themes-header">
          <h2>📚 我的主题 (${this.state.themes.length})</h2>
          <button class="btn btn-primary" onclick="app.showCreateThemeDialog()">
            ➕ 新建主题
          </button>
        </div>
        <div class="themes-grid">
          ${this.state.themes.map(theme => `
            <div class="theme-card" onclick="app.handleThemeSelect('${theme.id}')">
              <div class="theme-card-header">
                <h3>${this.escapeHtml(theme.title)}</h3>
                ${theme.is_pinned ? '<span class="pin-badge">📌</span>' : ''}
              </div>
              <div class="theme-card-body">
                <p>${this.escapeHtml(theme.description || '暂无描述')}</p>
                <div class="theme-meta">
                  <span class="theme-style">${theme.style_config?.theme || 'minimalist-white'}</span>
                  <span class="theme-date">${this.formatDate(theme.created_at)}</span>
                </div>
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

    return `
      <div class="theme-detail">
        <div class="theme-detail-header">
          <div class="theme-info">
            <h2>${this.escapeHtml(this.state.currentTheme.title)}</h2>
            <p>${this.escapeHtml(this.state.currentTheme.description || '暂无描述')}</p>
          </div>
          <div class="theme-actions">
            <button class="btn btn-primary" onclick="app.showAddCardDialog()">
              ➕ 添加卡片
            </button>
            <button class="btn btn-secondary" onclick="app.toggleMode()">
              ${this.state.currentMode === 'list' ? '🎬 幻灯片模式' : '📋 列表模式'}
            </button>
          </div>
        </div>
        <div class="theme-content">
          ${this.state.currentMode === 'list' ? this.getCardsListHTML() : this.getSlideshowHTML()}
        </div>
      </div>
    `;
  }

  // 卡片列表HTML
  getCardsListHTML() {
    if (this.state.currentCards.length === 0) {
      return `
        <div class="empty-state">
          <h3>📝 开始添加卡片</h3>
          <p>点击上方"添加卡片"按钮创建您的第一张记忆卡片</p>
          <button class="btn btn-primary" onclick="app.showAddCardDialog()">
            ➕ 添加卡片
          </button>
        </div>
      `;
    }

    return `
      <div class="cards-list">
        <div class="cards-header">
          <h3>🃏 卡片列表 (${this.state.currentCards.length})</h3>
          <button class="btn btn-primary" onclick="app.showAddCardDialog()">
            ➕ 添加更多卡片
          </button>
        </div>
        <div class="cards-grid">
          ${this.state.currentCards.map((card, index) => `
            <div class="card-item" data-card-index="${index}" onclick="app.handleCardClick(${index})">
              <div class="card ${card.isFlipped ? 'flipped' : ''}">
                <div class="card-face card-front">
                  <div class="card-content">
                    ${this.escapeHtml(card.front?.main_text || '正面内容')}
                  </div>
                </div>
                <div class="card-face card-back">
                  <div class="card-content">
                    ${this.escapeHtml(card.back?.main_text || '背面内容')}
                  </div>
                </div>
              </div>
              <div class="card-meta">
                <span class="card-index">#${index + 1}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 幻灯片模式HTML
  getSlideshowHTML() {
    if (this.state.currentCards.length === 0) {
      return this.getCardsListHTML();
    }

    const currentCard = this.state.currentCards[this.state.currentCardIndex];
    if (!currentCard) {
      return '<div class="error">卡片不存在</div>';
    }

    return `
      <div class="slideshow-container">
        <div class="slideshow-header">
          <span class="slideshow-counter">
            ${this.state.currentCardIndex + 1} / ${this.state.currentCards.length}
          </span>
          <div class="slideshow-controls">
            <button class="btn btn-secondary" onclick="app.previousCard()" 
                   ${this.state.currentCardIndex === 0 ? 'disabled' : ''}>
              ← 上一张
            </button>
            <button class="btn btn-secondary" onclick="app.flipCard(${this.state.currentCardIndex})">
              🔄 翻转
            </button>
            <button class="btn btn-secondary" onclick="app.nextCard()" 
                   ${this.state.currentCardIndex === this.state.currentCards.length - 1 ? 'disabled' : ''}>
              下一张 →
            </button>
          </div>
        </div>
        <div class="slideshow-card-container">
          <div class="card slideshow-card ${currentCard.isFlipped ? 'flipped' : ''}" 
               data-card-index="${this.state.currentCardIndex}"
               onclick="app.handleCardClick(${this.state.currentCardIndex})">
            <div class="card-face card-front">
              <div class="card-content">
                ${this.escapeHtml(currentCard.front?.main_text || '正面内容')}
              </div>
            </div>
            <div class="card-face card-back">
              <div class="card-content">
                ${this.escapeHtml(currentCard.back?.main_text || '背面内容')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 绑定DOM事件
  bindDOMEvents() {
    // 键盘事件
    document.addEventListener('keydown', this.handleKeyPress);
  }

  // 绑定全局事件
  bindEvents() {
    // 键盘快捷键
    document.addEventListener('keydown', this.handleKeyPress);
  }

  // 处理键盘事件
  handleKeyPress(event) {
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        if (this.state.currentView === 'theme-detail' && this.state.currentCards.length > 0) {
          if (this.state.currentMode === 'slideshow') {
            this.flipCard(this.state.currentCardIndex);
          }
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
      case 'Escape':
        this.goBack();
        break;
    }
  }

  // 显示通知
  showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 自动移除
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // HTML转义
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  }
}

// 主题编辑器组件
class ThemeEditor {
  constructor(app) {
    this.app = app;
    this.isEditing = false;
    this.currentTheme = null;
  }

  // 渲染主题编辑表单
  render(theme = null) {
    this.isEditing = !!theme;
    this.currentTheme = theme;

    return `
      <div class="theme-editor-container">
        <div class="theme-editor-header">
          <h2>${this.isEditing ? '编辑主题' : '创建新主题'}</h2>
          <button class="btn btn-close" onclick="app.goBack()">✕</button>
        </div>
        
        <form class="theme-editor-form" onsubmit="app.handleThemeSubmit(event)">
          <div class="form-group">
            <label for="theme-title">主题标题 *</label>
            <input 
              type="text" 
              id="theme-title" 
              name="title" 
              value="${theme?.title || ''}"
              placeholder="例如：英语单词、历史知识"
              required
              maxlength="50"
            >
            <div class="form-hint">简洁明了的主题名称</div>
          </div>

          <div class="form-group">
            <label for="theme-description">主题描述</label>
            <textarea 
              id="theme-description" 
              name="description" 
              placeholder="描述这个主题的内容和用途..."
              maxlength="200"
              rows="3"
            >${theme?.description || ''}</textarea>
            <div class="form-hint">可选，帮助您记住这个主题的用途</div>
          </div>

          <div class="form-group">
            <label>界面风格</label>
            <div class="style-selector">
              <div class="style-option ${(!theme || theme.style_config?.theme === 'minimalist-white') ? 'selected' : ''}" 
                   onclick="app.selectThemeStyle('minimalist-white')">
                <div class="style-preview minimalist-white">
                  <div class="preview-card">Aa</div>
                </div>
                <span>极简白</span>
              </div>
              <div class="style-option ${(theme?.style_config?.theme === 'night-black') ? 'selected' : ''}" 
                   onclick="app.selectThemeStyle('night-black')">
                <div class="style-preview night-black">
                  <div class="preview-card">Aa</div>
                </div>
                <span>暗夜黑</span>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="app.goBack()">
              取消
            </button>
            <button type="submit" class="btn btn-primary">
              ${this.isEditing ? '保存修改' : '创建主题'}
            </button>
          </div>
        </form>
      </div>
    `;
  }
}

// 卡片编辑器组件
class CardEditor {
  constructor(app) {
    this.app = app;
    this.isEditing = false;
    this.currentCard = null;
  }

  render(card = null, themeId) {
    this.isEditing = !!card;
    this.currentCard = card;

    return `
      <div class="card-editor-container">
        <div class="card-editor-header">
          <h2>${this.isEditing ? '编辑卡片' : '添加新卡片'}</h2>
          <button class="btn btn-close" onclick="app.goBack()">✕</button>
        </div>

        <div class="card-editor-content">
          <form class="card-editor-form" onsubmit="app.handleCardSubmit(event, '${themeId}')">
            
            <!-- 实时预览区域 -->
            <div class="card-preview-section">
              <h3>卡片预览</h3>
              <div class="preview-card-container">
                <div class="preview-card ${this.app.state.styleTheme}" id="preview-card" onclick="app.flipPreviewCard()">
                  <div class="card-face card-front">
                    <div class="card-content" id="preview-front">
                      ${card?.front?.main_text || '正面内容预览'}
                    </div>
                  </div>
                  <div class="card-face card-back">
                    <div class="card-content" id="preview-back">
                      ${card?.back?.main_text || '背面内容预览'}
                    </div>
                  </div>
                </div>
              </div>
              <div class="preview-hint">点击卡片可以预览翻转效果</div>
            </div>

            <!-- 编辑表单区域 -->
            <div class="card-form-section">
              <div class="form-group">
                <label for="card-front">正面内容 *</label>
                <textarea 
                  id="card-front" 
                  name="frontText" 
                  placeholder="输入卡片正面的内容，比如问题、单词等..."
                  required
                  maxlength="500"
                  rows="4"
                  oninput="app.updateCardPreview('front', this.value)"
                >${card?.front?.main_text || ''}</textarea>
                <div class="form-hint">这是用户首先看到的内容</div>
              </div>

              <div class="form-group">
                <label for="card-back">背面内容 *</label>
                <textarea 
                  id="card-back" 
                  name="backText" 
                  placeholder="输入卡片背面的内容，比如答案、释义等..."
                  required
                  maxlength="500"
                  rows="4"
                  oninput="app.updateCardPreview('back', this.value)"
                >${card?.back?.main_text || ''}</textarea>
                <div class="form-hint">这是翻转后显示的内容</div>
              </div>

              <div class="form-group">
                <label for="card-notes">备注说明</label>
                <textarea 
                  id="card-notes" 
                  name="notes" 
                  placeholder="添加一些备注或记忆技巧..."
                  maxlength="200"
                  rows="2"
                >${card?.front?.notes || ''}</textarea>
                <div class="form-hint">可选，帮助记忆的额外信息</div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="app.goBack()">
                  取消
                </button>
                <button type="submit" class="btn btn-primary">
                  ${this.isEditing ? '保存修改' : '添加卡片'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }
}

// 创建全局应用实例
window.app = new MilkaApp();
navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister());
});