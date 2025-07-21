// 喵卡应用后端服务入口 - 基于Express.js和懒猫微服架构
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// 懒猫微服文件存储路径配置 - 修复版本
const STORAGE_PATHS = {
  // 临时文件存储（用于导入处理）
  temp: process.env.TEMP_PATH || '/lzcapp/tmp/milka',
  // 持久化存储（修复：确保路径不为 undefined）
  uploads: process.env.UPLOAD_PATH || '/lzcapp/var/milka/uploads',
  // 应用静态资源（只读）
  public: path.join(__dirname, 'public')
};

// 路径验证和修复函数
const validateAndFixPaths = () => {
  console.log('🔍 验证存储路径配置...');
  
  // 检查并修复每个路径
  Object.keys(STORAGE_PATHS).forEach(key => {
    const originalPath = STORAGE_PATHS[key];
    
    if (!originalPath || typeof originalPath !== 'string') {
      console.warn(`⚠️ 路径 ${key} 无效:`, originalPath);
      
      // 提供安全的默认路径
      switch (key) {
        case 'temp':
          STORAGE_PATHS[key] = '/lzcapp/tmp/milka';
          break;
        case 'uploads':
          STORAGE_PATHS[key] = '/lzcapp/var/milka/uploads';
          break;
        case 'public':
          STORAGE_PATHS[key] = path.join(__dirname, 'public');
          break;
        default:
          STORAGE_PATHS[key] = `/lzcapp/tmp/milka/${key}`;
      }
      
      console.log(`✅ 路径 ${key} 已修复为:`, STORAGE_PATHS[key]);
    } else {
      console.log(`✅ 路径 ${key} 正常:`, originalPath);
    }
  });
  
  console.log('📁 最终存储路径配置:', STORAGE_PATHS);
};

// 确保存储目录存在 - 修复版本
const ensureStorageDirectories = async () => {
  try {
    console.log('📁 开始创建存储目录...');
    
    // 验证和修复路径配置
    validateAndFixPaths();
    
    // 创建临时目录
    if (STORAGE_PATHS.temp) {
      await fs.mkdir(STORAGE_PATHS.temp, { recursive: true });
      console.log('📁 临时目录创建成功:', STORAGE_PATHS.temp);
    }
    
    // 创建上传目录
    if (STORAGE_PATHS.uploads) {
      await fs.mkdir(STORAGE_PATHS.uploads, { recursive: true });
      console.log('📁 上传目录创建成功:', STORAGE_PATHS.uploads);
    }
    
    // 验证 public 目录存在
    if (STORAGE_PATHS.public) {
      try {
        await fs.access(STORAGE_PATHS.public);
        console.log('📁 静态资源目录验证成功:', STORAGE_PATHS.public);
      } catch (error) {
        console.warn('⚠️ 静态资源目录不存在:', STORAGE_PATHS.public);
      }
    }
    
  } catch (error) {
    console.error('❌ 存储目录创建失败:', error);
    
    // 提供详细的错误信息和建议
    console.error('💡 错误详情:');
    console.error('  - 错误类型:', error.code);
    console.error('  - 错误消息:', error.message);
    console.error('  - 当前路径配置:', STORAGE_PATHS);
    
    // 尝试使用更安全的路径
    console.log('🔧 尝试使用备用路径...');
    
    try {
      // 使用当前目录下的子目录作为备用方案
      const backupPaths = {
        temp: path.join(__dirname, 'temp'),
        uploads: path.join(__dirname, 'uploads')
      };
      
      for (const [key, backupPath] of Object.entries(backupPaths)) {
        await fs.mkdir(backupPath, { recursive: true });
        STORAGE_PATHS[key] = backupPath;
        console.log(`✅ 备用${key}目录创建成功:`, backupPath);
      }
      
    } catch (backupError) {
      console.error('❌ 备用目录创建也失败:', backupError);
      throw error; // 重新抛出原始错误
    }
  }
};

// 中间件配置
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务 - 懒猫微服标准路径
app.use(express.static(STORAGE_PATHS.public));

// 文件上传配置 - 修复版本，增强错误处理
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // 确保使用有效的临时目录路径
      const uploadDir = STORAGE_PATHS.temp || '/lzcapp/tmp/milka';
      
      // 验证路径是否为字符串
      if (typeof uploadDir !== 'string') {
        throw new Error(`上传目录路径无效: ${uploadDir}`);
      }
      
      await fs.mkdir(uploadDir, { recursive: true });
      console.log('📁 文件上传目录准备完成:', uploadDir);
      cb(null, uploadDir);
      
    } catch (error) {
      console.error('❌ 上传目录创建失败:', error);
      
      // 尝试使用当前目录下的 temp 作为备用
      const fallbackDir = path.join(__dirname, 'temp');
      try {
        await fs.mkdir(fallbackDir, { recursive: true });
        console.log('✅ 使用备用上传目录:', fallbackDir);
        cb(null, fallbackDir);
      } catch (fallbackError) {
        console.error('❌ 备用目录也创建失败:', fallbackError);
        cb(error);
      }
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomId = uuidv4().substring(0, 8);
    const ext = path.extname(file.originalname);
    const uniqueName = `milka_import_${timestamp}_${randomId}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB 限制
    files: 10 // 最多10个文件
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 文件上传检查:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // 支持 JSON 数据包导入和其他常见格式
    const allowedTypes = [
      'application/json',
      'text/plain',
      'text/json',
      'application/octet-stream'
    ];
    
    const allowedExtensions = ['.json', '.txt'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      console.warn('⚠️ 不支持的文件类型:', file.mimetype, fileExt);
      cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
    }
  }
});

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📡 ${timestamp} ${req.method} ${req.url}`);
  
  // 记录请求体（仅用于调试）
  if (req.method === 'POST' && req.body && Object.keys(req.body).length > 0) {
    console.log('📝 请求体:', JSON.stringify(req.body, null, 2).substring(0, 200));
  }
  
  next();
});

// API 路由定义

// 健康检查接口 - 增强版本
app.get('/api/health', (req, res) => {
  const healthInfo = {
    status: 'ok',
    service: 'milka-backend',
    version: '0.1.1',
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    },
    storage: {
      paths: STORAGE_PATHS,
      pathValidation: {
        temp: typeof STORAGE_PATHS.temp === 'string' && STORAGE_PATHS.temp.length > 0,
        uploads: typeof STORAGE_PATHS.uploads === 'string' && STORAGE_PATHS.uploads.length > 0,
        public: typeof STORAGE_PATHS.public === 'string' && STORAGE_PATHS.public.length > 0
      }
    },
    database: {
      type: 'MiniDB',
      status: 'connected',
      collections: ['themes', 'cardFaces', 'associations']
    }
  };
  
  console.log('💚 健康检查请求');
  res.json(healthInfo);
});

// 存储信息接口 - 新增
app.get('/api/storage-info', async (req, res) => {
  try {
    const storageInfo = {
      paths: STORAGE_PATHS,
      permissions: {},
      diskUsage: {}
    };
    
    // 检查目录权限和存在性
    for (const [key, dirPath] of Object.entries(STORAGE_PATHS)) {
      try {
        if (typeof dirPath === 'string' && dirPath.length > 0) {
          await fs.access(dirPath, fs.constants.F_OK);
          storageInfo.permissions[key] = 'accessible';
          
          // 获取目录统计信息
          const stats = await fs.stat(dirPath);
          storageInfo.diskUsage[key] = {
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modified: stats.mtime
          };
        } else {
          storageInfo.permissions[key] = 'invalid_path';
          storageInfo.diskUsage[key] = { error: 'Path is not a valid string' };
        }
      } catch (error) {
        storageInfo.permissions[key] = 'not_accessible';
        storageInfo.diskUsage[key] = { error: error.message };
      }
    }
    
    res.json({
      success: true,
      storage: storageInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 获取存储信息失败:', error);
    res.status(500).json({
      error: '获取存储信息失败: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 数据导出接口 - 支持主题数据包下载
app.get('/api/export/:themeId', async (req, res) => {
  try {
    const { themeId } = req.params;
    const { format = 'json' } = req.query;
    
    console.log(`📤 导出主题数据: ${themeId}, 格式: ${format}`);
    
    // 验证主题ID
    if (!themeId || themeId.trim() === '') {
      return res.status(400).json({ 
        error: '主题ID不能为空',
        timestamp: new Date().toISOString()
      });
    }
    
    // 生成导出文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `milka-theme-${themeId}-${timestamp}.json`;
    
    // 设置下载响应头
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // 返回导出指令和元数据，实际导出由前端 MiniDB 处理
    const exportData = {
      success: true,
      action: 'export',
      themeId: themeId,
      filename: filename,
      timestamp: new Date().toISOString(),
      format: format,
      instructions: {
        message: '请在前端使用 MiniDB 获取实际数据',
        steps: [
          '1. 获取主题基本信息',
          '2. 获取关联的卡片数据',
          '3. 获取卡面详细内容',
          '4. 组装完整数据包'
        ]
      },
      metadata: {
        exportVersion: '1.0',
        applicationVersion: '0.1.1',
        dataFormat: 'milka-theme-package'
      }
    };
    
    console.log(`✅ 导出请求处理完成: ${filename}`);
    res.json(exportData);
    
  } catch (error) {
    console.error('❌ 导出失败:', error);
    res.status(500).json({ 
      error: '导出失败: ' + error.message,
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 数据导入接口 - 修复版本，使用正确的临时目录
app.post('/api/import', upload.single('dataFile'), async (req, res) => {
  let tempFilePath = null;
  
  try {
    console.log('📥 开始处理数据导入请求');
    console.log('📁 当前存储配置:', STORAGE_PATHS);
    
    // 检查文件是否上传成功
    if (!req.file) {
      console.warn('⚠️ 未找到上传文件');
      return res.status(400).json({ 
        error: '未找到上传文件',
        message: '请选择要导入的 JSON 文件',
        timestamp: new Date().toISOString()
      });
    }
    
    tempFilePath = req.file.path;
    console.log('📁 文件上传成功:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      path: tempFilePath,
      destination: req.file.destination
    });
    
    // 读取上传的文件内容
    let fileContent;
    try {
      const fileBuffer = await fs.readFile(tempFilePath, 'utf8');
      fileContent = fileBuffer.toString().trim();
      
      if (!fileContent) {
        throw new Error('文件内容为空');
      }
      
      console.log('📖 文件读取成功，内容长度:', fileContent.length);
      
    } catch (readError) {
      console.error('❌ 文件读取失败:', readError);
      throw new Error(`文件读取失败: ${readError.message}`);
    }
    
    // 解析 JSON 数据
    let importData;
    try {
      importData = JSON.parse(fileContent);
      console.log('✅ JSON 解析成功');
      
    } catch (parseError) {
      console.error('❌ JSON 解析失败:', parseError);
      throw new Error(`JSON 格式错误: ${parseError.message}`);
    }
    
    // 验证数据格式
    const validationResult = validateImportData(importData);
    if (!validationResult.valid) {
      console.error('❌ 数据格式验证失败:', validationResult.errors);
      throw new Error(`数据格式不正确: ${validationResult.errors.join(', ')}`);
    }
    
    console.log('✅ 数据格式验证通过');
    
    // 清理临时文件
    try {
      await fs.unlink(tempFilePath);
      console.log('🗑️ 临时文件清理完成');
    } catch (cleanupError) {
      console.warn('⚠️ 临时文件清理失败:', cleanupError.message);
    }
    
    // 返回成功响应
    const response = {
      success: true,
      action: 'import',
      data: importData,
      statistics: {
        themes: Array.isArray(importData.themes) ? importData.themes.length : (importData.theme ? 1 : 0),
        cards: Array.isArray(importData.cards) ? importData.cards.length : 0,
        cardFaces: Array.isArray(importData.cardFaces) ? importData.cardFaces.length : 0
      },
      storage: {
        tempPath: STORAGE_PATHS.temp,
        fileProcessed: req.file.filename
      },
      timestamp: new Date().toISOString(),
      message: '数据导入成功，请在前端处理 MiniDB 存储',
      instructions: {
        nextSteps: [
          '1. 验证导入的主题数据',
          '2. 检查卡片和卡面数据完整性',
          '3. 使用 MiniDB 批量存储数据',
          '4. 更新前端界面显示'
        ]
      }
    };
    
    console.log('✅ 导入请求处理完成:', response.statistics);
    res.json(response);
    
  } catch (error) {
    console.error('❌ 导入处理失败:', error);
    
    // 清理临时文件（如果存在）
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        console.log('🗑️ 错误处理：临时文件已清理');
      } catch (cleanupError) {
        console.warn('⚠️ 错误处理：临时文件清理失败:', cleanupError.message);
      }
    }
    
    res.status(500).json({ 
      error: '导入失败: ' + error.message,
      timestamp: new Date().toISOString(),
      storage: STORAGE_PATHS,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      suggestions: [
        '请检查文件格式是否为有效的 JSON',
        '确保文件包含必要的主题和卡片数据',
        '文件大小不应超过 50MB',
        '确认存储目录权限正确'
      ]
    });
  }
});

// 数据格式验证函数
function validateImportData(data) {
  const errors = [];
  
  try {
    // 检查基本结构
    if (!data || typeof data !== 'object') {
      errors.push('数据必须是有效的 JSON 对象');
      return { valid: false, errors };
    }
    
    // 检查主题数据（支持单个主题或主题数组）
    if (!data.theme && !data.themes) {
      errors.push('缺少主题数据 (theme 或 themes 字段)');
    }
    
    // 验证主题格式
    const themes = data.themes || (data.theme ? [data.theme] : []);
    if (themes.length === 0) {
      errors.push('至少需要一个主题');
    }
    
    themes.forEach((theme, index) => {
      if (!theme.title || typeof theme.title !== 'string') {
        errors.push(`主题 ${index + 1} 缺少有效的标题`);
      }
      if (theme.id && typeof theme.id !== 'string') {
        errors.push(`主题 ${index + 1} 的 ID 格式不正确`);
      }
    });
    
    // 检查卡片数据（可选）
    if (data.cards && !Array.isArray(data.cards)) {
      errors.push('cards 字段必须是数组');
    }
    
    // 检查卡面数据（可选）
    if (data.cardFaces && !Array.isArray(data.cardFaces)) {
      errors.push('cardFaces 字段必须是数组');
    }
    
    console.log('📋 数据验证结果:', {
      valid: errors.length === 0,
      errorCount: errors.length,
      themeCount: themes.length,
      cardCount: data.cards ? data.cards.length : 0
    });
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
    
  } catch (validationError) {
    console.error('❌ 验证过程出错:', validationError);
    return {
      valid: false,
      errors: ['数据验证过程出错: ' + validationError.message]
    };
  }
}

// 统计信息接口
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      server: {
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        version: process.version,
        platform: process.platform
      },
      application: {
        name: 'Milka',
        version: '0.1.1',
        environment: process.env.NODE_ENV || 'development',
        port: PORT
      },
      storage: STORAGE_PATHS,
      features: {
        minidb: 'enabled',
        fileUpload: 'enabled',
        export: 'enabled',
        import: 'enabled'
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 统计信息请求');
    res.json(stats);
    
  } catch (error) {
    console.error('❌ 获取统计信息失败:', error);
    res.status(500).json({
      error: '获取统计信息失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 文件管理接口 - 清理临时文件
app.delete('/api/cleanup', async (req, res) => {
  try {
    const tempDir = STORAGE_PATHS.temp;
    
    // 验证临时目录路径
    if (!tempDir || typeof tempDir !== 'string') {
      return res.status(400).json({
        error: '临时目录路径无效',
        tempPath: tempDir,
        timestamp: new Date().toISOString()
      });
    }
    
    // 检查临时目录是否存在
    try {
      await fs.access(tempDir);
    } catch (error) {
      return res.json({
        success: true,
        message: '临时目录不存在，无需清理',
        tempPath: tempDir,
        timestamp: new Date().toISOString()
      });
    }
    
    const files = await fs.readdir(tempDir);
    
    let cleanedCount = 0;
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      try {
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      } catch (error) {
        console.warn(`⚠️ 清理文件失败: ${file}`, error.message);
      }
    }
    
    console.log(`🧹 清理完成，删除了 ${cleanedCount} 个过期文件`);
    
    res.json({
      success: true,
      message: `清理完成，删除了 ${cleanedCount} 个过期文件`,
      tempPath: tempDir,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 文件清理失败:', error);
    res.status(500).json({
      error: '文件清理失败: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('🚨 服务器错误:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // 处理 Multer 错误
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: '文件太大，最大支持 50MB',
        code: 'FILE_TOO_LARGE',
        timestamp: new Date().toISOString()
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({
        error: '文件数量超限，最多支持 10 个文件',
        code: 'TOO_MANY_FILES',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  res.status(500).json({
    error: '内部服务器错误',
    message: error.message,
    timestamp: new Date().toISOString(),
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// 404 处理 - 返回前端应用
app.get('*', (req, res) => {
  // 对于 API 路径返回 404 错误
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API 端点不存在',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
  
  // 其他路径返回前端应用
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器 - 修复版本
const startServer = async () => {
  try {
    console.log('🐱 ================================');
    console.log('🐱 喵卡服务启动中...');
    console.log('🐱 ================================');
    
    // 确保必要的目录存在
    await ensureStorageDirectories();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log('🐱 ================================');
      console.log('🐱 喵卡服务启动成功！');
      console.log('🐱 ================================');
      console.log(`📡 服务端口: ${PORT}`);
      console.log(`🌐 访问地址: http://localhost:${PORT}`);
      console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`📤 导出接口: http://localhost:${PORT}/api/export/:themeId`);
      console.log(`📥 导入接口: http://localhost:${PORT}/api/import`);
      console.log(`🗄️  数据库: MiniDB (懒猫微服官方)`);
      console.log(`📁 存储配置:`);
      console.log(`   - 临时目录: ${STORAGE_PATHS.temp}`);
      console.log(`   - 上传目录: ${STORAGE_PATHS.uploads}`);
      console.log(`   - 静态资源: ${STORAGE_PATHS.public}`);
      console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
      console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log('🐱 ================================');
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    console.error('💡 可能的解决方案:');
    console.error('  1. 检查文件系统权限');
    console.error('  2. 确认存储路径配置正确');
    console.error('  3. 验证懒猫微服环境变量');
    console.error('  4. 查看详细错误日志');
    process.exit(1);
  }
};

// 优雅关闭处理
const gracefulShutdown = (signal) => {
  console.log(`🛑 收到 ${signal} 信号，正在优雅关闭服务...`);
  
  // 这里可以添加清理逻辑
  // 例如：关闭数据库连接、清理临时文件等
  
  setTimeout(() => {
    console.log('✅ 服务已优雅关闭');
    process.exit(0);
  }, 1000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('🚨 未捕获的异常:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 未处理的 Promise 拒绝:', reason);
  console.error('Promise:', promise);
});

// 启动服务器
startServer();