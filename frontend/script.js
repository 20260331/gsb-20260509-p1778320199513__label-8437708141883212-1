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
    powerupWidth: 30,
    powerupHeight: 30,
    powerupSpeed: 2,
    powerupSpawnInterval: 5000,
    powerupDuration: 8000,
    powerupTypes: ['health', 'firepower', 'shield']
};

// 游戏状态
let gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    lives: gameConfig.initialLives,
    lastEnemySpawn: 0,
    lastPowerupSpawn: 0,
    hasShield: false,
    hasFirepower: false,
    shieldEndTime: 0,
    firepowerEndTime: 0
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
let powerups = [];
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
    gameState.lastPowerupSpawn = 0;
    gameState.hasShield = false;
    gameState.hasFirepower = false;
    gameState.shieldEndTime = 0;
    gameState.firepowerEndTime = 0;
    
    // 清空游戏对象
    bullets = [];
    enemies = [];
    powerups = [];
    
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

function shoot() {
    if (gameState.hasFirepower) {
        bullets.push({
            x: player.x + player.width / 2 - gameConfig.bulletWidth / 2 - 15,
            y: player.y,
            width: gameConfig.bulletWidth,
            height: gameConfig.bulletHeight,
            speed: gameConfig.bulletSpeed
        });
        bullets.push({
            x: player.x + player.width / 2 - gameConfig.bulletWidth / 2,
            y: player.y,
            width: gameConfig.bulletWidth,
            height: gameConfig.bulletHeight,
            speed: gameConfig.bulletSpeed
        });
        bullets.push({
            x: player.x + player.width / 2 - gameConfig.bulletWidth / 2 + 15,
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

function spawnPowerup() {
    const now = Date.now();
    if (now - gameState.lastPowerupSpawn > gameConfig.powerupSpawnInterval) {
        const type = gameConfig.powerupTypes[Math.floor(Math.random() * gameConfig.powerupTypes.length)];
        powerups.push({
            x: Math.random() * (gameConfig.canvasWidth - gameConfig.powerupWidth),
            y: 0,
            width: gameConfig.powerupWidth,
            height: gameConfig.powerupHeight,
            speed: gameConfig.powerupSpeed,
            type: type
        });
        gameState.lastPowerupSpawn = now;
    }
}

function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        powerups[i].y += powerups[i].speed;
        
        if (powerups[i].y > gameConfig.canvasHeight) {
            powerups.splice(i, 1);
        }
    }
}

function applyPowerup(powerup) {
    const now = Date.now();
    switch (powerup.type) {
        case 'health':
            gameState.lives = Math.min(gameState.lives + 1, 5);
            updateLives();
            break;
        case 'firepower':
            gameState.hasFirepower = true;
            gameState.firepowerEndTime = now + gameConfig.powerupDuration;
            break;
        case 'shield':
            gameState.hasShield = true;
            gameState.shieldEndTime = now + gameConfig.powerupDuration;
            break;
    }
}

function checkPowerupExpiry() {
    const now = Date.now();
    if (gameState.hasShield && now > gameState.shieldEndTime) {
        gameState.hasShield = false;
    }
    if (gameState.hasFirepower && now > gameState.firepowerEndTime) {
        gameState.hasFirepower = false;
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
            if (gameState.hasShield) {
                gameState.hasShield = false;
            } else {
                gameState.lives--;
                updateLives();
                checkGameOver();
            }
            break;
        }
    }
    
    // 玩家与道具碰撞
    for (let i = powerups.length - 1; i >= 0; i--) {
        if (isColliding(player, powerups[i])) {
            applyPowerup(powerups[i]);
            powerups.splice(i, 1);
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

function drawPowerups() {
    powerups.forEach(powerup => {
        const centerX = powerup.x + powerup.width / 2;
        const centerY = powerup.y + powerup.height / 2;
        const radius = powerup.width / 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        
        switch (powerup.type) {
            case 'health':
                ctx.fillStyle = '#4CAF50';
                ctx.fill();
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('+', centerX, centerY);
                break;
            case 'firepower':
                ctx.fillStyle = '#FF9800';
                ctx.fill();
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('F', centerX, centerY);
                break;
            case 'shield':
                ctx.fillStyle = '#2196F3';
                ctx.fill();
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('S', centerX, centerY);
                break;
        }
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
        ctx.stroke();
    });
}

function drawPowerupEffects() {
    if (gameState.hasShield) {
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        const radius = Math.max(player.width, player.height) / 2 + 10;
        
        ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(33, 150, 243, 0.4)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    if (gameState.hasFirepower) {
        ctx.fillStyle = 'rgba(255, 152, 0, 0.9)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('火力增强', 10, 50);
        
        const remaining = Math.ceil((gameState.firepowerEndTime - Date.now()) / 1000);
        ctx.fillStyle = 'rgba(255, 152, 0, 0.7)';
        ctx.fillText(`${remaining.toFixed(1)}s`, 10, 65);
    }
    
    if (gameState.hasShield) {
        ctx.fillStyle = 'rgba(33, 150, 243, 0.9)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('护盾', 10, 85);
        
        const remaining = Math.ceil((gameState.shieldEndTime - Date.now()) / 1000);
        ctx.fillStyle = 'rgba(33, 150, 243, 0.7)';
        ctx.fillText(`${remaining.toFixed(1)}s`, 10, 100);
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
    updatePowerups();
    spawnEnemy();
    spawnPowerup();
    checkCollisions();
    checkPowerupExpiry();
    
    // 绘制游戏画面
    drawBackground();
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawPowerups();
    drawPowerupEffects();
    
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