// 喵卡应用前端主逻辑 - 基于MiniDB和React组件化设计
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
      currentView: 'themes', // themes | theme-detail | card-editor
      themes: [],
      currentCards: [],
      currentCardIndex: 0,
      isLoading: false,
      styleTheme: 'minimalist-white', // minimalist-white | night-black
      searchQuery: '',
      selectedCards: new Set()
    };
    
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
  }

  // 应用初始化
  async init() {
    try {
      console.log('🐱 喵卡应用初始化中...');
      
      // 加载主题数据
      await this.loadThemes();
      
      // 检查是否有预置数据，没有则创建示例数据
      if (this.state.themes.length === 0) {
        await this.createSampleData();
        await this.loadThemes();
      }
      
      // 渲染应用界面
      this.render();
      
      // 绑定事件监听器
      this.bindEvents();
      
      // 应用主题
      this.applyTheme();
      
      console.log('✅ 喵卡应用初始化完成');
      
    } catch (error) {
      console.error('❌ 应用初始化失败:', error);
      this.showNotification('应用初始化失败，请刷新页面重试', 'error');
    }
  }

  // 加载所有主题数据
  async loadThemes() {
    try {
      this.state.isLoading = true;
      this.render();
      
      // 按排序和创建时间加载主题
      this.state.themes = await this.themesCollection
        .find({}, { sort: ["sort_order", "created_at"] })
        .fetch();
      
      console.log(`📚 加载了 ${this.state.themes.length} 个主题`);
      
    } catch (error) {
      console.error('加载主题失败:', error);
      this.showNotification('加载主题失败', 'error');
    } finally {
      this.state.isLoading = false;
    }
  }

  // 加载主题的卡片数据
  async loadThemeCards(themeId) {
    try {
      // 获取主题关联的卡片
      const associations = await this.associationsCollection
        .find({ theme_id: themeId }, { sort: ["sort_order"] })
        .fetch();
      
      if (associations.length === 0) {
        this.state.currentCards = [];
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
      
      console.log(`🃏 加载了 ${this.state.currentCards.length} 张卡片`);
      
    } catch (error) {
      console.error('加载卡片失败:', error);
      this.showNotification('加载卡片失败', 'error');
    }
  }

  // 创建新主题
  async createTheme(themeData) {
    try {
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
      
      await this.themesCollection.upsert(theme);
      await this.loadThemes();
      
      this.showNotification('主题创建成功', 'success');
      return theme;
      
    } catch (error) {
      console.error('创建主题失败:', error);
      this.showNotification('创建主题失败', 'error');
      throw error;
    }
  }

  // 添加卡片到主题
  async addCard(themeId, frontText, backText, notes = '') {
    try {
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
      
      // 重新加载当前主题的卡片
      if (this.state.currentTheme && this.state.currentTheme.id === themeId) {
        await this.loadThemeCards(themeId);
      }
      
      this.showNotification('卡片添加成功', 'success');
      
    } catch (error) {
      console.error('添加卡片失败:', error);
      this.showNotification('添加卡片失败', 'error');
      throw error;
    }
  }

  // 删除主题
  async deleteTheme(themeId) {
    try {
      // 删除主题相关的所有关联
      const associations = await this.associationsCollection
        .find({ theme_id: themeId })
        .fetch();
      
      // 获取所有相关卡面ID
      const faceIds = [...new Set([
        ...associations.map(a => a.front_face_id),
        ...associations.map(a => a.back_face_id)
      ])];
      
      // 删除卡面（注意：这里简化处理，实际应该检查卡面是否被其他主题使用）
      for (const faceId of faceIds) {
        await this.cardFacesCollection.remove({ id: faceId });
      }
      
      // 删除关联关系
      for (const assoc of associations) {
        await this.associationsCollection.remove({ id: assoc.id });
      }
      
      // 删除主题
      await this.themesCollection.remove({ id: themeId });
      
      await this.loadThemes();
      
      // 如果删除的是当前主题，返回主题列表
      if (this.state.currentTheme && this.state.currentTheme.id === themeId) {
        this.state.currentTheme = null;
        this.state.currentView = 'themes';
      }
      
      this.showNotification('主题删除成功', 'success');
      this.render();
      
    } catch (error) {
      console.error('删除主题失败:', error);
      this.showNotification('删除主题失败', 'error');
    }
  }

  // 导出主题数据
  async exportTheme(themeId) {
    try {
      const theme = await this.themesCollection.findOne({ id: themeId });
      if (!theme) {
        throw new Error('主题不存在');
      }
      
      // 获取主题的所有卡片数据
      await this.loadThemeCards(themeId);
      
      const exportData = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        theme: theme,
        cards: this.state.currentCards.map(card => ({
          front: card.front,
          back: card.back,
          sortOrder: card.sortOrder
        }))
      };
      
      // 创建下载链接
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `milka-theme-${theme.title}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      this.showNotification('主题导出成功', 'success');
      
    } catch (error) {
      console.error('导出主题失败:', error);
      this.showNotification('导出主题失败', 'error');
    }
  }

  // 导入主题数据
  async importTheme() {
    try {
      const fileInput = document.getElementById('file-input');
      fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const importData = JSON.parse(e.target.result);
            
            // 验证数据格式
            if (!importData.theme || !importData.cards) {
              throw new Error('数据格式不正确');
            }
            
            // 生成新的ID避免冲突
            const newThemeId = `theme_${Date.now()}_imported`;
            const theme = {
              ...importData.theme,
              id: newThemeId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // 导入主题
            await this.themesCollection.upsert(theme);
            
            // 导入卡片
            for (const cardData of importData.cards) {
              await this.addCard(
                newThemeId,
                cardData.front.main_text,
                cardData.back.main_text,
                cardData.front.notes
              );
            }
            
            await this.loadThemes();
            this.render();
            
            this.showNotification(`主题 "${theme.title}" 导入成功`, 'success');
            
          } catch (error) {
            console.error('导入失败:', error);
            this.showNotification('导入失败：' + error.message, 'error');
          }
        };
        
        reader.readAsText(file);
      };
      
      fileInput.click();
      
    } catch (error) {
      console.error('导入主题失败:', error);
      this.showNotification('导入主题失败', 'error');
    }
  }

  // 创建示例数据
  async createSampleData() {
    try {
      console.log('🎯 创建示例数据...');
      
      // 创建示例主题
      const sampleTheme = await this.createTheme({
        title: '英语单词学习',
        description: '常用英语单词记忆卡片，帮助快速掌握基础词汇',
        styleTheme: 'minimalist-white'
      });
      
      // 添加示例卡片
      const sampleCards = [
        { front: 'Hello', back: '你好', notes: '最常用的问候语' },
        { front: 'Thank you', back: '谢谢', notes: '表达感谢' },
        { front: 'Good morning', back: '早上好', notes: '上午问候' },
        { front: 'How are you?', back: '你好吗？', notes: '询问近况' },
        { front: 'Nice to meet you', back: '很高兴见到你', notes: '初次见面' }
      ];
      
      for (const card of sampleCards) {
        await this.addCard(sampleTheme.id, card.front, card.back, card.notes);
      }
      
      console.log('✅ 示例数据创建完成');
      
    } catch (error) {
      console.error('创建示例数据失败:', error);
    }
  }

  // 事件绑定
  bindEvents() {
    // 键盘事件
    document.addEventListener('keydown', this.handleKeyPress);
    
    // 主题切换
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="toggle-theme"]')) {
        this.toggleStyleTheme();
      }
      
      if (e.target.matches('[data-action="create-theme"]')) {
        this.showCreateThemeModal();
      }
      
      if (e.target.matches('[data-action="import-theme"]')) {
        this.importTheme();
      }
    });
  }

  // 键盘事件处理
  handleKeyPress(event) {
    switch (event.key) {
      case ' ': // 空格键
        if (this.state.currentMode === 'slideshow') {
          event.preventDefault();
          this.nextCard();
        }
        break;
      case 'ArrowLeft':
        if (this.state.currentMode === 'slideshow') {
          event.preventDefault();
          this.previousCard();
        }
        break;
      case 'ArrowRight':
        if (this.state.currentMode === 'slideshow') {
          event.preventDefault();
          this.nextCard();
        }
        break;
      case 'Escape':
        if (this.state.currentMode === 'slideshow') {
          this.exitSlideshow();
        }
        break;
    }
  }

  // 卡片点击处理
  handleCardClick(cardId) {
    const cardIndex = this.state.currentCards.findIndex(c => c.id === cardId);
    if (cardIndex !== -1) {
      this.state.currentCards[cardIndex].isFlipped = !this.state.currentCards[cardIndex].isFlipped;
      this.render();
    }
  }

  // 主题选择处理
  async handleThemeSelect(themeId) {
    try {
      const theme = this.state.themes.find(t => t.id === themeId);
      if (!theme) return;
      
      this.state.currentTheme = theme;
      this.state.currentView = 'theme-detail';
      this.state.currentMode = 'list';
      
      await this.loadThemeCards(themeId);
      this.render();
      
    } catch (error) {
      console.error('选择主题失败:', error);
      this.showNotification('加载主题失败', 'error');
    }
  }

  // 切换样式主题
  toggleStyleTheme() {
    this.state.styleTheme = this.state.styleTheme === 'minimalist-white' 
      ? 'night-black' 
      : 'minimalist-white';
    
    this.applyTheme();
    this.showNotification(`已切换到${this.state.styleTheme === 'minimalist-white' ? '极简白' : '暗夜黑'}主题`, 'info');
  }

  // 应用主题样式
  applyTheme() {
    document.body.className = `theme-${this.state.styleTheme}`;
  }

  // 显示通知
  showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // 自动移除通知
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // 渲染应用界面
  render() {
    const app = document.getElementById('app');
    app.innerHTML = this.getAppHTML();
  }

  // 获取应用HTML
  getAppHTML() {
    return `
      <div class="milka-container">
        ${this.getHeaderHTML()}
        <main class="main-content">
          ${this.getCurrentViewHTML()}
        </main>
      </div>
    `;
  }

  // 获取头部HTML
  getHeaderHTML() {
    return `
      <header class="app-header">
        <div class="header-left">
          <h1 class="app-title">
            <span class="app-icon">🐱</span>
            喵卡 Milka
          </h1>
          ${this.state.currentView !== 'themes' ? `
            <button class="btn btn-ghost" onclick="app.goBack()">
              ← 返回
            </button>
          ` : ''}
        </div>
        <div class="header-right">
          <button class="btn btn-ghost" data-action="toggle-theme">
            ${this.state.styleTheme === 'minimalist-white' ? '🌙' : '☀️'}
          </button>
          <button class="btn btn-primary" data-action="create-theme">
            + 新建主题
          </button>
          <button class="btn btn-secondary" data-action="import-theme">
            📥 导入
          </button>
        </div>
      </header>
    `;
  }

  // 获取当前视图HTML
  getCurrentViewHTML() {
    switch (this.state.currentView) {
      case 'themes':
        return this.getThemesListHTML();
      case 'theme-detail':
        return this.getThemeDetailHTML();
      default:
        return this.getThemesListHTML();
    }
  }

  // 获取主题列表HTML
  getThemesListHTML() {
    if (this.state.isLoading) {
      return '<div class="loading">正在加载主题...</div>';
    }

    if (this.state.themes.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>还没有主题</h3>
          <p>创建你的第一个学习主题吧！</p>
          <button class="btn btn-primary" data-action="create-theme">
            创建主题
          </button>
        </div>
      `;
    }

    return `
      <div class="themes-grid">
        ${this.state.themes.map(theme => `
          <div class="theme-card" onclick="app.handleThemeSelect('${theme.id}')">
            <div class="theme-header">
              <h3 class="theme-title">${theme.title}</h3>
              <div class="theme-actions">
                <button class="btn btn-sm" onclick="event.stopPropagation(); app.exportTheme('${theme.id}')">
                  📤
                </button>
                <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); app.deleteTheme('${theme.id}')">
                  🗑️
                </button>
              </div>
            </div>
            <p class="theme-description">${theme.description || '暂无描述'}</p>
            <div class="theme-meta">
              <span class="theme-date">
                ${new Date(theme.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 获取主题详情HTML
  getThemeDetailHTML() {
    if (!this.state.currentTheme) {
      return '<div class="error">主题不存在</div>';
    }

    return `
      <div class="theme-detail">
        <div class="theme-detail-header">
          <h2>${this.state.currentTheme.title}</h2>
          <div class="theme-controls">
            <button class="btn btn-secondary" onclick="app.showAddCardModal()">
              + 添加卡片
            </button>
            <button class="btn btn-primary" onclick="app.startSlideshow()" 
                    ${this.state.currentCards.length === 0 ? 'disabled' : ''}>
              🎬 幻灯片模式
            </button>
          </div>
        </div>
        
        ${this.state.currentCards.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🃏</div>
            <h3>还没有卡片</h3>
            <p>为这个主题添加一些学习卡片吧！</p>
            <button class="btn btn-primary" onclick="app.showAddCardModal()">
              添加卡片
            </button>
          </div>
        ` : `
          <div class="cards-grid">
            ${this.state.currentCards.map(card => `
              <div class="card ${card.isFlipped ? 'flipped' : ''}" 
                   onclick="app.handleCardClick('${card.id}')">
                <div class="card-face card-front">
                  <div class="card-content">
                    ${card.front.main_text}
                  </div>
                  ${card.front.notes ? `
                    <div class="card-notes">${card.front.notes}</div>
                  ` : ''}
                </div>
                <div class="card-face card-back">
                  <div class="card-content">
                    ${card.back.main_text}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  // 返回上一页
  goBack() {
    if (this.state.currentView === 'theme-detail') {
      this.state.currentView = 'themes';
      this.state.currentTheme = null;
      this.state.currentCards = [];
      this.render();
    }
  }

  // 显示创建主题模态框
  showCreateThemeModal() {
    // 简化实现，使用 prompt
    const title = prompt('请输入主题标题:');
    if (title) {
      const description = prompt('请输入主题描述（可选）:') || '';
      this.createTheme({ title, description });
    }
  }

  // 显示添加卡片模态框
  showAddCardModal() {
    if (!this.state.currentTheme) return;
    
    const frontText = prompt('请输入卡片正面内容:');
    if (frontText) {
      const backText = prompt('请输入卡片背面内容:');
      if (backText) {
        const notes = prompt('请输入备注（可选）:') || '';
        this.addCard(this.state.currentTheme.id, frontText, backText, notes);
      }
    }
  }

  // 开始幻灯片模式
  startSlideshow() {
    if (this.state.currentCards.length === 0) return;
    
    this.state.currentMode = 'slideshow';
    this.state.currentCardIndex = 0;
    this.renderSlideshow();
  }

  // 渲染幻灯片模式
  renderSlideshow() {
    const app = document.getElementById('app');
    const currentCard = this.state.currentCards[this.state.currentCardIndex];
    
    app.innerHTML = `
      <div class="slideshow-container">
        <div class="slideshow-header">
          <button class="btn btn-ghost" onclick="app.exitSlideshow()">
            ✕ 退出
          </button>
          <div class="slideshow-progress">
            ${this.state.currentCardIndex + 1} / ${this.state.currentCards.length}
          </div>
        </div>
        
        <div class="slideshow-content">
          <div class="slideshow-card ${currentCard.isFlipped ? 'flipped' : ''}" 
               onclick="app.flipCurrentCard()">
            <div class="card-face card-front">
              <div class="card-content">
                ${currentCard.front.main_text}
              </div>
            </div>
            <div class="card-face card-back">
              <div class="card-content">
                ${currentCard.back.main_text}
              </div>
            </div>
          </div>
        </div>
        
        <div class="slideshow-controls">
          <button class="btn btn-secondary" onclick="app.previousCard()" 
                  ${this.state.currentCardIndex === 0 ? 'disabled' : ''}>
            ← 上一张
          </button>
          <button class="btn btn-primary" onclick="app.flipCurrentCard()">
            翻转卡片
          </button>
          <button class="btn btn-secondary" onclick="app.nextCard()" 
                  ${this.state.currentCardIndex === this.state.currentCards.length - 1 ? 'disabled' : ''}>
            下一张 →
          </button>
        </div>
        
        <div class="slideshow-help">
          <p>💡 提示：使用空格键翻转卡片，方向键切换卡片，ESC键退出</p>
        </div>
      </div>
    `;
  }

  // 翻转当前卡片
  flipCurrentCard() {
    if (this.state.currentMode === 'slideshow') {
      const currentCard = this.state.currentCards[this.state.currentCardIndex];
      currentCard.isFlipped = !currentCard.isFlipped;
      this.renderSlideshow();
    }
  }

  // 下一张卡片
  nextCard() {
    if (this.state.currentCardIndex < this.state.currentCards.length - 1) {
      this.state.currentCardIndex++;
      this.state.currentCards[this.state.currentCardIndex].isFlipped = false;
      this.renderSlideshow();
    }
  }

  // 上一张卡片
  previousCard() {
    if (this.state.currentCardIndex > 0) {
      this.state.currentCardIndex--;
      this.state.currentCards[this.state.currentCardIndex].isFlipped = false;
      this.renderSlideshow();
    }
  }

  // 退出幻灯片模式
  exitSlideshow() {
    this.state.currentMode = 'list';
    this.state.currentCardIndex = 0;
    // 重置所有卡片翻转状态
    this.state.currentCards.forEach(card => {
      card.isFlipped = false;
    });
    this.render();
  }
}

// 全局应用实例
window.app = new MilkaApp();

// 导出应用类供其他模块使用
export default MilkaApp;