// 主题编辑器组件
export class ThemeEditor {
  constructor(app) {
    this.app = app;
    this.isEditing = false;
    this.currentTheme = null;
  }

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
export class CardEditor {
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
                <div class="preview-card card ${this.app.state.styleTheme}" id="preview-card" onclick="app.flipPreviewCard()">
                  <div class="card-face card-front">
                    <div class="card-content" id="preview-front">
                      ${card?.front?.main_text || '正面内容预览'}
                    </div>
                    <div class="card-notes" id="preview-front-notes">
                      ${card?.front?.notes || '正面备注'}
                    </div>
                  </div>
                  <div class="card-face card-back">
                    <div class="card-content" id="preview-back">
                      ${card?.back?.main_text || '背面内容预览'}
                    </div>
                    <div class="card-notes" id="preview-back-notes">
                      ${card?.back?.notes || '背面备注'}
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
                  rows="3"
                  oninput="app.updateCardPreview('front', this.value)"
                >${card?.front?.main_text || ''}</textarea>
                <div class="form-hint">这是用户首先看到的内容</div>
              </div>

              <div class="form-group">
                <label for="card-front-notes">正面备注</label>
                <textarea 
                  id="card-front-notes" 
                  name="frontNotes" 
                  placeholder="添加助记信息、提示等..."
                  maxlength="200"
                  rows="2"
                  oninput="app.updateCardPreview('front-notes', this.value)"
                >${card?.front?.notes || ''}</textarea>
                <div class="form-hint">可选，帮助记忆的额外信息</div>
              </div>

              <div class="form-group">
                <label for="card-back">背面内容 *</label>
                <textarea 
                  id="card-back" 
                  name="backText" 
                  placeholder="输入卡片背面的内容，比如答案、释义等..."
                  required
                  maxlength="500"
                  rows="3"
                  oninput="app.updateCardPreview('back', this.value)"
                >${card?.back?.main_text || ''}</textarea>
                <div class="form-hint">这是翻转后显示的内容</div>
              </div>

              <div class="form-group">
                <label for="card-back-notes">背面备注</label>
                <textarea 
                  id="card-back-notes" 
                  name="backNotes" 
                  placeholder="添加例句、发音、用法等..."
                  maxlength="200"
                  rows="2"
                  oninput="app.updateCardPreview('back-notes', this.value)"
                >${card?.back?.notes || ''}</textarea>
                <div class="form-hint">可选，补充说明信息</div>
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