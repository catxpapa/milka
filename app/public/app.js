// 全局状态管理
const AppState = {
    currentPage: 'themes',
    currentTheme: null,
    themes: [],
    viewMode: 'grid'
};

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🐱 喵卡 Milka 前端启动');
    initializeApp();
});

// 应用初始化
async function initializeApp() {
    try {
        bindFormEvents();
        await loadThemes();
        showThemesPage();
    } catch (error) {
        console.error('应用初始化失败:', error);
        showMessage('应用初始化失败，请刷新页面重试', 'error');
    }
}

// 绑定表单事件
function bindFormEvents() {
    const createForm = document.getElementById('create-theme-form');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateTheme);
    }
}

// 页面切换函数
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        AppState.currentPage = pageId.replace('-page', '');
    }
}

// 显示主题列表页面
function showThemesPage() {
    showPage('themes-page');
    loadThemes();
}

// 显示创建主题表单
function showCreateThemeForm() {
    showPage('create-theme-page');
    
    const form = document.getElementById('create-theme-form');
    if (form) {
        form.reset();
    }
    
    const titleInput = document.getElementById('theme-title');
    if (titleInput) {
        setTimeout(() => titleInput.focus(), 100);
    }
}

// 显示主题详情页面
function showThemeDetail(themeId) {
    showPage('theme-detail-page');
    loadThemeDetail(themeId);
}

// 加载主题列表
async function loadThemes() {
    const container = document.getElementById('themes-container');
    if (!container) return;
    
    try {
        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>正在加载主题...</p></div>';
        
        console.log('请求主题列表: /api/themes');
        const response = await fetch('/api/themes');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const themes = await response.json();
        AppState.themes = themes;
        
        console.log(`加载到 ${themes.length} 个主题`);
        
        if (themes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <h3>还没有主题</h3>
                    <p>点击"创建新主题"按钮开始您的学习之旅</p>
                </div>
            `;
            return;
        }
        
        const themesHtml = themes.map(theme => createThemeCardHtml(theme)).join('');
        container.innerHTML = `<div class="themes-grid">${themesHtml}</div>`;
        
    } catch (error) {
        console.error('加载主题失败:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <h3>加载失败</h3>
                <p>无法加载主题列表: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadThemes()">重试</button>
            </div>
        `;
        showMessage('加载主题失败: ' + error.message, 'error');
    }
}

// 创建主题卡片HTML
function createThemeCardHtml(theme) {
    const cardCount = theme.card_count || 0;
    const isPinned = theme.is_pinned ? 'pinned' : '';
    const description = theme.description || '暂无描述';
    
    return `
        <div class="theme-card ${isPinned}" onclick="showThemeDetail(${theme.id})">
            <h3>${escapeHtml(theme.title)}</h3>
            <p>${escapeHtml(description)}</p>
            <div class="theme-card-meta">
                <span>📚 ${cardCount} 张卡片</span>
                <span>📅 ${formatDate(theme.created_at)}</span>
            </div>
        </div>
    `;
}

// 处理创建主题表单提交
async function handleCreateTheme(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const title = formData.get('title').trim();
    const description = formData.get('description').trim();
    
    if (!title) {
        showMessage('请输入主题标题', 'error');
        return;
    }
    
    try {
        console.log('创建主题:', { title, description });
        
        const response = await fetch('/api/themes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('主题创建成功:', result);
        
        showMessage('主题创建成功！', 'success');
        showThemesPage();
        
    } catch (error) {
        console.error('创建主题失败:', error);
        showMessage('创建失败: ' + error.message, 'error');
    }
}

// 加载主题详情
async function loadThemeDetail(themeId) {
    try {
        document.getElementById('theme-detail-title').textContent = '加载中...';
        document.getElementById('theme-detail-description').textContent = '';
        
        const cardsContainer = document.getElementById('cards-container');
        cardsContainer.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>正在加载卡片...</p></div>';
        
        console.log(`请求主题详情: /api/themes/${themeId}`);
        const response = await fetch(`/api/themes/${themeId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const theme = await response.json();
        AppState.currentTheme = theme;
        
        console.log(`加载主题详情成功: ${theme.title}, ${theme.cards.length} 张卡片`);
        
        // 更新主题信息
        document.getElementById('theme-detail-title').textContent = theme.title;
        document.getElementById('theme-detail-description').textContent = theme.description || '暂无描述';
        document.getElementById('card-count').textContent = `${theme.cards.length} 张卡片`;
        document.getElementById('create-date').textContent = formatDate(theme.created_at);
        
        // 渲染卡片
        if (!theme.cards || theme.cards.length === 0) {
            document.getElementById('empty-cards').style.display = 'block';
            cardsContainer.innerHTML = '';
        } else {
            document.getElementById('empty-cards').style.display = 'none';
            const cardsHtml = theme.cards.map(card => createFlashcardHtml(card)).join('');
            cardsContainer.innerHTML = cardsHtml;
        }
        
    } catch (error) {
        console.error('加载主题详情失败:', error);
        document.getElementById('theme-detail-title').textContent = '加载失败';
        document.getElementById('theme-detail-description').textContent = error.message;
        showMessage('加载主题详情失败: ' + error.message, 'error');
    }
}

// 创建闪卡HTML
function createFlashcardHtml(card) {
    return `
        <div class="flashcard" onclick="flipCard(this)">
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <div class="flashcard-content">
                        <div class="flashcard-main">${escapeHtml(card.front_text)}</div>
                        ${card.front_notes ? `<div class="flashcard-notes">${escapeHtml(card.front_notes)}</div>` : ''}
                    </div>
                </div>
                <div class="flashcard-back">
                    <div class="flashcard-content">
                        <div class="flashcard-main">${escapeHtml(card.back_text)}</div>
                        ${card.back_notes ? `<div class="flashcard-notes">${escapeHtml(card.back_notes)}</div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 翻转卡片
function flipCard(cardElement) {
    cardElement.classList.toggle('flipped');
}

// 工具函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

function showMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    if (!container) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type} show`;
    messageEl.textContent = message;
    
    container.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => {
            container.removeChild(messageEl);
        }, 300);
    }, 3000);
}

// 预留函数
function editTheme() {
    showMessage('编辑功能开发中...', 'warning');
}

function toggleViewMode() {
    showMessage('幻灯片模式开发中...', 'warning');
}