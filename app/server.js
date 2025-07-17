const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件托管 - 前端文件
app.use(express.static(path.join(__dirname, 'public')));

// 数据库连接配置
const dbConfig = {
  host: 'mysql.cloud.lazycat.app.milka.lzcapp',
  port: 3306,
  user: 'LAZYCAT',
  password: 'LAZYCAT',
  database: 'LAZYCAT',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// 数据库连接池
let pool;

// 等待数据库完全启动的函数
async function waitForDatabase(maxRetries = 30, retryInterval = 2000) {
  console.log('等待MySQL数据库服务启动...');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // 尝试创建连接池
      const testPool = mysql.createPool(dbConfig);
      
      // 执行简单查询测试数据库是否完全可用
      await testPool.execute('SELECT 1 as test');
      await testPool.execute('SHOW TABLES'); // 确保可以执行DDL操作
      
      console.log(`数据库连接成功！(尝试 ${i + 1}/${maxRetries})`);
      await testPool.end();
      return true;
      
    } catch (error) {
      console.log(`数据库连接失败，${retryInterval/1000}秒后重试... (${i + 1}/${maxRetries})`);
      console.log(`错误信息: ${error.message}`);
      
      if (i === maxRetries - 1) {
        throw new Error(`数据库连接超时，已重试 ${maxRetries} 次`);
      }
      
      // 等待指定时间后重试
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
}

// 初始化数据库
async function initDatabase() {
  try {
    // 等待数据库完全启动
    await waitForDatabase();
    
    // 创建连接池
    pool = mysql.createPool(dbConfig);
    console.log('数据库连接池创建成功');
    
    // 创建数据表
    await createTables();
    console.log('数据表初始化完成');
    
    // 插入预置数据
    await insertSampleData();
    console.log('预置数据插入完成');
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1); // 如果数据库初始化失败，退出应用
  }
}

// 创建数据表（增加错误重试）
async function createTables() {
  const tables = [
    {
      name: 'CardFace',
      sql: ` CREATE TABLE IF NOT EXISTS CardFace ( id INT AUTO_INCREMENT PRIMARY KEY, main_text TEXT NOT NULL, notes TEXT, image_url VARCHAR(255), keywords JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci `
    },
    {
      name: 'Theme',
      sql: ` CREATE TABLE IF NOT EXISTS Theme ( id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, cover_image_url VARCHAR(255), style_config JSON, is_official BOOLEAN DEFAULT FALSE, sort_order INT DEFAULT 0, is_pinned BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci `
    },
    {
      name: 'ThemeCardAssociation',
      sql: ` CREATE TABLE IF NOT EXISTS ThemeCardAssociation ( id INT AUTO_INCREMENT PRIMARY KEY, theme_id INT NOT NULL, front_face_id INT NOT NULL, back_face_id INT NOT NULL, sort_order INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (theme_id) REFERENCES Theme(id) ON DELETE CASCADE, FOREIGN KEY (front_face_id) REFERENCES CardFace(id) ON DELETE CASCADE, FOREIGN KEY (back_face_id) REFERENCES CardFace(id) ON DELETE CASCADE ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci `
    }
  ];

  for (const table of tables) {
    try {
      console.log(`创建数据表: ${table.name}`);
      await pool.execute(table.sql);
      console.log(`✓ ${table.name} 表创建成功`);
    } catch (error) {
      console.error(`✗ ${table.name} 表创建失败:`, error.message);
      throw error;
    }
  }
}

// 插入预置数据
async function insertSampleData() {
  try {
    // 检查是否已有数据
    const [existingThemes] = await pool.execute('SELECT COUNT(*) as count FROM Theme');
    if (existingThemes[0].count > 0) {
      console.log('数据库已有数据，跳过预置数据插入');
      return;
    }

    console.log('插入预置数据...');
    
    // 插入示例卡面
    const cardFaces = [
      { main_text: 'Apple', notes: '苹果 - 一种常见的水果', keywords: '["en", "fruit", "apple"]' },
      { main_text: '苹果', notes: 'Apple的中文翻译', keywords: '["zh", "水果", "苹果"]' },
      { main_text: 'Hello', notes: '你好 - 常用问候语', keywords: '["en", "greeting"]' },
      { main_text: '你好', notes: 'Hello的中文翻译', keywords: '["zh", "问候"]' }
    ];

    const cardFaceIds = [];
    for (const face of cardFaces) {
      const [result] = await pool.execute(
        'INSERT INTO CardFace (main_text, notes, keywords) VALUES (?, ?, ?)',
        [face.main_text, face.notes, face.keywords]
      );
      cardFaceIds.push(result.insertId);
    }

    // 插入示例主题
    const [themeResult] = await pool.execute(
      'INSERT INTO Theme (title, description, is_official) VALUES (?, ?, ?)',
      ['基础英语单词', '包含一些基础的英语单词学习卡片', true]
    );
    const themeId = themeResult.insertId;

    // 插入主题-卡片关联
    await pool.execute(
      'INSERT INTO ThemeCardAssociation (theme_id, front_face_id, back_face_id, sort_order) VALUES (?, ?, ?, ?)',
      [themeId, cardFaceIds[0], cardFaceIds[1], 1]
    );
    await pool.execute(
      'INSERT INTO ThemeCardAssociation (theme_id, front_face_id, back_face_id, sort_order) VALUES (?, ?, ?, ?)',
      [themeId, cardFaceIds[2], cardFaceIds[3], 2]
    );

    console.log('✓ 预置数据插入完成');
  } catch (error) {
    console.error('预置数据插入失败:', error);
    // 预置数据失败不应该导致应用退出
  }
}

// API路由

// 获取所有主题
app.get('/api/themes', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM Theme 
      ORDER BY is_pinned DESC, sort_order ASC, created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('获取主题失败:', error);
    res.status(500).json({ error: '获取主题失败' });
  }
});

// 获取主题详情及其卡片
app.get('/api/themes/:id', async (req, res) => {
  try {
    const themeId = req.params.id;
    
    // 获取主题信息
    const [themeRows] = await pool.execute(
      'SELECT * FROM Theme WHERE id = ?', 
      [themeId]
    );
    
    if (themeRows.length === 0) {
      return res.status(404).json({ error: '主题不存在' });
    }
    
    // 获取主题的卡片
    const [cardRows] = await pool.execute(`
      SELECT 
        tca.id as association_id,
        tca.sort_order,
        cf1.id as front_id, cf1.main_text as front_text, cf1.notes as front_notes,
        cf2.id as back_id, cf2.main_text as back_text, cf2.notes as back_notes
      FROM ThemeCardAssociation tca
      JOIN CardFace cf1 ON tca.front_face_id = cf1.id
      JOIN CardFace cf2 ON tca.back_face_id = cf2.id
      WHERE tca.theme_id = ?
      ORDER BY tca.sort_order ASC
    `, [themeId]);
    
    const theme = themeRows[0];
    theme.cards = cardRows;
    
    res.json(theme);
  } catch (error) {
    console.error('获取主题详情失败:', error);
    res.status(500).json({ error: '获取主题详情失败' });
  }
});

// 创建新主题
app.post('/api/themes', async (req, res) => {
  try {
    const { title, description, style_config } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO Theme (title, description, style_config) VALUES (?, ?, ?)',
      [title, description, JSON.stringify(style_config || {})]
    );
    
    res.json({ id: result.insertId, message: '主题创建成功' });
  } catch (error) {
    console.error('创建主题失败:', error);
    res.status(500).json({ error: '创建主题失败' });
  }
});

// 所有其他路由返回前端应用
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public'));
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`喵卡 Milka 服务器运行在端口 ${PORT}`);
  await initDatabase();
});