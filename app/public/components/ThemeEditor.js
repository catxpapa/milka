// 新增：app/public/components/ThemeEditor.js
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