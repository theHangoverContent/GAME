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
  const scene = GAME.scenes[state.sceneId];
  if (!scene) {
    $("#bodyText").textContent = "Scene not found.";
    return;
  }

  // Header
  $("#gameTitle").textContent = GAME.meta.title;
  $("#gameSubtitle").textContent = GAME.meta.subtitle;
  $("#sceneTitle").textContent = scene.title;
  $("#stamp").textContent = scene.dossierStamp || "";

  // Image
  const img = $("#sceneImage");
  img.src = scene.image || "";
  img.alt = scene.title || "Scene image";

  // Narrative entry
  $("#bodyText").innerHTML = "";
  scene.entryText.forEach((p) => {
    const el = document.createElement("p");
    el.textContent = p;
    $("#bodyText").appendChild(el);
  });

  // Sidebar: clues
  renderClues();
  // Sidebar: lore
  renderLore();

  // Actions / hotspots
  const list = $("#hotspotList");
  list.innerHTML = "";

  (scene.hotspots || [])
    .filter((hs) => showIfPasses(hs.showIf))
    .forEach((hs) => {
      const btn = document.createElement("button");
      btn.className = "hotspot";
      btn.textContent = hs.label;
      btn.onclick = () => {
        clickSfx();
        handleHotspot(hs, scene);
      };
      list.appendChild(btn);
    });

  // Proceed button (if exists)
  const proceedWrap = $("#proceedWrap");
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
  wrap.innerHTML = "";
  const ids = [...state.clues];
  if (ids.length === 0) {
    $("#cluesEmpty").style.display = "block";
  } else {
    $("#cluesEmpty").style.display = "none";
  }

  ids.forEach((id) => {
    const c = GAME.clues[id];
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = c?.title || id;
    chip.onclick = () => {
      clickSfx();
      openModal(
        c?.title || "Clue",
        [c?.desc || "No description."],
        { footer: "Clue recorded." }
      );
    };
    wrap.appendChild(chip);
  });
}

function renderLore() {
  const wrap = $("#loreList");
  wrap.innerHTML = "";

  const allLoreIds = Object.keys(GAME.lore);
  allLoreIds.forEach((id) => {
    const unlocked = state.lore.has(id);
    const item = document.createElement("button");
    item.className = "loreItem";
    item.disabled = !unlocked;
    item.textContent = unlocked ? GAME.lore[id].title : "Lore — Locked";
    item.onclick = () => {
      clickSfx();
      const l = GAME.lore[id];
      openModal(l.title, l.body, { footer: "Lore collected." });
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
  $("#modalTitle").textContent = title;
  const body = $("#modalBody");
  body.innerHTML = "";
  paragraphs.forEach((p) => {
    const el = document.createElement("p");
    el.textContent = p;
    body.appendChild(el);
  });
  $("#modalFooter").textContent = opts.footer || "";
  $("#modalChoices").innerHTML = "";
  $("#modal").classList.add("open");
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
  if (state.flags.cipherSolved) {
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
  wrap.innerHTML = "";

  // Symbol buttons
  GAME.symbols.forEach((s) => {
    const b = document.createElement("button");
    b.className = "secondary";
    b.textContent = `${s.glyph}  ${s.label}`;
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
      state.puzzle.selected.every((id, i) => id === puzzle.correctOrder[i]);

    if (ok) {
      applyEffects(puzzle.effectsOnSolve || []);
      renderLore();

      openModal("Unlocked", puzzle.rewardText, { footer: "Compartment opened." });
    } else {
      openModal("Incorrect Order", ["The lock refuses you. The sigils demand hierarchy."], {
        footer: "Try again.",
      });
    }
  };

  controls.appendChild(resetBtn);
  controls.appendChild(submitBtn);
  $("#modalBody").appendChild(controls);

  updatePuzzleFooter(puzzle);
}

function updatePuzzleFooter(puzzle) {
  const picked = state.puzzle.selected.map((id) => {
    const s = GAME.symbols.find((x) => x.id === id);
    return s ? s.glyph : "?";
  });

  $("#modalFooter").textContent =
    picked.length === 0
      ? "Select three sigils in order."
      : `Selected: ${picked.join("  ")} (${picked.length}/3)`;
}

function closeModal() {
  $("#modal").classList.remove("open");
}

function resetGame() {
  state.sceneId = "s1_antechamber";
  state.flags = {};
  state.clues = new Set();
  state.lore = new Set();
  state.puzzle.selected = [];
  render();
}

function bindUI() {
  $("#closeModal").onclick = () => {
    clickSfx();
    closeModal();
  };
  $("#modalBackdrop").onclick = () => closeModal();
  $("#resetBtn").onclick = () => {
    clickSfx();
    resetGame();
  };
}

bindUI();
render();
