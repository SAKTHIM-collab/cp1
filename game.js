// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TILE_SIZE = 40;
const GRID_COLS = Math.floor(CANVAS_WIDTH / TILE_SIZE);
const GRID_ROWS = Math.floor(CANVAS_HEIGHT / TILE_SIZE);
const PLAYER_SIZE = 30; // Increased from 20 to 30
const PLAYER_SPEED = 5;
const BULLET_SPEED = 8;
const BULLET_SIZE = 5;
const TOWER_RADIUS = 15;
const TOWER_DETECTION_RANGE = 150;
const TOWER_DAMAGE_RATE = 0.05; // Reduced from 0.1 to 0.05 damage per frame
const KEY_SIZE = 15;
const SHARD_SIZE = 15;
const COIN_SIZE = 10;
const SYSTEM_HEALTH_DECAY_RATE = 1.11; // Increased to make system health reach 0 in 90 seconds (100 health / 90 seconds)
const SHARD_HEALTH_RESTORE = 25; // Each shard restores 25% health (4 shards = 100%)
const BULLET_DAMAGE = 25; // Reduced from default

// Game Modes
const GAME_MODES = {
    NORMAL: 'normal',
    HACKER: 'hacker',
    HACKER_PLUS: 'hacker++'
};

// Power-up Constants
const POWER_UP_TYPES = {
    HEALTH_PACK: 'health_pack',
    INVISIBILITY: 'invisibility',
    SPEED_BOOST: 'speed_boost',
    SHIELD: 'shield',
    DOUBLE_DAMAGE: 'double_damage',
    TIME_SLOW: 'time_slow'
};

// Bot Constants
const BOT_TYPES = {
    LIGHT: 'light',
    HEAVY: 'heavy',
    SNIPER: 'sniper'
};

// Marketplace Constants
const MARKETPLACE_ITEMS = {
    WEAPONS: {
        PISTOL: {
            name: 'Pistol',
            cost: 1,
            damage: 25,
            fireRate: 1,
            maxKills: 5,
            description: 'Basic weapon with moderate damage (5 bot kills)'
        },
        RIFLE: {
            name: 'Rifle',
            cost: 2,
            damage: 40,
            fireRate: 2,
            maxKills: 7,
            description: 'High damage, medium fire rate (7 bot kills)'
        },
        SHOTGUN: {
            name: 'Shotgun',
            cost: 3,
            damage: 60,
            fireRate: 0.5,
            maxKills: 9,
            description: 'High damage, low fire rate, spread shot (9 bot kills)'
        },
        SNIPER: {
            name: 'Sniper',
            cost: 4,
            damage: 100,
            fireRate: 0.3,
            maxKills: 15,
            description: 'Extreme damage, very low fire rate (15 bot kills)'
        }
    },
    UPGRADES: {
        SPEED_BOOST: {
            name: 'Speed Boost',
            cost: 1,
            effect: 1.5,
            duration: 10,
            description: '50% movement speed increase (10s)'
        },
        FIRE_RATE: {
            name: 'Fire Rate',
            cost: 2,
            effect: 1.5,
            duration: 10,
            description: '50% increased fire rate (10s)'
        },
        DAMAGE_BOOST: {
            name: 'Damage Boost',
            cost: 3,
            effect: 2,
            duration: 10,
            description: 'Double damage output (10s)'
        }
    },
    UTILITIES: {
        HEALTH_PACK: {
            name: 'Health Pack',
            cost: 1,
            effect: 30,
            description: 'Restore 30 health points'
        },
        SHIELD: {
            name: 'Shield',
            cost: 2,
            effect: 50,
            duration: 5,
            description: 'Temporary shield that absorbs damage (5s)'
        },
        INVISIBILITY: {
            name: 'Invisibility',
            cost: 3,
            duration: 5,
            description: 'Become invisible to enemies (5s)'
        }
    },
    MINES: {
        BASIC_MINE: {
            name: 'Basic Data Mine',
            cost: 1,
            productionRate: 1,
            maxCapacity: 5,
            buildTime: 10,
            description: 'Produces 1 shard per minute, max 5 shards'
        },
        ADVANCED_MINE: {
            name: 'Advanced Data Mine',
            cost: 2,
            productionRate: 2,
            maxCapacity: 10,
            buildTime: 15,
            description: 'Produces 2 shards per minute, max 10 shards'
        },
        ELITE_MINE: {
            name: 'Elite Data Mine',
            cost: 3,
            productionRate: 3,
            maxCapacity: 15,
            buildTime: 20,
            description: 'Produces 3 shards per minute, max 15 shards'
        }
    },
    TELEPORTS: {
        BASIC_HUB: {
            name: 'Basic Teleport Hub',
            cost: 1,
            description: 'Place a teleport hub with basic functionality and range',
            features: ['150 unit range', 'Basic visibility', 'Custom labeling']
        },
        ADVANCED_HUB: {
            name: 'Advanced Teleport Hub',
            cost: 2,
            description: 'Place a teleport hub with enhanced visibility and range',
            features: ['200 unit range', 'Enhanced visibility', 'Custom labeling', 'Usage statistics']
        },
        ELITE_HUB: {
            name: 'Elite Teleport Hub',
            cost: 3,
            description: 'Place a teleport hub with maximum visibility and range',
            features: ['250 unit range', 'Maximum visibility', 'Custom labeling', 'Usage statistics', 'Priority routing']
        }
    }
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
let coins = [];
let bullets = [];
let bots = [];
let powerUps = [];
let dataMines = [];
let teleportHubs = [];
let safeZones = [];
let systemHealth = 100;
let playerHealth = 100;
let collectedKeys = 0;
let collectedShards = 0;
let collectedCoins = 0;
let teleportHubsAvailable = 0;
let lastTime = 0;
let animationId;
let grid = [];
let viewportX = 0;
let viewportY = 0;
let infiniteMap = [];
let infiniteMapSize = 10; // 10x10 grid of chunks
let playerInvisible = false;
let playerSpeedBoost = false;
let speedBoostEndTime = 0;
let invisibilityEndTime = 0;
let cityWideAlert = false;
let alertEndTime = 0;
let botSpawnRate = 3000; // 3 seconds
let lastBotSpawn = 0;
let currentWeapon = MARKETPLACE_ITEMS.WEAPONS.PISTOL;
let weaponKillsRemaining = 0;
let activeUpgrades = [];
let activeShield = false;
let shieldHealth = 0;
let marketplaceLocation = null;

// Game Objects
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = PLAYER_SIZE;
        this.height = PLAYER_SIZE;
        this.speed = PLAYER_SPEED;
        this.direction = { x: 0, y: 0 };
        this.lastShot = 0;
        this.highlightPulse = 0;
        this.highlightDirection = 0.02;
    }

    update() {
        if (gamePaused || gameOver) return;

        // Update highlight pulse effect
        this.highlightPulse += this.highlightDirection;
        if (this.highlightPulse > 1 || this.highlightPulse < 0) {
            this.highlightDirection *= -1;
        }

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
        // Draw highlight glow
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15 + this.highlightPulse * 10;
        ctx.fillStyle = `rgba(0, 255, 0, ${0.3 + this.highlightPulse * 0.2})`;
        ctx.beginPath();
        ctx.arc(
            this.x + this.width/2,
            this.y + this.height/2,
            this.width * 0.8,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw player body
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw direction indicator
        if (this.direction.x !== 0 || this.direction.y !== 0) {
            ctx.fillStyle = '#ff0000';
            const indicatorSize = this.width * 0.3;
            ctx.fillRect(
                this.x + this.width/2 - indicatorSize/2 + this.direction.x * this.width/2,
                this.y + this.height/2 - indicatorSize/2 + this.direction.y * this.height/2,
                indicatorSize,
                indicatorSize
            );
        }
    }

    shoot(targetX, targetY) {
        if (gamePaused || gameOver) return;

        // Check fire rate
        const now = Date.now();
        if (now - this.lastShot < 1000 / currentWeapon.fireRate) return;
        this.lastShot = now;

        // Calculate direction vector
        const dx = targetX - (this.x + this.width / 2);
        const dy = targetY - (this.y + this.height / 2);
        const length = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / length;
        const dirY = dy / length;

        // Apply damage boost from upgrades
        let damage = currentWeapon.damage;
        const damageBoost = activeUpgrades.find(u => u.type === 'DAMAGE_BOOST');
        if (damageBoost) damage *= damageBoost.effect;

        bullets.push(new Bullet(
            this.x + this.width / 2 - BULLET_SIZE / 2,
            this.y + this.height / 2 - BULLET_SIZE / 2,
            dirX,
            dirY,
            false,
            damage
        ));

        // Special effects for different weapons
        if (currentWeapon.name === 'Shotgun') {
            // Create spread pattern
            for (let i = -2; i <= 2; i++) {
                const spread = i * 0.2;
                const newDirX = dirX * Math.cos(spread) - dirY * Math.sin(spread);
                const newDirY = dirX * Math.sin(spread) + dirY * Math.cos(spread);
                bullets.push(new Bullet(
                    this.x + this.width / 2 - BULLET_SIZE / 2,
                    this.y + this.height / 2 - BULLET_SIZE / 2,
                    newDirX,
                    newDirY,
                    false,
                    damage * 0.7
                ));
            }
        }
    }
}

class Bullet {
    constructor(x, y, dirX, dirY, isEnemyBullet = false, damage = 25) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.speed = BULLET_SPEED;
        this.size = BULLET_SIZE;
        this.bounces = 0;
        this.maxBounces = 5;
        this.isEnemyBullet = isEnemyBullet;
        this.damage = damage;
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
                    if (bot.takeDamage(currentWeapon.damage)) {
                        bots.splice(i, 1);
                    }
                    return true;
                }
            }
        }

        // Check for collisions with player (only enemy bullets)
        if (this.isEnemyBullet && !playerInvisible) {
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
        this.isActive = true;  // Add isActive property
    }

    update() {
        if (!this.isActive) return;  // Skip update if tower is inactive

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
        this.isChasing = false;
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

        // Only chase if player is not invisible and not in safe zone
        if ((distance < this.detectionRange || cityWideAlert) && !playerInvisible && !safeZones.some(zone => zone.isPlayerInZone())) {
            this.isChasing = true;
            this.target = player;
        } else {
            this.isChasing = false;
            this.target = null;
        }

        // Move towards target or patrol point
        if (this.target) {
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;

            // Shoot if in range and player is not invisible
            if (distance < 100 && this.shootCooldown <= 0 && !playerInvisible) {
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
            true, // isEnemyBullet
            5 // Reduced damage from default
        ));
    }

    draw() {
        ctx.fillStyle = this.getBotColor();
        ctx.fillRect(this.x - viewportX, this.y - viewportY, this.size, this.size);
        
        // Draw detection range only if not chasing invisible player
        if (this.isChasing && !playerInvisible) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x + this.size / 2 - viewportX, this.y + this.size / 2 - viewportY, this.detectionRange, 0, Math.PI * 2);
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

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            if (weaponKillsRemaining > 0) {
                weaponKillsRemaining--;
                if (weaponKillsRemaining === 0) {
                    currentWeapon = MARKETPLACE_ITEMS.WEAPONS.PISTOL;
                    showPowerUpIndicator('Weapon depleted! Switched to default pistol.');
                }
            }
            return true;
        }
        return false;
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 20;
        this.collected = false;
        this.rotation = 0;
        this.pulseScale = 1;
        this.pulseDirection = 0.02;
    }

    update() {
        // Rotate power-up
        this.rotation += 0.02;
        
        // Pulse effect
        this.pulseScale += this.pulseDirection;
        if (this.pulseScale > 1.2 || this.pulseScale < 0.8) {
            this.pulseDirection *= -1;
        }
    }

    draw() {
        if (this.collected) return;

        ctx.save();
        ctx.translate(this.x + this.size / 2 - viewportX, this.y + this.size / 2 - viewportY);
        ctx.rotate(this.rotation);
        ctx.scale(this.pulseScale, this.pulseScale);

        // Draw power-up base
        ctx.fillStyle = this.getPowerUpColor();
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw power-up icon
        ctx.fillStyle = '#ffffff';
        this.drawPowerUpIcon();

        ctx.restore();
    }

    drawPowerUpIcon() {
        switch(this.type) {
            case POWER_UP_TYPES.HEALTH_PACK:
                // Draw plus symbol
                ctx.fillRect(-4, -8, 8, 16);
                ctx.fillRect(-8, -4, 16, 8);
                break;
            case POWER_UP_TYPES.INVISIBILITY:
                // Draw eye symbol
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case POWER_UP_TYPES.SPEED_BOOST:
                // Draw lightning bolt
                ctx.beginPath();
                ctx.moveTo(-4, -8);
                ctx.lineTo(4, 0);
                ctx.lineTo(-4, 8);
                ctx.lineTo(4, 0);
                ctx.closePath();
                ctx.fill();
                break;
            case POWER_UP_TYPES.SHIELD:
                // Draw shield symbol
                ctx.beginPath();
                ctx.arc(0, 0, 6, Math.PI, 0);
                ctx.fill();
                break;
            case POWER_UP_TYPES.DOUBLE_DAMAGE:
                // Draw X symbol
                ctx.beginPath();
                ctx.moveTo(-6, -6);
                ctx.lineTo(6, 6);
                ctx.moveTo(6, -6);
                ctx.lineTo(-6, 6);
                ctx.stroke();
                break;
            case POWER_UP_TYPES.TIME_SLOW:
                // Draw clock symbol
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -4);
                ctx.moveTo(0, 0);
                ctx.lineTo(4, 0);
                ctx.stroke();
                break;
        }
    }

    getPowerUpColor() {
        switch(this.type) {
            case POWER_UP_TYPES.HEALTH_PACK: return '#00ff00';
            case POWER_UP_TYPES.INVISIBILITY: return '#0000ff';
            case POWER_UP_TYPES.SPEED_BOOST: return '#ffff00';
            case POWER_UP_TYPES.SHIELD: return '#ff00ff';
            case POWER_UP_TYPES.DOUBLE_DAMAGE: return '#ff0000';
            case POWER_UP_TYPES.TIME_SLOW: return '#00ffff';
            default: return '#ffffff';
        }
    }

    applyEffect() {
        switch(this.type) {
            case POWER_UP_TYPES.HEALTH_PACK:
                playerHealth = Math.min(100, playerHealth + 30);
                updatePlayerHealth();
                showPowerUpIndicator('Health Restored!');
                break;
            case POWER_UP_TYPES.INVISIBILITY:
                playerInvisible = true;
                if (invisibilityEndTime) clearTimeout(invisibilityEndTime);
                invisibilityEndTime = setTimeout(() => {
                    playerInvisible = false;
                    showPowerUpIndicator('Invisibility Ended');
                }, 5000);
                showPowerUpIndicator('Invisibility Activated!');
                break;
            case POWER_UP_TYPES.SPEED_BOOST:
                const originalSpeed = player.speed;
                player.speed *= 1.5;
                setTimeout(() => {
                    player.speed = originalSpeed;
                    showPowerUpIndicator('Speed Boost Ended');
                }, 5000);
                showPowerUpIndicator('Speed Boost Activated!');
                break;
            case POWER_UP_TYPES.SHIELD:
                playerHealth = Math.min(100, playerHealth + 50);
                updatePlayerHealth();
                showPowerUpIndicator('Shield Activated!');
                break;
            case POWER_UP_TYPES.DOUBLE_DAMAGE:
                BULLET_DAMAGE *= 2;
                setTimeout(() => {
                    BULLET_DAMAGE /= 2;
                    showPowerUpIndicator('Double Damage Ended');
                }, 5000);
                showPowerUpIndicator('Double Damage Activated!');
                break;
            case POWER_UP_TYPES.TIME_SLOW:
                // Slow down all enemies
                bots.forEach(bot => bot.speed *= 0.5);
                setTimeout(() => {
                    bots.forEach(bot => bot.speed *= 2);
                    showPowerUpIndicator('Time Slow Ended');
                }, 5000);
                showPowerUpIndicator('Time Slow Activated!');
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
        this.storedShards = 0;
        this.lastProductionTime = Date.now();
        this.buildProgress = 0;
        this.buildTime = 10; // 10 seconds build time
        this.isBuilt = false;
        this.isCollecting = false;
    }

    update() {
        if (!this.isBuilt) {
            this.buildProgress += 1/60; // Assuming 60 FPS
            if (this.buildProgress >= this.buildTime) {
                this.isBuilt = true;
                showPowerUpIndicator('⛏️ Data Mine construction complete!');
            }
            return;
        }

        const now = Date.now();
        const timeDiff = (now - this.lastProductionTime) / 1000; // Convert to seconds
        
        if (timeDiff >= 60 / this.productionRate && this.storedShards < this.maxCapacity) {
            this.storedShards++;
            this.lastProductionTime = now;
            if (this.storedShards === this.maxCapacity) {
                showPowerUpIndicator('⛏️ Data Mine has reached maximum capacity!');
            }
        }
    }

    draw() {
        // Draw mine base
        ctx.fillStyle = this.isBuilt ? '#00ffff' : '#666666';
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2 - viewportX, this.y + this.size / 2 - viewportY, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        if (!this.isBuilt) {
            // Draw build progress
            const progress = (this.buildProgress / this.buildTime) * 100;
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.fillText(`${Math.floor(progress)}%`, this.x + this.size / 2 - 10 - viewportX, this.y + this.size / 2 + 4 - viewportY);
        } else {
            // Draw shard count
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.fillText(`${this.storedShards}/${this.maxCapacity}`, this.x + this.size / 2 - 15 - viewportX, this.y + this.size / 2 + 4 - viewportY);
            
            // Draw collection indicator if player is nearby
            if (this.isPlayerNearby() && this.storedShards > 0) {
                ctx.fillStyle = '#00ff00';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('Press E to collect', this.x + this.size / 2 - 30 - viewportX, this.y - 10 - viewportY);
            }
        }
    }

    isPlayerNearby() {
        const dx = (player.x + player.width/2) - (this.x + this.size/2);
        const dy = (player.y + player.height/2) - (this.y + this.size/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 50;
    }

    collectShards() {
        if (!this.isBuilt || this.isCollecting) return 0;
        
        this.isCollecting = true;
        const shards = this.storedShards;
        this.storedShards = 0;
        this.lastProductionTime = Date.now();
        
        showPowerUpIndicator(`⛏️ Collected ${shards} shards from Data Mine!`);
        
        // Reset collection state after a short delay
        setTimeout(() => {
            this.isCollecting = false;
        }, 1000);
        
        return shards;
    }
}

class TeleportHub {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 30;
        this.label = this.generateLabel();
        this.isActive = true;
        this.pulseScale = 1;
        this.pulseDirection = 0.02;
        this.range = this.getRange();
        this.visibility = this.getVisibility();
        this.customLabel = null; // Add support for custom labels
        this.description = ''; // Add support for descriptions
        this.lastUsed = Date.now(); // Track last usage time
        this.usageCount = 0; // Track number of times used
    }

    generateLabel() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return `HUB-${letters[Math.floor(Math.random() * letters.length)]}`;
    }

    setCustomLabel(label) {
        this.customLabel = label;
    }

    setDescription(description) {
        this.description = description;
    }

    getDisplayLabel() {
        return this.customLabel || this.label;
    }

    getRange() {
        switch(this.type) {
            case 'BASIC_HUB': return 150;
            case 'ADVANCED_HUB': return 200;
            case 'ELITE_HUB': return 250;
            default: return 150;
        }
    }

    getVisibility() {
        switch(this.type) {
            case 'BASIC_HUB': return 0.3;
            case 'ADVANCED_HUB': return 0.5;
            case 'ELITE_HUB': return 0.7;
            default: return 0.3;
        }
    }

    update() {
        // Pulse effect
        this.pulseScale += this.pulseDirection;
        if (this.pulseScale > 1.2 || this.pulseScale < 0.8) {
            this.pulseDirection *= -1;
        }
    }

    draw() {
        if (!this.isActive) return;

        ctx.save();
        ctx.translate(this.x + this.size / 2 - viewportX, this.y + this.size / 2 - viewportY);
        ctx.scale(this.pulseScale, this.pulseScale);

        // Draw range indicator
        ctx.strokeStyle = `rgba(255, 0, 255, ${this.visibility})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.range, 0, Math.PI * 2);
        ctx.stroke();

        // Draw hub base
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw hub icon
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(8, 0);
        ctx.lineTo(-8, 8);
        ctx.closePath();
        ctx.fill();

        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.getDisplayLabel(), 0, -20);

        // Draw usage count if greater than 0
        if (this.usageCount > 0) {
            ctx.font = '10px Arial';
            ctx.fillText(`Used: ${this.usageCount}`, 0, 10);
        }

        ctx.restore();
    }

    isPlayerInRange() {
        const dx = (player.x + player.width/2) - (this.x + this.size/2);
        const dy = (player.y + player.height/2) - (this.y + this.size/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.range;
    }

    teleportTo(targetHub) {
        if (!this.isActive || !targetHub.isActive) return false;
        
        // Add teleport effect
        showPowerUpIndicator(`Teleporting to ${targetHub.getDisplayLabel()}...`);
        
        // Move player to target hub
        player.x = targetHub.x;
        player.y = targetHub.y;
        
        // Update usage statistics
        this.lastUsed = Date.now();
        this.usageCount++;
        targetHub.lastUsed = Date.now();
        targetHub.usageCount++;
        
        return true;
    }
}

class Marketplace {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.isOpen = false;
    }

    draw() {
        // Draw marketplace building with more visible appearance
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - viewportX, this.y - viewportY, this.size, this.size);
        
        // Draw marketplace icon with glow effect
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('$', this.x + this.size/2 - 8 - viewportX, this.y + this.size/2 + 8 - viewportY);
        ctx.shadowBlur = 0;
        
        // Draw interaction radius with more visible effect
        if (this.isPlayerNearby()) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.size/2 - viewportX, this.y + this.size/2 - viewportY, 50, 0, Math.PI * 2);
            ctx.stroke();
            
            // Add pulsing effect
            const pulseSize = 50 + Math.sin(Date.now() / 200) * 5;
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(this.x + this.size/2 - viewportX, this.y + this.size/2 - viewportY, pulseSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    isPlayerNearby() {
        const dx = (player.x + player.width/2) - (this.x + this.size/2);
        const dy = (player.y + player.height/2) - (this.y + this.size/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 50;
    }

    open() {
        this.isOpen = true;
        gamePaused = true;
        document.getElementById('pause-btn').textContent = 'Resume';
        const marketplace = document.getElementById('marketplace');
        marketplace.style.display = 'block';
    }

    close() {
        this.isOpen = false;
        gamePaused = false;
        document.getElementById('pause-btn').textContent = 'Pause';
        const marketplace = document.getElementById('marketplace');
        marketplace.style.display = 'none';
        
        // Ensure game resumes properly
        if (!gameOver) {
            lastTime = performance.now();
            requestAnimationFrame(gameLoop);
        }
    }
}

// Add SafeZone class after the Marketplace class
class SafeZone {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE * 3;  // 3x3 tile safe zone
        this.height = TILE_SIZE * 3;
        this.isActive = true;
        this.pulseScale = 1;
        this.pulseDirection = 0.02;
    }

    update() {
        // Pulse effect for visual feedback
        this.pulseScale += this.pulseDirection;
        if (this.pulseScale > 1.2 || this.pulseScale < 0.8) {
            this.pulseDirection *= -1;
        }
    }

    draw() {
        if (!this.isActive) return;

        // Draw safe zone with pulsing effect
        ctx.save();
        ctx.translate(this.x + this.width/2 - viewportX, this.y + this.height/2 - viewportY);
        ctx.scale(this.pulseScale, this.pulseScale);
        
        // Draw outer glow
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Draw border
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Draw safe zone symbol
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SAFE', 0, 0);
        
        ctx.restore();
    }

    isPlayerInZone() {
        return player.x + player.width > this.x &&
               player.x < this.x + this.width &&
               player.y + player.height > this.y &&
               player.y < this.y + this.height;
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
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    // Reset game state
    gameOver = false;
    gamePaused = false;
    systemHealth = 100;
    playerHealth = 100;
    collectedKeys = 0;
    collectedShards = 0;
    collectedCoins = 0;
    playerInvisible = false;
    cityWideAlert = false;
    
    if (invisibilityEndTime) clearTimeout(invisibilityEndTime);
    if (alertEndTime) clearTimeout(alertEndTime);
    
    updateSystemHealth();
    updatePlayerHealth();
    updateKeysCount();
    updateShardsCount();
    updateCoinsCount();
    
    // Hide game message
    const gameMessage = document.getElementById('game-message');
    gameMessage.style.display = 'none';
    gameMessage.textContent = '';
    
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
    const keyCount = currentGameMode === GAME_MODES.HACKER_PLUS ? 25 : 15; // More keys in Hacker++ mode
    for (let i = 0; i < keyCount; i++) {
        const pos = findWalkablePosition();
        keys.push(new Key(pos.x, pos.y));
    }
    
    // Initialize marketplace (only in Hacker modes)
    if (currentGameMode !== GAME_MODES.NORMAL) {
        initMarketplace();
    }
    
    // Create shards
    shards = [];
    const shardCount = currentGameMode === GAME_MODES.HACKER_PLUS ? 20 : 10; // More shards in Hacker++ mode
    
    if (currentGameMode === GAME_MODES.NORMAL) {
        // In normal mode, place shards randomly around the map
        for (let i = 0; i < shardCount; i++) {
            const pos = findWalkablePosition();
            shards.push(new DataShard(pos.x, pos.y));
        }
    } else if (marketplaceLocation) {
        // In Hacker modes, place shards near marketplace
        const minDistance = TILE_SIZE * 2;
        const maxDistance = TILE_SIZE * 4;
        
        for (let i = 0; i < shardCount; i++) {
            let shardX, shardY;
            let attempts = 0;
            const maxAttempts = 20;
            
            do {
                const angle = Math.random() * Math.PI * 2;
                const distance = minDistance + Math.random() * (maxDistance - minDistance);
                
                shardX = marketplaceLocation.x + Math.cos(angle) * distance;
                shardY = marketplaceLocation.y + Math.sin(angle) * distance;
                
                shardX = Math.max(0, Math.min(CANVAS_WIDTH - SHARD_SIZE, shardX));
                shardY = Math.max(0, Math.min(CANVAS_HEIGHT - SHARD_SIZE, shardY));
                
                const gridX = Math.floor(shardX / TILE_SIZE);
                const gridY = Math.floor(shardY / TILE_SIZE);
                
                if (grid[gridY][gridX] !== 1) {
                    shards.push(new DataShard(shardX, shardY));
                    break;
                }
                
                attempts++;
            } while (attempts < maxAttempts);
        }
    }
    
    // Initialize mode-specific elements
    bots = [];
    powerUps = [];
    dataMines = [];
    teleportHubs = [];
    safeZones = [];
    teleportHubsAvailable = 3;
    
    if (currentGameMode !== GAME_MODES.NORMAL) {
        // Start bot spawning
        botSpawnRate = 3000;
        spawnBot();
        
        // Start power-up spawning
        spawnPowerUp();

        // Create safe zones (only in Hacker modes)
        const safeZoneCount = 3;
        for (let i = 0; i < safeZoneCount; i++) {
            const pos = findWalkablePosition();
            safeZones.push(new SafeZone(pos.x, pos.y));
        }
    }
    
    bullets = [];

    // Reset marketplace items
    currentWeapon = MARKETPLACE_ITEMS.WEAPONS.PISTOL;
    weaponKillsRemaining = 0;
    activeUpgrades = [];
    activeShield = false;
    shieldHealth = 0;
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
    // Try to find a position near the center of the map
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
            if (currentGameMode === GAME_MODES.HACKER_PLUS) {
                cityWideAlert = true;
                if (alertEndTime) clearTimeout(alertEndTime);
                alertEndTime = setTimeout(() => {
                    cityWideAlert = false;
                }, 10000); // 10 seconds alert
            }
        }
    }
    
    // Check for shard collection (only if player has keys)
    for (let i = shards.length - 1; i >= 0; i--) {
        const shard = shards[i];
        if (checkCollision(player, shard) && collectedKeys > 0) {
            shards.splice(i, 1);
            collectedKeys--;
            collectedShards++;
            updateKeysCount();
            updateShardsCount();
        }
    }
    
    // Update power-ups
    powerUps.forEach(powerUp => powerUp.update());

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
    
    // Check if player is at server and has shards
    const basePos = findCentralHubPosition();
    const dx = (player.x + player.width/2) - (basePos.x + TILE_SIZE/2);
    const dy = (player.y + player.height/2) - (basePos.y + TILE_SIZE/2);
    const distanceToServer = Math.sqrt(dx * dx + dy * dy);
    
    if (distanceToServer < TILE_SIZE && collectedShards > 0) {
        // Calculate health to restore based on available shards
        const healthToRestore = Math.min(SHARD_HEALTH_RESTORE * collectedShards, 100 - systemHealth);
        const shardsNeeded = Math.ceil(healthToRestore / SHARD_HEALTH_RESTORE);
        
        if (shardsNeeded > 0) {
            systemHealth = Math.min(100, systemHealth + healthToRestore);
            collectedShards -= shardsNeeded;
            updateShardsCount();
            updateSystemHealth();
            showPowerUpIndicator(`Server health restored by ${healthToRestore}% using ${shardsNeeded} shard${shardsNeeded > 1 ? 's' : ''}!`);
            
            // Check if server is fully restored
            if (systemHealth >= 100) {
                endGame(true, "Server fully restored! Cyberia is saved!");
            }
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
    }
    
    // Update marketplace interaction
    if (marketplaceLocation) {
        if (marketplaceLocation.isPlayerNearby()) {
            if (!marketplaceLocation.isOpen) {
                marketplaceLocation.open();
            }
        } else if (marketplaceLocation.isOpen) {
            marketplaceLocation.close();
        }
    }

    // Update active upgrades
    const now = Date.now();
    activeUpgrades = activeUpgrades.filter(upgrade => now < upgrade.endTime);

    // Update safe zones
    if (currentGameMode !== GAME_MODES.NORMAL) {
        safeZones.forEach(zone => zone.update());
        
        // Check if player is in any safe zone
        const playerInSafeZone = safeZones.some(zone => zone.isPlayerInZone());
        
        // If player is in safe zone, make them immune to damage
        if (playerInSafeZone) {
            // Disable tower damage
            towers.forEach(tower => {
                tower.isActive = false;
            });
            
            // Make bots stop chasing
            bots.forEach(bot => {
                bot.isChasing = false;
                bot.target = null;
            });
            
            // Show safe zone indicator
            if (!document.getElementById('safe-zone-indicator').classList.contains('active')) {
                showSafeZoneIndicator();
            }
        } else {
            // Re-enable tower damage
            towers.forEach(tower => {
                tower.isActive = true;
            });
            
            // Hide safe zone indicator
            document.getElementById('safe-zone-indicator').classList.remove('active');
        }
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
    
    // Draw marketplace first to ensure it's visible
    if (marketplaceLocation) {
        marketplaceLocation.draw();
    }
    
    // Draw other game elements
    keys.forEach(key => key.draw());
    shards.forEach(shard => shard.draw());
    towers.forEach(tower => tower.draw());
    bots.forEach(bot => bot.draw());
    powerUps.forEach(powerUp => powerUp.draw());
    dataMines.forEach(mine => mine.draw());
    teleportHubs.forEach(hub => hub.draw());
    bullets.forEach(bullet => bullet.draw());
    
    // Draw player
    if (!playerInvisible) {
        player.draw();
    }
    
    // Draw base station with health indicator
    const basePos = findCentralHubPosition();
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(basePos.x, basePos.y, TILE_SIZE, TILE_SIZE);
    
    // Draw server health indicator
    const healthBarWidth = TILE_SIZE;
    const healthBarHeight = 5;
    const healthBarX = basePos.x;
    const healthBarY = basePos.y - 10;
    
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // Health level
    ctx.fillStyle = systemHealth > 30 ? '#00ff00' : '#ff0000';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * (systemHealth / 100), healthBarHeight);
    
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

    // Draw safe zones (only in Hacker modes)
    if (currentGameMode !== GAME_MODES.NORMAL) {
        safeZones.forEach(zone => zone.draw());
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

function updateCoinsCount() {
    document.getElementById('coins-count').textContent = collectedCoins;
}

function spawnBot() {
    if (currentGameMode === GAME_MODES.NORMAL) return;
    
    const types = Object.values(BOT_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const pos = findWalkablePosition();
    bots.push(new Bot(pos.x, pos.y, type));
    
    // Decrease spawn rate more gradually and set a higher minimum
    botSpawnRate = Math.max(5000, botSpawnRate - 10); // Changed from 2000 to 5000 and 20 to 10
    lastBotSpawn = setTimeout(spawnBot, botSpawnRate);
}

function spawnPowerUp() {
    if (currentGameMode === GAME_MODES.NORMAL) return;
    
    const types = Object.values(POWER_UP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const pos = findWalkablePosition();
    powerUps.push(new PowerUp(pos.x, pos.y, type));
    
    // Spawn power-ups more frequently in Hacker++ mode
    const spawnDelay = currentGameMode === GAME_MODES.HACKER_PLUS ? 20000 : 30000;
    setTimeout(spawnPowerUp, spawnDelay);
}

function setGameMode(mode) {
    currentGameMode = mode;
    resetGame();
    
    // Update UI based on mode
    document.getElementById('normal-mode').classList.remove('active');
    document.getElementById('hacker-mode').classList.remove('active');
    document.getElementById('hacker-plus-mode').classList.remove('active');
    document.getElementById(`${mode}-mode`).classList.add('active');
    
    // Handle mode-specific UI elements
    const isHackerMode = mode === GAME_MODES.HACKER || mode === GAME_MODES.HACKER_PLUS;
    const isHackerPlusMode = mode === GAME_MODES.HACKER_PLUS;
    
    // Show shards display in all modes
    document.getElementById('shards-display').style.display = 'flex';
    document.getElementById('coins-display').style.display = isHackerMode ? 'flex' : 'none';
    document.getElementById('teleport-display').style.display = isHackerPlusMode ? 'flex' : 'none';
    document.getElementById('teleport-btn').style.display = isHackerPlusMode ? 'block' : 'none';
    document.getElementById('mine-btn').style.display = isHackerPlusMode ? 'block' : 'none';
    document.getElementById('power-up-panel').style.display = isHackerMode ? 'block' : 'none';
    
    // Handle marketplace visibility
    const marketplace = document.getElementById('marketplace');
    if (!isHackerMode) {
        marketplace.style.display = 'none';
        if (marketplaceLocation) {
            marketplaceLocation.close();
        }
    } else {
        initMarketplace();
    }
}

function placeTeleportHub() {
    if (teleportHubsAvailable > 0) {
        const pos = findWalkablePosition();
        const label = `HUB${teleportHubs.length + 1}`;
        teleportHubs.push(new TeleportHub(pos.x, pos.y, label));
        teleportHubsAvailable--;
        updateTeleportCount();
    }
}

function placeDataMine() {
    const pos = findWalkablePosition();
    dataMines.push(new DataMine(pos.x, pos.y));
}

function updateTeleportCount() {
    document.getElementById('teleport-count').textContent = teleportHubsAvailable;
}

// Add marketplace functions
function initMarketplace() {
    // Only initialize marketplace in Hacker and Hacker++ modes
    if (currentGameMode === GAME_MODES.NORMAL) {
        marketplaceLocation = null;
        return;
    }
    
    // For Hacker modes, use the existing marketplace logic
    const serverPos = findCentralHubPosition();
    const minDistance = TILE_SIZE * 3;
    const maxDistance = TILE_SIZE * 6;
    
    let marketplaceX, marketplaceY;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
        const angle = Math.random() * Math.PI * 2;
        const distance = minDistance + Math.random() * (maxDistance - minDistance);
        
        marketplaceX = serverPos.x + Math.cos(angle) * distance;
        marketplaceY = serverPos.y + Math.sin(angle) * distance;
        
        marketplaceX = Math.max(0, Math.min(CANVAS_WIDTH - TILE_SIZE, marketplaceX));
        marketplaceY = Math.max(0, Math.min(CANVAS_HEIGHT - TILE_SIZE, marketplaceY));
        
        const gridX = Math.floor(marketplaceX / TILE_SIZE);
        const gridY = Math.floor(marketplaceY / TILE_SIZE);
        
        if (grid[gridY][gridX] !== 1) {
            break;
        }
        
        attempts++;
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
        marketplaceX = TILE_SIZE * 2;
        marketplaceY = TILE_SIZE * 2;
    }
    
    marketplaceLocation = new Marketplace(marketplaceX, marketplaceY);
    
    // Add click handlers for marketplace items
    document.querySelectorAll('.marketplace-item').forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;
            const itemName = item.dataset.item;
            buyItem(category, itemName);
        });
    });
}

function showMarketplaceUI() {
    const marketplace = document.getElementById('marketplace');
    marketplace.style.display = 'block';
    
    // Update all item costs in the UI
    Object.keys(MARKETPLACE_ITEMS).forEach(category => {
        Object.keys(MARKETPLACE_ITEMS[category]).forEach(item => {
            const itemData = MARKETPLACE_ITEMS[category][item];
            const itemElement = document.querySelector(`[data-category="${category}"][data-item="${item}"]`);
            if (itemElement) {
                const costElement = itemElement.querySelector('.item-cost');
                if (costElement) {
                    costElement.textContent = `${itemData.cost} shards`;
                }
            }
        });
    });
}

function buyItem(category, itemName) {
    const itemData = MARKETPLACE_ITEMS[category][itemName];
    console.log('Attempting to buy:', itemData.name, 'Cost:', itemData.cost, 'Current shards:', collectedShards);
    
    if (collectedShards >= itemData.cost) {
        // Deduct shards first
        collectedShards -= itemData.cost;
        updateShardsCount();

        switch(category) {
            case 'WEAPONS':
                currentWeapon = itemData;
                weaponKillsRemaining = itemData.maxKills;
                showPowerUpIndicator(`🎯 ${itemData.name} purchased and equipped!\nDamage: ${itemData.damage}\nFire Rate: ${itemData.fireRate}x\nKills Remaining: ${weaponKillsRemaining}`);
                break;
            case 'UPGRADES':
                const upgrade = {
                    type: itemName,
                    effect: itemData.effect,
                    endTime: Date.now() + itemData.duration * 1000
                };
                activeUpgrades.push(upgrade);
                
                // Apply upgrade effects
                if (itemName === 'SPEED_BOOST') {
                    const originalSpeed = player.speed;
                    player.speed *= itemData.effect;
                    showPowerUpIndicator(`⚡ Speed Boost activated!\nMovement speed increased by 50%\nDuration: ${itemData.duration}s`);
                    setTimeout(() => {
                        player.speed = originalSpeed;
                        showPowerUpIndicator('Speed Boost ended!');
                    }, itemData.duration * 1000);
                } else if (itemName === 'FIRE_RATE') {
                    const originalFireRate = currentWeapon.fireRate;
                    currentWeapon.fireRate *= itemData.effect;
                    showPowerUpIndicator(`🔥 Fire Rate Boost activated!\nFire rate increased by 50%\nDuration: ${itemData.duration}s`);
                    setTimeout(() => {
                        currentWeapon.fireRate = originalFireRate;
                        showPowerUpIndicator('Fire Rate boost ended!');
                    }, itemData.duration * 1000);
                } else if (itemName === 'DAMAGE_BOOST') {
                    const originalDamage = currentWeapon.damage;
                    currentWeapon.damage *= itemData.effect;
                    showPowerUpIndicator(`💥 Damage Boost activated!\nDamage output doubled\nDuration: ${itemData.duration}s`);
                    setTimeout(() => {
                        currentWeapon.damage = originalDamage;
                        showPowerUpIndicator('Damage Boost ended!');
                    }, itemData.duration * 1000);
                }
                break;
            case 'UTILITIES':
                switch(itemName) {
                    case 'HEALTH_PACK':
                        playerHealth = Math.min(100, playerHealth + itemData.effect);
                        updatePlayerHealth();
                        showPowerUpIndicator(`❤️ Health Pack used!\nRestored ${itemData.effect} health points\nCurrent Health: ${playerHealth}%`);
                        break;
                    case 'SHIELD':
                        activeShield = true;
                        shieldHealth = itemData.effect;
                        showPowerUpIndicator(`🛡️ Shield activated!\nDamage absorption: ${itemData.effect}\nDuration: ${itemData.duration}s`);
                        setTimeout(() => {
                            activeShield = false;
                            shieldHealth = 0;
                            showPowerUpIndicator('Shield depleted!');
                        }, itemData.duration * 1000);
                        break;
                    case 'INVISIBILITY':
                        playerInvisible = true;
                        // Make all bots stop chasing
                        bots.forEach(bot => {
                            bot.isChasing = false;
                            bot.target = null;
                        });
                        showPowerUpIndicator(`👻 Invisibility activated!\nEnemies cannot detect or target you\nDuration: ${itemData.duration}s`);
                        setTimeout(() => {
                            playerInvisible = false;
                            showPowerUpIndicator('Invisibility ended!');
                        }, itemData.duration * 1000);
                        break;
                }
                break;
            case 'MINES':
                if (dataMines.length < 3) {
                    const minePos = findWalkablePosition();
                    const mine = new DataMine(minePos.x, minePos.y);
                    mine.productionRate = itemData.productionRate;
                    mine.maxCapacity = itemData.maxCapacity;
                    mine.buildTime = itemData.buildTime;
                    dataMines.push(mine);
                    showPowerUpIndicator(`⛏️ ${itemData.name} placed!\nProduction Rate: ${itemData.productionRate} shards/min\nMax Capacity: ${itemData.maxCapacity} shards\nBuild Time: ${itemData.buildTime}s`);
                } else {
                    showPowerUpIndicator('❌ Maximum mines reached! (3)');
                    // Refund the shards since we can't place the mine
                    collectedShards += itemData.cost;
                    updateShardsCount();
                }
                break;
        }
    } else {
        showPowerUpIndicator(`❌ Not enough shards!\nYou need ${itemData.cost} shards to purchase ${itemData.name}\nCurrent shards: ${collectedShards}`);
    }
}

// Update the updateShardsCount function to ensure it's properly updating the UI
function updateShardsCount() {
    const shardCountElement = document.getElementById('shards-count');
    if (shardCountElement) {
        shardCountElement.textContent = collectedShards;
    }
}

// Update the marketplace interaction
function updateMarketplaceInteraction() {
    if (marketplaceLocation && marketplaceLocation.isPlayerNearby() && 
        (currentGameMode === GAME_MODES.HACKER || currentGameMode === GAME_MODES.HACKER_PLUS)) {
        showMarketplaceNotification();
        // Remove automatic opening and pausing
        if (marketplaceLocation.isOpen) {
            marketplaceLocation.close();
            const marketplace = document.getElementById('marketplace');
            marketplace.style.display = 'none';
        }
    }
}

// Add keyboard event listener for marketplace
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm' && 
        (currentGameMode === GAME_MODES.HACKER || currentGameMode === GAME_MODES.HACKER_PLUS) &&
        marketplaceLocation && 
        marketplaceLocation.isPlayerNearby()) {
        if (!marketplaceLocation.isOpen) {
            marketplaceLocation.open();
        } else {
            marketplaceLocation.close();
        }
    }
});

// Add function to show safe zone indicator
function showSafeZoneIndicator() {
    const indicator = document.getElementById('safe-zone-indicator');
    indicator.classList.add('active');
    indicator.textContent = 'Safe Zone Active';
}

// Add teleportation UI and controls
function showTeleportUI() {
    const teleportUI = document.createElement('div');
    teleportUI.id = 'teleport-ui';
    teleportUI.style.display = 'none';
    teleportUI.style.position = 'absolute';
    teleportUI.style.top = '50%';
    teleportUI.style.left = '50%';
    teleportUI.style.transform = 'translate(-50%, -50%)';
    teleportUI.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    teleportUI.style.padding = '20px';
    teleportUI.style.borderRadius = '10px';
    teleportUI.style.zIndex = '1000';
    teleportUI.style.minWidth = '300px';
    teleportUI.style.color = '#ffffff';

    const title = document.createElement('h3');
    title.textContent = 'Teleport Network';
    title.style.color = '#ffffff';
    title.style.marginBottom = '20px';
    title.style.textAlign = 'center';
    teleportUI.appendChild(title);

    // Add tabs for different views
    const tabContainer = document.createElement('div');
    tabContainer.style.display = 'flex';
    tabContainer.style.marginBottom = '15px';
    tabContainer.style.borderBottom = '1px solid #ff00ff';

    const views = ['All Hubs', 'Recent', 'Favorites'];
    views.forEach(view => {
        const tab = document.createElement('button');
        tab.textContent = view;
        tab.style.flex = '1';
        tab.style.padding = '10px';
        tab.style.backgroundColor = 'transparent';
        tab.style.border = 'none';
        tab.style.color = '#ffffff';
        tab.style.cursor = 'pointer';
        tab.onclick = () => switchTeleportView(view);
        tabContainer.appendChild(tab);
    });
    teleportUI.appendChild(tabContainer);

    const hubList = document.createElement('div');
    hubList.id = 'hub-list';
    hubList.style.maxHeight = '300px';
    hubList.style.overflowY = 'auto';
    teleportUI.appendChild(hubList);

    // Add custom label input
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.placeholder = 'Enter custom label';
    labelInput.style.width = '100%';
    labelInput.style.padding = '8px';
    labelInput.style.marginTop = '15px';
    labelInput.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    labelInput.style.border = '1px solid #ff00ff';
    labelInput.style.borderRadius = '5px';
    labelInput.style.color = '#ffffff';
    teleportUI.appendChild(labelInput);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.marginTop = '15px';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '8px 15px';
    closeButton.style.backgroundColor = '#ff00ff';
    closeButton.style.color = '#ffffff';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = hideTeleportUI;
    buttonContainer.appendChild(closeButton);

    const renameButton = document.createElement('button');
    renameButton.textContent = 'Rename Selected';
    renameButton.style.padding = '8px 15px';
    renameButton.style.backgroundColor = '#ff00ff';
    renameButton.style.color = '#ffffff';
    renameButton.style.border = 'none';
    renameButton.style.borderRadius = '5px';
    renameButton.style.cursor = 'pointer';
    renameButton.onclick = () => {
        const selectedHub = document.querySelector('.hub-button.selected');
        if (selectedHub && labelInput.value.trim()) {
            const hub = teleportHubs.find(h => h.getDisplayLabel() === selectedHub.dataset.label);
            if (hub) {
                hub.setCustomLabel(labelInput.value.trim());
                updateTeleportUI();
            }
        }
    };
    buttonContainer.appendChild(renameButton);

    teleportUI.appendChild(buttonContainer);
    document.body.appendChild(teleportUI);
}

function updateTeleportUI() {
    const hubList = document.getElementById('hub-list');
    if (!hubList) return;

    hubList.innerHTML = '';
    const currentHub = teleportHubs.find(h => h.isPlayerInRange());
    
    // Sort hubs by last used time
    const sortedHubs = [...teleportHubs].sort((a, b) => b.lastUsed - a.lastUsed);

    sortedHubs.forEach((hub, index) => {
        if (!hub.isActive) return;

        const hubContainer = document.createElement('div');
        hubContainer.style.marginBottom = '10px';
        hubContainer.style.padding = '10px';
        hubContainer.style.backgroundColor = 'rgba(255, 0, 255, 0.1)';
        hubContainer.style.borderRadius = '5px';
        hubContainer.style.cursor = 'pointer';
        hubContainer.style.transition = 'background-color 0.2s';

        const hubButton = document.createElement('button');
        hubButton.className = 'hub-button';
        hubButton.dataset.label = hub.getDisplayLabel();
        hubButton.style.width = '100%';
        hubButton.style.textAlign = 'left';
        hubButton.style.padding = '10px';
        hubButton.style.backgroundColor = 'transparent';
        hubButton.style.color = '#ffffff';
        hubButton.style.border = 'none';
        hubButton.style.cursor = 'pointer';
        hubButton.style.display = 'flex';
        hubButton.style.justifyContent = 'space-between';
        hubButton.style.alignItems = 'center';

        const labelSpan = document.createElement('span');
        labelSpan.textContent = hub.getDisplayLabel();
        hubButton.appendChild(labelSpan);

        const statsSpan = document.createElement('span');
        statsSpan.style.fontSize = '0.8em';
        statsSpan.style.color = '#aaaaaa';
        statsSpan.textContent = `Used: ${hub.usageCount}`;
        hubButton.appendChild(statsSpan);

        hubButton.onclick = () => {
            if (currentHub) {
                currentHub.teleportTo(hub);
                hideTeleportUI();
            }
        };

        hubButton.onmouseover = () => {
            hubContainer.style.backgroundColor = 'rgba(255, 0, 255, 0.2)';
        };

        hubButton.onmouseout = () => {
            hubContainer.style.backgroundColor = 'rgba(255, 0, 255, 0.1)';
        };

        hubContainer.appendChild(hubButton);
        hubList.appendChild(hubContainer);
    });
}

function switchTeleportView(view) {
    const hubList = document.getElementById('hub-list');
    if (!hubList) return;

    const sortedHubs = [...teleportHubs].sort((a, b) => {
        switch(view) {
            case 'Recent':
                return b.lastUsed - a.lastUsed;
            case 'Favorites':
                return b.usageCount - a.usageCount;
            default:
                return 0;
        }
    });

    updateTeleportUI();
}

function hideTeleportUI() {
    const teleportUI = document.getElementById('teleport-ui');
    if (teleportUI) {
        teleportUI.style.display = 'none';
    }
}

// Add keyboard shortcut for teleportation
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 't' && currentGameMode === GAME_MODES.HACKER_PLUS) {
        const currentHub = teleportHubs.find(hub => hub.isPlayerInRange());
        if (currentHub) {
            showTeleportUI();
            updateTeleportUI();
        }
    }
});

// Initialize game when window loads
window.onload = initGame;

function updateShardCount() {
    const shardCountElement = document.getElementById('shard-count');
    if (shardCountElement) {
        shardCountElement.textContent = player.shards;
    }
}

function toggleMarketplace() {
    const marketplace = document.getElementById('marketplace');
    if (marketplaceLocation && marketplaceLocation.isPlayerNearby() && 
        (currentGameMode === GAME_MODES.HACKER || currentGameMode === GAME_MODES.HACKER_PLUS)) {
        if (marketplace.style.display === 'none' || !marketplace.style.display) {
            marketplace.style.display = 'block';
            gamePaused = true;
            document.getElementById('pause-btn').textContent = 'Resume';
        } else {
            marketplace.style.display = 'none';
            gamePaused = false;
            document.getElementById('pause-btn').textContent = 'Pause';
        }
    }
}

// Update the showPowerUpIndicator function to handle multi-line messages
function showPowerUpIndicator(message) {
    const indicator = document.getElementById('power-up-indicator');
    if (!indicator) return;

    // Split message into lines and create HTML
    const lines = message.split('\n');
    const html = lines.map(line => `<div>${line}</div>`).join('');
    
    indicator.innerHTML = html;
    indicator.style.display = 'block';
    indicator.style.opacity = '1';

    // Clear any existing timeout
    if (indicator.timeout) {
        clearTimeout(indicator.timeout);
    }

    // Hide the indicator after 3 seconds
    indicator.timeout = setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 500);
    }, 3000);
}