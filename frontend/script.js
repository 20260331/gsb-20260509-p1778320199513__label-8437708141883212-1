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
    powerUpWidth: 30,
    powerUpHeight: 30,
    powerUpSpeed: 2,
    powerUpSpawnInterval: 5000,
    powerUpDuration: 8000,
    shieldDuration: 10000,
    fireRateIncreaseInterval: 100,
    doubleBulletOffset: 15
};

// 游戏状态
let gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    lives: gameConfig.initialLives,
    lastEnemySpawn: 0,
    lastPowerUpSpawn: 0,
    lastShootTime: 0,
    activeEffects: {
        fireBoost: null,
        shield: null
    },
    pickupNotifications: []
};

const PowerUpType = {
    HEALTH: 'health',
    FIRE_BOOST: 'fireBoost',
    SHIELD: 'shield'
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
let powerUps = [];
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

// 事件监听
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    e.preventDefault();
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
    gameState.lastPowerUpSpawn = 0;
    gameState.lastShootTime = 0;
    gameState.activeEffects = {
        fireBoost: null,
        shield: null
    };
    gameState.pickupNotifications = [];
    
    // 清空游戏对象
    bullets = [];
    enemies = [];
    powerUps = [];
    
    // 重置玩家位置
    player.x = gameConfig.canvasWidth / 2 - gameConfig.playerWidth / 2;
    player.y = gameConfig.canvasHeight - gameConfig.playerHeight - 20;
    
    // 更新UI
    updateScore();
    updateLives();
    gameOverElement.style.display = 'none';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暂停游戏';
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function handleShooting() {
    if (!keys['Space'] || !gameState.isPlaying || gameState.isPaused) {
        return;
    }
    
    const now = Date.now();
    const fireRate = gameState.activeEffects.fireBoost ? gameConfig.fireRateIncreaseInterval : 250;
    
    if (now - gameState.lastShootTime >= fireRate) {
        shoot();
        gameState.lastShootTime = now;
    }
}

function shoot() {
    if (gameState.activeEffects.fireBoost) {
        bullets.push({
            x: player.x + player.width / 2 - gameConfig.bulletWidth / 2 - gameConfig.doubleBulletOffset,
            y: player.y,
            width: gameConfig.bulletWidth,
            height: gameConfig.bulletHeight,
            speed: gameConfig.bulletSpeed
        });
        bullets.push({
            x: player.x + player.width / 2 - gameConfig.bulletWidth / 2 + gameConfig.doubleBulletOffset,
            y: player.y,
            width: gameConfig.bulletWidth,
            height: gameConfig.bulletHeight,
            speed: gameConfig.bulletSpeed
        });
    } else {
        bullets.push({
            x: player.x + player.width / 2 - gameConfig.bulletWidth / 2,
            y: player.y,
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
            if (!gameState.activeEffects.shield) {
                gameState.lives--;
                updateLives();
                checkGameOver();
            }
            break;
        }
    }
    
    // 玩家与道具碰撞
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (isColliding(player, powerUps[i])) {
            applyPowerUp(powerUps[i].type);
            powerUps.splice(i, 1);
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

function spawnPowerUp() {
    const now = Date.now();
    if (now - gameState.lastPowerUpSpawn > gameConfig.powerUpSpawnInterval) {
        const types = [PowerUpType.HEALTH, PowerUpType.FIRE_BOOST, PowerUpType.SHIELD];
        const randomType = types[Math.floor(Math.random() * types.length)];
        powerUps.push({
            x: Math.random() * (gameConfig.canvasWidth - gameConfig.powerUpWidth),
            y: 0,
            width: gameConfig.powerUpWidth,
            height: gameConfig.powerUpHeight,
            speed: gameConfig.powerUpSpeed,
            type: randomType
        });
        gameState.lastPowerUpSpawn = now;
    }
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].y += powerUps[i].speed;
        
        if (powerUps[i].y > gameConfig.canvasHeight) {
            powerUps.splice(i, 1);
        }
    }
}

function applyPowerUp(type) {
    const now = Date.now();
    let notification = '';
    let color = '#fff';
    
    switch (type) {
        case PowerUpType.HEALTH:
            gameState.lives = Math.min(gameState.lives + 1, 5);
            updateLives();
            notification = '生命恢复 +1';
            color = '#E91E63';
            break;
        case PowerUpType.FIRE_BOOST:
            gameState.activeEffects.fireBoost = {
                startTime: now,
                endTime: now + gameConfig.powerUpDuration
            };
            notification = '火力增强 8秒';
            color = '#FF9800';
            break;
        case PowerUpType.SHIELD:
            gameState.activeEffects.shield = {
                startTime: now,
                endTime: now + gameConfig.shieldDuration
            };
            notification = '护盾激活 10秒';
            color = '#2196F3';
            break;
    }
    
    gameState.pickupNotifications.push({
        text: notification,
        color: color,
        startTime: now,
        duration: 2000,
        y: gameConfig.canvasHeight / 2
    });
}

function updateActiveEffects() {
    const now = Date.now();
    if (gameState.activeEffects.fireBoost && now > gameState.activeEffects.fireBoost.endTime) {
        gameState.activeEffects.fireBoost = null;
    }
    if (gameState.activeEffects.shield && now > gameState.activeEffects.shield.endTime) {
        gameState.activeEffects.shield = null;
    }
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        const cx = powerUp.x + powerUp.width / 2;
        const cy = powerUp.y + powerUp.height / 2;
        const radius = powerUp.width / 2;
        
        ctx.save();
        
        const glowGradient = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.5);
        switch (powerUp.type) {
            case PowerUpType.HEALTH:
                glowGradient.addColorStop(0, 'rgba(233, 30, 99, 0.8)');
                glowGradient.addColorStop(1, 'rgba(233, 30, 99, 0)');
                break;
            case PowerUpType.FIRE_BOOST:
                glowGradient.addColorStop(0, 'rgba(255, 152, 0, 0.8)');
                glowGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
                break;
            case PowerUpType.SHIELD:
                glowGradient.addColorStop(0, 'rgba(33, 150, 243, 0.8)');
                glowGradient.addColorStop(1, 'rgba(33, 150, 243, 0)');
                break;
        }
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        
        switch (powerUp.type) {
            case PowerUpType.HEALTH:
                ctx.fillStyle = '#E91E63';
                break;
            case PowerUpType.FIRE_BOOST:
                ctx.fillStyle = '#FF9800';
                break;
            case PowerUpType.SHIELD:
                ctx.fillStyle = '#2196F3';
                break;
        }
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#fff';
        
        switch (powerUp.type) {
            case PowerUpType.HEALTH:
                drawHeartIcon(cx, cy, radius * 0.6);
                break;
            case PowerUpType.FIRE_BOOST:
                drawFireIcon(cx, cy, radius * 0.7);
                break;
            case PowerUpType.SHIELD:
                drawShieldIcon(cx, cy, radius * 0.65);
                break;
        }
        
        ctx.restore();
    });
}

function drawHeartIcon(cx, cy, size) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.3);
    ctx.bezierCurveTo(cx, cy, cx - size, cy, cx - size, cy - size * 0.3);
    ctx.bezierCurveTo(cx - size, cy - size * 0.7, cx - size * 0.5, cy - size * 0.7, cx, cy - size * 0.2);
    ctx.bezierCurveTo(cx + size * 0.5, cy - size * 0.7, cx + size, cy - size * 0.7, cx + size, cy - size * 0.3);
    ctx.bezierCurveTo(cx + size, cy, cx, cy, cx, cy + size * 0.3);
    ctx.closePath();
    ctx.fill();
}

function drawFireIcon(cx, cy, size) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.bezierCurveTo(cx - size * 0.5, cy - size * 0.5, cx - size, cy, cx - size * 0.5, cy + size * 0.3);
    ctx.bezierCurveTo(cx - size * 0.3, cy + size * 0.5, cx, cy + size * 0.3, cx, cy);
    ctx.bezierCurveTo(cx, cy + size * 0.3, cx + size * 0.3, cy + size * 0.5, cx + size * 0.5, cy + size * 0.3);
    ctx.bezierCurveTo(cx + size, cy, cx + size * 0.5, cy - size * 0.5, cx, cy - size);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.5);
    ctx.bezierCurveTo(cx - size * 0.25, cy - size * 0.25, cx - size * 0.5, cy, cx - size * 0.25, cy + size * 0.15);
    ctx.bezierCurveTo(cx - size * 0.15, cy + size * 0.25, cx, cy + size * 0.15, cx, cy);
    ctx.bezierCurveTo(cx, cy + size * 0.15, cx + size * 0.15, cy + size * 0.25, cx + size * 0.25, cy + size * 0.15);
    ctx.bezierCurveTo(cx + size * 0.5, cy, cx + size * 0.25, cy - size * 0.25, cx, cy - size * 0.5);
    ctx.closePath();
    ctx.fill();
}

function drawShieldIcon(cx, cy, size) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx - size, cy - size * 0.4);
    ctx.lineTo(cx - size * 0.9, cy + size * 0.5);
    ctx.bezierCurveTo(cx - size * 0.5, cy + size * 0.9, cx, cy + size, cx, cy + size);
    ctx.bezierCurveTo(cx, cy + size, cx + size * 0.5, cy + size * 0.9, cx + size * 0.9, cy + size * 0.5);
    ctx.lineTo(cx + size, cy - size * 0.4);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#2196F3';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.7);
    ctx.lineTo(cx - size * 0.7, cy - size * 0.2);
    ctx.lineTo(cx - size * 0.6, cy + size * 0.35);
    ctx.bezierCurveTo(cx - size * 0.35, cy + size * 0.6, cx, cy + size * 0.65, cx, cy + size * 0.65);
    ctx.bezierCurveTo(cx, cy + size * 0.65, cx + size * 0.35, cy + size * 0.6, cx + size * 0.6, cy + size * 0.35);
    ctx.lineTo(cx + size * 0.7, cy - size * 0.2);
    ctx.closePath();
    ctx.fill();
}

function drawShield() {
    if (gameState.activeEffects.shield) {
        const cx = player.x + player.width / 2;
        const cy = player.y + player.height / 2;
        const radius = Math.max(player.width, player.height) / 2 + 15;
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(33, 150, 243, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(33, 150, 243, 0.15)';
        ctx.fill();
    }
}

function updateNotifications() {
    const now = Date.now();
    for (let i = gameState.pickupNotifications.length - 1; i >= 0; i--) {
        const notification = gameState.pickupNotifications[i];
        if (now - notification.startTime > notification.duration) {
            gameState.pickupNotifications.splice(i, 1);
        }
    }
}

function drawEffectTimers() {
    const now = Date.now();
    let y = 60;
    
    if (gameState.activeEffects.fireBoost || gameState.activeEffects.shield) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        let panelHeight = 0;
        if (gameState.activeEffects.fireBoost) panelHeight += 40;
        if (gameState.activeEffects.shield) panelHeight += 40;
        ctx.fillRect(5, 40, 180, panelHeight);
        
        ctx.strokeStyle = '#FFC107';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 40, 180, panelHeight);
    }
    
    if (gameState.activeEffects.fireBoost) {
        const remaining = Math.max(0, (gameState.activeEffects.fireBoost.endTime - now) / 1000);
        const totalDuration = gameConfig.powerUpDuration / 1000;
        const progress = remaining / totalDuration;
        
        ctx.fillStyle = '#FF9800';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('🔥 火力增强', 15, y);
        y += 18;
        
        ctx.fillStyle = '#555';
        ctx.fillRect(15, y, 160, 8);
        ctx.fillStyle = '#FF9800';
        ctx.fillRect(15, y, 160 * progress, 8);
        ctx.fillStyle = '#fff';
        ctx.font = '11px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${remaining.toFixed(1)}s`, 170, y + 7);
        y += 22;
    }
    
    if (gameState.activeEffects.shield) {
        const remaining = Math.max(0, (gameState.activeEffects.shield.endTime - now) / 1000);
        const totalDuration = gameConfig.shieldDuration / 1000;
        const progress = remaining / totalDuration;
        
        ctx.fillStyle = '#2196F3';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('🛡 护盾', 15, y);
        y += 18;
        
        ctx.fillStyle = '#555';
        ctx.fillRect(15, y, 160, 8);
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(15, y, 160 * progress, 8);
        ctx.fillStyle = '#fff';
        ctx.font = '11px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${remaining.toFixed(1)}s`, 170, y + 7);
    }
}

function drawPickupNotifications() {
    const now = Date.now();
    gameState.pickupNotifications.forEach((notification, index) => {
        const elapsed = now - notification.startTime;
        const progress = elapsed / notification.duration;
        const alpha = 1 - progress;
        const offsetY = progress * 50;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = notification.color;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(notification.text, gameConfig.canvasWidth / 2, notification.y - offsetY);
        ctx.fillText(notification.text, gameConfig.canvasWidth / 2, notification.y - offsetY);
        ctx.restore();
    });
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
    handleShooting();
    updateBullets();
    updateEnemies();
    updatePowerUps();
    updateActiveEffects();
    updateNotifications();
    spawnEnemy();
    spawnPowerUp();
    checkCollisions();
    
    // 绘制游戏画面
    drawBackground();
    drawPowerUps();
    drawPlayer();
    drawShield();
    drawBullets();
    drawEnemies();
    drawEffectTimers();
    drawPickupNotifications();
    
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