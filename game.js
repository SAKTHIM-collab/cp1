// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TILE_SIZE = 40;
const GRID_COLS = Math.floor(CANVAS_WIDTH / TILE_SIZE);
const GRID_ROWS = Math.floor(CANVAS_HEIGHT / TILE_SIZE);
const PLAYER_SIZE = 20;
const PLAYER_SPEED = 3;
const BULLET_SPEED = 8;
const BULLET_SIZE = 5;
const TOWER_RADIUS = 15;
const TOWER_DETECTION_RANGE = 150;
const TOWER_DAMAGE_RATE = 0.5; // Damage per frame when in detection zone
const KEY_SIZE = 15;
const SHARD_SIZE = 15;
const SYSTEM_HEALTH_DECAY_RATE = 0.05; // System health decay per second
const SHARD_HEALTH_RESTORE = 15; // Health restored per shard delivered

// Game Modes
const GAME_MODES = {
    NORMAL: 'normal',
    HACKER: 'hacker',
    HACKER_PLUS_PLUS: 'hacker++'
};

// Power-up Constants
const POWER_UP_TYPES = {
    HEALTH_PACK: 'health_pack',
    INVISIBILITY: 'invisibility',
    SPEED_BOOST: 'speed_boost'
};

// Bot Constants
const BOT_TYPES = {
    LIGHT: 'light',
    HEAVY: 'heavy',
    SNIPER: 'sniper'
};

// Game Variables
let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let gameOver = false;
let currentGameMode = GAME_MODES.NORMAL;
let player;
let towers = [];
let keys = [];
let shards = [];
let bullets = [];
let bots = [];
let powerUps = [];
let dataMines = [];
let teleportHubs = [];
let systemHealth = 100;
let playerHealth = 100;
let collectedKeys = 0;
let collectedShards = 0;
let lastTime = 0;
let animationId;
let grid = [];
let isInvisible = false;
let invisibilityTimer = null;
let cityWideAlert = false;
let alertTimer = null;
let botSpawnTimer = null;
let botSpawnRate = 10000; // Initial spawn rate in milliseconds

// Game Objects
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = PLAYER_SIZE;
        this.height = PLAYER_SIZE;
        this.speed = PLAYER_SPEED;
        this.direction = { x: 0, y: 0 };
    }

    update() {
        if (gamePaused || gameOver) return;

        // Calculate new position
        let newX = this.x + this.direction.x * this.speed;
        let newY = this.y + this.direction.y * this.speed;

        // Check boundaries
        newX = Math.max(0, Math.min(CANVAS_WIDTH - this.width, newX));
        newY = Math.max(0, Math.min(CANVAS_HEIGHT - this.height, newY));

        // Check collision with buildings
        const gridX = Math.floor(newX / TILE_SIZE);
        const gridY = Math.floor(newY / TILE_SIZE);

        if (grid[gridY][gridX] !== 1) { // 1 represents a building (non-walkable)
            this.x = newX;
            this.y = newY;
        }
    }

    draw() {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    shoot(targetX, targetY) {
        if (gamePaused || gameOver) return;

        // Calculate direction vector
        const dx = targetX - (this.x + this.width / 2);
        const dy = targetY - (this.y + this.height / 2);
        const length = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / length;
        const dirY = dy / length;

        bullets.push(new Bullet(
            this.x + this.width / 2 - BULLET_SIZE / 2,
            this.y + this.height / 2 - BULLET_SIZE / 2,
            dirX,
            dirY
        ));
    }
}

class Bullet {
    constructor(x, y, dirX, dirY, isEnemyBullet = false) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.speed = BULLET_SPEED;
        this.size = BULLET_SIZE;
        this.bounces = 0;
        this.maxBounces = 5;
        this.isEnemyBullet = isEnemyBullet;
    }

    update() {
        this.x += this.dirX * this.speed;
        this.y += this.dirY * this.speed;

        // Check for collisions with walls
        if (this.x <= 0 || this.x >= CANVAS_WIDTH - this.size) {
            this.dirX *= -1;
            this.bounces++;
        }
        if (this.y <= 0 || this.y >= CANVAS_HEIGHT - this.size) {
            this.dirY *= -1;
            this.bounces++;
        }

        // Check for collisions with buildings
        const gridX = Math.floor(this.x / TILE_SIZE);
        const gridY = Math.floor(this.y / TILE_SIZE);

        if (gridX >= 0 && gridX < GRID_COLS && gridY >= 0 && gridY < GRID_ROWS) {
            if (grid[gridY][gridX] === 1) {
                const tileX = gridX * TILE_SIZE;
                const tileY = gridY * TILE_SIZE;
                
                const distLeft = this.x - tileX;
                const distRight = (tileX + TILE_SIZE) - (this.x + this.size);
                const distTop = this.y - tileY;
                const distBottom = (tileY + TILE_SIZE) - (this.y + this.size);
                
                const minDist = Math.min(distLeft, distRight, distTop, distBottom);
                
                if (minDist === distLeft || minDist === distRight) {
                    this.dirX *= -1;
                } else {
                    this.dirY *= -1;
                }
                
                this.bounces++;
            }
        }

        // Check for collisions with towers (only player bullets)
        if (!this.isEnemyBullet) {
            for (let i = towers.length - 1; i >= 0; i--) {
                const tower = towers[i];
                const towerCenterX = tower.x + TOWER_RADIUS;
                const towerCenterY = tower.y + TOWER_RADIUS;
                const bulletCenterX = this.x + this.size / 2;
                const bulletCenterY = this.y + this.size / 2;
                
                const distance = Math.sqrt(
                    Math.pow(bulletCenterX - towerCenterX, 2) + 
                    Math.pow(bulletCenterY - towerCenterY, 2)
                );
                
                if (distance < TOWER_RADIUS) {
                    towers.splice(i, 1);
                    return true;
                }
            }
        }

        // Check for collisions with bots (only player bullets)
        if (!this.isEnemyBullet) {
            for (let i = bots.length - 1; i >= 0; i--) {
                const bot = bots[i];
                const botCenterX = bot.x + bot.size / 2;
                const botCenterY = bot.y + bot.size / 2;
                const bulletCenterX = this.x + this.size / 2;
                const bulletCenterY = this.y + this.size / 2;
                
                const distance = Math.sqrt(
                    Math.pow(bulletCenterX - botCenterX, 2) + 
                    Math.pow(bulletCenterY - botCenterY, 2)
                );
                
                if (distance < bot.size / 2) {
                    bot.health -= 25; // Damage per hit
                    if (bot.health <= 0) {
                        bots.splice(i, 1);
                    }
                    return true;
                }
            }
        }

        // Check for collisions with player (only enemy bullets)
        if (this.isEnemyBullet && !isInvisible) {
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;
            const bulletCenterX = this.x + this.size / 2;
            const bulletCenterY = this.y + this.size / 2;
            
            const distance = Math.sqrt(
                Math.pow(bulletCenterX - playerCenterX, 2) + 
                Math.pow(bulletCenterY - playerCenterY, 2)
            );
            
            if (distance < player.width / 2) {
                playerHealth -= 10;
                updatePlayerHealth();
                return true;
            }
        }

        return this.bounces >= this.maxBounces;
    }

    draw() {
        ctx.fillStyle = this.isEnemyBullet ? '#ff0000' : '#ffff00';
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

class SurveillanceTower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = TOWER_RADIUS;
        this.detectionRange = TOWER_DETECTION_RANGE;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = 0.02;
        this.detectionAngle = Math.PI / 3; // 60 degrees
    }

    update() {
        this.angle += this.rotationSpeed;
        this.angle %= Math.PI * 2;
        
        // Check if player is in detection zone
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const towerCenterX = this.x + this.radius;
        const towerCenterY = this.y + this.radius;
        
        const dx = playerCenterX - towerCenterX;
        const dy = playerCenterY - towerCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.detectionRange) {
            const angleToPlayer = Math.atan2(dy, dx);
            let angleDiff = (angleToPlayer - this.angle + Math.PI * 3) % (Math.PI * 2) - Math.PI;
            
            if (Math.abs(angleDiff) < this.detectionAngle / 2) {
                playerHealth -= TOWER_DAMAGE_RATE;
                updatePlayerHealth();
            }
        }
    }

    draw() {
        // Draw tower base
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x + this.radius, this.y + this.radius, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw detection cone
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(this.x + this.radius, this.y + this.radius);
        ctx.arc(
            this.x + this.radius, 
            this.y + this.radius, 
            this.detectionRange, 
            this.angle - this.detectionAngle / 2, 
            this.angle + this.detectionAngle / 2
        );
        ctx.closePath();
        ctx.fill();
        
        // Draw tower "eye"
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(
            this.x + this.radius + Math.cos(this.angle) * this.radius * 0.5,
            this.y + this.radius + Math.sin(this.angle) * this.radius * 0.5,
            this.radius * 0.3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

class Key {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = KEY_SIZE;
    }

    draw() {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x, this.y, this.size, this.size);
        
        // Draw key shape
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(this.x + this.size * 0.3, this.y, this.size * 0.4, this.size * 0.6);
        ctx.fillRect(this.x, this.y + this.size * 0.5, this.size * 0.7, this.size * 0.2);
    }
}

class DataShard {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = SHARD_SIZE;
    }

    draw() {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.size / 2, this.y);
        ctx.lineTo(this.x + this.size, this.y + this.size / 2);
        ctx.lineTo(this.x + this.size / 2, this.y + this.size);
        ctx.lineTo(this.x, this.y + this.size / 2);
        ctx.closePath();
        ctx.fill();
    }
}

class Bot {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 20;
        this.speed = this.getSpeed();
        this.health = this.getHealth();
        this.detectionRange = this.getDetectionRange();
        this.target = null;
        this.patrolPath = this.generatePatrolPath();
        this.currentPatrolIndex = 0;
        this.shootCooldown = 0;
    }

    getSpeed() {
        switch(this.type) {
            case BOT_TYPES.LIGHT: return 4;
            case BOT_TYPES.HEAVY: return 2;
            case BOT_TYPES.SNIPER: return 3;
            default: return 3;
        }
    }

    getHealth() {
        switch(this.type) {
            case BOT_TYPES.LIGHT: return 50;
            case BOT_TYPES.HEAVY: return 200;
            case BOT_TYPES.SNIPER: return 100;
            default: return 100;
        }
    }

    getDetectionRange() {
        switch(this.type) {
            case BOT_TYPES.LIGHT: return 150;
            case BOT_TYPES.HEAVY: return 100;
            case BOT_TYPES.SNIPER: return 300;
            default: return 150;
        }
    }

    generatePatrolPath() {
        const path = [];
        const numPoints = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numPoints; i++) {
            path.push(findWalkablePosition());
        }
        return path;
    }

    update() {
        if (gamePaused || gameOver) return;

        // Check if player is in detection range or city-wide alert is active
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.detectionRange || cityWideAlert) {
            this.target = player;
        } else {
            this.target = null;
        }

        // Move towards target or patrol point
        if (this.target) {
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;

            // Shoot if in range
            if (distance < 100 && this.shootCooldown <= 0) {
                this.shoot();
                this.shootCooldown = 60; // 1 second cooldown at 60 FPS
            }
        } else {
            // Patrol behavior
            const targetPoint = this.patrolPath[this.currentPatrolIndex];
            const dx = targetPoint.x - this.x;
            const dy = targetPoint.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPath.length;
            } else {
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
            }
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
    }

    shoot() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        bullets.push(new Bullet(
            this.x + this.size / 2,
            this.y + this.size / 2,
            Math.cos(angle),
            Math.sin(angle),
            true // isEnemyBullet
        ));
    }

    draw() {
        ctx.fillStyle = this.getBotColor();
        ctx.fillRect(this.x, this.y, this.size, this.size);
        
        // Draw detection range
        if (this.target) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.detectionRange, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    getBotColor() {
        switch(this.type) {
            case BOT_TYPES.LIGHT: return '#ff0000';
            case BOT_TYPES.HEAVY: return '#800000';
            case BOT_TYPES.SNIPER: return '#ff00ff';
            default: return '#ff0000';
        }
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 20;
        this.collected = false;
    }

    draw() {
        if (this.collected) return;

        ctx.fillStyle = this.getPowerUpColor();
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    getPowerUpColor() {
        switch(this.type) {
            case POWER_UP_TYPES.HEALTH_PACK: return '#00ff00';
            case POWER_UP_TYPES.INVISIBILITY: return '#0000ff';
            case POWER_UP_TYPES.SPEED_BOOST: return '#ffff00';
            default: return '#ffffff';
        }
    }

    applyEffect() {
        switch(this.type) {
            case POWER_UP_TYPES.HEALTH_PACK:
                playerHealth = Math.min(100, playerHealth + 30);
                updatePlayerHealth();
                break;
            case POWER_UP_TYPES.INVISIBILITY:
                isInvisible = true;
                if (invisibilityTimer) clearTimeout(invisibilityTimer);
                invisibilityTimer = setTimeout(() => {
                    isInvisible = false;
                }, 5000); // 5 seconds of invisibility
                break;
            case POWER_UP_TYPES.SPEED_BOOST:
                const originalSpeed = player.speed;
                player.speed *= 1.5;
                setTimeout(() => {
                    player.speed = originalSpeed;
                }, 5000); // 5 seconds of speed boost
                break;
        }
    }
}

class DataMine {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 30;
        this.productionRate = 1; // Shards per minute
        this.maxCapacity = 5;
        this.currentShards = 0;
        this.lastProductionTime = Date.now();
    }

    update() {
        const now = Date.now();
        const timeDiff = (now - this.lastProductionTime) / 1000; // Convert to seconds
        
        if (timeDiff >= 60 / this.productionRate && this.currentShards < this.maxCapacity) {
            this.currentShards++;
            this.lastProductionTime = now;
        }
    }

    draw() {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw shard count
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.fillText(this.currentShards.toString(), this.x + this.size / 2 - 4, this.y + this.size / 2 + 4);
    }

    collectShards() {
        const shards = this.currentShards;
        this.currentShards = 0;
        return shards;
    }
}

class TeleportHub {
    constructor(x, y, label) {
        this.x = x;
        this.y = y;
        this.size = 30;
        this.label = label;
    }

    draw() {
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw label
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.fillText(this.label, this.x + this.size / 2 - 10, this.y + this.size / 2 + 4);
    }
}

// Game Functions
function initGame() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Initialize game state
    resetGame();
    
    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('click', handleClick);
    
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    
    // Start game loop
    gameRunning = true;
    lastTime = performance.now();
    gameLoop();
}

function resetGame() {
    // Reset game state
    gameOver = false;
    gamePaused = false;
    systemHealth = 100;
    playerHealth = 100;
    collectedKeys = 0;
    collectedShards = 0;
    isInvisible = false;
    cityWideAlert = false;
    
    if (invisibilityTimer) clearTimeout(invisibilityTimer);
    if (alertTimer) clearTimeout(alertTimer);
    if (botSpawnTimer) clearTimeout(botSpawnTimer);
    
    updateSystemHealth();
    updatePlayerHealth();
    updateKeysCount();
    updateShardsCount();
    
    document.getElementById('game-message').style.display = 'none';
    
    // Generate procedural map
    generateMap();
    
    // Create player
    const startPos = findWalkablePosition();
    player = new Player(startPos.x, startPos.y);
    
    // Create towers
    towers = [];
    const towerCount = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < towerCount; i++) {
        const pos = findWalkablePosition();
        towers.push(new SurveillanceTower(pos.x, pos.y));
    }
    
    // Create keys
    keys = [];
    const keyCount = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < keyCount; i++) {
        const pos = findWalkablePosition();
        keys.push(new Key(pos.x, pos.y));
    }
    
    // Create shards
    shards = [];
    const hubPos = findCentralHubPosition();
    const shardCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < shardCount; i++) {
        shards.push(new DataShard(
            hubPos.x + Math.random() * TILE_SIZE * 3 - TILE_SIZE * 1.5,
            hubPos.y + Math.random() * TILE_SIZE * 3 - TILE_SIZE * 1.5
        ));
    }
    
    // Initialize mode-specific elements
    bots = [];
    powerUps = [];
    dataMines = [];
    teleportHubs = [];
    
    if (currentGameMode !== GAME_MODES.NORMAL) {
        // Start bot spawning
        botSpawnRate = 10000;
        spawnBot();
        
        // Start power-up spawning
        spawnPowerUp();
    }
    
    bullets = [];
}

function generateMap() {
    grid = [];
    
    // Initialize empty grid (all walkable)
    for (let y = 0; y < GRID_ROWS; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_COLS; x++) {
            grid[y][x] = 0; // 0 = walkable
        }
    }
    
    // Generate buildings (black areas)
    const buildingCount = 20 + Math.floor(Math.random() * 20);
    for (let i = 0; i < buildingCount; i++) {
        const width = 2 + Math.floor(Math.random() * 4);
        const height = 2 + Math.floor(Math.random() * 4);
        const x = Math.floor(Math.random() * (GRID_COLS - width));
        const y = Math.floor(Math.random() * (GRID_ROWS - height));
        
        // Mark tiles as buildings
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                if (y + dy < GRID_ROWS && x + dx < GRID_COLS) {
                    grid[y + dy][x + dx] = 1; // 1 = building
                }
            }
        }
    }
    
    // Generate some green areas (open spaces)
    const greenAreaCount = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < greenAreaCount; i++) {
        const width = 3 + Math.floor(Math.random() * 4);
        const height = 3 + Math.floor(Math.random() * 4);
        const x = Math.floor(Math.random() * (GRID_COLS - width));
        const y = Math.floor(Math.random() * (GRID_ROWS - height));
        
        // Clear buildings in this area
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                if (y + dy < GRID_ROWS && x + dx < GRID_COLS) {
                    grid[y + dy][x + dx] = 2; // 2 = green area
                }
            }
        }
    }
}

function findWalkablePosition() {
    let x, y;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
        x = Math.floor(Math.random() * (GRID_COLS - 1)) * TILE_SIZE;
        y = Math.floor(Math.random() * (GRID_ROWS - 1)) * TILE_SIZE;
        attempts++;
        
        if (attempts >= maxAttempts) {
            // If we can't find a walkable position after many attempts, just return any position
            return { x: TILE_SIZE, y: TILE_SIZE };
        }
    } while (grid[Math.floor(y / TILE_SIZE)][Math.floor(x / TILE_SIZE)] === 1);
    
    return { x, y };
}

function findCentralHubPosition() {
    // Try to find a position near the center
    const centerX = Math.floor(GRID_COLS / 2);
    const centerY = Math.floor(GRID_ROWS / 2);
    
    // Search in expanding circles around the center
    for (let radius = 0; radius < Math.max(GRID_COLS, GRID_ROWS); radius++) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    
                    if (x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS && grid[y][x] !== 1) {
                        return {
                            x: x * TILE_SIZE,
                            y: y * TILE_SIZE
                        };
                    }
                }
            }
        }
    }
    
    // Fallback to any walkable position
    return findWalkablePosition();
}

function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    if (!gamePaused && !gameOver) {
        update(deltaTime);
    }
    
    render();
    
    animationId = requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // Update player
    player.update();
    
    // Update towers
    towers.forEach(tower => tower.update());
    
    // Update bots
    bots.forEach(bot => bot.update());
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const shouldRemove = bullets[i].update();
        if (shouldRemove) {
            bullets.splice(i, 1);
        }
    }
    
    // Update data mines
    dataMines.forEach(mine => mine.update());
    
    // Check for key collection
    for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i];
        if (checkCollision(player, key)) {
            keys.splice(i, 1);
            collectedKeys++;
            updateKeysCount();
            
            // Trigger city-wide alert in Hacker++ mode
            if (currentGameMode === GAME_MODES.HACKER_PLUS_PLUS) {
                cityWideAlert = true;
                if (alertTimer) clearTimeout(alertTimer);
                alertTimer = setTimeout(() => {
                    cityWideAlert = false;
                }, 10000); // 10 seconds alert
            }
        }
    }
    
    // Check for power-up collection
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        if (!powerUp.collected && checkCollision(player, powerUp)) {
            powerUp.applyEffect();
            powerUp.collected = true;
            powerUps.splice(i, 1);
        }
    }
    
    // Check for data mine collection
    for (let i = dataMines.length - 1; i >= 0; i--) {
        const mine = dataMines[i];
        if (checkCollision(player, mine)) {
            const shards = mine.collectShards();
            collectedShards += shards;
            updateShardsCount();
        }
    }
    
    // System health decay
    systemHealth -= SYSTEM_HEALTH_DECAY_RATE * (deltaTime / 1000);
    updateSystemHealth();
    
    // Check for game over conditions
    if (playerHealth <= 0) {
        endGame(false, "Player health depleted! Cyberia has fallen.");
    } else if (systemHealth <= 0) {
        endGame(false, "System health depleted! AUREX has collapsed.");
    } else if (systemHealth >= 100) {
        endGame(true, "AUREX restored! Cyberia is saved!");
    }
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.size &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.size &&
           obj1.y + obj1.height > obj2.y;
}

function render() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid and map
    drawMap();
    
    // Draw keys
    keys.forEach(key => key.draw());
    
    // Draw shards
    shards.forEach(shard => shard.draw());
    
    // Draw towers
    towers.forEach(tower => tower.draw());
    
    // Draw bots
    bots.forEach(bot => bot.draw());
    
    // Draw power-ups
    powerUps.forEach(powerUp => powerUp.draw());
    
    // Draw data mines
    dataMines.forEach(mine => mine.draw());
    
    // Draw teleport hubs
    teleportHubs.forEach(hub => hub.draw());
    
    // Draw bullets
    bullets.forEach(bullet => bullet.draw());
    
    // Draw player
    if (!isInvisible) {
        player.draw();
    }
    
    // Draw base station
    const basePos = findCentralHubPosition();
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(basePos.x, basePos.y, TILE_SIZE, TILE_SIZE);
    
    // Draw grid lines
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    for (let x = 0; x <= CANVAS_WIDTH; x += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }
}

function drawMap() {
    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            const tileX = x * TILE_SIZE;
            const tileY = y * TILE_SIZE;
            
            if (grid[y][x] === 1) { // Building
                ctx.fillStyle = '#000000';
                ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
            } else if (grid[y][x] === 2) { // Green area
                ctx.fillStyle = '#003300';
                ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

function handleKeyDown(e) {
    if (gamePaused || gameOver) return;
    
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
            player.direction.y = -1;
            break;
        case 'ArrowDown':
        case 's':
            player.direction.y = 1;
            break;
        case 'ArrowLeft':
        case 'a':
            player.direction.x = -1;
            break;
        case 'ArrowRight':
        case 'd':
            player.direction.x = 1;
            break;
    }
}

function handleKeyUp(e) {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
            if (player.direction.y === -1) player.direction.y = 0;
            break;
        case 'ArrowDown':
        case 's':
            if (player.direction.y === 1) player.direction.y = 0;
            break;
        case 'ArrowLeft':
        case 'a':
            if (player.direction.x === -1) player.direction.x = 0;
            break;
        case 'ArrowRight':
        case 'd':
            if (player.direction.x === 1) player.direction.x = 0;
            break;
        case 'p':
            togglePause();
            break;
    }
}

function handleClick(e) {
    if (gamePaused || gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    player.shoot(mouseX, mouseY);
}

function togglePause() {
    gamePaused = !gamePaused;
    document.getElementById('pause-btn').textContent = gamePaused ? 'Resume' : 'Pause';
}

function endGame(win, message) {
    gameOver = true;
    const gameMessage = document.getElementById('game-message');
    gameMessage.textContent = message;
    gameMessage.style.display = 'block';
    gameMessage.style.color = win ? '#00ff00' : '#ff0000';
}

function updateSystemHealth() {
    const healthBar = document.getElementById('system-health');
    healthBar.style.width = `${Math.max(0, systemHealth)}%`;
    healthBar.style.backgroundColor = systemHealth > 30 ? '#00ff00' : '#ff0000';
}

function updatePlayerHealth() {
    const healthBar = document.getElementById('player-health');
    healthBar.style.width = `${Math.max(0, playerHealth)}%`;
    healthBar.style.backgroundColor = playerHealth > 30 ? '#00ff00' : '#ff0000';
}

function updateKeysCount() {
    document.getElementById('keys-count').textContent = collectedKeys;
}

function updateShardsCount() {
    document.getElementById('shards-count').textContent = collectedShards;
}

function spawnBot() {
    if (currentGameMode === GAME_MODES.NORMAL) return;
    
    const types = Object.values(BOT_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const pos = findWalkablePosition();
    bots.push(new Bot(pos.x, pos.y, type));
    
    // Increase spawn rate over time
    botSpawnRate = Math.max(2000, botSpawnRate - 100);
    botSpawnTimer = setTimeout(spawnBot, botSpawnRate);
}

function spawnPowerUp() {
    if (currentGameMode === GAME_MODES.NORMAL) return;
    
    const types = Object.values(POWER_UP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const pos = findWalkablePosition();
    powerUps.push(new PowerUp(pos.x, pos.y, type));
    
    setTimeout(spawnPowerUp, 30000); // Spawn power-up every 30 seconds
}

function setGameMode(mode) {
    currentGameMode = mode;
    resetGame();
}

// Initialize game when window loads
window.onload = initGame;