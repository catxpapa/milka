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
  database: 'LAZYCAT'
};

// 数据库连接池
let pool;

// 初始化数据库
async function initDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log('数据库连接成功');
    
    // 创建数据表
    await createTables();
    console.log('数据表初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

// 创建数据表
async function createTables() {
  const createCardFaceTable = `
    CREATE TABLE IF NOT EXISTS CardFace (
      id INT AUTO_INCREMENT PRIMARY KEY,
      main_text TEXT NOT NULL,
      notes TEXT,
      image_url VARCHAR(255),
      keywords JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  const createThemeTable = `
    CREATE TABLE IF NOT EXISTS Theme (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      cover_image_url VARCHAR(255),
      style_config JSON,
      is_official BOOLEAN DEFAULT FALSE,
      sort_order INT DEFAULT 0,
      is_pinned BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  const createAssociationTable = `
    CREATE TABLE IF NOT EXISTS ThemeCardAssociation (
      id INT AUTO_INCREMENT PRIMARY KEY,
      theme_id INT NOT NULL,
      front_face_id INT NOT NULL,
      back_face_id INT NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (theme_id) REFERENCES Theme(id) ON DELETE CASCADE,
      FOREIGN KEY (front_face_id) REFERENCES CardFace(id) ON DELETE CASCADE,
      FOREIGN KEY (back_face_id) REFERENCES CardFace(id) ON DELETE CASCADE
    )
  `;

  await pool.execute(createCardFaceTable);
  await pool.execute(createThemeTable);
  await pool.execute(createAssociationTable);
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
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`喵卡 Milka 服务器运行在端口 ${PORT}`);
  await initDatabase();
});