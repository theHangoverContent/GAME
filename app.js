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
  if (!sceneImg) {
    console.error('DOM element not found: scene-image');
    return;
  }
  sceneImg.src = scene.image;
  sceneImg.alt = scene.title;
  
  // Update header
  const sceneTitle = document.getElementById('scene-title');
  const sceneStamp = document.getElementById('scene-stamp');
  if (!sceneTitle || !sceneStamp) {
    console.error('DOM elements not found: scene-title or scene-stamp');
    return;
  }
  sceneTitle.textContent = scene.title;
  sceneStamp.textContent = scene.dossierStamp;
  
  // Render entry text
  const narrativeDiv = document.getElementById('narrative-text');
  if (!narrativeDiv) {
    console.error('DOM element not found: narrative-text');
    return;
  }
  narrativeDiv.innerHTML = '';
  
  if (!scene.entryText || !Array.isArray(scene.entryText)) {
    console.warn('Scene entry text missing or invalid:', sceneId);
  } else {
    scene.entryText.forEach(para => {
      const p = document.createElement('p');
      p.textContent = para;
      narrativeDiv.appendChild(p);
    });
  }
  
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
  if (!hotspotsContainer) {
    console.error('DOM element not found: hotspots-list');
    return;
  }
  hotspotsContainer.innerHTML = '';
  
  if (!scene.hotspots || !Array.isArray(scene.hotspots)) {
    console.warn('Scene hotspots missing or invalid:', scene.id);
    return;
  }
  
  scene.hotspots.forEach(hotspot => {
    if (!hotspot.id || !hotspot.label) {
      console.warn('Hotspot missing required fields (id or label):', hotspot);
      return;
    }
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
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', `Investigate: ${hotspot.label}`);
    button.addEventListener('click', () => handleHotspotClick(hotspot, scene));
    
    hotspotDiv.appendChild(button);
    hotspotsContainer.appendChild(hotspotDiv);
  });
}

function renderProceedButton(scene) {
  const proceedContainer = document.getElementById('proceed-container');
  if (!proceedContainer) {
    console.error('DOM element not found: proceed-container');
    return;
  }
  proceedContainer.innerHTML = '';
  
  if (scene.proceed && scene.proceed.nextScene && checkConditions(scene.proceed.conditions || [])) {
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
  if (!narrativeDiv) {
    console.error('DOM element not found: narrative-text');
    return;
  }
  narrativeDiv.innerHTML = '';
  
  // Show hotspot text
  if (hotspot.text && Array.isArray(hotspot.text)) {
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
    button.setAttribute('role', 'button');
    button.addEventListener('click', () => handleChoice(choice, scene));
    choicesDiv.appendChild(button);
  });
  
  document.getElementById('narrative-text').appendChild(choicesDiv);
}

function handleChoice(choice, scene) {
  playClick();
  
  const narrativeDiv = document.getElementById('narrative-text');
  if (!narrativeDiv) {
    console.error('DOM element not found: narrative-text');
    return;
  }
  narrativeDiv.innerHTML = '';
  
  // Show result text
  if (choice.resultText && Array.isArray(choice.resultText)) {
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
  if (!currentScene) {
    console.error('Scene not found:', scene.id);
    return;
  }
  
  if (!currentScene.puzzles) {
    console.error('No puzzles defined for scene:', scene.id);
    return;
  }
  
  const puzzle = currentScene.puzzles[puzzleId];
  
  if (!puzzle) {
    console.error('Puzzle not found:', puzzleId);
    return;
  }
  
  state.activePuzzle = puzzle;
  state.puzzleSolution = [];
  
  const narrativeDiv = document.getElementById('narrative-text');
  if (!narrativeDiv) {
    console.error('DOM element not found: narrative-text');
    return;
  }
  narrativeDiv.innerHTML = '';
  
  // Puzzle intro
  const introDiv = document.createElement('div');
  introDiv.className = 'puzzle-intro';
  if (puzzle.intro && Array.isArray(puzzle.intro)) {
    puzzle.intro.forEach(para => {
      const p = document.createElement('p');
      p.textContent = para;
      introDiv.appendChild(p);
    });
  }
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
  
  if (!GAME.symbols || !Array.isArray(GAME.symbols)) {
    console.error('GAME.symbols not defined or invalid');
  } else {
    GAME.symbols.forEach(symbol => {
      if (!symbol.id || !symbol.label || !symbol.glyph) {
        console.warn('Symbol missing required fields:', symbol);
        return;
      }
      const symbolBtn = document.createElement('button');
      symbolBtn.className = 'symbol-btn';
      symbolBtn.innerHTML = `<span class="symbol-glyph">${symbol.glyph}</span><br><small>${symbol.label}</small>`;
      symbolBtn.dataset.symbolId = symbol.id;
      symbolBtn.addEventListener('click', () => addSymbolToSolution(symbol.id));
      symbolsDiv.appendChild(symbolBtn);
    });
  }
  
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
  if (!solutionText) {
    console.warn('DOM element not found: solution-text');
    return;
  }
  
  if (state.puzzleSolution.length === 0) {
    solutionText.textContent = '—';
  } else {
    const glyphs = state.puzzleSolution.map(id => {
      const symbol = GAME.symbols ? GAME.symbols.find(s => s.id === id) : null;
      return symbol ? symbol.glyph : '?';
    });
    solutionText.textContent = glyphs.join(' → ');
  }
}

function checkPuzzleSolution(scene) {
  playClick();
  
  const puzzle = state.activePuzzle;
  if (!puzzle) {
    console.error('No active puzzle to check');
    return;
  }
  
  if (!puzzle.correctOrder || !Array.isArray(puzzle.correctOrder)) {
    console.error('Puzzle missing correctOrder:', puzzle);
    return;
  }
  
  const correct = JSON.stringify(state.puzzleSolution) === JSON.stringify(puzzle.correctOrder);
  
  const narrativeDiv = document.getElementById('narrative-text');
  if (!narrativeDiv) {
    console.error('DOM element not found: narrative-text');
    return;
  }
  narrativeDiv.innerHTML = '';
  
  if (correct) {
    // Success!
    const successDiv = document.createElement('div');
    successDiv.className = 'puzzle-success';
    
    if (puzzle.rewardText && Array.isArray(puzzle.rewardText)) {
      puzzle.rewardText.forEach(para => {
        const p = document.createElement('p');
        p.textContent = para;
        successDiv.appendChild(p);
      });
    }
    
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
  if (state.flags.sigilPuzzleSolved) {
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
  if (!cluesContainer) {
    console.error('DOM element not found: clues-list');
    return;
  }
  cluesContainer.innerHTML = '';
  
  if (!GAME.clues) {
    console.warn('GAME.clues not defined');
    return;
  }
  
  state.clues.forEach(clueId => {
    const clue = GAME.clues[clueId];
    if (clue && clue.title) {
      const chip = document.createElement('div');
      chip.className = 'clue-chip';
      chip.title = clue.desc;
      chip.textContent = clue.title;
      cluesContainer.appendChild(chip);
    } else {
      console.warn('Clue not found or missing title:', clueId);
    }
  });
}

function updateLoreDisplay() {
  const loreContainer = document.getElementById('lore-list');
  if (!loreContainer) {
    console.error('DOM element not found: lore-list');
    return;
  }
  loreContainer.innerHTML = '';
  
  if (!GAME.lore) {
    console.warn('GAME.lore not defined');
    return;
  }
  
  // Show all lore (locked and unlocked)
  Object.keys(GAME.lore).forEach(loreId => {
    const loreData = GAME.lore[loreId];
    if (!loreData || !loreData.title) {
      console.warn('Lore missing or invalid:', loreId);
      return;
    }
    
    const loreItem = document.createElement('div');
    loreItem.className = 'lore-item';
    
    if (state.lore.has(loreId)) {
      loreItem.classList.add('unlocked');
      const button = document.createElement('button');
      button.className = 'lore-btn';
      button.textContent = loreData.title;
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
  
  if (!GAME.lore || !GAME.lore[loreId]) {
    console.error('Lore not found:', loreId);
    return;
  }
  
  const lore = GAME.lore[loreId];
  const modal = document.getElementById('lore-modal');
  const modalTitle = document.getElementById('lore-modal-title');
  const modalBody = document.getElementById('lore-modal-body');
  const modalCloseBtn = document.getElementById('lore-modal-close');
  
  if (!modal || !modalTitle || !modalBody) {
    console.error('Modal DOM elements not found');
    return;
  }
  
  modalTitle.textContent = lore.title;
  modalBody.innerHTML = '';
  
  if (lore.body && Array.isArray(lore.body)) {
    lore.body.forEach(para => {
      const p = document.createElement('p');
      p.textContent = para;
      modalBody.appendChild(p);
    });
  }
  
  modal.style.display = 'flex';
  
  // Focus the close button for accessibility
  // Use requestAnimationFrame for more reliable focus timing
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (modalCloseBtn) {
        modalCloseBtn.focus();
      }
    });
  });
}

function closeLoreModal() {
  playClick();
  const modal = document.getElementById('lore-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function showLoreUnlockNotification(loreId) {
  if (!GAME.lore || !GAME.lore[loreId]) {
    console.warn('Lore not found for notification:', loreId);
    return;
  }
  
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
// Keyboard Event Handling
// =========================
let keyboardListenersInitialized = false;

function setupKeyboardListeners() {
  if (keyboardListenersInitialized) return;
  
  document.addEventListener('keydown', (e) => {
    const loreModal = document.getElementById('lore-modal');
    if (e.key === 'Escape' && loreModal && loreModal.style.display === 'flex') {
      closeLoreModal();
    }
  });
  
  keyboardListenersInitialized = true;
}

// =========================
// Initialization
// =========================
function init() {
  // Validate GAME content structure
  if (!GAME || !GAME.meta || !GAME.scenes) {
    console.error('GAME content is missing or invalid. Cannot initialize.');
    const narrativeDiv = document.getElementById('narrative-text');
    if (narrativeDiv) {
      narrativeDiv.innerHTML = '<p style="color: red;">Error: Game content failed to load. Please refresh the page.</p>';
    }
    return;
  }
  
  // Set up lore modal close button
  const modalCloseBtn = document.getElementById('lore-modal-close');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeLoreModal);
  } else {
    console.warn('Lore modal close button not found');
  }
  
  // Close modal on outside click
  const loreModal = document.getElementById('lore-modal');
  if (loreModal) {
    loreModal.addEventListener('click', (e) => {
      if (e.target.id === 'lore-modal') {
        closeLoreModal();
      }
    });
  } else {
    console.warn('Lore modal not found');
  }
  
  // Set up keyboard listeners (only once)
  setupKeyboardListeners();
  
  // Set game title
  const gameTitle = document.getElementById('game-title');
  const gameSubtitle = document.getElementById('game-subtitle');
  if (gameTitle && GAME.meta.title) {
    gameTitle.textContent = GAME.meta.title;
  }
  if (gameSubtitle && GAME.meta.subtitle) {
    gameSubtitle.textContent = GAME.meta.subtitle;
  }
  
  // Load sounds
  loadSounds();
  
  // Initialize displays
  updateCluesDisplay();
  updateLoreDisplay();
  
  // Start first scene
  const startScene = 's1_antechamber';
  if (GAME.scenes[startScene]) {
    renderScene(startScene);
  } else {
    console.error('Starting scene not found:', startScene);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
