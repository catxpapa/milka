// 设置页面 - 数据管理和系统配置
import { SampleDataGenerator } from "../utils/sampleData.js";

export class SettingsPage {
  constructor(app) {
    this.app = app;
    this.sampleDataGenerator = new SampleDataGenerator(app.db);
    this.isProcessing = false;
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
                      ${this.isProcessing ? 'disabled' : ''}
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
                      ${this.isProcessing ? 'disabled' : ''}
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
                      ${this.isProcessing ? 'disabled' : ''}
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

            <!-- 数据导入导出区域（预留） -->
            <div class="settings-section">
              <div class="section-header">
                <h3>💾 数据导入导出</h3>
                <p class="section-description">备份和恢复应用数据（功能开发中）</p>
              </div>

              <div class="settings-grid">
                <!-- 导出数据 -->
                <div class="setting-card disabled">
                  <div class="card-content">
                    <h4>📤 导出数据</h4>
                    <p>将所有数据导出为JSON文件</p>
                    <button class="btn btn-secondary" disabled>
                      即将推出
                    </button>
                  </div>
                </div>

                <!-- 导入数据 -->
                <div class="setting-card disabled">
                  <div class="card-content">
                    <h4>📥 导入数据</h4>
                    <p>从JSON文件导入数据</p>
                    <button class="btn btn-secondary" disabled>
                      即将推出
                    </button>
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
          /* 移除背景色，透出底色 */
          min-height: 100vh;
        }

        .settings-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        /* 移除 settings-header 相关样式 */

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
          position: relative; /* 为关闭按钮定位 */
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

        /* 关闭按钮样式 */
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

        /* 修改后的标题样式 - 图标直接在标题中，缩小尺寸 */
        .card-content h4 {
          font-size: 1.125rem;
          font-weight: 400;
          color: #333;
          margin: 0 0 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem; /* 图标和文字间距 */
        }

        /* 确保emoji图标大小适中 */
        .card-content h4::first-letter {
          font-size: 1rem; /* 缩小图标尺寸 */
        }

        .card-content p {
          color: #666;
          font-size: 0.875rem;
          margin: 0 0 1rem 0;
          line-height: 1.5;
          font-weight: 300;
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

        /* 确认对话框样式 */
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
            padding-right: 3rem; /* 为关闭按钮留出空间 */
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

  // 重新初始化数据
  async reinitializeData() {
    this.showConfirmDialog(
      '重新初始化数据',
      '这将删除所有现有数据并重新创建示例数据。此操作不可撤销，确定要继续吗？',
      'reinitialize'
    );
  }

  // 清空所有数据
  async clearAllData() {
    this.showConfirmDialog(
      '清空所有数据',
      '这将永久删除所有主题、卡片和关联数据。此操作不可撤销，确定要继续吗？',
      'clear'
    );
  }

  // 创建示例数据
  async createSampleData() {
    this.showConfirmDialog(
      '创建示例数据',
      '这将在现有数据基础上添加示例主题和卡片。确定要继续吗？',
      'sample'
    );
  }

  // 显示确认对话框
  showConfirmDialog(title, message, action) {
    const dialog = document.getElementById('confirm-dialog');
    const titleElement = document.getElementById('dialog-title');
    const messageElement = document.getElementById('dialog-message');
    const confirmButton = document.getElementById('confirm-button');

    titleElement.textContent = title;
    messageElement.textContent = message;
    confirmButton.setAttribute('data-action', action);

    dialog.classList.remove('hidden');
  }

  // 隐藏确认对话框
  hideConfirmDialog() {
    const dialog = document.getElementById('confirm-dialog');
    dialog.classList.add('hidden');
  }

  // 执行确认的操作
  async executeConfirmedAction() {
    const confirmButton = document.getElementById('confirm-button');
    const action = confirmButton.getAttribute('data-action');

    this.hideConfirmDialog();
    this.showProcessing('正在处理...');

    try {
      switch (action) {
        case 'reinitialize':
          await this.sampleDataGenerator.recreateSampleData();
          this.showNotification('数据重新初始化成功', 'success');
          break;
        case 'clear':
          await this.sampleDataGenerator.clearAllData();
          this.showNotification('所有数据已清空', 'success');
          break;
        case 'sample':
          await this.sampleDataGenerator.createAllSampleData();
          this.showNotification('示例数据创建成功', 'success');
          break;
      }

      // 刷新统计数据
      await this.refreshStats();
      
      // 如果在主应用中，重新加载主题数据
      if (this.app.loadThemes) {
        await this.app.loadThemes();
      }

    } catch (error) {
      console.error('操作失败:', error);
      this.showNotification('操作失败: ' + error.message, 'error');
    } finally {
      this.hideProcessing();
    }
  }

  // 显示处理中指示器
  showProcessing(message) {
    this.isProcessing = true;
    const indicator = document.getElementById('processing-indicator');
    const messageElement = document.getElementById('processing-message');
    
    messageElement.textContent = message;
    indicator.classList.remove('hidden');

    // 禁用所有按钮
    const buttons = document.querySelectorAll('.settings-page .btn:not([disabled])');
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.setAttribute('data-was-enabled', 'true');
    });
  }

  // 隐藏处理中指示器
  hideProcessing() {
    this.isProcessing = false;
    const indicator = document.getElementById('processing-indicator');
    indicator.classList.add('hidden');

    // 重新启用按钮
    const buttons = document.querySelectorAll('.settings-page .btn[data-was-enabled]');
    buttons.forEach(btn => {
      btn.disabled = false;
      btn.removeAttribute('data-was-enabled');
    });
  }

  // 刷新数据统计
  async refreshStats() {
    try {
      const themes = await this.app.themesCollection.find({}).fetch();
      const associations = await this.app.associationsCollection.find({}).fetch();
      const faces = await this.app.cardFacesCollection.find({}).fetch();

      document.getElementById('themes-count').textContent = themes.length;
      document.getElementById('cards-count').textContent = associations.length;
      document.getElementById('faces-count').textContent = faces.length;

    } catch (error) {
      console.error('刷新统计失败:', error);
      document.getElementById('themes-count').textContent = '错误';
      document.getElementById('cards-count').textContent = '错误';
      document.getElementById('faces-count').textContent = '错误';
    }
  }

  // 更新最后更新时间
  updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN');
    document.getElementById('last-update').textContent = timeString;
  }

  // 显示通知
  showNotification(message, type = 'info') {
    // 简单的通知实现
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // 如果主应用有通知方法，使用主应用的
    if (this.app.showNotification) {
      this.app.showNotification(message, type);
    }
  }
}

// 创建全局实例
window.settingsPage = null;

// 当页面加载时初始化设置页面实例
document.addEventListener('DOMContentLoaded', () => {
  if (window.app) {
    window.settingsPage = new SettingsPage(window.app);
  }
});