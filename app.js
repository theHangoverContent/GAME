// app.js
import { GAME } from "./content.js";

const $ = (sel) => document.querySelector(sel);

const state = {
  sceneId: "s1_antechamber",
  flags: {},
  clues: new Set(),
  lore: new Set(),
  // puzzle working buffer
  puzzle: {
    selected: [], // array of symbol ids in chosen order
  },
};

function safePlay(src) {
  if (!src) return;
  try {
    const a = new Audio(src);
    a.volume = 0.4;
    a.play().catch(() => {});
  } catch (_) {}
}

function clickSfx() {
  safePlay(GAME.sfx?.click);
}

function hasAllClues(clues) {
  return clues.every((c) => state.clues.has(c));
}

function allFlagsTrue(flags) {
  return flags.every((f) => state.flags[f] === true);
}

function showIfPasses(showIf = []) {
  // showIf is an array of conditions; all must pass
  for (const cond of showIf) {
    if (cond.type === "hasClues") {
      if (!hasAllClues(cond.clues)) return false;
    } else if (cond.type === "allFlagsTrue") {
      if (!allFlagsTrue(cond.flags)) return false;
    } else {
      // unknown condition => be safe: hide
      return false;
    }
  }
  return true;
}

function applyEffect(effect) {
  if (!effect) return;

  if (effect.type === "addFlag") {
    state.flags[effect.flag] = effect.value;
  } else if (effect.type === "addClue") {
    state.clues.add(effect.clueId);
  } else if (effect.type === "addLore") {
    state.lore.add(effect.loreId);
  }
}

function applyEffects(effects = []) {
  for (const e of effects) applyEffect(e);
}

function setScene(sceneId) {
  state.sceneId = sceneId;
  render();
}

function render() {
  const scene = GAME.scenes?.[state.sceneId];
  if (!scene) {
    console.error(`Scene not found: ${state.sceneId}`);
    const bodyText = $("#bodyText");
    if (bodyText) {
      bodyText.textContent = "Scene not found.";
    }
    return;
  }

  // Header
  const gameTitle = $("#gameTitle");
  if (!gameTitle) {
    console.error('DOM element not found: gameTitle');
    return;
  }
  gameTitle.textContent = GAME.meta?.title || "";

  const gameSubtitle = $("#gameSubtitle");
  if (!gameSubtitle) {
    console.error('DOM element not found: gameSubtitle');
    return;
  }
  gameSubtitle.textContent = GAME.meta?.subtitle || "";

  const sceneTitle = $("#sceneTitle");
  if (!sceneTitle) {
    console.error('DOM element not found: sceneTitle');
    return;
  }
  sceneTitle.textContent = scene.title || "";

  const stamp = $("#stamp");
  if (!stamp) {
    console.error('DOM element not found: stamp');
    return;
  }
  stamp.textContent = scene.dossierStamp || "";

  // Image
  const img = $("#sceneImage");
  if (!img) {
    console.error('DOM element not found: sceneImage');
    return;
  }
  img.src = scene.image || "";
  img.alt = scene.title || "Scene image";

  // Narrative entry
  const bodyText = $("#bodyText");
  if (!bodyText) {
    console.error('DOM element not found: bodyText');
    return;
  }
  bodyText.innerHTML = "";
  if (Array.isArray(scene.entryText)) {
    scene.entryText.forEach((p) => {
      const el = document.createElement("p");
      el.textContent = p;
      bodyText.appendChild(el);
    });
  }

  // Sidebar: clues
  renderClues();
  // Sidebar: lore
  renderLore();

  // Actions / hotspots
  const list = $("#hotspotList");
  if (!list) {
    console.error('DOM element not found: hotspotList');
    return;
  }
  list.innerHTML = "";

  if (Array.isArray(scene.hotspots)) {
    scene.hotspots
      .filter((hs) => showIfPasses(hs.showIf))
      .forEach((hs) => {
        const btn = document.createElement("button");
        btn.className = "hotspot";
        btn.textContent = hs.label || "Action";
        btn.setAttribute("aria-label", `Investigate: ${hs.label || "Action"}`);
        btn.onclick = () => {
          clickSfx();
          handleHotspot(hs, scene);
        };
        list.appendChild(btn);
      });
  }

  // Proceed button (if exists)
  const proceedWrap = $("#proceedWrap");
  if (!proceedWrap) {
    console.error('DOM element not found: proceedWrap');
    return;
  }
  proceedWrap.innerHTML = "";
  if (scene.proceed) {
    const pbtn = document.createElement("button");
    pbtn.className = "primary";
    pbtn.textContent = scene.proceed.label || "Proceed";
    pbtn.onclick = () => {
      clickSfx();
      setScene(scene.proceed.nextScene);
    };
    proceedWrap.appendChild(pbtn);
  }

  // Clear modal content
  closeModal();
}

function renderClues() {
  const wrap = $("#clueChips");
  if (!wrap) {
    console.error('DOM element not found: clueChips');
    return;
  }
  wrap.innerHTML = "";

  const cluesEmpty = $("#cluesEmpty");
  if (!cluesEmpty) {
    console.error('DOM element not found: cluesEmpty');
    return;
  }

  const ids = [...state.clues];
  if (ids.length === 0) {
    cluesEmpty.style.display = "block";
  } else {
    cluesEmpty.style.display = "none";
  }

  ids.forEach((id) => {
    const c = GAME.clues?.[id];
    if (!c) {
      console.warn(`Clue not found: ${id}`);
      return;
    }
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = c.title || id;
    chip.onclick = () => {
      clickSfx();
      openModal(
        c.title || "Clue",
        [c.desc || "No description."],
        { footer: "Clue recorded." }
      );
    };
    wrap.appendChild(chip);
  });
}

function renderLore() {
  const wrap = $("#loreList");
  if (!wrap) {
    console.error('DOM element not found: loreList');
    return;
  }
  wrap.innerHTML = "";

  if (!GAME.lore) {
    console.warn('GAME.lore not found');
    return;
  }

  const allLoreIds = Object.keys(GAME.lore);
  allLoreIds.forEach((id) => {
    const loreData = GAME.lore[id];
    if (!loreData) {
      console.warn(`Lore data not found: ${id}`);
      return;
    }
    const unlocked = state.lore.has(id);
    const item = document.createElement("button");
    item.className = "loreItem";
    item.disabled = !unlocked;
    item.textContent = unlocked ? (loreData.title || id) : "Lore — Locked";
    item.onclick = () => {
      clickSfx();
      openModal(loreData.title || id, loreData.body || [], { footer: "Lore collected." });
    };
    wrap.appendChild(item);
  });
}

function handleHotspot(hs, scene) {
  // puzzle hotspot
  if (hs.type === "puzzle") {
    const puzzle = scene.puzzles?.[hs.puzzleId];
    if (!puzzle) {
      openModal("Puzzle", ["Puzzle data missing."], {});
      return;
    }
    openSigilOrderPuzzle(puzzle);
    return;
  }

  // talk hotspot
  if (hs.type === "talk") {
    const character = (scene.characters || []).find((c) => c.id === hs.characterId);
    const header = character ? `${character.name} — ${character.role}` : "Conversation";
    const lines = [];
    (hs.text || []).forEach((t) => lines.push(t));
    if (character?.voice?.length) {
      lines.push("");
      lines.push(`"${character.voice[0]}"`);
    }
    openChoiceModal(header, lines, hs.choices || []);
    return;
  }

  // inspect / action
  const title = hs.label || "Inspection";
  const lines = hs.text || ["Nothing noteworthy."];
  applyEffects(hs.effects || []);
  // Re-render sidebars immediately after effects
  renderClues();
  renderLore();

  // If this is the injection node, it has choices
  if (hs.choices?.length) {
    openChoiceModal(title, lines, hs.choices);
  } else {
    openModal(title, lines, { footer: "Filed." });
  }
}

function openModal(title, paragraphs = [], opts = {}) {
  const modalTitle = $("#modalTitle");
  if (!modalTitle) {
    console.error('DOM element not found: modalTitle');
    return;
  }
  modalTitle.textContent = title;

  const body = $("#modalBody");
  if (!body) {
    console.error('DOM element not found: modalBody');
    return;
  }
  body.innerHTML = "";
  if (Array.isArray(paragraphs)) {
    paragraphs.forEach((p) => {
      const el = document.createElement("p");
      el.textContent = p;
      body.appendChild(el);
    });
  }

  const modalFooter = $("#modalFooter");
  if (!modalFooter) {
    console.error('DOM element not found: modalFooter');
    return;
  }
  modalFooter.textContent = opts.footer || "";

  const modalChoices = $("#modalChoices");
  if (!modalChoices) {
    console.error('DOM element not found: modalChoices');
    return;
  }
  modalChoices.innerHTML = "";

  const modal = $("#modal");
  if (!modal) {
    console.error('DOM element not found: modal');
    return;
  }
  modal.classList.add("open");

  // Focus management with double requestAnimationFrame for reliable cross-browser timing
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    });
  });
}

function openChoiceModal(title, paragraphs = [], choices = []) {
  openModal(title, paragraphs, { footer: "" });
  const wrap = $("#modalChoices");
  wrap.innerHTML = "";

  choices.forEach((ch) => {
    const btn = document.createElement("button");
    btn.className = ch.next ? "primary" : "secondary";
    btn.textContent = ch.label;
    btn.onclick = () => {
      clickSfx();
      // Apply choice effects
      applyEffects(ch.effects || []);

      // Show result text + then optionally advance
      const result = (ch.resultText || []).slice();
      // Special case: ending text assembly if END
      if (ch.next === "END") {
        result.push("");
        result.push(...buildEndingText());
      }

      openModal("Filed Response", result, {
        footer: ch.next === "END" ? "END OF PROLOGUE" : "Decision recorded.",
      });

      // Advance if next scene
      if (ch.next && ch.next !== "END") {
        // Delay small for readability; no async promises needed
        setTimeout(() => setScene(ch.next), 200);
      }

      // If end, keep player in modal and show restart button
      if (ch.next === "END") {
        const wrap2 = $("#modalChoices");
        wrap2.innerHTML = "";
        const again = document.createElement("button");
        again.className = "primary";
        again.textContent = "Restart Prologue";
        again.onclick = () => {
          clickSfx();
          resetGame();
        };
        wrap2.appendChild(again);
      }

      // Update sidebars if choice unlocked lore etc
      renderClues();
      renderLore();
    };
    wrap.appendChild(btn);
  });
}

function buildEndingText() {
  // Reveal: you are ex-royal only at the end
  const lines = [];

  // Moral risk emphasis
  lines.push("The Echo's smile is not kind. It is accurate.");
  if (state.flags.learnedInjectionRisk) {
    lines.push("You knew the risk. You did it anyway. That is what the court calls guilt.");
  } else {
    lines.push("You did not ask permission. That is what the ruins call survival.");
  }

  // Variation: strict vs neutral warden
  if (state.flags.wardenDisposition === "strict") {
    lines.push("Somewhere outside the remembered room, a pen scratches harder than necessary.");
  } else {
    lines.push("Somewhere outside the remembered room, the Warden files your existence under 'Pending.'");
  }

  // Variation: solved symbol puzzle
  if (state.flags.sigilPuzzleSolved) {
    lines.push("The Black Library folio feels heavier now—as if it recognizes you.");
  } else {
    lines.push("You feel the room resisting you, withholding the pages you did not earn.");
  }

  // Key reveal (only now)
  lines.push("");
  lines.push("Then the Echo speaks the name you have not spoken aloud in years.");
  lines.push("Not your common name. Your crown-name.");
  lines.push("The room remembers what the court tried to erase.");
  lines.push("");
  lines.push("You are not here as an investigator.");
  lines.push("You are here as the last unresolved clause in a royal sentence.");

  return lines;
}

function openSigilOrderPuzzle(puzzle) {
  state.puzzle.selected = [];

  const intro = puzzle.intro || [];
  openModal(puzzle.title, intro, { footer: "Select three sigils in order." });

  const wrap = $("#modalChoices");
  if (!wrap) {
    console.error('DOM element not found: modalChoices');
    return;
  }
  wrap.innerHTML = "";

  // Symbol buttons
  if (!GAME.symbols || !Array.isArray(GAME.symbols)) {
    console.error('GAME.symbols not found or not an array');
    return;
  }

  GAME.symbols.forEach((s) => {
    const b = document.createElement("button");
    b.className = "secondary";
    b.textContent = `${s.glyph || "?"}  ${s.label || "Unknown"}`;
    b.onclick = () => {
      clickSfx();
      if (state.puzzle.selected.length >= 3) return;
      state.puzzle.selected.push(s.id);
      updatePuzzleFooter(puzzle);
    };
    wrap.appendChild(b);
  });

  // Control row
  const controls = document.createElement("div");
  controls.className = "puzzleControls";

  const resetBtn = document.createElement("button");
  resetBtn.className = "ghost";
  resetBtn.textContent = "Reset";
  resetBtn.onclick = () => {
    clickSfx();
    state.puzzle.selected = [];
    updatePuzzleFooter(puzzle);
  };

  const submitBtn = document.createElement("button");
  submitBtn.className = "primary";
  submitBtn.textContent = "Submit Order";
  submitBtn.onclick = () => {
    clickSfx();
    const ok =
      state.puzzle.selected.length === 3 &&
      puzzle.correctOrder &&
      state.puzzle.selected.every((id, i) => id === puzzle.correctOrder[i]);

    if (ok) {
      applyEffects(puzzle.effectsOnSolve || []);
      renderLore();

      openModal("Unlocked", puzzle.rewardText || [], { footer: "Compartment opened." });
    } else {
      openModal("Incorrect Order", ["The lock refuses you. The sigils demand hierarchy."], {
        footer: "Try again.",
      });
    }
  };

  controls.appendChild(resetBtn);
  controls.appendChild(submitBtn);

  const modalBody = $("#modalBody");
  if (!modalBody) {
    console.error('DOM element not found: modalBody');
    return;
  }
  modalBody.appendChild(controls);

  updatePuzzleFooter(puzzle);
}

function updatePuzzleFooter(puzzle) {
  const picked = state.puzzle.selected.map((id) => {
    const s = GAME.symbols?.find((x) => x.id === id);
    return s ? (s.glyph || "?") : "?";
  });

  const modalFooter = $("#modalFooter");
  if (!modalFooter) {
    console.error('DOM element not found: modalFooter');
    return;
  }
  modalFooter.textContent =
    picked.length === 0
      ? "Select three sigils in order."
      : `Selected: ${picked.join("  ")} (${picked.length}/3)`;
}

function closeModal() {
  const modal = $("#modal");
  if (!modal) {
    console.error('DOM element not found: modal');
    return;
  }
  modal.classList.remove("open");
}

function resetGame() {
  state.sceneId = "s1_antechamber";
  state.flags = {};
  state.clues = new Set();
  state.lore = new Set();
  state.puzzle.selected = [];
  render();
}

let keyboardListenersInitialized = false;

function setupKeyboardListeners() {
  if (keyboardListenersInitialized) return;
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = $("#modal");
      if (modal && modal.classList.contains('open')) {
        closeModal();
      }
    }
  });
  
  keyboardListenersInitialized = true;
}

function bindUI() {
  const closeModalBtn = $("#closeModal");
  if (!closeModalBtn) {
    console.error('DOM element not found: closeModal');
  } else {
    closeModalBtn.onclick = () => {
      clickSfx();
      closeModal();
    };
  }

  const modalBackdrop = $("#modalBackdrop");
  if (!modalBackdrop) {
    console.error('DOM element not found: modalBackdrop');
  } else {
    modalBackdrop.onclick = () => closeModal();
  }

  const resetBtn = $("#resetBtn");
  if (!resetBtn) {
    console.error('DOM element not found: resetBtn');
  } else {
    resetBtn.onclick = () => {
      clickSfx();
      resetGame();
    };
  }

  setupKeyboardListeners();
}

bindUI();
render();
