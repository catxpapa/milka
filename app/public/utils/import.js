

import { MiniDB } from "@lazycatcloud/minidb";



class BatchImporter {
  constructor() {
    // 初始化 MiniDB
    this.db = new MiniDB();
    this.themesCollection = this.db.getCollection("themes");
    this.cardFacesCollection = this.db.getCollection("cardFaces");
    this.associationsCollection = this.db.getCollection("associations");

    this.parsedData = [];
    this.dom = {
      csvInput: document.getElementById('csv-input'),
      uploadBtn: document.getElementById('upload-btn'),
      fileInput: document.getElementById('csv-file-input'),
      previewBtn: document.getElementById('preview-btn'),
      themeSection: document.getElementById('theme-section'),
      newThemeName: document.getElementById('new-theme-name'),
      newThemeDescription: document.getElementById('new-theme-description'), // 新增
      existingThemesSelect: document.getElementById('existing-themes-select'),
      themeChoiceRadios: document.querySelectorAll('input[name="theme-choice"]'),
      previewSection: document.getElementById('preview-section'),
      cardCount: document.getElementById('card-count'),
      previewList: document.getElementById('preview-list'),
      importDbBtn: document.getElementById('import-db-btn'),
      downloadJsonBtn: document.getElementById('download-json-btn'),
      notificationArea: document.getElementById('notification-area'),
      // 新增AI相关DOM元素
      aiGeneratorToggle: document.getElementById('ai-generator-toggle'),
      aiGeneratorContent: document.getElementById('ai-generator-content'),
      aiPromptTemplate: document.getElementById('ai-prompt-template'),
      copyPromptBtn: document.getElementById('copy-prompt-btn'),
      submitAiBtn: document.getElementById('submit-ai-btn')
    };

    this.bindEvents();
    this.loadExistingThemes();
    this.toggleThemeInputs(); // 页面加载时初始化状态
  }

  bindEvents() {
    this.dom.uploadBtn.addEventListener('click', () => this.dom.fileInput.click());
    this.dom.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    this.dom.previewBtn.addEventListener('click', () => this.processAndPreview());
    this.dom.themeChoiceRadios.forEach(radio => {
      radio.addEventListener('change', () => this.toggleThemeInputs());
    });
    this.dom.importDbBtn.addEventListener('click', () => this.importToDatabase());
    this.dom.downloadJsonBtn.addEventListener('click', () => this.downloadAsJson());
  // 新增AI相关事件绑定
    this.dom.aiGeneratorToggle.addEventListener('click', () => this.toggleAiGenerator());
    this.dom.copyPromptBtn.addEventListener('click', () => this.copyAiPrompt());
    this.dom.submitAiBtn.addEventListener('click', () => this.submitToAi()); 

}
  // --- AI 相关方法 ---
  toggleAiGenerator() {
    this.dom.aiGeneratorToggle.parentElement.classList.toggle('expanded');

    if(!this.dom.aiPromptTemplate.value){
        this.dom.aiPromptTemplate.value=`
请帮我整理【主题】相关的单词卡，生成CSV格式的数据。

**主题**：【在此填写具体主题，如：商务英语、日常生活、学术词汇等】

**详细要求**：【在此填写具体要求，如：难度级别、词汇数量、特定场景、学习目标等】

请按照以下格式要求生成：

1. 每个分类包含15-20个词汇（除非有特殊说明）
2. 按主题逻辑分组，每组有标题和简要说明
3. 格式为：正面,背面,正面说明,背面说明
4. 正面用于提示和回忆，背面是需要记忆的答案
5. 避免重复，如有相似词汇请换用不同表达
6. 内容简洁明了，便于制作实体单词卡

---

## CSV数据格式详细说明

### 1. 基本结构特点

**四字段格式**：\`正面,背面,正面说明,背面说明\`

- **正面**：用于提示和回忆的内容，通常是问题、中文释义或关键词
- **背面**：需要记忆的答案，通常是英文单词、公式或详细解释
- **正面说明**：辅助记忆的提示，如使用场景、助记方法、词根词缀等
- **背面说明**：详细信息，如音标、例句、语法说明、同义词等

### 2. 正反面设计原理

**正面（Front）**：
- 作为记忆触发器，帮助回忆目标内容
- 应该简洁明了，一眼就能理解要回忆什么
- 可以是问题形式、关键词或部分信息
- 例如：\`苗条的\`、\`What does "brilliant" mean?\`、\`形容词：聪明的\`

**背面（Back）**：
- 包含完整的答案或目标记忆内容
- 只有翻转卡片后才会显示，用于验证记忆效果
- 应该准确、完整地回答正面的提示
- 例如：\`slim\`、\`才华横溢的，杰出的\`、\`intelligent, clever, smart\`

### 3. 字段处理规则

**逗号处理**：
\`\`\`
正确：他说,"Hello, world!",然后离开了
错误：他说,Hello, world!,然后离开了

正确：包含逗号的内容,"如：apple, banana, orange",需要引号
错误：包含逗号的内容,如：apple, banana, orange,需要引号
\`\`\`

**换行处理**：
- CSV格式中避免使用真实换行符
- 如需换行效果，使用\`\n\`或\`<br>\`标记
- 建议保持单行内容，提高兼容性

**特殊字符**：
- 双引号：使用\`""\`转义或避免使用
- 分号：可正常使用，不会影响CSV解析
- 制表符：避免使用，可能导致格式错乱

### 4. 内容长度要求

**标准长度建议**：
- **正面**：5-15个字符（中文）或3-8个单词（英文）
- **背面**：5-20个字符（中文）或1-5个单词（英文）
- **正面说明**：15-50个字符，简洁的使用提示
- **背面说明**：20-80个字符，包含音标和例句

**特殊情况**：
- 如用户在【详细要求】中明确需要详细解释，可适当增加长度
- 专业术语或复杂概念可突破长度限制
- 保持整体一致性，避免个别条目过长或过短

### 5. 分类组织原则

**分组标题格式**：
\`\`\`
# 主题名称 英文对照（可选）
简要说明文字，描述该分类的特点和适用场景。
\`\`\`

**内容组织**：
- 每组15-20条记录，便于分阶段学习
- 按逻辑关联性分组（如词性、场景、难度）
- 同组内容难度相近，便于集中练习
- 避免跨组重复，如有相似概念应使用不同表达

### 6. 质量控制要点

**准确性**：
- 确保翻译和解释的准确性
- 音标使用国际音标标准
- 例句符合语法规范和实际使用习惯

**实用性**：
- 选择高频、实用的词汇和概念
- 提供真实的使用场景和语境
- 避免过于生僻或理论化的内容

**记忆友好性**：
- 正面提示清晰明确，不产生歧义
- 背面答案完整准确，便于自我验证
- 说明信息有助于理解和记忆，而非增加负担

### 7. 导入使用建议

**软件兼容性**：
- 使用UTF-8编码保存，确保中文正常显示
- 测试主流单词卡软件（如Anki、Quizlet）的导入效果
- 保留原始CSV文件作为备份

**学习策略**：
- 建议按分组顺序学习，先掌握一组再进入下一组
- 利用正面说明理解使用场景，提高记忆效果
- 结合背面说明中的例句进行实际应用练习
        `
    }
  }

  copyAiPrompt() {
    const promptText = this.dom.aiPromptTemplate.value;
    if (!promptText) {
      this.showNotification('提示词模板为空，无需复制', 'error');
      return;
    }
    navigator.clipboard.writeText(promptText).then(() => {
      this.showNotification('提示词已复制到剪贴板', 'success');
    }).catch(err => {
      this.showNotification('复制失败，请手动复制', 'error');
      console.error('复制失败:', err);
    });
  }

  submitToAi() {
    this.showNotification('需对接到AI模型使用，此功能尚待开发。', 'info');
  }
  // --- AI 相关方法结束 ---

  async loadExistingThemes() {
    try {
      const themes = await this.themesCollection.find({}, { sort: ["title"] }).fetch();
      this.dom.existingThemesSelect.innerHTML = '<option value="">-- 请选择 --</option>';
      themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.id;
        option.textContent = theme.title;
        this.dom.existingThemesSelect.appendChild(option);
      });
    } catch (error) {
      this.showNotification('加载现有主题失败', 'error');
      console.error('加载主题失败:', error);
    }
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.dom.csvInput.value = e.target.result;
      this.showNotification('文件已加载到文本框', 'success');
    };
    reader.readAsText(file);
  }

  toggleThemeInputs() {
    const choice = document.querySelector('input[name="theme-choice"]:checked').value;
    if (choice === 'new') {
      this.dom.newThemeName.disabled = false;
      this.dom.newThemeDescription.disabled = false; // 修改
      this.dom.existingThemesSelect.disabled = true;
    } else {
      this.dom.newThemeName.disabled = true;
      this.dom.newThemeDescription.disabled = true; // 修改
      this.dom.existingThemesSelect.disabled = false;
    }
  }

  processAndPreview() {
    const csvText = this.dom.csvInput.value.trim();
    if (!csvText) {
      this.showNotification('请输入或上传数据', 'error');
      return;
    }

    // 解析CSV
    this.parsedData = csvText.split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => {
        const parts = line.split(',');
        return {
          front: parts[0] || '',
          back: parts[1] || '',
          frontNotes: parts[2] || '',
          backNotes: parts[3] || ''
        };
      });

    if (this.parsedData.length === 0) {
      this.showNotification('未解析到有效卡片数据', 'error');
      return;
    }

    // 渲染预览
    this.dom.cardCount.textContent = this.parsedData.length;
    this.dom.previewList.innerHTML = '';
    this.parsedData.forEach(card => {
      const row = document.createElement('div');
      row.className = 'preview-row';
      row.innerHTML = `
        <div class="preview-col">
          <div>${card.front}</div>
          ${card.frontNotes ? `<div class="preview-notes">${card.frontNotes}</div>` : ''}
        </div>
        <div class="preview-col">
          <div>${card.back}</div>
          ${card.backNotes ? `<div class="preview-notes">${card.backNotes}</div>` : ''}
        </div>
      `;
      this.dom.previewList.appendChild(row);
    });

    // 显示预览区域
    this.dom.previewSection.classList.remove('hidden');
    this.showNotification(`成功解析 ${this.parsedData.length} 张卡片`, 'success');
  }

  // 提取公共逻辑，用于生成待处理的数据结构
  async generateDataObject() {
    if (this.parsedData.length === 0) {
      this.showNotification('没有可处理的数据，请先预览', 'error');
      return null;
    }

    const themeChoice = document.querySelector('input[name="theme-choice"]:checked').value;
    let themeId, themeTitle, themeDescription;
    let isNewTheme = false;

    if (themeChoice === 'new') {
      themeTitle = this.dom.newThemeName.value.trim();
      themeDescription = this.dom.newThemeDescription.value.trim(); // 获取描述
      if (!themeTitle) {
        this.showNotification('新主题名称不能为空', 'error');
        return null;
      }
      themeId = `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      isNewTheme = true;
    } else {
      themeId = this.dom.existingThemesSelect.value;
      if (!themeId) {
        this.showNotification('请选择一个现有主题', 'error');
        return null;
      }
      const selectedOption = this.dom.existingThemesSelect.options[this.dom.existingThemesSelect.selectedIndex];
      themeTitle = selectedOption.textContent;
    }

    const faces = [];
    const cards = [];
    
    this.parsedData.forEach((card, i) => {
      const timestamp = Date.now() + i;
      const frontFaceId = `face_${timestamp}_front`;
      const backFaceId = `face_${timestamp}_back`;

      faces.push({
        id: frontFaceId,
        main_text: card.front,
        notes: card.frontNotes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      faces.push({
        id: backFaceId,
        main_text: card.back,
        notes: card.backNotes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      cards.push({
        id: `assoc_${timestamp}`,
        theme_id: themeId,
        front_face_id: frontFaceId,
        back_face_id: backFaceId,
        sort_order: i,
        created_at: new Date().toISOString()
      });
    });

    const dataObject = {
      theme: null,
      faces,
      cards
    };

    if (isNewTheme) {
      dataObject.theme = {
        id: themeId,
        title: themeTitle,
        description: themeDescription, // 添加描述
        cover_image_url: '',
        style_config: { theme: 'minimalist-white', custom_styles: {} },
        is_official: false,
        sort_order: 0,
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    return dataObject;
  }

  async importToDatabase() {
    const data = await this.generateDataObject();
    if (!data) return;

    try {
      // 如果是新主题，先创建主题
      if (data.theme) {
        await this.themesCollection.upsert(data.theme);
      }
      // 批量插入卡面和关联
      await this.cardFacesCollection.upsert(data.faces);
      await this.associationsCollection.upsert(data.cards);

      this.showNotification(`成功导入 ${data.cards.length} 张卡片到主题！`, 'success');
      // 成功后刷新现有主题列表
      this.loadExistingThemes();
    } catch (error) {
      this.showNotification('导入数据库失败', 'error');
      console.error('导入失败:', error);
    }
  }

  async downloadAsJson() {
    const data = await this.generateDataObject();
    if (!data) return;

    const exportData = {
      metadata: {
        version: '1.0.0',
        export_date: new Date().toISOString(),
        source: '喵卡批量创建工具'
      },
      data: {
        themes: data.theme ? [data.theme] : [],
        cards: data.cards,
        faces: data.faces
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const themeName = data.theme ? data.theme.title : 'existing-theme';
    a.download = `milka-import-${themeName.replace(/\s/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showNotification('JSON 文件已开始下载', 'success');
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    this.dom.notificationArea.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 500);
    }, 4000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BatchImporter();
});