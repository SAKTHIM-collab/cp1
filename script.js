// Game state variables
let gameMode = "normal"; // "normal", "hacker", "hackerPlus"
let currentPlayer = "red"; // "red" or "blue"
let phase = "placement"; // "placement" or "movement"
let placedNodes = [];
let selectedNode = null;
let movementStartNode = null;
let redScore = 0;
let blueScore = 0;
let redTitans = 0;
let blueTitans = 0;
let maxTitans = 4;
let paused = false;
let sounds = true;
let botEnabled = true;
let botDifficulty = "medium";
let gameInProgress = false;
let circuitShape = "hexagon";
let circuitCount = 3;

// Time variables
let turnTimer = 30;
let gameTimer = 300;
let turnTimerInterval;
let gameTimerInterval;

// Powerup variables
let redPowerups = {swap: 1, extraTitan: 1};
let bluePowerups = {swap: 1, extraTitan: 1};

// Undo/Redo variables
let history = [];
let historyIndex = -1;
let redoStack = [];

// DOM elements
const boardEl = document.getElementById("board");
const redScoreEl = document.getElementById("redScore");
const blueScoreEl = document.getElementById("blueScore");
const redTitansEl = document.getElementById("redTitans");
const blueTitansEl = document.getElementById("blueTitans");
const currentPlayerEl = document.getElementById("currentPlayer");
const phaseIndicatorEl = document.getElementById("phaseIndicator");
const turnTimerEl = document.getElementById("turnTimer");
const gameTimerEl = document.getElementById("gameTimer");
const moveHistoryEl = document.getElementById("move-history");
const historyListEl = document.getElementById("history-list");
const normalModeBtn = document.getElementById("normalMode");
const hackerModeBtn = document.getElementById("hackerMode");
const hackerPlusModeBtn = document.getElementById("hackerPlusMode");
const hackerControlsEl = document.getElementById("hacker-controls");
const hackerPlusControlsEl = document.getElementById("hacker-plus-controls");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const resetBtn = document.getElementById("resetBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const soundBtn = document.getElementById("soundBtn");
const powerupBtn = document.getElementById("powerupBtn");
const powerupModalEl = document.getElementById("powerup-modal");
const swapPowerupBtn = document.getElementById("swapPowerup");
const extraPowerupBtn = document.getElementById("extraPowerup");
const closeModalBtns = document.querySelectorAll(".close-modal");
const replayBtn = document.getElementById("replayBtn");
const analysisBtn = document.getElementById("analysisBtn");
const leaderboardBtn = document.getElementById("leaderboardBtn");
const configModalEl = document.getElementById("config-modal");
const shapeSelectEl = document.getElementById("shape-select");
const circuitCountEl = document.getElementById("circuit-count");
const circuitCountValueEl = document.getElementById("circuit-count-value");
const botCheckboxEl = document.getElementById("bot-checkbox");
const difficultySelectEl = document.getElementById("difficulty-select");
const startGameBtn = document.getElementById("start-game-btn");
const redPowerupsEl = document.getElementById("redPowerups");
const bluePowerupsEl = document.getElementById("bluePowerups");

// Game board configuration
let nodes = [];
let edges = [];
let boardWidth, boardHeight, centerX, centerY;
let circuitRadii = [];
const nodeRadius = 15;

// Sound elements
const placeSound = document.getElementById("placeSound");
const moveSound = document.getElementById("moveSound");
const captureSound = document.getElementById("captureSound");
const powerupSound = document.getElementById("powerupSound");
const clickSound = document.getElementById("clickSound");

// Initialize particles background
document.addEventListener("DOMContentLoaded", function() {
  particlesJS('particles-js', {
    "particles": {
      "number": {
        "value": 80,
        "density": {
          "enable": true,
          "value_area": 800
        }
      },
      "color": {
        "value": "#ffffff"
      },
      "shape": {
        "type": "circle",
        "stroke": {
          "width": 0,
          "color": "#000000"
        },
        "polygon": {
          "nb_sides": 5
        }
      },
      "opacity": {
        "value": 0.5,
        "random": false,
        "anim": {
          "enable": false,
          "speed": 1,
          "opacity_min": 0.1,
          "sync": false
        }
      },
      "size": {
        "value": 3,
        "random": true,
        "anim": {
          "enable": false,
          "speed": 40,
          "size_min": 0.1,
          "sync": false
        }
      },
      "line_linked": {
        "enable": true,
        "distance": 150,
        "color": "#6e00ff",
        "opacity": 0.4,
        "width": 1
      },
      "move": {
        "enable": true,
        "speed": 2,
        "direction": "none",
        "random": false,
        "straight": false,
        "out_mode": "out",
        "bounce": false,
        "attract": {
          "enable": false,
          "rotateX": 600,
          "rotateY": 1200
        }
      }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": {
        "onhover": {
          "enable": true,
          "mode": "grab"
        },
        "onclick": {
          "enable": true,
          "mode": "push"
        },
        "resize": true
      },
      "modes": {
        "grab": {
          "distance": 140,
          "line_linked": {
            "opacity": 1
          }
        },
        "bubble": {
          "distance": 400,
          "size": 40,
          "duration": 2,
          "opacity": 8,
          "speed": 3
        },
        "repulse": {
          "distance": 200,
          "duration": 0.4
        },
        "push": {
          "particles_nb": 4
        },
        "remove": {
          "particles_nb": 2
        }
      }
    },
    "retina_detect": true
  });
});

// Initialize the game
function init() {
  // Event listeners for game modes
  normalModeBtn.addEventListener("click", () => setGameMode("normal"));
  hackerModeBtn.addEventListener("click", () => setGameMode("hacker"));
  hackerPlusModeBtn.addEventListener("click", () => setGameMode("hackerPlus"));

  // Event listeners for controls
  pauseBtn.addEventListener("click", pauseGame);
  resumeBtn.addEventListener("click", resumeGame);
  resetBtn.addEventListener("click", resetGame);
  undoBtn.addEventListener("click", () => {
    playSound(clickSound);
    if (historyIndex >= 0) {
      const lastState = history[historyIndex];
      redoStack.push(JSON.parse(JSON.stringify(lastState)));
      historyIndex--;
      if (historyIndex >= 0) {
        restoreState(history[historyIndex]);
      } else {
        resetGame(false);
      }
      updateGameUI();
    }
  });
  
  redoBtn.addEventListener("click", () => {
    playSound(clickSound);
    if (redoStack.length > 0) {
      const nextState = redoStack.pop();
      history.push(JSON.parse(JSON.stringify(nextState)));
      historyIndex++;
      restoreState(nextState);
      updateGameUI();
    }
  });
  
  soundBtn.addEventListener("click", () => {
    sounds = !sounds;
    soundBtn.querySelector(".btn-text").textContent = `Sound: ${sounds ? "ON" : "OFF"}`;
    playSound(clickSound);
  });
  
  powerupBtn.addEventListener("click", () => {
    playSound(clickSound);
    openPowerupModal();
  });
  
  swapPowerupBtn.addEventListener("click", () => {
    playSound(powerupSound);
    applyPowerup("swap");
    closePowerupModal();
  });
  
  extraPowerupBtn.addEventListener("click", () => {
    playSound(powerupSound);
    applyPowerup("extraTitan");
    closePowerupModal();
  });
  
  closeModalBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      playSound(clickSound);
      closePowerupModal();
      closeConfigModal();
    });
  });
  
  replayBtn.addEventListener("click", () => {
    playSound(clickSound);
    replayGame();
  });
  
  analysisBtn.addEventListener("click", () => {
    playSound(clickSound);
    analyzeGame();
  });
  
  leaderboardBtn.addEventListener("click", () => {
    playSound(clickSound);
    showLeaderboard();
  });
  
  hackerPlusModeBtn.addEventListener("click", () => {
    playSound(clickSound);
    openConfigModal();
  });
  
  shapeSelectEl.addEventListener("change", () => {
    circuitShape = shapeSelectEl.value;
  });
  
  circuitCountEl.addEventListener("input", () => {
    circuitCount = parseInt(circuitCountEl.value);
    circuitCountValueEl.textContent = circuitCount;
  });
  
  botCheckboxEl.addEventListener("change", () => {
    botEnabled = botCheckboxEl.checked;
    document.getElementById("difficulty-section").style.display = botEnabled ? "block" : "none";
  });
  
  difficultySelectEl.addEventListener("change", () => {
    botDifficulty = difficultySelectEl.value;
  });
  
  startGameBtn.addEventListener("click", () => {
    playSound(clickSound);
    closeConfigModal();
    setGameMode("hackerPlus");
    resetGame();
  });

  // Set default game mode
  setGameMode("normal");
  resetGame();
}

// Initialize particles for background effect
function initParticles() {
  const particles = [];
  const particleCount = 30;
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * boardWidth,
      y: Math.random() * boardHeight,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2,
      color: `rgba(${Math.floor(Math.random() * 100 + 150)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 255)}, 0.7)`
    });
  }
  
  return particles;
}

// Generate positions for nodes based on the shape
function generatePositions(centerX, centerY) {
  let nodePositions = [];
  
  // Calculate radii for concentric circuits
  const maxRadius = Math.min(boardWidth, boardHeight) * 0.45;
  circuitRadii = [];
  
  for (let i = 0; i < circuitCount; i++) {
    circuitRadii.push(maxRadius * ((i + 1) / circuitCount));
  }
  
  // Generate positions based on shape
  if (circuitShape === "hexagon") {
    for (let circuit = 0; circuit < circuitCount; circuit++) {
      const radius = circuitRadii[circuit];
      const nodesPerCircuit = 6 * (circuit + 1);
      
      for (let i = 0; i < nodesPerCircuit; i++) {
        const angle = (i * 2 * Math.PI) / nodesPerCircuit;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        nodePositions.push({
          x,
          y,
          circuit,
          position: i,
          connections: []
        });
      }
    }
  } else if (circuitShape === "square") {
    for (let circuit = 0; circuit < circuitCount; circuit++) {
      const radius = circuitRadii[circuit];
      const nodesPerCircuit = 4 * (circuit + 1);
      
      for (let i = 0; i < nodesPerCircuit; i++) {
        let x, y;
        const sideLength = i % 4;
        const progress = (i % (nodesPerCircuit / 4)) / (nodesPerCircuit / 4);
        
        if (sideLength === 0) { // Top side
          x = centerX - radius + 2 * radius * progress;
          y = centerY - radius;
        } else if (sideLength === 1) { // Right side
          x = centerX + radius;
          y = centerY - radius + 2 * radius * progress;
        } else if (sideLength === 2) { // Bottom side
          x = centerX + radius - 2 * radius * progress;
          y = centerY + radius;
        } else { // Left side
          x = centerX - radius;
          y = centerY + radius - 2 * radius * progress;
        }
        
        nodePositions.push({
          x,
          y,
          circuit,
          position: i,
          connections: []
        });
      }
    }
  } else if (circuitShape === "triangle") {
    for (let circuit = 0; circuit < circuitCount; circuit++) {
      const radius = circuitRadii[circuit];
      const nodesPerCircuit = 3 * (circuit + 1);
      
      for (let i = 0; i < nodesPerCircuit; i++) {
        const angle = (i * 2 * Math.PI) / nodesPerCircuit + Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        nodePositions.push({
          x,
          y,
          circuit,
          position: i,
          connections: []
        });
      }
    }
  }
  
  return nodePositions;
}

// Generate connection edges between nodes
function generateConnections() {
  let edgeList = [];
  
  // First, connect nodes within the same circuit (circle)
  for (let circuit = 0; circuit < circuitCount; circuit++) {
    const circuitNodes = nodes.filter(node => node.circuit === circuit);
    
    for (let i = 0; i < circuitNodes.length; i++) {
      const currentNode = circuitNodes[i];
      const nextNode = circuitNodes[(i + 1) % circuitNodes.length];
      
      currentNode.connections.push(nextNode.index);
      
      edgeList.push({
        node1: currentNode.index,
        node2: nextNode.index,
        controlledBy: null,
        weight: Math.floor(Math.random() * 5) + 1 // Random weight between 1-5
      });
    }
  }
  
  // Then, connect nodes between adjacent circuits
  for (let circuit = 0; circuit < circuitCount - 1; circuit++) {
    const innerCircuitNodes = nodes.filter(node => node.circuit === circuit);
    const outerCircuitNodes = nodes.filter(node => node.circuit === circuit + 1);
    
    // Connect some inner nodes to outer nodes
    for (let i = 0; i < innerCircuitNodes.length; i++) {
      if (Math.random() < 0.5) { // Only connect some nodes
        const innerNode = innerCircuitNodes[i];
        
        // Find the closest outer circuit node
        let closestNode = null;
        let minDistance = Number.MAX_VALUE;
        
        for (const outerNode of outerCircuitNodes) {
          const distance = Math.sqrt(
            Math.pow(innerNode.x - outerNode.x, 2) +
            Math.pow(innerNode.y - outerNode.y, 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestNode = outerNode;
          }
        }
        
        if (closestNode) {
          innerNode.connections.push(closestNode.index);
          closestNode.connections.push(innerNode.index);
          
          edgeList.push({
            node1: innerNode.index,
            node2: closestNode.index,
            controlledBy: null,
            weight: Math.floor(Math.random() * 5) + 1 // Random weight between 1-5
          });
        }
      }
    }
  }
  
  return edgeList;
}

// Create the game board
function createBoard() {
  // Clear existing board
  boardEl.innerHTML = '';
  nodes = [];
  edges = [];
  placedNodes = [];
  redScore = 0;
  blueScore = 0;
  
  // Get board dimensions
  boardWidth = boardEl.clientWidth;
  boardHeight = boardEl.clientHeight;
  centerX = boardWidth / 2;
  centerY = boardHeight / 2;
  
  // Generate node positions
  const nodePositions = generatePositions(centerX, centerY);
  
  // Create nodes
  nodePositions.forEach((pos, index) => {
    const nodeElement = document.createElement('div');
    nodeElement.classList.add('node');
    nodeElement.style.left = `${pos.x}px`;
    nodeElement.style.top = `${pos.y}px`;
    
    // Store node data with reference to DOM element
    const nodeData = {
      index,
      x: pos.x,
      y: pos.y,
      circuit: pos.circuit,
      position: pos.position,
      connections: pos.connections,
      element: nodeElement,
      occupied: false,
      occupiedBy: null
    };
    
    nodes.push(nodeData);
    
    // Add click event to node
    nodeElement.addEventListener('click', () => handleNodeClick(index));
    
    // Add node to board
    boardEl.appendChild(nodeElement);
  });
  
  // Update node indices in connections
  nodes.forEach(node => {
    const filteredConnections = [];
    for (const connIndex of node.connections) {
      if (nodes[connIndex]) {
        filteredConnections.push(connIndex);
      }
    }
    node.connections = filteredConnections;
  });
  
  // Generate connections
  edges = generateConnections();
  
  // Render edges
  renderEdges();
  
  // Update UI
  updateGameUI();
}

// Render the edges between nodes
function renderEdges() {
  // Clear existing edges
  const existingEdges = boardEl.querySelectorAll('.edge');
  existingEdges.forEach(edge => edge.remove());
  
  // Create edges
  edges.forEach((edge, index) => {
    const node1 = nodes[edge.node1];
    const node2 = nodes[edge.node2];
    
    if (!node1 || !node2) return;
    
    const dx = node2.x - node1.x;
    const dy = node2.y - node1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    const edgeElement = document.createElement('div');
    edgeElement.classList.add('edge');
    
    // Add controlled class if the edge is controlled
    if (edge.controlledBy === 'red') {
      edgeElement.classList.add('controlled-red');
    } else if (edge.controlledBy === 'blue') {
      edgeElement.classList.add('controlled-blue');
    }
    
    edgeElement.style.width = `${distance}px`;
    edgeElement.style.left = `${node1.x}px`;
    edgeElement.style.top = `${node1.y}px`;
    edgeElement.style.transform = `rotate(${angle}rad)`;
    
    // Add weight label if weight is defined
    if (gameMode === 'hackerPlus' && edge.weight !== undefined) {
      const labelElement = document.createElement('div');
      labelElement.classList.add('edge-label');
      labelElement.textContent = edge.weight;
      
      // Position label at midpoint of edge
      const midX = (node1.x + node2.x) / 2;
      const midY = (node1.y + node2.y) / 2;
      
      labelElement.style.left = `${midX}px`;
      labelElement.style.top = `${midY}px`;
      
      boardEl.appendChild(labelElement);
    }
    
    // Add edge element to board
    boardEl.appendChild(edgeElement);
    
    // Store reference to DOM element
    edge.element = edgeElement;
  });
}

// Check if a node is unlocked (available to place a titan)
function isNodeUnlocked(index) {
  const node = nodes[index];
  if (!node) return false;
  
  // In placement phase, allow placing on any unoccupied node
  if (phase === 'placement') {
    return !node.occupied;
  }
  
  // In movement phase, check different conditions
  return false; // This is handled in handleMovementSelection
}

// Handle click on a node
function handleNodeClick(index) {
  if (paused) return;
  
  // If bot is enabled and it's blue's turn, do nothing
  if (botEnabled && currentPlayer === 'blue') return;
  
  if (phase === 'placement') {
    handlePlacement(index);
  } else if (phase === 'movement') {
    if (movementStartNode === null) {
      handleMovementSelection(index);
    } else {
      handleMovement(index);
    }
  }
}

// Handle placement of a titan
function handlePlacement(index) {
  const node = nodes[index];
  if (!node || node.occupied) return;
  
  // Check placement conditions
  if (isNodeUnlocked(index)) {
    playSound(placeSound);
    
    // Save current state for undo
    saveState();
    
    // Place titan
    node.occupied = true;
    node.occupiedBy = currentPlayer;
    node.element.classList.add(currentPlayer);
    
    // Add to placed nodes
    placedNodes.push(index);
    
    // Increment titan count
    if (currentPlayer === 'red') {
      redTitans++;
      // Check if all titans are placed
      if (redTitans >= maxTitans && blueTitans >= maxTitans) {
        phase = 'movement';
        phaseIndicatorEl.textContent = 'MOVEMENT PHASE';
        phaseIndicatorEl.classList.remove('placement-phase');
        phaseIndicatorEl.classList.add('movement-phase');
      }
    } else {
      blueTitans++;
      // Check if all titans are placed
      if (redTitans >= maxTitans && blueTitans >= maxTitans) {
        phase = 'movement';
        phaseIndicatorEl.textContent = 'MOVEMENT PHASE';
        phaseIndicatorEl.classList.remove('placement-phase');
        phaseIndicatorEl.classList.add('movement-phase');
      }
    }
    
    // Check for captures
    checkForCaptures(index);
    
    // Update edge control
    updateEdgeControl();
    
    // Add to history
    addToHistory(`${currentPlayer === 'red' ? 'Red' : 'Blue'} placed at node ${index + 1}`);
    
    // Switch player
    switchPlayer();
    
    // Check win condition
    checkWinCondition();
    
    // Update UI
    updateGameUI();
    
    // If it's bot's turn and bot is enabled
    if (currentPlayer === 'blue' && botEnabled) {
      setTimeout(botMakeMove, 1000);
    }
  }
}

// Check if a circuit is full (all nodes occupied)
function checkIsCircuitFull(circuitIndex) {
  const circuitNodes = nodes.filter(node => node.circuit === circuitIndex);
  return circuitNodes.every(node => node.occupied);
}

// Handle selecting a node to move from
function handleMovementSelection(index) {
  const node = nodes[index];
  if (!node || !node.occupied) return;
  
  // Can only select your own titans
  if (node.occupiedBy !== currentPlayer) return;
  
  playSound(clickSound);
  
  // Select node for movement
  movementStartNode = index;
  
  // Highlight possible movement destinations
  nodes.forEach((n, idx) => {
    n.element.classList.remove('selectable');
    
    // Only highlight valid destinations
    if (areNodesAdjacent(index, idx) && !n.occupied) {
      n.element.classList.add('selectable');
    }
  });
  
  // Highlight selected node
  node.element.classList.add('selectable');
}

// Check if two nodes are adjacent
function areNodesAdjacent(node1, node2) {
  const n1 = nodes[node1];
  return n1 && n1.connections.includes(node2);
}

// Handle moving a titan
function handleMovement(targetIndex) {
  const sourceNode = nodes[movementStartNode];
  const targetNode = nodes[targetIndex];
  
  if (!sourceNode || !targetNode) {
    movementStartNode = null;
    nodes.forEach(n => n.element.classList.remove('selectable'));
    return;
  }
  
  // If clicking on the same node, deselect it
  if (movementStartNode === targetIndex) {
    movementStartNode = null;
    nodes.forEach(n => n.element.classList.remove('selectable'));
    return;
  }
  
  // Check if target is valid for movement
  if (areNodesAdjacent(movementStartNode, targetIndex) && !targetNode.occupied) {
    playSound(moveSound);
    
    // Save current state for undo
    saveState();
    
    // Move the titan
    sourceNode.occupied = false;
    sourceNode.occupiedBy = null;
    sourceNode.element.classList.remove('red', 'blue');
    
    targetNode.occupied = true;
    targetNode.occupiedBy = currentPlayer;
    targetNode.element.classList.add(currentPlayer);
    
    // Update placed nodes list
    const index = placedNodes.indexOf(movementStartNode);
    if (index !== -1) {
      placedNodes[index] = targetIndex;
    }
    
    // Check for captures
    checkForCaptures(targetIndex);
    
    // Update edge control
    updateEdgeControl();
    
    // Add to history
    addToHistory(`${currentPlayer === 'red' ? 'Red' : 'Blue'} moved from ${movementStartNode + 1} to ${targetIndex + 1}`);
    
    // Reset movement selection
    movementStartNode = null;
    nodes.forEach(n => n.element.classList.remove('selectable'));
    
    // Switch player
    switchPlayer();
    
    // Check win condition
    checkWinCondition();
    
    // Update UI
    updateGameUI();
    
    // If it's bot's turn and bot is enabled
    if (currentPlayer === 'blue' && botEnabled) {
      setTimeout(botMakeMove, 1000);
    }
  }
}

// Check for captures after a titan is placed or moved
function checkForCaptures(placedNodeIndex) {
  const placedNode = nodes[placedNodeIndex];
  if (!placedNode) return;
  
  const player = placedNode.occupiedBy;
  if (!player) return;
  
  // Check surrounding nodes for opponent titans
  const surroundingNodes = getSurroundingNodes(placedNodeIndex);
  
  surroundingNodes.forEach(nodeIndex => {
    const node = nodes[nodeIndex];
    if (node && node.occupied && node.occupiedBy !== player) {
      // Check if this node is surrounded by player's titans
      const nodeNeighbors = getSurroundingNodes(nodeIndex);
      const allSurrounded = nodeNeighbors.every(neighborIndex => {
        const neighbor = nodes[neighborIndex];
        return !neighbor || neighbor.occupied && neighbor.occupiedBy === player;
      });
      
      // If surrounded, capture the node
      if (allSurrounded) {
        playSound(captureSound);
        
        // Add capturing animation
        node.element.classList.add('capturing-animation');
        setTimeout(() => {
          node.element.classList.remove('capturing-animation');
        }, 800);
        
        // Remove opponent's titan
        node.occupied = false;
        
        if (node.occupiedBy === 'red') {
          redTitans--;
        } else {
          blueTitans--;
        }
        
        node.occupiedBy = null;
        node.element.classList.remove('red', 'blue');
        
        // Update placed nodes list
        const index = placedNodes.indexOf(nodeIndex);
        if (index !== -1) {
          placedNodes.splice(index, 1);
        }
        
        // Award points
        if (player === 'red') {
          redScore += 10; // Base capture points
        } else {
          blueScore += 10; // Base capture points
        }
        
        // Add to history
        addToHistory(`${player === 'red' ? 'Red' : 'Blue'} captured node ${nodeIndex + 1}`);
      }
    }
  });
}

// Get surrounding nodes (neighbors)
function getSurroundingNodes(nodeIndex) {
  const node = nodes[nodeIndex];
  if (!node) return [];
  
  return node.connections;
}

// Update which player controls each edge
function updateEdgeControl() {
  edges.forEach(edge => {
    const node1 = nodes[edge.node1];
    const node2 = nodes[edge.node2];
    
    if (!node1 || !node2) return;
    
    let controlledBy = null;
    
    // If both nodes are occupied by the same player, they control the edge
    if (node1.occupied && node2.occupied && node1.occupiedBy === node2.occupiedBy) {
      controlledBy = node1.occupiedBy;
      
      // Award points for newly controlled edges
      if (edge.controlledBy !== controlledBy) {
        const points = edge.weight || 1;
        if (controlledBy === 'red') {
          redScore += points;
        } else {
          blueScore += points;
        }
      }
    }
    
    // Update edge control
    edge.controlledBy = controlledBy;
    
    // Update edge element class
    if (edge.element) {
      edge.element.classList.remove('controlled-red', 'controlled-blue');
      if (controlledBy) {
        edge.element.classList.add(`controlled-${controlledBy}`);
      }
    }
  });
}

// Check if a player has won
function checkWinCondition() {
  // Win condition 1: All opponent titans are captured
  if (redTitans <= 0) {
    // Blue wins
    endGame('blue');
    return;
  } else if (blueTitans <= 0) {
    // Red wins
    endGame('red');
    return;
  }
  
  // Win condition 2: Time's up, higher score wins
  if (gameTimer <= 0) {
    if (redScore > blueScore) {
      endGame('red');
    } else if (blueScore > redScore) {
      endGame('blue');
    } else {
      endGame('draw');
    }
    return;
  }
  
  // Win condition 3: Score threshold reached (100 points)
  if (redScore >= 100) {
    endGame('red');
    return;
  } else if (blueScore >= 100) {
    endGame('blue');
    return;
  }
  
  // Win condition 4: All circuits are controlled by one player
  let redCircuits = 0;
  let blueCircuits = 0;
  
  for (let i = 0; i < circuitCount; i++) {
    if (checkIsCircuitFull(i)) {
      const circuitNodes = nodes.filter(node => node.circuit === i);
      const redNodes = circuitNodes.filter(node => node.occupied && node.occupiedBy === 'red').length;
      const blueNodes = circuitNodes.filter(node => node.occupied && node.occupiedBy === 'blue').length;
      
      if (redNodes > blueNodes) {
        redCircuits++;
      } else if (blueNodes > redNodes) {
        blueCircuits++;
      }
    }
  }
  
  if (redCircuits >= Math.ceil(circuitCount / 2)) {
    endGame('red');
  } else if (blueCircuits >= Math.ceil(circuitCount / 2)) {
    endGame('blue');
  }
}

// End the game and declare a winner
function endGame(winner) {
  paused = true;
  clearInterval(turnTimerInterval);
  clearInterval(gameTimerInterval);
  
  // Update UI
  if (winner === 'red') {
    currentPlayerEl.textContent = "RED WINS!";
    currentPlayerEl.classList.remove('glow-blue');
    currentPlayerEl.classList.add('glow-red');
    showMessage("Red player wins!");
  } else if (winner === 'blue') {
    currentPlayerEl.textContent = "BLUE WINS!";
    currentPlayerEl.classList.remove('glow-red');
    currentPlayerEl.classList.add('glow-blue');
    showMessage("Blue player wins!");
  } else {
    currentPlayerEl.textContent = "DRAW!";
    currentPlayerEl.classList.remove('glow-red', 'glow-blue');
    showMessage("The game ends in a draw!");
  }
  
  // Save to leaderboard if in hackerPlus mode
  if (gameMode === 'hackerPlus') {
    saveToLeaderboard(winner, redScore, blueScore);
  }
  
  // Enable the reset button
  resetBtn.disabled = false;
  pauseBtn.disabled = true;
  resumeBtn.disabled = true;
  
  gameInProgress = false;
}

// Save game results to leaderboard
function saveToLeaderboard(winner, redScore, blueScore) {
  // For this simplified version, we'll just log the results
  console.log(`Game saved to leaderboard: ${winner} won with ${winner === 'red' ? redScore : blueScore} points`);
  
  // In a real implementation, you would save this to localStorage or a backend
  const leaderboardEntry = {
    date: new Date().toISOString(),
    winner,
    redScore,
    blueScore,
    gameMode,
    circuitShape,
    circuitCount,
    duration: 300 - gameTimer
  };
  
  // Save to localStorage
  let leaderboard = JSON.parse(localStorage.getItem('titansLeaderboard') || '[]');
  leaderboard.push(leaderboardEntry);
  localStorage.setItem('titansLeaderboard', JSON.stringify(leaderboard));
}

// Switch to the next player's turn
function switchPlayer() {
  currentPlayer = currentPlayer === 'red' ? 'blue' : 'red';
  resetTurnTimer();
  
  // Update UI
  currentPlayerEl.textContent = `${currentPlayer.toUpperCase()}'S TURN`;
  currentPlayerEl.classList.remove('glow-red', 'glow-blue');
  currentPlayerEl.classList.add(currentPlayer === 'red' ? 'glow-red' : 'glow-blue');
}

// Reset the turn timer
function resetTurnTimer() {
  turnTimer = 30;
  turnTimerEl.textContent = turnTimer;
}

// Start the game timers
function startTimers() {
  resetTurnTimer();
  gameTimer = 300; // 5 minutes
  gameTimerEl.textContent = gameTimer;
  
  // Clear any existing intervals
  clearInterval(turnTimerInterval);
  clearInterval(gameTimerInterval);
  
  // Set up turn timer
  turnTimerInterval = setInterval(() => {
    if (!paused) {
      turnTimer--;
      turnTimerEl.textContent = turnTimer;
      
      if (turnTimer <= 0) {
        // Time's up for this turn
        switchPlayer();
        
        // If it's bot's turn and bot is enabled
        if (currentPlayer === 'blue' && botEnabled) {
          setTimeout(botMakeMove, 1000);
        }
      }
    }
  }, 1000);
  
  // Set up game timer
  gameTimerInterval = setInterval(() => {
    if (!paused) {
      gameTimer--;
      gameTimerEl.textContent = gameTimer;
      
      if (gameTimer <= 0) {
        // Game over, time's up
        checkWinCondition();
      }
    }
  }, 1000);
}

// Pause the game
function pauseGame() {
  if (gameInProgress) {
    playSound(clickSound);
    paused = true;
    pauseBtn.disabled = true;
    resumeBtn.disabled = false;
    showMessage("Game paused");
  }
}

// Resume the game
function resumeGame() {
  if (gameInProgress) {
    playSound(clickSound);
    paused = false;
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
    showMessage("Game resumed");
  }
}

// Reset the game
function resetGame(newGame = true) {
  playSound(clickSound);
  
  // Clear timers
  clearInterval(turnTimerInterval);
  clearInterval(gameTimerInterval);
  
  // Reset game state
  currentPlayer = 'red';
  phase = 'placement';
  placedNodes = [];
  selectedNode = null;
  movementStartNode = null;
  redScore = 0;
  blueScore = 0;
  redTitans = 0;
  blueTitans = 0;
  paused = false;
  history = [];
  historyIndex = -1;
  redoStack = [];
  redPowerups = {swap: 1, extraTitan: 1};
  bluePowerups = {swap: 1, extraTitan: 1};
  
  // Update max titans based on game mode
  maxTitans = gameMode === 'hackerPlus' ? 5 : 4;

  // Reset UI
  phaseIndicatorEl.textContent = 'PLACEMENT PHASE';
  phaseIndicatorEl.classList.add('placement-phase');
  phaseIndicatorEl.classList.remove('movement-phase');
  currentPlayerEl.textContent = "RED'S TURN";
  currentPlayerEl.classList.remove('glow-blue');
  currentPlayerEl.classList.add('glow-red');
  pauseBtn.disabled = false;
  resumeBtn.disabled = true;
  
  // Create new board
  createBoard();
  
  // Start timers
  if (newGame) {
    startTimers();
    gameInProgress = true;
    showMessage("New game started");
    
    // Save initial state
    saveState();
  }
  
  // Update powerup display
  updatePowerupDisplay();
}

// Update the display of powerups
function updatePowerupDisplay() {
  // Show powerups in hacker++ mode only
  const showPowerups = gameMode === 'hackerPlus';
  
  // Get powerup elements
  redPowerupsEl.style.display = showPowerups ? "flex" : "none";
  bluePowerupsEl.style.display = showPowerups ? "flex" : "none";
  
  // Update red powerups
  redPowerupsEl.children[0].querySelector('span').textContent = redPowerups.swap;
  redPowerupsEl.children[1].querySelector('span').textContent = redPowerups.extraTitan;
  
  // Update blue powerups
  bluePowerupsEl.children[0].querySelector('span').textContent = bluePowerups.swap;
  bluePowerupsEl.children[1].querySelector('span').textContent = bluePowerups.extraTitan;
}

// Add a move to the history
function addToHistory(moveDesc) {
  if (historyListEl) {
    const time = new Date().toLocaleTimeString();
    const historyItem = document.createElement('div');
    historyItem.classList.add('history-item', currentPlayer);
    
    const moveSpan = document.createElement('div');
    moveSpan.classList.add('history-move');
    moveSpan.textContent = moveDesc;
    
    const timeSpan = document.createElement('div');
    timeSpan.classList.add('history-time');
    timeSpan.textContent = time;
    
    historyItem.appendChild(moveSpan);
    historyItem.appendChild(timeSpan);
    
    historyListEl.appendChild(historyItem);
    historyListEl.scrollTop = historyListEl.scrollHeight;
  }
}

// Bot move logic
function botMakeMove() {
  if (paused || currentPlayer !== 'blue') return;
  
  if (phase === 'placement') {
    botPlacementMove();
  } else {
    botMovementMove();
  }
}

// Bot placement logic
function botPlacementMove() {
  // Get all available nodes for placement
  const availableNodes = nodes.filter(node => !node.occupied);
  
  if (availableNodes.length === 0) return;
  
  // Choose node based on difficulty
  let targetNode;
  
  if (botDifficulty === 'easy') {
    // Random choice
    const randomIndex = Math.floor(Math.random() * availableNodes.length);
    targetNode = availableNodes[randomIndex];
  } else if (botDifficulty === 'medium') {
    // Prefer nodes that will form edges with existing blue titans
    const scoredNodes = availableNodes.map(node => {
      let score = 0;
      
      // Check connections for blue titans
      for (const connIndex of node.connections) {
        const connNode = nodes[connIndex];
        if (connNode && connNode.occupied) {
          if (connNode.occupiedBy === 'blue') {
            score += 10; // Highly prefer connecting to own titans
          } else {
            score += 5; // Also good to connect to opponent titans for future capture
          }
        }
      }
      
      // Small random factor
      score += Math.random() * 3;
      
      return { node, score };
    });
    
    // Sort by score (highest first)
    scoredNodes.sort((a, b) => b.score - a.score);
    
    // Choose the highest scoring node
    targetNode = scoredNodes[0].node;
  } else { // hard
    // Strategic placement
    const scoredNodes = availableNodes.map(node => {
      let score = evaluateNode(node.index);
      return { node, score };
    });
    
    // Sort by score (highest first)
    scoredNodes.sort((a, b) => b.score - a.score);
    
    // Choose the highest scoring node
    targetNode = scoredNodes[0].node;
  }
  
  // Perform the placement
  handlePlacement(targetNode.index);
}

// Bot movement logic
function botMovementMove() {
  // Get all blue titans
  const blueTitanNodes = nodes.filter(node => node.occupied && node.occupiedBy === 'blue');
  
  if (blueTitanNodes.length === 0) return;
  
  let bestMoveScore = -1000;
  let bestMoveFrom = null;
  let bestMoveTo = null;
  
  // Evaluate all possible moves
  for (const fromNode of blueTitanNodes) {
    // Get possible destinations
    for (const toIndex of fromNode.connections) {
      const toNode = nodes[toIndex];
      
      // Can only move to unoccupied nodes
      if (toNode && !toNode.occupied) {
        const moveScore = evaluateMove(fromNode.index, toIndex);
        
        if (moveScore > bestMoveScore) {
          bestMoveScore = moveScore;
          bestMoveFrom = fromNode.index;
          bestMoveTo = toIndex;
        }
      }
    }
  }
  
  // Perform the best move
  if (bestMoveFrom !== null && bestMoveTo !== null) {
    // Select the titan
    handleMovementSelection(bestMoveFrom);
    
    // Wait a bit for "thinking"
    setTimeout(() => {
      // Move the titan
      handleMovement(bestMoveTo);
    }, 800);
  }
}

// Evaluate a node position
function evaluateNode(nodeIdx) {
  const node = nodes[nodeIdx];
  if (!node) return -100;
  
  let score = 0;
  
  // Prefer nodes with more connections
  score += node.connections.length * 2;
  
  // Prefer inner circuit nodes (more defendable)
  score += (circuitCount - node.circuit) * 5;
  
  // Check for capture opportunities
  for (const connIndex of node.connections) {
    const connNode = nodes[connIndex];
    if (connNode && connNode.occupied) {
      if (connNode.occupiedBy === 'red') {
        // Potential to surround opponent titans
        score += 15;
        
        // Check if this placement would capture a red titan
        const redNeighbors = getSurroundingNodes(connIndex);
        const captureCount = redNeighbors.filter(neighborIndex => {
          const neighbor = nodes[neighborIndex];
          return (neighborIndex === nodeIdx) || // the node we're evaluating
                 (neighbor && neighbor.occupied && neighbor.occupiedBy === 'blue');
        }).length;
        
        if (captureCount === redNeighbors.length) {
          score += 50; // Huge bonus for immediate capture
        }
      } else {
        // Connect to own titans
        score += 10;
      }
    }
  }
  
  // Add a small random factor
  score += Math.random() * 5;
  
  return score;
}

// Evaluate a move
function evaluateMove(fromIdx, toIdx) {
  const fromNode = nodes[fromIdx];
  const toNode = nodes[toIdx];
  if (!fromNode || !toNode) return -100;
  
  let score = 0;
  
  // Base score from target node evaluation
  score += evaluateNode(toIdx);
  
  // Additional scoring for tactical movement
  
  // Check for immediate edge control gains
  for (const connIndex of toNode.connections) {
    const connNode = nodes[connIndex];
    if (connNode && connNode.occupied && connNode.occupiedBy === 'blue') {
      // This move would create an edge controlled by blue
      const edgeIndex = edges.findIndex(e => 
        (e.node1 === toIdx && e.node2 === connIndex) || 
        (e.node1 === connIndex && e.node2 === toIdx)
      );
      
      if (edgeIndex !== -1) {
        const edge = edges[edgeIndex];
        if (edge.controlledBy !== 'blue') {
          score += (edge.weight || 1) * 10; // Points for new edge control
        }
      }
    }
  }
  
  // Check for escape from being surrounded
  let danger = 0;
  let surroundingRed = 0;
  
  for (const connIndex of fromNode.connections) {
    const connNode = nodes[connIndex];
    if (connNode && connNode.occupied && connNode.occupiedBy === 'red') {
      surroundingRed++;
    }
  }
  
  // If most connections are red, this titan is in danger
  if (surroundingRed > fromNode.connections.length / 2) {
    danger = surroundingRed * 10;
  }
  
  // Add escape bonus if moving reduces danger
  let newSurroundingRed = 0;
  for (const connIndex of toNode.connections) {
    const connNode = nodes[connIndex];
    if (connNode && connNode.occupied && connNode.occupiedBy === 'red') {
      newSurroundingRed++;
    }
  }
  
  if (newSurroundingRed < surroundingRed) {
    score += (surroundingRed - newSurroundingRed) * 15; // Bonus for reducing danger
  }
  
  // Add small random variation
  score += Math.random() * 5;
  
  return score;
}

// Play a sound effect
function playSound(sound) {
  if (sounds && sound) {
    sound.currentTime = 0;
    sound.play().catch(err => console.log("Sound play error:", err));
  }
}

// Show a message to the user
function showMessage(message) {
  // In a full implementation, you'd have a message box or toast notification
  console.log(message);
}

// Show the leaderboard
function showLeaderboard() {
  // Get leaderboard from localStorage
  const leaderboard = JSON.parse(localStorage.getItem('titansLeaderboard') || '[]');
  
  if (leaderboard.length === 0) {
    showMessage("No games recorded yet in the leaderboard.");
    return;
  }
  
  // In a full implementation, you'd display this in a modal
  console.log("Leaderboard:", leaderboard);
  showMessage("Leaderboard viewed (check console)");
}

// Replay the current game
function replayGame() {
  showMessage("Game replay feature would show a step-by-step replay of the game");
  // In a full implementation, you'd animate through the history states
}

// Analyze the current game
function analyzeGame() {
  const redEdges = edges.filter(edge => edge.controlledBy === 'red').length;
  const blueEdges = edges.filter(edge => edge.controlledBy === 'blue').length;
  
  const redEdgePoints = edges
    .filter(edge => edge.controlledBy === 'red')
    .reduce((sum, edge) => sum + (edge.weight || 1), 0);
  
  const blueEdgePoints = edges
    .filter(edge => edge.controlledBy === 'blue')
    .reduce((sum, edge) => sum + (edge.weight || 1), 0);
  
  // In a full implementation, you'd display this in a modal
  console.log("Game Analysis:", {
    redTitans,
    blueTitans,
    redScore,
    blueScore,
    redEdges,
    blueEdges,
    redEdgePoints,
    blueEdgePoints
  });
  
  showMessage("Game analysis data shown (check console)");
}

// Apply a powerup
function applyPowerup(type) {
  if (paused) return;
  
  // Check if player has this powerup
  const powerups = currentPlayer === 'red' ? redPowerups : bluePowerups;
  
  if (powerups[type] <= 0) {
    showMessage(`No ${type} powerups left!`);
    return;
  }
  
  // Save current state for undo
  saveState();
  
  // Apply the powerup effect
  if (type === 'swap') {
    // Swap powerup implementation
    if (phase === 'movement') {
      // In swap powerup, user would select two nodes to swap
      // For simplicity, we'll just implement a basic version that swaps a random opponent titan with nothing
      
      const opponentTitans = nodes.filter(node => 
        node.occupied && node.occupiedBy !== currentPlayer
      );
      
      const emptyNodes = nodes.filter(node => !node.occupied);
      
      if (opponentTitans.length > 0 && emptyNodes.length > 0) {
        const randomOpponent = opponentTitans[Math.floor(Math.random() * opponentTitans.length)];
        const randomEmpty = emptyNodes[Math.floor(Math.random() * emptyNodes.length)];
        
        // Move opponent titan to empty node
        randomEmpty.occupied = true;
        randomEmpty.occupiedBy = randomOpponent.occupiedBy;
        randomEmpty.element.classList.add(randomOpponent.occupiedBy);
        
        // Clear original node
        randomOpponent.occupied = false;
        randomOpponent.occupiedBy = null;
        randomOpponent.element.classList.remove('red', 'blue');
        
        // Update placed nodes list
        const index = placedNodes.indexOf(randomOpponent.index);
        if (index !== -1) {
          placedNodes[index] = randomEmpty.index;
        }
        
        showMessage(`${currentPlayer} used swap powerup!`);
        addToHistory(`${currentPlayer === 'red' ? 'Red' : 'Blue'} used SWAP powerup`);
      } else {
        showMessage("Cannot use swap powerup - no valid targets!");
        return; // Don't consume the powerup
      }
    } else {
      showMessage("Swap powerup can only be used in movement phase");
      return; // Don't consume the powerup
    }
  } else if (type === 'extraTitan') {
    // Extra titan powerup implementation
    if (currentPlayer === 'red' && redTitans < maxTitans + 1) {
      redTitans++; // Allow one extra titan
      maxTitans = 5; // Set max titans to 5 for this game
      showMessage("Red gained an extra titan!");
      addToHistory("Red used EXTRA TITAN powerup");
    } else if (currentPlayer === 'blue' && blueTitans < maxTitans + 1) {
      blueTitans++; // Allow one extra titan
      maxTitans = 5; // Set max titans to 5 for this game
      showMessage("Blue gained an extra titan!");
      addToHistory("Blue used EXTRA TITAN powerup");
    } else {
      showMessage("Cannot use extra titan powerup - already at maximum!");
      return; // Don't consume the powerup
    }
  }
  
  // Consume the powerup
  powerups[type]--;
  
  // Update UI
  updateGameUI();
  updatePowerupDisplay();
  
  // Update edge control
  updateEdgeControl();
  
  // Check win condition
  checkWinCondition();
}

// Open the powerup modal
function openPowerupModal() {
  powerupModalEl.classList.remove('hidden');
  
  // Only show powerups the player has available
  const powerups = currentPlayer === 'red' ? redPowerups : bluePowerups;
  
  swapPowerupBtn.style.display = powerups.swap > 0 ? 'flex' : 'none';
  extraPowerupBtn.style.display = powerups.extraTitan > 0 ? 'flex' : 'none';
  
  // Style powerup buttons for Hacker++ mode
  swapPowerupBtn.style.background = `linear-gradient(135deg, rgba(255, 204, 0, 0.2), rgba(255, 204, 0, 0.1))`;
  swapPowerupBtn.style.border = `1px solid rgba(255, 204, 0, 0.4)`;
  swapPowerupBtn.style.boxShadow = `0 0 20px rgba(255, 204, 0, 0.4)`;
  
  extraPowerupBtn.style.background = `linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.1))`;
  extraPowerupBtn.style.border = `1px solid rgba(0, 255, 136, 0.4)`;
  extraPowerupBtn.style.boxShadow = `0 0 20px rgba(0, 255, 136, 0.4)`;
}

// Close the powerup modal
function closePowerupModal() {
  powerupModalEl.classList.add('hidden');
}

// Open the configuration modal
function openConfigModal() {
  configModalEl.classList.remove('hidden');
}

// Close the configuration modal
function closeConfigModal() {
  configModalEl.classList.add('hidden');
}

// Set the game mode
function setGameMode(mode) {
  gameMode = mode;
  
  // Update UI
  normalModeBtn.classList.remove('active');
  hackerModeBtn.classList.remove('active');
  hackerPlusModeBtn.classList.remove('active');
  
  if (mode === 'normal') {
    normalModeBtn.classList.add('active');
    hackerControlsEl.classList.add('hidden');
    hackerPlusControlsEl.classList.add('hidden');
    moveHistoryEl.classList.add('hidden');
  } else if (mode === 'hacker') {
    hackerModeBtn.classList.add('active');
    hackerControlsEl.classList.remove('hidden');
    hackerPlusControlsEl.classList.add('hidden');
    moveHistoryEl.classList.remove('hidden');
  } else { // hackerPlus
    hackerPlusModeBtn.classList.add('active');
    hackerControlsEl.classList.remove('hidden');
    hackerPlusControlsEl.classList.remove('hidden');
    moveHistoryEl.classList.remove('hidden');
  }
  
  // Reset the game
  resetGame();
}

// Save current game state for undo/redo
function saveState() {
  const state = {
    nodes: nodes.map(node => ({
      ...node,
      element: null // Don't store DOM elements
    })),
    edges: edges.map(edge => ({
      ...edge,
      element: null // Don't store DOM elements
    })),
    currentPlayer,
    phase,
    redScore,
    blueScore,
    redTitans,
    blueTitans,
    placedNodes: [...placedNodes],
    redPowerups: {...redPowerups},
    bluePowerups: {...bluePowerups}
  };
  
  // Remove any future states in redo stack when making a new move
  redoStack = [];
  
  // Add new state to history
  history.push(JSON.parse(JSON.stringify(state)));
  historyIndex = history.length - 1;
}

// Restore a saved game state
function restoreState(state) {
  // Restore simple properties
  currentPlayer = state.currentPlayer;
  phase = state.phase;
  redScore = state.redScore;
  blueScore = state.blueScore;
  redTitans = state.redTitans;
  blueTitans = state.blueTitans;
  placedNodes = [...state.placedNodes];
  redPowerups = {...state.redPowerups};
  bluePowerups = {...state.bluePowerups};
  
  // Restore node occupancy
  nodes.forEach((node, i) => {
    const savedNode = state.nodes[i];
    if (savedNode) {
      node.occupied = savedNode.occupied;
      node.occupiedBy = savedNode.occupiedBy;
      
      // Update DOM
      node.element.classList.remove('red', 'blue');
      if (node.occupied) {
        node.element.classList.add(node.occupiedBy);
      }
    }
  });
  
  // Restore edge control
  edges.forEach((edge, i) => {
    const savedEdge = state.edges[i];
    if (savedEdge) {
      edge.controlledBy = savedEdge.controlledBy;
      
      // Update DOM
      if (edge.element) {
        edge.element.classList.remove('controlled-red', 'controlled-blue');
        if (edge.controlledBy) {
          edge.element.classList.add(`controlled-${edge.controlledBy}`);
        }
      }
    }
  });
}

// Update the game UI
function updateGameUI() {
  // Update scores
  redScoreEl.textContent = redScore;
  blueScoreEl.textContent = blueScore;
  
  // Update titan counts
  redTitansEl.textContent = redTitans;
  blueTitansEl.textContent = blueTitans;
  
  // Update current player indicator
  currentPlayerEl.textContent = `${currentPlayer.toUpperCase()}'S TURN`;
  currentPlayerEl.classList.remove('glow-red', 'glow-blue');
  currentPlayerEl.classList.add(currentPlayer === 'red' ? 'glow-red' : 'glow-blue');
  
  // Update phase indicator
  phaseIndicatorEl.textContent = phase === 'placement' ? 'PLACEMENT PHASE' : 'MOVEMENT PHASE';
  phaseIndicatorEl.classList.toggle('placement-phase', phase === 'placement');
  phaseIndicatorEl.classList.toggle('movement-phase', phase === 'movement');
  
  // Update powerup display
  updatePowerupDisplay();
}

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);