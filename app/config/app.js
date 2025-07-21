// 喵卡应用配置 - 环境变量、主题设置、数据库配置等
/**
 * 应用配置管理
 * 统一管理应用的各种配置参数
 */
class AppConfig {
  constructor() {
    // 应用基本信息
    this.app = {
      name: '喵卡 Milka',
      version: '0.1.1',
      description: '漂亮的记忆闪卡应用，支持自定义界面及内容',
      author: 'CATxPAPA@gmail.com',
      homepage: 'https://catxpapa.com',
      repository: 'https://github.com/catxpapa/milka'
    };

    // 环境配置
    this.environment = {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT) || 3000,
      isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
      isProduction: (process.env.NODE_ENV || 'development') === 'production'
    };

    // 数据库配置 - MiniDB
    this.database = {
      type: 'minidb',
      collections: {
        themes: 'themes',
        cardFaces: 'cardFaces',
        associations: 'associations'
      },
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000
      }
    };

    // 文件上传配置 - 遵循懒猫微服文件存储规范
    this.upload = {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
      allowedTypes: (process.env.ALLOWED_TYPES || 'json,txt,csv').split(','),
      uploadPath: process.env.UPLOAD_PATH || '/app/uploads',
      tempPath: process.env.TEMP_PATH || '/app/temp'
    };

    // 主题样式配置
    this.themes = {
      default: 'minimalist-white',
      available: [
        {
          id: 'minimalist-white',
          name: '极简白',
          description: '清新简洁的白色主题，适合日常学习',
          colors: {
            primary: '#667eea',
            secondary: '#764ba2',
            background: '#f5f7fa',
            surface: '#ffffff',
            text: '#2c3e50'
          }
        },
        {
          id: 'night-black',
          name: '暗夜黑',
          description: '深色护眼主题，适合夜间学习',
          colors: {
            primary: '#e74c3c',
            secondary: '#c0392b',
            background: '#2c3e50',
            surface: '#34495e',
            text: '#ecf0f1'
          }
        }
      ]
    };

    // 学习模式配置
    this.studyModes = {
      list: {
        name: '列表模式',
        description: '以列表形式展示所有卡片，支持快速浏览',
        features: ['快速翻转', '批量操作', '搜索过滤']
      },
      slideshow: {
        name: '幻灯片模式',
        description: '全屏展示卡片，专注学习体验',
        features: ['全屏显示', '键盘控制', '自动播放'],
        controls: {
          flip: 'Space',
          next: 'ArrowRight',
          previous: 'ArrowLeft',
          exit: 'Escape'
        }
      }
    };

    // 数据导入导出配置
    this.dataExchange = {
      formats: {
        json: {
          extension: '.json',
          mimeType: 'application/json',
          description: 'JSON 格式数据包'
        },
        csv: {
          extension: '.csv',
          mimeType: 'text/csv',
          description: 'CSV 表格文件'
        }
      },
      export: {
        includeMetadata: true,
        compression: false,
        encoding: 'utf-8'
      },
      import: {
        validateFormat: true,
        continueOnError: false,
        maxBatchSize: 1000
      }
    };

    // 性能配置
    this.performance = {
      pagination: {
        defaultPageSize: 20,
        maxPageSize: 100
      },
      cache: {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5分钟
        maxSize: 100
      },
      debounce: {
        search: 300,
        save: 1000
      }
    };

    // 用户界面配置
    this.ui = {
      animations: {
        enabled: true,
        duration: 300,
        easing: 'ease-in-out'
      },
      notifications: {
        duration: 3000,
        position: 'top-right',
        maxVisible: 5
      },
      shortcuts: {
        enabled: true,
        keys: {
          newTheme: 'Ctrl+N',
          newCard: 'Ctrl+Shift+N',
          search: 'Ctrl+F',
          save: 'Ctrl+S',
          export: 'Ctrl+E',
          import: 'Ctrl+I'
        }
      }
    };

    // 安全配置
    this.security = {
      cors: {
        enabled: true,
        origins: this.environment.isDevelopment 
          ? ['http://localhost:3000', 'http://127.0.0.1:3000']
          : [],
        credentials: false
      },
      rateLimit: {
        enabled: this.environment.isProduction,
        windowMs: 15 * 60 * 1000, // 15分钟
        maxRequests: 100
      },
      validation: {
        sanitizeInput: true,
        maxTextLength: 1000,
        maxTitleLength: 100,
        maxDescriptionLength: 500
      }
    };

    // 日志配置
    this.logging = {
      level: this.environment.isDevelopment ? 'debug' : 'info',
      format: 'json',
      destinations: {
        console: true,
        file: this.environment.isProduction,
        remote: false
      },
      retention: {
        days: 30,
        maxSize: '100MB'
      }
    };

    // 功能开关
    this.features = {
      multipleThemes: true,
      cardNotes: true,
      cardImages: false, // 预留功能
      audioSupport: false, // 预留功能
      collaboration: false, // 预留功能
      analytics: false, // 预留功能
      offlineMode: true,
      exportImport: true,
      searchFilter: true,
      dragDrop: true
    };

    // API 配置
    this.api = {
      baseUrl: this.environment.isDevelopment 
        ? 'http://localhost:3000/api'
        : '/api',
      timeout: 10000,
      retries: 3,
      endpoints: {
        health: '/health',
        export: '/export',
        import: '/import',
        stats: '/stats'
      }
    };

    // 本地存储配置
    this.storage = {
      prefix: 'milka_',
      keys: {
        theme: 'theme_preference',
        studyRecords: 'study_records',
        reviewRecords: 'review_records',
        userSettings: 'user_settings',
        lastBackup: 'last_backup'
      },
      encryption: false,
      compression: false
    };

    console.log('⚙️ 应用配置初始化完成');
  }

  /**
   * 获取配置值
   * @param {string} path - 配置路径，如 'database.retryConfig.maxRetries'
   * @param {*} defaultValue - 默认值
   * @returns {*} 配置值
   */
  get(path, defaultValue = null) {
    try {
      const keys = path.split('.');
      let value = this;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return defaultValue;
        }
      }
      
      return value;
    } catch (error) {
      console.warn(`获取配置失败: ${path}`, error);
      return defaultValue;
    }
  }

  /**
   * 设置配置值
   * @param {string} path - 配置路径
   * @param {*} value - 配置值
   */
  set(path, value) {
    try {
      const keys = path.split('.');
      const lastKey = keys.pop();
      let target = this;
      
      for (const key of keys) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        target = target[key];
      }
      
      target[lastKey] = value;
      console.log(`配置更新: ${path} = ${JSON.stringify(value)}`);
    } catch (error) {
      console.error(`设置配置失败: ${path}`, error);
    }
  }

  /**
   * 获取环境变量
   * @param {string} key - 环境变量名
   * @param {*} defaultValue - 默认值
   * @returns {*} 环境变量值
   */
  getEnv(key, defaultValue = null) {
    return process.env[key] || defaultValue;
  }

  /**
   * 检查功能是否启用
   * @param {string} feature - 功能名称
   * @returns {boolean} 是否启用
   */
  isFeatureEnabled(feature) {
    return this.get(`features.${feature}`, false);
  }

  /**
   * 获取主题配置
   * @param {string} themeId - 主题ID
   * @returns {Object|null} 主题配置
   */
  getThemeConfig(themeId) {
    return this.themes.available.find(theme => theme.id === themeId) || null;
  }

  /**
   * 获取存储键名
   * @param {string} key - 键名
   * @returns {string} 完整的存储键名
   */
  getStorageKey(key) {
    return `${this.storage.prefix}${this.storage.keys[key] || key}`;
  }

  /**
   * 验证配置完整性
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = [];
    const warnings = [];

    // 检查必需配置
    if (!this.app.name) {
      errors.push('应用名称未配置');
    }

    if (!this.database.type) {
      errors.push('数据库类型未配置');
    }

    // 检查端口配置
    if (this.environment.port < 1 || this.environment.port > 65535) {
      errors.push('端口号配置无效');
    }

    // 检查文件大小限制
    if (this.upload.maxFileSize > 100 * 1024 * 1024) {
      warnings.push('文件上传大小限制过大，可能影响性能');
    }

    // 检查主题配置
    if (this.themes.available.length === 0) {
      errors.push('没有可用的主题配置');
    }

    const result = {
      valid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date().toISOString()
    };

    if (errors.length > 0) {
      console.error('❌ 配置验证失败:', errors);
    } else if (warnings.length > 0) {
      console.warn('⚠️ 配置验证警告:', warnings);
    } else {
      console.log('✅ 配置验证通过');
    }

    return result;
  }

  /**
   * 导出配置（用于调试）
   * @param {boolean} includeSecrets - 是否包含敏感信息
   * @returns {Object} 配置对象
   */
  export(includeSecrets = false) {
    const config = { ...this };
    
    if (!includeSecrets) {
      // 移除敏感信息
      delete config.security;
      delete config.logging;
    }
    
    return {
      ...config,
      exportTime: new Date().toISOString(),
      environment: this.environment.nodeEnv
    };
  }

  /**
   * 重置为默认配置
   */
  reset() {
    console.log('🔄 重置应用配置...');
    // 重新初始化配置
    Object.assign(this, new AppConfig());
  }

  /**
   * 获取运行时信息
   * @returns {Object} 运行时信息
   */
  getRuntimeInfo() {
    return {
      app: this.app,
      environment: this.environment,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    };
  }
}

// 创建全局配置实例
const appConfig = new AppConfig();

// 验证配置
appConfig.validate();

// 导出配置实例和类
export default appConfig;
export { AppConfig };

// 导出常用配置的快捷访问
export const {
  app: APP_INFO,
  environment: ENV,
  database: DB_CONFIG,
  themes: THEME_CONFIG,
  upload: UPLOAD_CONFIG,
  api: API_CONFIG
} = appConfig;
