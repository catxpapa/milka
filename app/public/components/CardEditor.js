// 新增：app/public/components/CardEditor.js
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