// 全局状态管理
const AppState = {
    currentPage: 'themes',
    currentTheme: null,
    themes: [],
    viewMode: 'grid' // grid 或 slideshow
};

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('喵卡 Milka 应用启动');
    initializeApp();
});

// 应用初始化
async function initializeApp() {
    try {
        // 绑定表单事件
        bindFormEvents();
        
        // 加载主题列表
        await loadThemes();
        
        // 显示主题页面
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
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
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
    
    // 清空表单
    const form = document.getElementById('create-theme-form');
    if (form) {
        form.reset();
    }
    
    // 聚焦到标题输入框
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
        container.innerHTML = '<div class="loading">正在加载主题...</div>';
        
        const response = await fetch('/api/themes');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const themes = await response.json();
        AppState.themes = themes;
        
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
        
        // 渲染主题卡片
        const themesHtml = themes.map(theme => createThemeCardHtml(theme)).join('');
        container.innerHTML = `<div class="themes-grid">${themesHtml}</div>`;
        
    } catch (error) {
        console.error('加载主题失败:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <h3>加载失败</h3>
                <p>无法加载主题列表，请检查网络连接后刷新页面</p>
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
                <span>${cardCount} 张卡片</span>
                <span>${formatDate(theme.created_at)}</span>
            </div>
        </div>
    `;
}

// 加载主题详情
async function loadThemeDetail(themeId) {
    try {
        // 更新页面标题和描述为加载状态
        document.getElementById('theme-detail-title').textContent = '加载中...';
        document.getElementById('theme-detail-description').textContent = '';
        
        const cardsContainer = document.getElementById('cards-container');
        cardsContainer.innerHTML = '<div class="loading">正在加载卡片...</div>';
        
        const response = await fetch(`/api/themes/${themeId}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const theme = await response.json();
        AppState.currentTheme = theme;
        
        // 更新主题信息
        document.getElementById('theme-detail-title').textContent = theme.title;
        document.getElementById('theme-detail-description').textContent = theme.description || '暂无描述';
        
        // 渲染卡片
        if (!theme.cards || theme.cards.length === 0) {
            document.getElementById('empty-cards').style.display = 'block';
            cardsContainer.innerHTML = '';
        } else {
            document.getElementById('empty-cards').style.display = 'none';
            const cardsHtml = theme.cards.map(card => createFlashcardHtml(card)).join('');
            cardsContainer.innerHTML = cardsHtml;
            
            // 绑定卡片翻转事件
            bindFlashcardEvents();
        }
        
    } catch (error) {
        console.error('加载主题详情失败:', error);
        showMessage('加载主题详情失败: ' + error.message, 'error');
        
        // 显示错误状态
        document.getElementById('theme-detail-title').textContent = '加载失败';
        document.getElementById('theme-detail-description').textContent = '无法加载主题详情';
        document.getElementById('cards-container').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <h3>加载失败</h3>
                <p>无法加载主题详情，请检查网络连接后重试</p>
            </div>
        `;
    }
}

// 创建闪卡HTML
function createFlashcardHtml(card) {
    return `
        <div class="flashcard" data-card-id="${card.association_id}">
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

// 绑定闪卡翻转事件
function bindFlashcardEvents() {
    document.querySelectorAll('.flashcard').forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('flipped');
        });
        
        // 鼠标悬停翻转
        card.addEventListener('mouseenter', function() {
            this.classList.add('flipped');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('flipped');
        });
    });
}

// 处理创建主题表单提交
async function handleCreateTheme(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const themeData = {
        title: formData.get('title').trim(),
        description: formData.get('description').trim()
    };
    
    // 表单验证
    if (!themeData.title) {
        showMessage('请输入主题标题', 'warning');
        return;
    }
    
    try {
        // 禁用提交按钮
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '创建中...';
        
        const response = await fetch('/api/themes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(themeData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        showMessage('主题创建成功！', 'success');
        
        // 返回主题列表页面
        showThemesPage();
        
    } catch (error) {
        console.error('创建主题失败:', error);
        showMessage('创建主题失败: ' + error.message, 'error');
    } finally {
        // 恢复提交按钮
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// 编辑主题（预留功能）
function editTheme() {
    if (!AppState.currentTheme) {
        showMessage('请先选择一个主题', 'warning');
        return;
    }
    
    showMessage('编辑功能开发中...', 'warning');
}

// 切换查看模式（预留功能）
function toggleViewMode() {
    const modeText = document.getElementById('mode-toggle-text');
    
    if (AppState.viewMode === 'grid') {
        AppState.viewMode = 'slideshow';
        modeText.textContent = '网格模式';
        showMessage('幻灯片模式开发中...', 'warning');
    } else {
        AppState.viewMode = 'grid';
        modeText.textContent = '幻灯片模式';
        showMessage('已切换到网格模式', 'success');
    }
}

// 工具函数

// 显示消息提示
function showMessage(text, type = 'success') {
    const messageEl = document.getElementById('message');
    if (!messageEl) return;
    
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.classList.add('show');
    
    // 3秒后自动隐藏
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}

// HTML转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return '今天';
    } else if (diffDays === 2) {
        return '昨天';
    } else if (diffDays <= 7) {
        return `${diffDays} 天前`;
    } else {
        return date.toLocaleDateString('zh-CN');
    }
}

// 错误处理
window.addEventListener('error', function(event) {
    console.error('全局错误:', event.error);
    showMessage('应用出现错误，请刷新页面重试', 'error');
});

// 网络错误处理
window.addEventListener('unhandledrejection', function(event) {
    console.error('未处理的Promise拒绝:', event.reason);
    showMessage('网络请求失败，请检查连接', 'error');
});