// app.js
// Game engine for Crownline: Prologue

import { GAME } from './content.js';

// =========================
// Game State
// =========================
const state = {
  currentScene: 's1_antechamber',
  flags: {},
  clues: new Set(),
  lore: new Set(),
  viewedHotspots: new Set(),
  activePuzzle: null,
  puzzleSolution: [],
};

// =========================
// Audio System
// =========================
let clickSound = null;

function loadSounds() {
  if (GAME.sfx && GAME.sfx.click) {
    clickSound = new Audio(GAME.sfx.click);
    clickSound.volume = 0.3;
    // Preload but handle error gracefully
    clickSound.addEventListener('error', () => {
      console.log('Click sound not found, continuing without audio');
      clickSound = null;
    });
  }
}

function playClick() {
  if (clickSound) {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {
      // Silently fail if audio doesn't play
    });
  }
}

// =========================
// Condition Checking
// =========================
function checkConditions(conditions) {
  if (!conditions || conditions.length === 0) return true;
  
  for (const cond of conditions) {
    if (cond.type === 'hasFlag') {
      if (state.flags[cond.flag] !== cond.value) return false;
    } else if (cond.type === 'allFlagsTrue') {
      for (const flag of cond.flags) {
        if (!state.flags[flag]) return false;
      }
    } else if (cond.type === 'hasClues') {
      for (const clue of cond.clues) {
        if (!state.clues.has(clue)) return false;
      }
    }
  }
  
  return true;
}

// =========================
// Effect Application
// =========================
function applyEffects(effects) {
  if (!effects) return;
  
  for (const effect of effects) {
    switch (effect.type) {
      case 'addFlag':
        state.flags[effect.flag] = effect.value;
        break;
      case 'addClue':
        state.clues.add(effect.clueId);
        updateCluesDisplay();
        break;
      case 'addLore':
        if (!state.lore.has(effect.loreId)) {
          state.lore.add(effect.loreId);
          updateLoreDisplay();
          showLoreUnlockNotification(effect.loreId);
        }
        break;
    }
  }
}

// =========================
// Scene Rendering
// =========================
function renderScene(sceneId) {
  playClick();
  state.currentScene = sceneId;
  
  const scene = GAME.scenes[sceneId];
  if (!scene) {
    console.error('Scene not found:', sceneId);
    return;
  }
  
  // Update scene image
  const sceneImg = document.getElementById('scene-image');
  sceneImg.src = scene.image;
  sceneImg.alt = scene.title;
  
  // Update header
  document.getElementById('scene-title').textContent = scene.title;
  document.getElementById('scene-stamp').textContent = scene.dossierStamp;
  
  // Render entry text
  const narrativeDiv = document.getElementById('narrative-text');
  narrativeDiv.innerHTML = '';
  
  scene.entryText.forEach(para => {
    const p = document.createElement('p');
    p.textContent = para;
    narrativeDiv.appendChild(p);
  });
  
  // Render characters
  if (scene.characters && scene.characters.length > 0) {
    scene.characters.forEach(char => {
      const charDiv = document.createElement('div');
      charDiv.className = 'character-intro';
      charDiv.innerHTML = `
        <strong>${char.name}</strong> — <em>${char.role}</em>
      `;
      narrativeDiv.appendChild(charDiv);
    });
  }
  
  // Render hotspots
  renderHotspots(scene);
  
  // Render proceed button if available
  renderProceedButton(scene);
}

function renderHotspots(scene) {
  const hotspotsContainer = document.getElementById('hotspots-list');
  hotspotsContainer.innerHTML = '';
  
  scene.hotspots.forEach(hotspot => {
    // Check if hotspot should be shown
    if (hotspot.showIf && !checkConditions(hotspot.showIf)) {
      return; // Skip this hotspot
    }
    
    const hotspotDiv = document.createElement('div');
    hotspotDiv.className = 'hotspot-item';
    
    // Check if already viewed
    if (state.viewedHotspots.has(hotspot.id)) {
      hotspotDiv.classList.add('viewed');
    }
    
    const button = document.createElement('button');
    button.className = 'hotspot-btn';
    button.textContent = hotspot.label;
    button.addEventListener('click', () => handleHotspotClick(hotspot, scene));
    
    hotspotDiv.appendChild(button);
    hotspotsContainer.appendChild(hotspotDiv);
  });
}

function renderProceedButton(scene) {
  const proceedContainer = document.getElementById('proceed-container');
  proceedContainer.innerHTML = '';
  
  if (scene.proceed && checkConditions(scene.proceed.conditions || [])) {
    const button = document.createElement('button');
    button.className = 'proceed-btn';
    button.textContent = scene.proceed.label;
    button.addEventListener('click', () => {
      playClick();
      renderScene(scene.proceed.nextScene);
    });
    proceedContainer.appendChild(button);
  }
}

// =========================
// Hotspot Interaction
// =========================
function handleHotspotClick(hotspot, scene) {
  playClick();
  state.viewedHotspots.add(hotspot.id);
  
  const narrativeDiv = document.getElementById('narrative-text');
  narrativeDiv.innerHTML = '';
  
  // Show hotspot text
  if (hotspot.text) {
    hotspot.text.forEach(para => {
      const p = document.createElement('p');
      p.textContent = para;
      narrativeDiv.appendChild(p);
    });
  }
  
  // Apply effects
  if (hotspot.effects) {
    applyEffects(hotspot.effects);
  }
  
  // Handle different hotspot types
  if (hotspot.type === 'talk' && hotspot.choices) {
    renderChoices(hotspot.choices, scene);
  } else if (hotspot.type === 'puzzle') {
    renderPuzzle(hotspot.puzzleId, scene);
  } else if (hotspot.type === 'action' && hotspot.choices) {
    renderChoices(hotspot.choices, scene);
  } else {
    // Regular inspect - just show back button
    renderBackButton(scene);
  }
  
  // Update hotspot display to show it's been viewed
  renderHotspots(scene);
}

function renderChoices(choices, scene) {
  const choicesDiv = document.createElement('div');
  choicesDiv.className = 'choices-container';
  
  choices.forEach(choice => {
    const button = document.createElement('button');
    button.className = 'choice-btn';
    button.textContent = choice.label;
    button.addEventListener('click', () => handleChoice(choice, scene));
    choicesDiv.appendChild(button);
  });
  
  document.getElementById('narrative-text').appendChild(choicesDiv);
}

function handleChoice(choice, scene) {
  playClick();
  
  const narrativeDiv = document.getElementById('narrative-text');
  narrativeDiv.innerHTML = '';
  
  // Show result text
  if (choice.resultText) {
    choice.resultText.forEach(para => {
      const p = document.createElement('p');
      p.textContent = para;
      narrativeDiv.appendChild(p);
    });
  }
  
  // Apply effects
  if (choice.effects) {
    applyEffects(choice.effects);
  }
  
  // Handle next scene or ending
  if (choice.next === 'END') {
    renderEnding();
  } else if (choice.next) {
    setTimeout(() => {
      renderScene(choice.next);
    }, 2000);
  } else {
    // No transition, show back button
    renderBackButton(scene);
  }
}

function renderBackButton(scene) {
  const backDiv = document.createElement('div');
  backDiv.className = 'back-button-container';
  
  const button = document.createElement('button');
  button.className = 'back-btn';
  button.textContent = '← Return to investigation';
  button.addEventListener('click', () => {
    playClick();
    renderScene(scene.id);
  });
  
  backDiv.appendChild(button);
  document.getElementById('narrative-text').appendChild(backDiv);
}

// =========================
// Puzzle System
// =========================
function renderPuzzle(puzzleId, scene) {
  const currentScene = GAME.scenes[scene.id];
  const puzzle = currentScene.puzzles[puzzleId];
  
  if (!puzzle) {
    console.error('Puzzle not found:', puzzleId);
    return;
  }
  
  state.activePuzzle = puzzle;
  state.puzzleSolution = [];
  
  const narrativeDiv = document.getElementById('narrative-text');
  narrativeDiv.innerHTML = '';
  
  // Puzzle intro
  const introDiv = document.createElement('div');
  introDiv.className = 'puzzle-intro';
  puzzle.intro.forEach(para => {
    const p = document.createElement('p');
    p.textContent = para;
    introDiv.appendChild(p);
  });
  narrativeDiv.appendChild(introDiv);
  
  // Symbol selection interface
  const puzzleDiv = document.createElement('div');
  puzzleDiv.className = 'puzzle-container';
  puzzleDiv.id = 'puzzle-interface';
  
  const instructionP = document.createElement('p');
  instructionP.className = 'puzzle-instruction';
  instructionP.textContent = 'Click symbols in order:';
  puzzleDiv.appendChild(instructionP);
  
  const symbolsDiv = document.createElement('div');
  symbolsDiv.className = 'symbols-grid';
  
  GAME.symbols.forEach(symbol => {
    const symbolBtn = document.createElement('button');
    symbolBtn.className = 'symbol-btn';
    symbolBtn.innerHTML = `<span class="symbol-glyph">${symbol.glyph}</span><br><small>${symbol.label}</small>`;
    symbolBtn.dataset.symbolId = symbol.id;
    symbolBtn.addEventListener('click', () => addSymbolToSolution(symbol.id));
    symbolsDiv.appendChild(symbolBtn);
  });
  
  puzzleDiv.appendChild(symbolsDiv);
  
  const solutionDiv = document.createElement('div');
  solutionDiv.className = 'solution-display';
  solutionDiv.id = 'solution-display';
  solutionDiv.innerHTML = '<strong>Your sequence:</strong> <span id="solution-text">—</span>';
  puzzleDiv.appendChild(solutionDiv);
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'puzzle-actions';
  
  const clearBtn = document.createElement('button');
  clearBtn.className = 'puzzle-btn-clear';
  clearBtn.textContent = 'Clear';
  clearBtn.addEventListener('click', clearSolution);
  
  const submitBtn = document.createElement('button');
  submitBtn.className = 'puzzle-btn-submit';
  submitBtn.textContent = 'Submit';
  submitBtn.addEventListener('click', () => checkPuzzleSolution(scene));
  
  actionsDiv.appendChild(clearBtn);
  actionsDiv.appendChild(submitBtn);
  puzzleDiv.appendChild(actionsDiv);
  
  narrativeDiv.appendChild(puzzleDiv);
  
  // Back button
  renderBackButton(scene);
}

function addSymbolToSolution(symbolId) {
  playClick();
  
  if (state.puzzleSolution.length < 3) {
    state.puzzleSolution.push(symbolId);
    updateSolutionDisplay();
  }
}

function clearSolution() {
  playClick();
  state.puzzleSolution = [];
  updateSolutionDisplay();
}

function updateSolutionDisplay() {
  const solutionText = document.getElementById('solution-text');
  if (state.puzzleSolution.length === 0) {
    solutionText.textContent = '—';
  } else {
    const glyphs = state.puzzleSolution.map(id => {
      const symbol = GAME.symbols.find(s => s.id === id);
      return symbol ? symbol.glyph : '?';
    });
    solutionText.textContent = glyphs.join(' → ');
  }
}

function checkPuzzleSolution(scene) {
  playClick();
  
  const puzzle = state.activePuzzle;
  const correct = JSON.stringify(state.puzzleSolution) === JSON.stringify(puzzle.correctOrder);
  
  const narrativeDiv = document.getElementById('narrative-text');
  narrativeDiv.innerHTML = '';
  
  if (correct) {
    // Success!
    const successDiv = document.createElement('div');
    successDiv.className = 'puzzle-success';
    
    puzzle.rewardText.forEach(para => {
      const p = document.createElement('p');
      p.textContent = para;
      successDiv.appendChild(p);
    });
    
    narrativeDiv.appendChild(successDiv);
    
    // Apply effects
    if (puzzle.effectsOnSolve) {
      applyEffects(puzzle.effectsOnSolve);
    }
    
    // Show back button
    renderBackButton(scene);
  } else {
    // Failure
    const failDiv = document.createElement('div');
    failDiv.className = 'puzzle-failure';
    
    const p = document.createElement('p');
    p.textContent = 'The mechanism resists. The order is wrong.';
    failDiv.appendChild(p);
    
    narrativeDiv.appendChild(failDiv);
    
    // Show try again button
    setTimeout(() => {
      const tryAgainBtn = document.createElement('button');
      tryAgainBtn.className = 'back-btn';
      tryAgainBtn.textContent = 'Try again';
      tryAgainBtn.addEventListener('click', () => {
        playClick();
        renderScene(scene.id);
      });
      narrativeDiv.appendChild(tryAgainBtn);
    }, 1000);
  }
  
  state.activePuzzle = null;
}

// =========================
// Ending
// =========================
function renderEnding() {
  const narrativeDiv = document.getElementById('narrative-text');
  narrativeDiv.innerHTML = '';
  
  const endingDiv = document.createElement('div');
  endingDiv.className = 'ending-text';
  
  // Base ending
  const basePara = document.createElement('p');
  basePara.textContent = '"You were royal once," the Echo whispers, finally naming what you tried to bury.';
  endingDiv.appendChild(basePara);
  
  // Personalized based on flags
  if (state.flags.cipherSolved) {
    const p = document.createElement('p');
    p.textContent = '"And you still unlock what others fear to touch. The cartridge you carry proves it."';
    endingDiv.appendChild(p);
  }
  
  if (state.flags.wardenDisposition === 'strict') {
    const p = document.createElement('p');
    p.textContent = '"The Warden marks you. Authority leaves scars even when it shifts hands."';
    endingDiv.appendChild(p);
  } else if (state.flags.wardenDisposition === 'neutral') {
    const p = document.createElement('p');
    p.textContent = '"The Warden suspects, but suspicion is not proof. You may pass unrecorded—for now."';
    endingDiv.appendChild(p);
  }
  
  if (state.flags.learnedInjectionRisk) {
    const p = document.createElement('p');
    p.textContent = '"You knew the cost and paid it anyway. That makes you dangerous. Or desperate."';
    endingDiv.appendChild(p);
  }
  
  // Final line
  const finalPara = document.createElement('p');
  finalPara.textContent = 'The room fades. The memory releases you. You are left with three certainties: the crown is broken, the truth is incomplete, and you are not done yet.';
  endingDiv.appendChild(finalPara);
  
  narrativeDiv.appendChild(endingDiv);
  
  // End credits
  const creditsDiv = document.createElement('div');
  creditsDiv.className = 'credits';
  creditsDiv.innerHTML = `
    <hr>
    <p><strong>— End of Prologue —</strong></p>
    <p><em>Crownline: Prologue v${GAME.meta.version}</em></p>
    <button class="restart-btn" onclick="location.reload()">Play Again</button>
  `;
  narrativeDiv.appendChild(creditsDiv);
}

// =========================
// Clues & Lore Display
// =========================
function updateCluesDisplay() {
  const cluesContainer = document.getElementById('clues-list');
  cluesContainer.innerHTML = '';
  
  state.clues.forEach(clueId => {
    const clue = GAME.clues[clueId];
    if (clue) {
      const chip = document.createElement('div');
      chip.className = 'clue-chip';
      chip.title = clue.desc;
      chip.textContent = clue.title;
      cluesContainer.appendChild(chip);
    }
  });
}

function updateLoreDisplay() {
  const loreContainer = document.getElementById('lore-list');
  loreContainer.innerHTML = '';
  
  // Show all lore (locked and unlocked)
  Object.keys(GAME.lore).forEach(loreId => {
    const loreItem = document.createElement('div');
    loreItem.className = 'lore-item';
    
    if (state.lore.has(loreId)) {
      loreItem.classList.add('unlocked');
      const button = document.createElement('button');
      button.className = 'lore-btn';
      button.textContent = GAME.lore[loreId].title;
      button.addEventListener('click', () => showLoreModal(loreId));
      loreItem.appendChild(button);
    } else {
      loreItem.classList.add('locked');
      loreItem.textContent = '🔒 Locked';
    }
    
    loreContainer.appendChild(loreItem);
  });
}

function showLoreModal(loreId) {
  playClick();
  
  const lore = GAME.lore[loreId];
  const modal = document.getElementById('lore-modal');
  const modalTitle = document.getElementById('lore-modal-title');
  const modalBody = document.getElementById('lore-modal-body');
  
  modalTitle.textContent = lore.title;
  modalBody.innerHTML = '';
  
  lore.body.forEach(para => {
    const p = document.createElement('p');
    p.textContent = para;
    modalBody.appendChild(p);
  });
  
  modal.style.display = 'flex';
}

function closeLoreModal() {
  playClick();
  document.getElementById('lore-modal').style.display = 'none';
}

function showLoreUnlockNotification(loreId) {
  const lore = GAME.lore[loreId];
  const notification = document.createElement('div');
  notification.className = 'lore-notification';
  notification.textContent = `📜 ${lore.title} unlocked!`;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// =========================
// Initialization
// =========================
function init() {
  // Set up lore modal close button
  document.getElementById('lore-modal-close').addEventListener('click', closeLoreModal);
  
  // Close modal on outside click
  document.getElementById('lore-modal').addEventListener('click', (e) => {
    if (e.target.id === 'lore-modal') {
      closeLoreModal();
    }
  });
  
  // Set game title
  document.getElementById('game-title').textContent = GAME.meta.title;
  document.getElementById('game-subtitle').textContent = GAME.meta.subtitle;
  
  // Load sounds
  loadSounds();
  
  // Initialize displays
  updateCluesDisplay();
  updateLoreDisplay();
  
  // Start first scene
  renderScene('s1_antechamber');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
