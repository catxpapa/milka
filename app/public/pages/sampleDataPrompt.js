// 示例数据创建提示页面

export class SampleDataPrompt {
  constructor(app) {
    this.app = app;
  }

  render() {
    return `
      <div class="sample-data-prompt">
        <div class="prompt-container">
          <div class="prompt-header">
            <h2>🐱 欢迎使用喵卡 Milka</h2>
            <p class="prompt-subtitle">您的数据库目前为空</p>
          </div>
          
          <div class="prompt-content">
            <div class="prompt-options">
              <div class="option-card" onclick="app.createSampleDataAndStart()">
                <h3>🌱创建示例数据</h3>
                <p>包含英语单词、数学公式、历史朝代等示例主题，帮助您快速了解应用功能</p>
                <button class="btn btn-primary">创建示例数据</button>
              </div>
              
              <div class="option-card" onclick="app.startWithEmptyData()">
                <h3>📝从空白开始</h3>
                <p>直接开始使用，您可以创建自己的主题和卡片</p>
                <button class="btn btn-primary">从空白开始</button>
              </div>
            </div>
            
            <div class="prompt-note">
              <p>💡 您随时可以在设置页面中管理数据，包括清空、重新初始化或导入导出</p>
            </div>
          </div>
        </div>
      </div>

      <style>
        .sample-data-prompt {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .prompt-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          width: 100%;
          overflow: hidden;
        }

        .prompt-header {
          padding: 2rem;
          text-align: center;
        }

        .prompt-header h2 {
          font-size: 2rem;
          font-weight: 300;
          color: #333;
          margin: 0 0 0.5rem 0;
        }

        .prompt-subtitle {
          font-size: 1rem;
          color: #666;
          margin: 0;
          font-weight: 300;
        }

        .prompt-content {
          padding: 2rem;
        }

        .prompt-options {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .option-card {
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .option-card:hover {
          border-color: #858585ff;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
        }

        .option-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          display: block;
        }

        .option-card h3 {
          font-size: 1.25rem;
          font-weight: 400;
          color: #333;
          margin: 0 0 0.75rem 0;
        }

        .option-card p {
          color: #666;
          font-size: 0.875rem;
          line-height: 1.5;
          margin: 0 0 1.5rem 0;
          font-weight: 300;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 400;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 140px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2b2c2eff 0%, #3b3b3fff 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #f8f9fa;
          color: #333;
          border: 1px solid #dee2e6;
        }

        .btn-secondary:hover {
          background: #e9ecef;
          transform: translateY(-1px);
        }

        .prompt-note {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        }

        .prompt-note p {
          color: #666;
          font-size: 0.8rem;
          margin: 0;
          font-weight: 300;
        }

        @media (max-width: 768px) {
          .sample-data-prompt {
            padding: 1rem;
          }
          
          .prompt-container {
            margin: 0;
          }
          
          .prompt-header {
            padding: 1.5rem;
          }
          
          .prompt-content {
            padding: 1.5rem;
          }
          
          .option-card {
            padding: 1rem;
          }
        }
      </style>
    `;
  }
}