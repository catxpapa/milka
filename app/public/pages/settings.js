// 设置页面 - 数据管理和系统配置
import { SampleDataGenerator } from "../utils/sampleData.js";

export class SettingsPage {
  constructor(app) {
    this.app = app;
    this.sampleDataGenerator = new SampleDataGenerator(app.db);
    this.isProcessing = false;
    this.pendingImportData = null;
    this.pendingConfirmAction = null;
  }

  render() {
    return `
      <div class="settings-page">
        <div class="settings-container">
          <div class="settings-content">
            <!-- 数据管理区域 -->
            <div class="settings-section">
              <div class="section-header">
                <h3>📊 数据管理</h3>
                <p class="section-description">管理应用数据，包括重置、清空和备份操作</p>
                <button class="btn btn-close-settings" onclick="location.reload()">✕</button>
              </div>

              <div class="settings-grid">
                <!-- 重新初始化数据 -->
                <div class="setting-card">
                  <div class="card-content">
                    <h4>🔄 重新初始化数据</h4>
                    <p>清空所有数据并重新创建示例主题和卡片</p>
                    <button 
                      class="btn btn-warning" 
                      onclick="settingsPage.reinitializeData()"
                      ${this.isProcessing ? "disabled" : ""}
                    >
                      重新初始化
                    </button>
                  </div>
                </div>

                <!-- 清空所有数据 -->
                <div class="setting-card">
                  <div class="card-content">
                    <h4>🗑️ 清空所有数据</h4>
                    <p>删除所有主题、卡片和关联数据，不可恢复</p>
                    <button 
                      class="btn btn-danger" 
                      onclick="settingsPage.clearAllData()"
                      ${this.isProcessing ? "disabled" : ""}
                    >
                      清空数据
                    </button>
                  </div>
                </div>

                <!-- 创建示例数据 -->
                <div class="setting-card">
                  <div class="card-content">
                    <h4>🌱 创建示例数据</h4>
                    <p>在现有数据基础上添加示例主题和卡片</p>
                    <button 
                      class="btn btn-secondary" 
                      onclick="settingsPage.createSampleData()"
                      ${this.isProcessing ? "disabled" : ""}
                    >
                      添加示例
                    </button>
                  </div>
                </div>

                <!-- 数据统计 -->
                <div class="setting-card">
                  <div class="card-content">
                    <h4>📈 数据统计</h4>
                    <div class="data-stats" id="data-stats">
                      <div class="stat-item">
                        <span class="stat-label">主题数量：</span>
                        <span class="stat-value" id="themes-count">-</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">卡片数量：</span>
                        <span class="stat-value" id="cards-count">-</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">卡面数量：</span>
                        <span class="stat-value" id="faces-count">-</span>
                      </div>
                    </div>
                    <button 
                      class="btn btn-secondary" 
                      onclick="settingsPage.refreshStats()"
                    >
                      刷新统计
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 数据导入导出区域 -->
            <div class="settings-section">
              <div class="section-header">
                <h3>💾 数据导入导出</h3>
                <p class="section-description">备份和恢复应用数据，支持跨应用数据迁移</p>
              </div>

              <div class="settings-grid">
                <!-- 导出数据 -->
                <div class="setting-card">
                  <div class="card-content">
                    <h4>📤 导出数据</h4>
                    <p>将所有主题、卡片和关联数据导出为标准JSON格式</p>
                    <button 
                      class="btn btn-primary" 
                      onclick="settingsPage.exportData()"
                      ${this.isProcessing ? "disabled" : ""}
                    >
                      导出全部数据
                    </button>
                  </div>
                </div>

                <!-- 导入数据 -->
                <div class="setting-card">
                  <div class="card-content">
                    <h4>📥 导入数据</h4>
                    <p>从JSON文件导入数据，支持增量导入和完全覆盖</p>
                    <div class="import-controls">
                      <input 
                        type="file" 
                        id="import-file" 
                        accept=".json"
                        style="display: none;"
                        onchange="settingsPage.handleFileSelect(event)"
                      >
                      <button 
                        class="btn btn-secondary" 
                        onclick="document.getElementById('import-file').click()"
                      >
                        选择文件
                      </button>
                      <div class="file-info" id="file-info" style="display: none;">
                        <span class="file-name" id="file-name"></span>
                        <span class="file-size" id="file-size"></span>
                      </div>
                    </div>
                  </div>
                </div>


              </div>
            </div>

            <!-- 系统信息区域 -->
            <div class="settings-section">
              <div class="section-header">
                <h3>ℹ️ 系统信息</h3>
                <p class="section-description">应用版本和技术信息</p>
              </div>

              <div class="system-info">
                <div class="info-item">
                  <span class="info-label">应用版本：</span>
                  <span class="info-value">v0.2.1</span>
                </div>
                <div class="info-item">
                  <span class="info-label">数据库：</span>
                  <span class="info-value">MiniDB</span>
                </div>
                <div class="info-item">
                  <span class="info-label">平台：</span>
                  <span class="info-value">懒猫微服</span>
                </div>
                <div class="info-item">
                  <span class="info-label">数据格式版本：</span>
                  <span class="info-value">1.0</span>
                </div>
                <div class="info-item">
                  <span class="info-label">最后更新：</span>
                  <span class="info-value" id="last-update">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 确认对话框 -->
        <div id="confirm-dialog" class="confirm-dialog hidden">
          <div class="dialog-overlay" onclick="settingsPage.hideConfirmDialog()"></div>
          <div class="dialog-content">
            <div class="dialog-header">
              <h3 id="dialog-title">确认操作</h3>
            </div>
            <div class="dialog-body">
              <p id="dialog-message">确定要执行此操作吗？</p>
              <div class="dialog-warning">
                <span class="warning-icon">⚠️</span>
                <span>此操作不可撤销，请谨慎操作</span>
              </div>
            </div>
            <div class="dialog-actions">
              <button class="btn btn-secondary" onclick="settingsPage.hideConfirmDialog()">
                取消
              </button>
              <button class="btn btn-danger" id="confirm-button" onclick="settingsPage.executeConfirmedAction()">
                确认
              </button>
            </div>
          </div>
        </div>

       <!-- 导入预览对话框 -->
        <div id="import-preview-dialog" class="confirm-dialog hidden">
          <div class="dialog-overlay" onclick="settingsPage.hideImportPreview()"></div>
          <div class="dialog-content import-preview-content">
            <div class="dialog-header">
              <h3>导入数据预览</h3>
            </div>
            <div class="dialog-body">
              <div class="import-summary" id="import-summary">
                <!-- 动态生成导入摘要 -->
              </div>
              <div class="import-mode-selection">
                <h4>导入模式：</h4>
                <label class="radio-label">
                  <input type="radio" name="preview-import-mode" value="merge" checked>
                  <span>增量导入 - 保留现有数据，添加新数据</span>
                </label>
                <label class="radio-label">
                  <input type="radio" name="preview-import-mode" value="replace">
                  <span>完全覆盖 - 清空现有数据，导入新数据</span>
                </label>
              </div>
            </div>
            <div class="dialog-actions">
              <button class="btn btn-secondary" onclick="settingsPage.hideImportPreview()">
                取消
              </button>
              <button class="btn btn-primary" onclick="settingsPage.confirmImport()">
                确认导入
              </button>
            </div>
          </div>
        </div>

        <!-- 处理中指示器 -->
        <div id="processing-indicator" class="processing-indicator hidden">
          <div class="processing-content">
            <div class="processing-spinner"></div>
            <p id="processing-message">正在处理...</p>
          </div>
        </div>
      </div>

      <style>
        /* 设置页面样式 - 按要求修改 */
        .settings-page {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem;
          min-height: 100vh;
        }

        .settings-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .settings-content {
          padding: 2rem;
        }

        .settings-section {
          margin-bottom: 3rem;
        }

        .settings-section:last-child {
          margin-bottom: 0;
        }

        .section-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e9ecef;
          position: relative;
        }

        .section-header h3 {
          font-size: 1.25rem;
          font-weight: 300;
          color: #333;
          margin: 0 0 0.5rem 0;
        }

        .section-description {
          color: #666;
          font-size: 0.875rem;
          margin: 0;
          font-weight: 300;
        }

        .btn-close-settings {
          position: absolute;
          top: 0;
          right: 0;
          background: transparent;
          color: #999;
          border: none;
          padding: 0.5rem;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          font-size: 1.2rem;
          font-weight: 300;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-close-settings:hover {
          background: #f8f9fa;
          color: #666;
          transform: scale(1.1);
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .setting-card {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .setting-card:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .setting-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .card-content h4 {
          font-size: 1.125rem;
          font-weight: 400;
          color: #333;
          margin: 0 0 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .card-content p {
          color: #666;
          font-size: 0.875rem;
          margin: 0 0 1rem 0;
          line-height: 1.5;
          font-weight: 300;
        }

        /* 导入导出特殊样式 */
        .export-options {
          margin-bottom: 1rem;
        }

        .checkbox-label, .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: #666;
          cursor: pointer;
        }

        .checkbox-label input, .radio-label input {
          margin: 0;
        }

        .import-controls {
          margin-bottom: 1rem;
        }

        .file-info {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #e9ecef;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .file-name {
          display: block;
          font-weight: 500;
          color: #333;
        }

        .file-size {
          color: #666;
        }

        .import-mode {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e9ecef;
        }

        .data-stats {
          margin-bottom: 1rem;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .stat-label {
          color: #666;
          font-weight: 300;
        }

        .stat-value {
          color: #333;
          font-weight: 400;
        }

        .system-info {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        .info-label {
          color: #666;
          font-weight: 300;
        }

        .info-value {
          color: #333;
          font-weight: 400;
        }

        /* 按钮样式 */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 300;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          min-height: 36px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
          transform: translateY(-1px);
        }

        .btn-warning {
          background: #ffc107;
          color: #212529;
        }

        .btn-warning:hover:not(:disabled) {
          background: #e0a800;
          transform: translateY(-1px);
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #c82333;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #5a6268;
          transform: translateY(-1px);
        }

        /* 对话框样式 */
        .confirm-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .confirm-dialog.hidden {
          display: none;
        }

        .dialog-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }

        .dialog-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          max-width: 400px;
          width: 90%;
          position: relative;
          z-index: 1001;
        }

        .import-preview-content {
          max-width: 500px;
        }

        .dialog-header {
          padding: 1.5rem 1.5rem 0 1.5rem;
        }

        .dialog-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 400;
          color: #333;
        }

        .dialog-body {
          padding: 1rem 1.5rem;
        }

        .dialog-body p {
          margin: 0 0 1rem 0;
          color: #666;
          line-height: 1.5;
        }

        .dialog-warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #856404;
        }

        .warning-icon {
          font-size: 1rem;
        }

        .dialog-actions {
          padding: 0 1.5rem 1.5rem 1.5rem;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        /* 导入预览样式 */
        .import-summary {
          background: #f8f9fa;
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .import-summary h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: #333;
        }

        .import-summary ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #666;
          font-size: 0.875rem;
        }

        .import-mode-selection {
          margin-top: 1rem;
        }

        .import-mode-selection h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: #333;
        }

        /* 处理中指示器 */
        .processing-indicator {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .processing-indicator.hidden {
          display: none;
        }

        .processing-content {
          text-align: center;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .processing-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
          .settings-page {
            padding: 1rem;
          }

          .settings-content {
            padding: 1.5rem;
          }

          .settings-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            padding-right: 3rem;
          }

          .dialog-content {
            margin: 1rem;
          }
        }
      </style>
    `;
  }

  // 初始化页面
  async init() {
    await this.refreshStats();
    this.updateLastUpdate();
  }

  // 重新初始化数据 - 传递函数版本
  async reinitializeData() {
    this.showConfirmDialog(
      "重新初始化数据",
      "这将删除所有现有数据并重新创建示例数据。如果你已经添加过数据，建议先导出保存。此操作不可撤销，确定要继续吗？",
      async () => {
        try {
          this.showProcessing("正在重新初始化数据...");

          // 清空现有数据
          await this.sampleDataGenerator.clearAllData();

          // 创建示例数据
          await this.sampleDataGenerator.recreateSampleData();

          // 重新加载应用数据
          if (this.app.loadThemes) {
            await this.app.loadThemes();
          }

          // 刷新统计数据
          await this.refreshStats();

          this.hideProcessing();
          this.showNotification("数据重新初始化完成", "success");
        } catch (error) {
          console.error("重新初始化数据失败:", error);
          this.hideProcessing();
          this.showNotification("重新初始化失败: " + error.message, "error");
        }
      }
    );
  }

  // 清空所有数据 - 传递函数版本
  async clearAllData() {
    this.showConfirmDialog(
      "清空所有数据",
      "这将永久删除所有主题、卡片和关联数据。如果你已经添加过数据，建议先导出保存。此操作不可撤销，确定要继续吗？",
      async () => {
        try {
          this.showProcessing("正在清空数据...");

          // 执行清空操作
          await this.sampleDataGenerator.clearAllData();

          // 重新加载应用数据
          if (this.app.loadThemes) {
            await this.app.loadThemes();
          }

          // 刷新统计数据
          await this.refreshStats();

          this.hideProcessing();
          this.showNotification("所有数据已清空", "success");
        } catch (error) {
          console.error("清空数据失败:", error);
          this.hideProcessing();
          this.showNotification("清空数据失败: " + error.message, "error");
        }
      }
    );
  }

  // 创建示例数据 - 传递函数版本
  async createSampleData() {
    this.showConfirmDialog(
      "创建示例数据",
      "这将在现有数据基础上添加示例主题和卡片，<b>即使相同的数据可能已经存在</b>。可能会打乱数据内容，如果你已经添加过数据，建议先导出保存。确定要继续吗？",
      async () => {
        try {
          this.showProcessing("正在创建示例数据...");

          // 创建示例数据
          await this.sampleDataGenerator.createAllSampleData();

          // 重新加载应用数据
          if (this.app.loadThemes) {
            await this.app.loadThemes();
          }

          // 刷新统计数据
          await this.refreshStats();

          this.hideProcessing();
          this.showNotification("示例数据创建完成", "success");
        } catch (error) {
          console.error("创建示例数据失败:", error);
          this.hideProcessing();
          this.showNotification("创建示例数据失败: " + error.message, "error");
        }
      }
    );
  }

  // 导出数据
  // 导出数据功能 - 完整版本
  async exportData() {
    try {
      this.showProcessing("正在导出数据...");

      // 获取所有数据
      const themes = await this.app.themesCollection.find({}).fetch();
      const associations = await this.app.associationsCollection
        .find({})
        .fetch();
      const faces = await this.app.cardFacesCollection.find({}).fetch();

      // 构建完整的数据结构
      const exportData = {
        metadata: {
          version: "1.0",
          format: "milka-backup",
          exportTime: new Date().toISOString(),
          appVersion: "v0.2.1",
          description: "喵卡应用完整数据备份文件",
          dataCount: {
            themes: themes.length,
            cards: associations.length,
            faces: faces.length,
          },
        },
        data: {
          themes: themes.map((theme) => ({
            // 使用 _id 作为主键，但在导出时转换为 id 以保持兼容性
            id: theme._id || theme.id,
            title: theme.title,
            description: theme.description,
            cover_image_url: theme.cover_image_url || "",
            style_config: theme.style_config || {
              theme: "minimalist-white",
              custom_styles: {},
            },
            is_official: theme.is_official || false,
            sort_order: theme.sort_order || 0,
            is_pinned: theme.is_pinned || false,
            created_at: theme.created_at,
            updated_at: theme.updated_at,
          })),
          cards: associations.map((assoc) => ({
            id: assoc._id || assoc.id,
            theme_id: assoc.theme_id,
            front_face_id: assoc.front_face_id,
            back_face_id: assoc.back_face_id,
            sort_order: assoc.sort_order || 0,
            created_at: assoc.created_at,
          })),
          faces: faces.map((face) => ({
            id: face._id || face.id,
            main_text: face.main_text,
            notes: face.notes || "",
            image_url: face.image_url || "",
            keywords: face.keywords || [],
            created_at: face.created_at,
            updated_at: face.updated_at,
          })),
        },
      };

      // 生成文件名
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const filename = `milka-backup-${timestamp}.json`;

      // 创建并下载文件
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json;charset=utf-8", // 明确指定 UTF-8 编码
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.hideProcessing();
      this.showNotification(`数据导出成功！文件：${filename}`, "success");
    } catch (error) {
      console.error("导出数据失败:", error);
      this.hideProcessing();
      this.showNotification("导出数据失败: " + error.message, "error");
    }
  }
  // 构建导出数据
  async buildExportData(includeThemes, includeCards, includeSettings) {
    const exportData = {
      // 元数据
      metadata: {
        version: "1.0",
        format: "milka-backup",
        exportTime: new Date().toISOString(),
        appVersion: "v0.2.1",
        description: "喵卡应用数据备份文件",
      },
      // 数据内容
      data: {},
    };

    if (includeThemes || includeCards) {
      // 获取所有主题
      const themes = await this.app.themesCollection.find({}).fetch();

      if (includeThemes) {
        exportData.data.themes = themes.map((theme) => ({
          id: theme.id || theme._id,
          title: theme.title,
          description: theme.description,
          style_config: theme.style_config,
          is_official: theme.is_official,
          sort_order: theme.sort_order,
          is_pinned: theme.is_pinned,
          created_at: theme.created_at,
          updated_at: theme.updated_at,
        }));
      }

      if (includeCards) {
        // 获取所有关联关系
        const associations = await this.app.associationsCollection
          .find({})
          .fetch();

        // 获取所有卡面ID
        const faceIds = [
          ...new Set([
            ...associations.map((a) => a.front_face_id),
            ...associations.map((a) => a.back_face_id),
          ]),
        ];

        // 获取所有卡面
        const faces = await this.app.cardFacesCollection
          .find({ _id: { $in: faceIds } })
          .fetch();

        // 构建卡片数据结构
        exportData.data.cards = [];

        for (const theme of themes) {
          const themeAssociations = associations.filter(
            (a) => a.theme_id === (theme.id || theme._id)
          );

          for (const assoc of themeAssociations) {
            const frontFace = faces.find((f) => f._id === assoc.front_face_id);
            const backFace = faces.find((f) => f._id === assoc.back_face_id);

            if (frontFace && backFace) {
              exportData.data.cards.push({
                id: assoc.id || assoc._id,
                theme_id: assoc.theme_id,
                sort_order: assoc.sort_order,
                front: {
                  main_text: frontFace.main_text,
                  notes: frontFace.notes,
                  keywords: frontFace.keywords,
                },
                back: {
                  main_text: backFace.main_text,
                  notes: backFace.notes,
                  keywords: backFace.keywords,
                },
                created_at: assoc.created_at,
              });
            }
          }
        }
      }
    }

    if (includeSettings) {
      exportData.data.settings = {
        defaultTheme: "minimalist-white",
        // 可以添加更多应用设置
      };
    }

    return exportData;
  }

  // 下载JSON文件
  downloadJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 处理文件选择 - UTF-8 支持版本
  // 处理文件选择 - UTF-8 支持和错误处理增强版本
  // 处理文件选择 - 增加文件输入框复位功能
  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.name.endsWith(".json")) {
      this.showNotification("请选择 JSON 格式的文件", "error");
      // 重置文件输入框
      event.target.value = "";
      return;
    }

    // 显示文件信息
    const fileInfo = document.getElementById("file-info");
    const fileName = document.getElementById("file-name");
    const fileSize = document.getElementById("file-size");

    fileName.textContent = file.name;
    fileSize.textContent = `(${(file.size / 1024).toFixed(1)} KB)`;
    fileInfo.style.display = "block";

    // 读取并解析文件 - 明确指定 UTF-8 编码
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // 确保文本内容以 UTF-8 格式解析
        const textContent = e.target.result;

        // 验证是否为有效的 UTF-8 文本
        if (!this.isValidUTF8(textContent)) {
          throw new Error("文件编码格式不正确，请确保文件为 UTF-8 编码");
        }

        console.log("文件内容预览:", textContent.substring(0, 200) + "...");

        const importData = JSON.parse(textContent);

        console.log("解析后的数据结构:", {
          hasMetadata: !!importData.metadata,
          hasData: !!importData.data,
          dataKeys: importData.data ? Object.keys(importData.data) : [],
          themesCount: importData.data?.themes?.length || 0,
          cardsCount: importData.data?.cards?.length || 0,
          facesCount: importData.data?.faces?.length || 0,
        });

        // 验证数据格式
        if (!importData.data) {
          throw new Error("文件格式不正确：缺少 data 字段");
        }

        if (
          !importData.data.themes ||
          !importData.data.cards ||
          !importData.data.faces
        ) {
          throw new Error(
            "文件格式不正确：data 字段缺少必要的子字段（themes、cards、faces）"
          );
        }

        // 存储解析后的数据
        this.pendingImportData = importData;

        console.log("数据存储验证:", {
          stored: !!this.pendingImportData,
          hasData: !!this.pendingImportData?.data,
          dataKeys: this.pendingImportData?.data
            ? Object.keys(this.pendingImportData.data)
            : [],
        });

        if (!this.pendingImportData || !this.pendingImportData.data) {
          throw new Error("数据存储失败，请重试");
        }

        // 显示数据预览
        this.showImportPreview(importData);
      } catch (error) {
        console.error("文件解析失败:", error);
        this.showNotification("文件解析失败: " + error.message, "error");
        fileInfo.style.display = "none";

        // 清除文件选择
        event.target.value = "";
      }
    };

    reader.onerror = (error) => {
      console.error("文件读取失败:", error);
      this.showNotification("文件读取失败，请检查文件是否损坏", "error");
      // 重置文件输入框
      event.target.value = "";
    };

    // 指定 UTF-8 编码读取文件
    reader.readAsText(file, "UTF-8");
  }
  // 添加 UTF-8 验证方法
  isValidUTF8(str) {
    try {
      // 尝试编码和解码来验证 UTF-8 有效性
      return str === decodeURIComponent(encodeURIComponent(str));
    } catch (e) {
      return false;
    }
  }

  // 添加 UTF-8 验证方法
  isValidUTF8(str) {
    try {
      // 尝试编码和解码来验证 UTF-8 有效性
      return str === decodeURIComponent(encodeURIComponent(str));
    } catch (e) {
      return false;
    }
  }

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // 导入数据
  async importData() {
    if (!this.selectedFile) {
      this.showNotification("请先选择要导入的文件", "error");
      return;
    }

    try {
      this.showProcessing("正在读取文件...");

      // 读取文件内容
      const fileContent = await this.readFileAsText(this.selectedFile);
      const importData = JSON.parse(fileContent);

      // 验证文件格式
      if (!this.validateImportData(importData)) {
        this.hideProcessing();
        this.showNotification("文件格式不正确或不兼容", "error");
        return;
      }

      // 显示导入预览
      this.showImportPreview(importData);
      this.hideProcessing();
    } catch (error) {
      console.error("读取文件失败:", error);
      this.hideProcessing();
      this.showNotification("读取文件失败: " + error.message, "error");
    }
  }

  // 读取文件为文本
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error("文件读取失败"));
      reader.readAsText(file, "UTF-8"); // 明确指定 UTF-8 编码
    });
  }

  // 验证导入数据格式
  validateImportData(data) {
    // 检查基本结构
    if (!data || typeof data !== "object") return false;
    if (!data.metadata || !data.data) return false;

    // 检查版本兼容性
    if (data.metadata.format !== "milka-backup") return false;

    // 检查数据结构
    const { themes, cards, settings } = data.data;

    if (themes && !Array.isArray(themes)) return false;
    if (cards && !Array.isArray(cards)) return false;
    if (settings && typeof settings !== "object") return false;

    return true;
  }

  // 显示导入预览
  showImportPreview(importData) {
    const { themes = [], cards = [], settings } = importData.data;

    // 构建摘要信息
    const summaryHTML = `
      <h4>导入内容摘要：</h4>
      <ul>
        ${themes.length > 0 ? `<li>主题：${themes.length} 个</li>` : ""}
        ${cards.length > 0 ? `<li>卡片：${cards.length} 张</li>` : ""}
        ${settings ? "<li>应用设置：1 项</li>" : ""}
      </ul>
      <p><strong>导出时间：</strong>${new Date(
        importData.metadata.exportTime
      ).toLocaleString("zh-CN")}</p>
      <p><strong>数据版本：</strong>${importData.metadata.version}</p>
    `;

    document.getElementById("import-summary").innerHTML = summaryHTML;

    // 存储导入数据
    this.pendingImportData = importData;

    // 显示预览对话框
    document.getElementById("import-preview-dialog").classList.remove("hidden");
  }

  // 隐藏导入预览
  hideImportPreview() {
    document.getElementById("import-preview-dialog").classList.add("hidden");
    this.pendingImportData = null;
  }

  // 确认导入操作 - 修复版本
  // 确认导入操作 - 修复上下文丢失问题
  // 确认导入操作 - 增加文件输入框重置
  async confirmImport() {
    try {
      console.log("开始确认导入，检查数据状态...");

      // 验证是否有待导入的数据
      if (!this.pendingImportData) {
        console.error("pendingImportData 为空:", this.pendingImportData);
        throw new Error("没有可导入的数据，请重新选择文件");
      }

      console.log("pendingImportData 状态:", {
        exists: !!this.pendingImportData,
        hasData: !!this.pendingImportData.data,
        dataKeys: this.pendingImportData.data
          ? Object.keys(this.pendingImportData.data)
          : [],
      });

      // 验证数据结构
      if (!this.pendingImportData.data) {
        console.error("数据结构错误:", this.pendingImportData);
        throw new Error("导入文件格式不正确：缺少 data 字段");
      }

      // 获取选择的导入模式
      const selectedMode = document.querySelector(
        'input[name="preview-import-mode"]:checked'
      );
      const mode = selectedMode ? selectedMode.value : "merge";

      console.log("导入模式:", mode);

      // 创建数据副本，避免引用丢失
      const importDataCopy = JSON.parse(JSON.stringify(this.pendingImportData));

      console.log("创建数据副本，验证:", {
        copyExists: !!importDataCopy,
        copyHasData: !!importDataCopy.data,
        originalExists: !!this.pendingImportData,
      });

      // 隐藏预览对话框
      this.hideImportPreview();

      // 使用箭头函数确保 this 上下文正确，并传递数据副本
      await this.executeImport.call(this, importDataCopy, mode);

      // 导入完成后重置文件输入框和相关UI
      this.resetImportUI();
    } catch (error) {
      console.error("导入确认失败:", error);
      this.showNotification("导入确认失败: " + error.message, "error");
      // 出错时也重置UI
      this.resetImportUI();
    }
  }
  // 执行导入操作
  // 执行导入操作 - 修复版本
  // 执行导入操作 - 增强参数验证和错误处理
  async executeImport(importData, mode) {
    try {
      console.log("executeImport 被调用，参数检查:");
      console.log("- importData:", importData);
      console.log("- importData 类型:", typeof importData);
      console.log("- importData 是否为 null:", importData === null);
      console.log("- mode:", mode);

      this.showProcessing("正在导入数据...");

      // 第一层验证：检查参数是否为 null 或 undefined
      if (importData === null) {
        throw new Error("导入数据参数为 null，请检查数据传递过程");
      }

      if (importData === undefined) {
        throw new Error("导入数据参数为 undefined，请检查数据传递过程");
      }

      if (typeof importData !== "object") {
        throw new Error(
          `导入数据参数类型错误，期望 object，实际 ${typeof importData}`
        );
      }

      console.log("参数基础验证通过");

      // 第二层验证：检查数据结构
      if (!importData.data) {
        console.error("数据结构验证失败:", {
          importData: importData,
          hasData: !!importData.data,
          keys: Object.keys(importData),
        });
        throw new Error("导入文件格式不正确：缺少 data 字段");
      }

      console.log("数据结构验证通过，开始导入流程...");

      // 使用解构赋值避免变量重复声明
      const {
        themes: importThemes = [],
        cards: importCards = [],
        faces: importFaces = [],
      } = importData.data;

      console.log("数据统计:", {
        themes: importThemes.length,
        cards: importCards.length,
        faces: importFaces.length,
      });

      // 如果是完全覆盖模式，先清空数据
      if (mode === "replace") {
        console.log("完全覆盖模式：清空现有数据...");
        await this.sampleDataGenerator.clearAllData();
      }

      let importStats = {
        themes: { imported: 0, skipped: 0, errors: 0 },
        faces: { imported: 0, skipped: 0, errors: 0 },
        cards: { imported: 0, skipped: 0, errors: 0 },
      };

      // 1. 导入卡面数据（必须先导入，因为卡片关联需要引用）
      console.log(`开始导入 ${importFaces.length} 个卡面...`);
      for (const face of importFaces) {
        try {
          const faceData = {
            _id: face.id, // 使用 _id 作为 MiniDB 主键
            main_text: face.main_text,
            notes: face.notes || "",
            image_url: face.image_url || "",
            keywords: face.keywords || [],
            created_at: face.created_at || new Date().toISOString(),
            updated_at: face.updated_at || new Date().toISOString(),
          };

          if (mode === "merge") {
            // 增量模式：检查是否已存在
            const existing = await this.app.cardFacesCollection.findOne({
              _id: face.id,
            });
            if (existing) {
              importStats.faces.skipped++;
              continue;
            }
          }

          await this.app.cardFacesCollection.upsert(faceData);
          importStats.faces.imported++;
        } catch (error) {
          console.error(`导入卡面 ${face.id} 失败:`, error);
          importStats.faces.errors++;
        }
      }

      // 2. 导入主题数据
      console.log(`开始导入 ${importThemes.length} 个主题...`);
      for (const theme of importThemes) {
        try {
          const themeData = {
            _id: theme.id, // 使用 _id 作为 MiniDB 主键
            title: theme.title,
            description: theme.description || "",
            cover_image_url: theme.cover_image_url || "",
            style_config: theme.style_config || {
              theme: "minimalist-white",
              custom_styles: {},
            },
            is_official: theme.is_official || false,
            sort_order: theme.sort_order || 0,
            is_pinned: theme.is_pinned || false,
            created_at: theme.created_at || new Date().toISOString(),
            updated_at: theme.updated_at || new Date().toISOString(),
          };

          if (mode === "merge") {
            // 增量模式：检查是否已存在
            const existing = await this.app.themesCollection.findOne({
              _id: theme.id,
            });
            if (existing) {
              importStats.themes.skipped++;
              continue;
            }
          }

          await this.app.themesCollection.upsert(themeData);
          importStats.themes.imported++;
        } catch (error) {
          console.error(`导入主题 ${theme.id} 失败:`, error);
          importStats.themes.errors++;
        }
      }

      // 3. 导入卡片关联数据
      console.log(`开始导入 ${importCards.length} 个卡片关联...`);
      for (const card of importCards) {
        try {
          const cardData = {
            _id: card.id, // 使用 _id 作为 MiniDB 主键
            theme_id: card.theme_id,
            front_face_id: card.front_face_id,
            back_face_id: card.back_face_id,
            sort_order: card.sort_order || 0,
            created_at: card.created_at || new Date().toISOString(),
          };

          if (mode === "merge") {
            // 增量模式：检查是否已存在
            const existing = await this.app.associationsCollection.findOne({
              _id: card.id,
            });
            if (existing) {
              importStats.cards.skipped++;
              continue;
            }
          }

          await this.app.associationsCollection.upsert(cardData);
          importStats.cards.imported++;
        } catch (error) {
          console.error(`导入卡片 ${card.id} 失败:`, error);
          importStats.cards.errors++;
        }
      }

      // 重新加载应用数据
      if (this.app.loadThemes) {
        await this.app.loadThemes();
      }

      // 刷新统计数据
      await this.refreshStats();

      this.hideProcessing();

      // 显示导入结果
      const totalImported =
        importStats.themes.imported +
        importStats.faces.imported +
        importStats.cards.imported;
      const totalSkipped =
        importStats.themes.skipped +
        importStats.faces.skipped +
        importStats.cards.skipped;
      const totalErrors =
        importStats.themes.errors +
        importStats.faces.errors +
        importStats.cards.errors;

      let message = `导入完成！\n`;
      message += `成功导入：${totalImported} 项\n`;
      if (totalSkipped > 0) message += `跳过重复：${totalSkipped} 项\n`;
      if (totalErrors > 0) message += `导入失败：${totalErrors} 项\n`;
      message += `\n详细统计：\n`;
      message += `主题：${importStats.themes.imported} 成功，${importStats.themes.skipped} 跳过，${importStats.themes.errors} 失败\n`;
      message += `卡面：${importStats.faces.imported} 成功，${importStats.faces.skipped} 跳过，${importStats.faces.errors} 失败\n`;
      message += `卡片：${importStats.cards.imported} 成功，${importStats.cards.skipped} 跳过，${importStats.cards.errors} 失败`;

      this.showNotification(message, totalErrors > 0 ? "warning" : "success");
    } catch (error) {
      console.error("导入执行失败:", error);
      this.hideProcessing();
      this.showNotification("导入数据失败: " + error.message, "error");
    }
  }
  // 显示确认对话框
  // 显示确认对话框 - 简化版本
  showConfirmDialog(
    title,
    message,
    action,
    buttonText = "确认",
    buttonClass = "btn-danger"
  ) {
    const dialog = document.getElementById("confirm-dialog");
    const dialogTitle = document.getElementById("dialog-title");
    const dialogMessage = document.getElementById("dialog-message");
    const confirmButton = document.getElementById("confirm-button");

    // 设置对话框内容
    dialogTitle.textContent = title;
    dialogMessage.textContent = message;
    confirmButton.textContent = buttonText;
    confirmButton.className = `btn ${buttonClass}`;

    // 存储确认操作
    this.pendingConfirmAction = action;

    // 显示对话框
    dialog.classList.remove("hidden");
  }

  // 隐藏确认对话框
  hideConfirmDialog() {
    const dialog = document.getElementById("confirm-dialog");
    dialog.classList.add("hidden");
  }

  // 执行确认的操作
  // 执行确认的操作 - 简化版本
  executeConfirmedAction() {
    // 隐藏对话框
    this.hideConfirmDialog();

    // 执行待确认的操作
    if (
      this.pendingConfirmAction &&
      typeof this.pendingConfirmAction === "function"
    ) {
      this.pendingConfirmAction();
    }

    // 清除待确认操作
    this.pendingConfirmAction = null;
  }

  // 显示处理中指示器
  showProcessing(message) {
    this.isProcessing = true;
    const indicator = document.getElementById("processing-indicator");
    const messageElement = document.getElementById("processing-message");

    messageElement.textContent = message;
    indicator.classList.remove("hidden");

    // 禁用所有按钮
    const buttons = document.querySelectorAll(
      ".settings-page .btn:not([disabled])"
    );
    buttons.forEach((btn) => {
      btn.disabled = true;
      btn.setAttribute("data-was-enabled", "true");
    });
  }

  // 隐藏处理中指示器
  hideProcessing() {
    this.isProcessing = false;
    const indicator = document.getElementById("processing-indicator");
    indicator.classList.add("hidden");

    // 重新启用按钮
    const buttons = document.querySelectorAll(
      ".settings-page .btn[data-was-enabled]"
    );
    buttons.forEach((btn) => {
      btn.disabled = false;
      btn.removeAttribute("data-was-enabled");
    });
  }

  // 刷新数据统计
  // 刷新数据统计 - 避免变量重复声明
  async refreshStats() {
    try {
      const allThemes = await this.app.themesCollection.find({}).fetch(); // 使用不同的变量名
      const associations = await this.app.associationsCollection
        .find({})
        .fetch();
      const faces = await this.app.cardFacesCollection.find({}).fetch();

      document.getElementById("themes-count").textContent = allThemes.length;
      document.getElementById("cards-count").textContent = associations.length;
      document.getElementById("faces-count").textContent = faces.length;
    } catch (error) {
      console.error("刷新统计失败:", error);
      document.getElementById("themes-count").textContent = "错误";
      document.getElementById("cards-count").textContent = "错误";
      document.getElementById("faces-count").textContent = "错误";
    }
  }

  // 更新最后更新时间
  updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleString("zh-CN");
    document.getElementById("last-update").textContent = timeString;
  }

  // 显示通知
  showNotification(message, type = "info") {
    // 简单的通知实现，可以根据需要扩展
    console.log(`[${type.toUpperCase()}] ${message}`);

    // 如果主应用有通知方法，调用它
    if (this.app.showNotification) {
      this.app.showNotification(message, type);
    } else {
      // 简单的alert作为后备
      alert(message);
    }
  }

  // 验证和处理多语言字符
  validateMultiLanguageContent(data) {
    try {
      // 递归检查对象中的所有字符串字段
      const checkStrings = (obj, path = "") => {
        if (typeof obj === "string") {
          // 检查是否包含多语言字符
          const hasMultiLanguage =
            /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u0400-\u04ff\u0590-\u05ff\u0600-\u06ff]/.test(
              obj
            );
          if (hasMultiLanguage) {
            console.log(
              `检测到多语言字符 [${path}]:`,
              obj.substring(0, 50) + (obj.length > 50 ? "..." : "")
            );
          }
          return true;
        } else if (typeof obj === "object" && obj !== null) {
          for (const key in obj) {
            if (!checkStrings(obj[key], path ? `${path}.${key}` : key)) {
              return false;
            }
          }
        }
        return true;
      };

      const isValid = checkStrings(data);
      console.log("✅ 多语言字符验证完成，结果:", isValid);
      return isValid;
    } catch (error) {
      console.error("多语言字符验证失败:", error);
      return false;
    }
  }

  // 调试方法：检查当前数据状态
  debugImportData() {
    console.log("=== 导入数据调试信息 ===");
    console.log("pendingImportData 存在:", !!this.pendingImportData);
    console.log("pendingImportData 类型:", typeof this.pendingImportData);
    console.log("pendingImportData 值:", this.pendingImportData);

    if (this.pendingImportData) {
      console.log("data 字段存在:", !!this.pendingImportData.data);
      console.log("data 字段类型:", typeof this.pendingImportData.data);

      if (this.pendingImportData.data) {
        console.log("data 字段内容:", Object.keys(this.pendingImportData.data));
      }
    }
    console.log("========================");
  }

  // 重置导入相关UI状态
  resetImportUI() {
    try {
      // 重置文件输入框
      const fileInput = document.getElementById("import-file");
      if (fileInput) {
        fileInput.value = "";
      }

      // 隐藏文件信息
      const fileInfo = document.getElementById("file-info");
      if (fileInfo) {
        fileInfo.style.display = "none";
      }

      // 清除待导入数据
      this.pendingImportData = null;

      console.log("导入UI已重置");
    } catch (error) {
      console.error("重置导入UI失败:", error);
    }
  }
}

// 确保全局可访问
if (typeof window !== "undefined") {
  window.SettingsPage = SettingsPage;
}
