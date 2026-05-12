// 游戏配置
const gameConfig = {
    canvasWidth: 800,
    canvasHeight: 600,
    playerSpeed: 5,
    bulletSpeed: 8,
    enemySpeed: 2,
    enemySpawnInterval: 1000,
    playerWidth: 50,
    playerHeight: 40,
    bulletWidth: 5,
    bulletHeight: 15,
    enemyWidth: 40,
    enemyHeight: 30,
    initialLives: 3,
    itemWidth: 30,
    itemHeight: 30,
    itemSpawnInterval: 6000,
    itemSpeed: 1.5,
    healthRestore: 1,
    firepowerDuration: 8000,
    shieldDuration: 6000,
    healthGlowDuration: 1500
};

// 游戏状态
let gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    lives: gameConfig.initialLives,
    lastEnemySpawn: 0,
    lastItemSpawn: 0,
    activeEffects: {
        health: 0,
        firepower: 0,
        shield: 0
    }
};

// 游戏对象
let player = {
    x: gameConfig.canvasWidth / 2 - gameConfig.playerWidth / 2,
    y: gameConfig.canvasHeight - gameConfig.playerHeight - 20,
    width: gameConfig.playerWidth,
    height: gameConfig.playerHeight,
    speed: gameConfig.playerSpeed
};

let bullets = [];
let enemies = [];
let items = [];
let pickupNotifications = [];
let keys = {};

// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const slotHealthElement = document.getElementById('slotHealth');
const slotHealthStatusElement = document.getElementById('slotHealthStatus');
const slotFirepowerElement = document.getElementById('slotFirepower');
const slotFirepowerStatusElement = document.getElementById('slotFirepowerStatus');
const slotShieldElement = document.getElementById('slotShield');
const slotShieldStatusElement = document.getElementById('slotShieldStatus');

// 事件监听
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    // 空格键射击
    if (e.code === 'Space' && gameState.isPlaying && !gameState.isPaused) {
        shoot();
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', restartGame);

// 游戏函数
function startGame() {
    gameState.isPlaying = true;
    gameState.isPaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    gameLoop();
}

function togglePause() {
    if (gameState.isPlaying) {
        gameState.isPaused = !gameState.isPaused;
        pauseBtn.textContent = gameState.isPaused ? '继续游戏' : '暂停游戏';
        if (!gameState.isPaused) {
            gameLoop();
        }
    }
}

function restartGame() {
    // 重置游戏状态
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.lives = gameConfig.initialLives;
    gameState.lastEnemySpawn = 0;
    gameState.lastItemSpawn = 0;
    gameState.activeEffects.health = 0;
    gameState.activeEffects.firepower = 0;
    gameState.activeEffects.shield = 0;
    
    // 清空游戏对象
    bullets = [];
    enemies = [];
    items = [];
    pickupNotifications = [];
    
    // 重置玩家位置
    player.x = gameConfig.canvasWidth / 2 - gameConfig.playerWidth / 2;
    player.y = gameConfig.canvasHeight - gameConfig.playerHeight - 20;
    
    // 更新UI
    updateScore();
    updateLives();
    updateEffectsInfo();
    gameOverElement.style.display = 'none';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暂停游戏';
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function shoot() {
    const bx = player.x + player.width / 2 - gameConfig.bulletWidth / 2;
    const by = player.y;
    if (gameState.activeEffects.firepower > 0) {
        bullets.push({
            x: bx,
            y: by,
            width: gameConfig.bulletWidth,
            height: gameConfig.bulletHeight,
            speed: gameConfig.bulletSpeed
        });
        bullets.push({
            x: bx - 12,
            y: by + 5,
            width: gameConfig.bulletWidth,
            height: gameConfig.bulletHeight,
            speed: gameConfig.bulletSpeed
        });
        bullets.push({
            x: bx + 12,
            y: by + 5,
            width: gameConfig.bulletWidth,
            height: gameConfig.bulletHeight,
            speed: gameConfig.bulletSpeed
        });
    } else {
        bullets.push({
            x: bx,
            y: by,
            width: gameConfig.bulletWidth,
            height: gameConfig.bulletHeight,
            speed: gameConfig.bulletSpeed
        });
    }
}

function spawnEnemy() {
    const now = Date.now();
    if (now - gameState.lastEnemySpawn > gameConfig.enemySpawnInterval) {
        enemies.push({
            x: Math.random() * (gameConfig.canvasWidth - gameConfig.enemyWidth),
            y: 0,
            width: gameConfig.enemyWidth,
            height: gameConfig.enemyHeight,
            speed: gameConfig.enemySpeed
        });
        gameState.lastEnemySpawn = now;
    }
}

function spawnItem() {
    const now = Date.now();
    if (now - gameState.lastItemSpawn > gameConfig.itemSpawnInterval) {
        const types = ['health', 'firepower', 'shield'];
        const type = types[Math.floor(Math.random() * types.length)];
        items.push({
            x: Math.random() * (gameConfig.canvasWidth - gameConfig.itemWidth),
            y: -gameConfig.itemHeight,
            width: gameConfig.itemWidth,
            height: gameConfig.itemHeight,
            speed: gameConfig.itemSpeed,
            type: type
        });
        gameState.lastItemSpawn = now;
    }
}

function updateItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        items[i].y += items[i].speed;
        if (items[i].y > gameConfig.canvasHeight) {
            items.splice(i, 1);
        }
    }
}

function updateActiveEffects() {
    const now = Date.now();
    if (gameState.activeEffects.health > 0 && now >= gameState.activeEffects.health) {
        gameState.activeEffects.health = 0;
    }
    if (gameState.activeEffects.firepower > 0 && now >= gameState.activeEffects.firepower) {
        gameState.activeEffects.firepower = 0;
    }
    if (gameState.activeEffects.shield > 0 && now >= gameState.activeEffects.shield) {
        gameState.activeEffects.shield = 0;
    }
}

function updatePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < gameConfig.canvasWidth - player.width) {
        player.x += player.speed;
    }
    if (keys['ArrowUp'] && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] && player.y < gameConfig.canvasHeight - player.height) {
        player.y += player.speed;
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        
        // 移除超出画布的子弹
        if (bullets[i].y < -bullets[i].height) {
            bullets.splice(i, 1);
        }
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed;
        
        // 移除超出画布的敌人
        if (enemies[i].y > gameConfig.canvasHeight) {
            enemies.splice(i, 1);
            gameState.lives--;
            updateLives();
            checkGameOver();
        }
    }
}

function checkCollisions() {
    // 子弹与敌人碰撞
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (isColliding(bullets[i], enemies[j])) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                gameState.score += 10;
                updateScore();
                break;
            }
        }
    }
    
    // 玩家与敌人碰撞
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (isColliding(player, enemies[i])) {
            enemies.splice(i, 1);
            if (gameState.activeEffects.shield <= 0) {
                gameState.lives--;
                updateLives();
                checkGameOver();
            }
            break;
        }
    }
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function checkGameOver() {
    if (gameState.lives <= 0) {
        gameState.isPlaying = false;
        gameOverElement.style.display = 'block';
        finalScoreElement.textContent = gameState.score;
        startBtn.disabled = true;
        pauseBtn.disabled = true;
    }
}

function updateScore() {
    scoreElement.textContent = gameState.score;
}

function updateLives() {
    livesElement.textContent = gameState.lives;
}

function updateEffectsInfo() {
    const now = Date.now();

    if (gameState.activeEffects.health > 0) {
        slotHealthElement.classList.add('active');
        const sec = Math.ceil((gameState.activeEffects.health - now) / 1000);
        slotHealthStatusElement.textContent = '+' + gameConfig.healthRestore;
    } else {
        slotHealthElement.classList.remove('active');
        slotHealthStatusElement.textContent = '';
    }

    if (gameState.activeEffects.firepower > 0) {
        slotFirepowerElement.classList.add('active');
        const sec = Math.ceil((gameState.activeEffects.firepower - now) / 1000);
        slotFirepowerStatusElement.textContent = sec + 's';
    } else {
        slotFirepowerElement.classList.remove('active');
        slotFirepowerStatusElement.textContent = '';
    }

    if (gameState.activeEffects.shield > 0) {
        slotShieldElement.classList.add('active');
        const sec = Math.ceil((gameState.activeEffects.shield - now) / 1000);
        slotShieldStatusElement.textContent = sec + 's';
    } else {
        slotShieldElement.classList.remove('active');
        slotShieldStatusElement.textContent = '';
    }
}

function drawPlayer() {
    // 绘制玩家飞机主体
    ctx.fillStyle = '#4CAF50';
    
    // 绘制飞机机身
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height - 10);
    ctx.lineTo(player.x + 10, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2 - 10, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2 - 10, player.y + 20);
    ctx.lineTo(player.x + player.width / 2 + 10, player.y + 20);
    ctx.lineTo(player.x + player.width / 2 + 10, player.y + player.height);
    ctx.lineTo(player.x + player.width - 10, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height - 10);
    ctx.closePath();
    ctx.fill();
    
    // 绘制机翼
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.moveTo(player.x + 15, player.y + 15);
    ctx.lineTo(player.x - 20, player.y + 30);
    ctx.lineTo(player.x - 15, player.y + 35);
    ctx.lineTo(player.x + 15, player.y + 25);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(player.x + player.width - 15, player.y + 15);
    ctx.lineTo(player.x + player.width + 20, player.y + 30);
    ctx.lineTo(player.x + player.width + 15, player.y + 35);
    ctx.lineTo(player.x + player.width - 15, player.y + 25);
    ctx.closePath();
    ctx.fill();
    
    // 绘制驾驶舱
    ctx.fillStyle = '#FFC107';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + 12, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制驾驶舱玻璃效果
    ctx.strokeStyle = '#E3F2FD';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + 12, 8, 0, Math.PI * 2);
    ctx.stroke();
    
    // 绘制引擎
    ctx.fillStyle = '#757575';
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y + player.height, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(player.x + player.width - 20, player.y + player.height, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制引擎火焰
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.moveTo(player.x + 20, player.y + player.height + 6);
    ctx.lineTo(player.x + 15, player.y + player.height + 12);
    ctx.lineTo(player.x + 20, player.y + player.height + 10);
    ctx.lineTo(player.x + 25, player.y + player.height + 12);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(player.x + player.width - 20, player.y + player.height + 6);
    ctx.lineTo(player.x + player.width - 15, player.y + player.height + 12);
    ctx.lineTo(player.x + player.width - 20, player.y + player.height + 10);
    ctx.lineTo(player.x + player.width - 25, player.y + player.height + 12);
    ctx.closePath();
    ctx.fill();
    
    // 绘制尾翼
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2 - 8, player.y + player.height - 5);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height + 15);
    ctx.lineTo(player.x + player.width / 2 + 8, player.y + player.height - 5);
    ctx.closePath();
    ctx.fill();
}

function drawBullets() {
    ctx.fillStyle = '#FFEB3B';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function drawEnemies() {
    ctx.fillStyle = '#F44336';
    enemies.forEach(enemy => {
        // 绘制敌人飞机主体（头部向下）
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
        ctx.lineTo(enemy.x + 15, enemy.y + enemy.height - 25);
        ctx.lineTo(enemy.x + 10, enemy.y + enemy.height - 20);
        ctx.lineTo(enemy.x + enemy.width / 2 - 12, enemy.y + enemy.height - 20);
        ctx.lineTo(enemy.x + enemy.width / 2 - 12, enemy.y + 15);
        ctx.lineTo(enemy.x + enemy.width / 2 + 12, enemy.y + 15);
        ctx.lineTo(enemy.x + enemy.width / 2 + 12, enemy.y + enemy.height - 20);
        ctx.lineTo(enemy.x + enemy.width - 10, enemy.y + enemy.height - 20);
        ctx.lineTo(enemy.x + enemy.width - 15, enemy.y + enemy.height - 25);
        ctx.closePath();
        ctx.fill();
        
        // 绘制机翼
        ctx.fillStyle = '#B71C1C';
        ctx.beginPath();
        ctx.moveTo(enemy.x + 20, enemy.y + enemy.height - 25);
        ctx.lineTo(enemy.x - 15, enemy.y + enemy.height - 40);
        ctx.lineTo(enemy.x - 10, enemy.y + enemy.height - 35);
        ctx.lineTo(enemy.x + 20, enemy.y + enemy.height - 30);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width - 20, enemy.y + enemy.height - 25);
        ctx.lineTo(enemy.x + enemy.width + 15, enemy.y + enemy.height - 40);
        ctx.lineTo(enemy.x + enemy.width + 10, enemy.y + enemy.height - 35);
        ctx.lineTo(enemy.x + enemy.width - 20, enemy.y + enemy.height - 30);
        ctx.closePath();
        ctx.fill();
        
        // 绘制驾驶舱
        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height - 20, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制驾驶舱玻璃效果
        ctx.strokeStyle = '#E3F2FD';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height - 20, 6, 0, Math.PI * 2);
        ctx.stroke();
        
        // 绘制引擎
        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.arc(enemy.x + 25, enemy.y + enemy.height - 15, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width - 25, enemy.y + enemy.height - 15, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制引擎火焰
        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.moveTo(enemy.x + 25, enemy.y + enemy.height - 5);
        ctx.lineTo(enemy.x + 20, enemy.y + enemy.height);
        ctx.lineTo(enemy.x + 25, enemy.y + enemy.height - 2);
        ctx.lineTo(enemy.x + 30, enemy.y + enemy.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width - 25, enemy.y + enemy.height - 5);
        ctx.lineTo(enemy.x + enemy.width - 20, enemy.y + enemy.height);
        ctx.lineTo(enemy.x + enemy.width - 25, enemy.y + enemy.height - 2);
        ctx.lineTo(enemy.x + enemy.width - 30, enemy.y + enemy.height);
        ctx.closePath();
        ctx.fill();
        
        // 绘制尾翼
        ctx.fillStyle = '#B71C1C';
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2 - 8, enemy.y + 15);
        ctx.lineTo(enemy.x + enemy.width / 2, enemy.y);
        ctx.lineTo(enemy.x + enemy.width / 2 + 8, enemy.y + 15);
        ctx.closePath();
        ctx.fill();
        
        // 绘制垂直尾翼
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2 - 3, enemy.y + 15);
        ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + 5);
        ctx.lineTo(enemy.x + enemy.width / 2 + 3, enemy.y + 15);
        ctx.closePath();
        ctx.fill();
    });
}

function drawItems() {
    items.forEach(item => {
        const cx = item.x + item.width / 2;
        const cy = item.y + item.height / 2;
        const r = item.width / 2;

        ctx.save();
        if (item.type === 'health') {
            ctx.fillStyle = '#E91E63';
            ctx.beginPath();
            ctx.moveTo(cx, cy + r * 0.4);
            ctx.bezierCurveTo(cx + r * 0.6, cy - r * 0.2, cx + r * 0.9, cy + r * 0.5, cx, cy + r);
            ctx.bezierCurveTo(cx - r * 0.9, cy + r * 0.5, cx - r * 0.6, cy - r * 0.2, cx, cy + r * 0.4);
            ctx.fill();
            ctx.strokeStyle = '#F8BBD0';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else if (item.type === 'firepower') {
            ctx.fillStyle = '#FF9800';
            ctx.beginPath();
            ctx.moveTo(cx, cy - r);
            ctx.lineTo(cx + r * 0.3, cy - r * 0.2);
            ctx.lineTo(cx + r * 0.8, cy - r * 0.3);
            ctx.lineTo(cx + r * 0.4, cy + r * 0.1);
            ctx.lineTo(cx + r * 0.6, cy + r * 0.8);
            ctx.lineTo(cx, cy + r * 0.4);
            ctx.lineTo(cx - r * 0.6, cy + r * 0.8);
            ctx.lineTo(cx - r * 0.4, cy + r * 0.1);
            ctx.lineTo(cx - r * 0.8, cy - r * 0.3);
            ctx.lineTo(cx - r * 0.3, cy - r * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#FFE0B2';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else if (item.type === 'shield') {
            ctx.fillStyle = '#2196F3';
            ctx.beginPath();
            ctx.moveTo(cx, cy - r);
            ctx.lineTo(cx + r * 0.85, cy - r * 0.5);
            ctx.lineTo(cx + r * 0.7, cy + r * 0.3);
            ctx.lineTo(cx, cy + r);
            ctx.lineTo(cx - r * 0.7, cy + r * 0.3);
            ctx.lineTo(cx - r * 0.85, cy - r * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#BBDEFB';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = '#BBDEFB';
            ctx.beginPath();
            ctx.moveTo(cx, cy - r * 0.5);
            ctx.lineTo(cx + r * 0.4, cy - r * 0.2);
            ctx.lineTo(cx + r * 0.3, cy + r * 0.15);
            ctx.lineTo(cx, cy + r * 0.5);
            ctx.lineTo(cx - r * 0.3, cy + r * 0.15);
            ctx.lineTo(cx - r * 0.4, cy - r * 0.2);
            ctx.closePath();
            ctx.fill();
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    });
}

function checkItemCollisions() {
    for (let i = items.length - 1; i >= 0; i--) {
        if (isColliding(player, items[i])) {
            const item = items[i];
            if (item.type === 'health') {
                gameState.lives += gameConfig.healthRestore;
                updateLives();
                gameState.activeEffects.health = Date.now() + gameConfig.healthGlowDuration;
                addPickupNotification('♥ 生命恢复 +' + gameConfig.healthRestore, '#E91E63', '#F8BBD0');
            } else if (item.type === 'firepower') {
                gameState.activeEffects.firepower = Date.now() + gameConfig.firepowerDuration;
                addPickupNotification('⚡ 火力增强 ' + (gameConfig.firepowerDuration / 1000) + 's', '#FF9800', '#FFE0B2');
            } else if (item.type === 'shield') {
                gameState.activeEffects.shield = Date.now() + gameConfig.shieldDuration;
                addPickupNotification('🛡 护盾 ' + (gameConfig.shieldDuration / 1000) + 's', '#2196F3', '#BBDEFB');
            }
            items.splice(i, 1);
        }
    }
}

function addPickupNotification(text, bgColor, textColor) {
    pickupNotifications.push({
        text: text,
        bgColor: bgColor,
        textColor: textColor,
        startTime: Date.now(),
        duration: 1500,
        y: 0
    });
}

function updatePickupNotifications() {
    const now = Date.now();
    for (let i = pickupNotifications.length - 1; i >= 0; i--) {
        if (now - pickupNotifications[i].startTime >= pickupNotifications[i].duration) {
            pickupNotifications.splice(i, 1);
        }
    }
}

function drawPickupNotifications() {
    const now = Date.now();
    const baseX = gameConfig.canvasWidth / 2;
    const baseY = gameConfig.canvasHeight / 2 - 40;

    pickupNotifications.forEach(function(notif, index) {
        const elapsed = now - notif.startTime;
        const progress = elapsed / notif.duration;
        const alpha = progress < 0.2 ? progress / 0.2 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
        const offsetY = -30 * progress;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const metrics = ctx.measureText(notif.text);
        const pw = metrics.width + 30;
        const ph = 36;
        const px = baseX - pw / 2;
        const py = baseY + offsetY - ph / 2 + index * 44;

        ctx.fillStyle = notif.bgColor;
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 8);
        ctx.fill();

        ctx.strokeStyle = notif.textColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 8);
        ctx.stroke();

        ctx.fillStyle = notif.textColor;
        ctx.fillText(notif.text, baseX, py + ph / 2);

        ctx.restore();
    });
}

function drawActiveEffects() {
    const now = Date.now();
    const barWidth = 120;
    const barHeight = 12;
    const padding = 10;
    let offsetY = 10;

    if (gameState.activeEffects.shield > 0) {
        const remaining = gameState.activeEffects.shield - now;
        const ratio = Math.max(0, remaining / gameConfig.shieldDuration);
        const bx = gameConfig.canvasWidth - barWidth - padding;
        const by = offsetY;

        ctx.fillStyle = 'rgba(33,150,243,0.3)';
        ctx.fillRect(bx, by, barWidth, barHeight);
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(bx, by, barWidth * ratio, barHeight);
        ctx.strokeStyle = '#64B5F6';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, barWidth, barHeight);

        ctx.fillStyle = '#BBDEFB';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('护盾', bx + 4, by + 10);

        offsetY += barHeight + 5;
    }

    if (gameState.activeEffects.firepower > 0) {
        const remaining = gameState.activeEffects.firepower - now;
        const ratio = Math.max(0, remaining / gameConfig.firepowerDuration);
        const bx = gameConfig.canvasWidth - barWidth - padding;
        const by = offsetY;

        ctx.fillStyle = 'rgba(255,152,0,0.3)';
        ctx.fillRect(bx, by, barWidth, barHeight);
        ctx.fillStyle = '#FF9800';
        ctx.fillRect(bx, by, barWidth * ratio, barHeight);
        ctx.strokeStyle = '#FFB74D';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, barWidth, barHeight);

        ctx.fillStyle = '#FFE0B2';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('火力增强', bx + 4, by + 10);
    }
}

function drawShieldEffect() {
    if (gameState.activeEffects.shield > 0) {
        const cx = player.x + player.width / 2;
        const cy = player.y + player.height / 2;
        const radius = Math.max(player.width, player.height) * 0.8;
        const alpha = 0.3 + 0.15 * Math.sin(Date.now() * 0.005);

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(33,150,243,' + alpha + ')';
        ctx.fill();
        ctx.strokeStyle = 'rgba(100,181,246,' + (alpha + 0.2) + ')';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

function drawBackground() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, gameConfig.canvasWidth, gameConfig.canvasHeight);
}

function gameLoop() {
    if (!gameState.isPlaying || gameState.isPaused) {
        return;
    }
    
    // 更新游戏状态
    updatePlayer();
    updateBullets();
    updateEnemies();
    updateItems();
    updateActiveEffects();
    updatePickupNotifications();
    spawnEnemy();
    spawnItem();
    checkCollisions();
    checkItemCollisions();
    
    // 绘制游戏画面
    drawBackground();
    drawItems();
    drawPlayer();
    drawShieldEffect();
    drawBullets();
    drawEnemies();
    drawActiveEffects();
    drawPickupNotifications();
    updateEffectsInfo();
    
    // 继续游戏循环
    requestAnimationFrame(gameLoop);
}

// 初始化游戏
function initGame() {
    drawBackground();
    drawPlayer();
    updateScore();
    updateLives();
}

// 启动游戏
initGame();