// 喵卡应用后端服务入口 - 基于Express.js和懒猫微服架构
// 喵卡应用后端服务入口 - 基于Express.js和懒猫微服架构
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 懒猫微服标准路径
app.use(express.static(path.join(__dirname, 'public')));

// 文件上传配置 - 遵循懒猫微服文件存储规范
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 限制
  },
  fileFilter: (req, file, cb) => {
    // 支持 JSON 数据包导入
    const allowedTypes = ['application/json', 'text/plain'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// API 路由定义

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'milka-backend',
    version: '0.1.1',
    timestamp: new Date().toISOString(),
    minidb: 'connected'
  });
});

// 数据导出接口 - 支持主题数据包下载
app.get('/api/export/:themeId', async (req, res) => {
  try {
    const { themeId } = req.params;
    
    // 设置下载响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="theme-${themeId}-${Date.now()}.json"`);
    
    // 返回导出指令，实际导出由前端 MiniDB 处理
    res.json({
      success: true,
      action: 'export',
      themeId: themeId,
      timestamp: new Date().toISOString(),
      message: '数据导出请求已接收，由前端 MiniDB 处理'
    });
  } catch (error) {
    console.error('导出失败:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 数据导入接口 - 支持 JSON 数据包上传
app.post('/api/import', upload.single('dataFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未找到上传文件' });
    }

    const fs = require('fs').promises;
    const filePath = req.file.path;
    
    // 读取上传的 JSON 文件
    const fileContent = await fs.readFile(filePath, 'utf8');
    const importData = JSON.parse(fileContent);
    
    // 验证数据格式
    if (!importData.theme || !importData.cards) {
      return res.status(400).json({ error: '数据格式不正确' });
    }

    // 清理临时文件
    await fs.unlink(filePath);

    res.json({
      success: true,
      action: 'import',
      data: importData,
      timestamp: new Date().toISOString(),
      message: '数据导入成功，请在前端处理 MiniDB 存储'
    });
  } catch (error) {
    console.error('导入失败:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 统计信息接口
app.get('/api/stats', (req, res) => {
  res.json({
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    },
    application: {
      name: 'Milka',
      version: '0.1.1',
      environment: process.env.NODE_ENV || 'development'
    },
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    error: '内部服务器错误',
    timestamp: new Date().toISOString()
  });
});

// 404 处理 - 返回前端应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🐱 喵卡服务启动成功！`);
  console.log(`📡 服务端口: ${PORT}`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  数据库: MiniDB (懒猫微服官方)`);
  console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
});

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('🛑 收到 SIGTERM 信号，正在优雅关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 收到 SIGINT 信号，正在优雅关闭服务...');
  process.exit(0);
});