// content.js
// 1910-prologue: choice narrative + investigation (3 screens, 2 puzzles, 3 characters, 1 ending)
// Perspective: second-person
// UI style: royal dossier
// Puzzle #2: symbol order
// Reveal ex-royal: only at the end

export const GAME = {
  meta: {
    title: "Crownline: Prologue",
    subtitle: "A royal dossier recovered from the ruins",
    version: "0.1.0",
  },

  sfx: {
    // Optional. If file missing, app.js will fail gracefully.
    click: "assets/sfx/click.ogg",
  },

  lore: {
    lore_crownline: {
      title: "Lore I — The Crownline Before the Fall",
      body: [
        "The old world did not end with fire alone; it ended with paperwork.",
        "When the cities collapsed, titles survived: not because crowns are strong, but because people fear emptiness.",
        "A kingdom is a story you can tax.",
      ],
    },
    lore_unicorns: {
      title: "Lore II — Unicorns That Bleed Rust",
      body: [
        "In the first decade after the Collapse, witnesses described horned beasts in the ash.",
        "Later, the Archivists found bone-anchors and metal-growth: mutation guided by forgotten machines.",
        "Myth is what you call a fact you cannot afford to understand.",
      ],
    },
    lore_blacklibrary: {
      title: "Lore III — The Black Library",
      body: [
        "There are rooms in the ruins where sound behaves like a loyal servant.",
        "The court calls it sorcery. The scholars call it preserved signal.",
        "Either way, it obeys whoever dares to ask the right question.",
      ],
    },
  },

  // Symbols for Puzzle #2 (order puzzle)
  symbols: [
    { id: "sigil_sun", label: "Sun-Sigil", glyph: "☉" },
    { id: "sigil_crown", label: "Crown-Sigil", glyph: "♛" },
    { id: "sigil_ash", label: "Ash-Sigil", glyph: "❖" },
  ],

  scenes: {
    s1_antechamber: {
      id: "s1_antechamber",
      title: "Scene I — The Ash Antechamber",
      image: "assets/img/placeholder/scene1.svg",
      dossierStamp: "INTAKE // RUINS-SECTOR 7",
      entryText: [
        "You step through a broken archway into a chamber that used to welcome petitions and punishments alike.",
        "Dust lies in layers, like old verdicts. The air tastes of burnt vellum.",
        "A court survives here—barely. Not by glory, but by procedure.",
      ],

      characters: [
        {
          id: "warden",
          name: "The Warden",
          role: "Bureaucratic Court Enforcer",
          voice: [
            "State your purpose for entering the throne sector.",
            "And speak clearly—ruins do not excuse vagueness.",
          ],
        },
      ],

      hotspots: [
        {
          id: "hs_registry",
          label: "Registry Desk",
          type: "inspect",
          text: [
            "A ledger, half-charred. Names reduced to initials. Ink that looks too fresh to be honest.",
            "A wax stamp bears a crown that no longer exists.",
          ],
          effects: [{ type: "addLore", loreId: "lore_crownline" }],
        },
        {
          id: "hs_floor",
          label: "Scorched Floor Tiles",
          type: "inspect",
          text: [
            "The scorch pattern is wrong for candles. Too focused. Too clean.",
            "Court rumors call it magic. Your gut calls it a discharge.",
          ],
          effects: [{ type: "addClue", clueId: "clue_burnpattern" }],
        },
        {
          id: "hs_notice",
          label: "Notice Board",
          type: "inspect",
          text: [
            "Proclamations overlap like threats wearing different uniforms.",
            "One document mentions 'injection ethics' under the old royal seal—then it's torn away.",
          ],
          effects: [{ type: "addFlag", flag: "sawEthicsNotice", value: true }],
        },
        {
          id: "hs_talk_warden",
          label: "Speak to the Warden",
          type: "talk",
          characterId: "warden",
          text: [
            "He does not threaten you. He files you.",
            "His eyes scan for contraband, not prophecy.",
          ],
          choices: [
            {
              id: "c1_comply",
              label: "Comply politely: request access to investigate.",
              resultText: [
                "The Warden nods once. Not agreement—acceptance of process.",
                "You may enter under observation. Touch nothing you cannot justify.",
              ],
              effects: [{ type: "addFlag", flag: "wardenDisposition", value: "neutral" }],
              next: null,
            },
            {
              id: "c1_push",
              label: "Press authority: demand immediate access.",
              resultText: [
                "His pen stops. The pause is a weapon made of silence.",
                "'Authority requires documentation,' he says, and writes something you cannot read from this angle.",
                "You may enter. Under stricter observation.",
              ],
              effects: [{ type: "addFlag", flag: "wardenDisposition", value: "strict" }],
              next: null,
            },
          ],
        },
      ],

      // Scene transition
      proceed: {
        label: "Proceed to the Throne Room",
        nextScene: "s2_throneroom",
        conditions: [],
      },
    },

    s2_throneroom: {
      id: "s2_throneroom",
      title: "Scene II — The Ruined Throne Room",
      image: "assets/img/placeholder/scene2.svg",
      dossierStamp: "EVIDENCE // CROWN-SEAT INCIDENT",
      entryText: [
        "The throne sits like a missing tooth in a broken mouth of stone.",
        "Tapestries hang in strips. A crown-shaped shadow stains the wall.",
        "They call what happened here magic. You call it something else—but you need proof.",
      ],

      characters: [
        {
          id: "archivist",
          name: "The Soot Archivist",
          role: "Scholar of Court Records",
          voice: [
            "The court prefers legends; legends do not require repairs.",
            "If you want truth, collect it. Then decide what you can live with.",
          ],
        },
      ],

      // Investigation hotspots
      hotspots: [
        {
          id: "hs_dais",
          label: "Throne Dais",
          type: "inspect",
          text: [
            "A low hum crawls up your bones when you step close.",
            "It is not a ghost. It is a device that never learned to die.",
          ],
          effects: [{ type: "addClue", clueId: "clue_resonance" }],
        },
        {
          id: "hs_sigilmarks",
          label: "Sigil Marks on Stone",
          type: "inspect",
          text: [
            "The symbols are not carved—they are melted in, as if stamped by heat and pressure.",
            "Magic leaves drama. This leaves manufacturing.",
          ],
          effects: [{ type: "addClue", clueId: "clue_imprint" }],
        },
        {
          id: "hs_burnpattern_recheck",
          label: "Blast Scar (Close Look)",
          type: "inspect",
          text: [
            "The blast converges toward the seat, not away from it.",
            "Someone wanted the throne to be the target—or the trigger.",
          ],
          effects: [{ type: "addFlag", flag: "burnScarConfirmed", value: true }],
        },
        {
          id: "hs_shattered_crown",
          label: "Shattered Crown Reliquary",
          type: "inspect",
          text: [
            "A glass case. Empty. The label remains: 'CROWNLINE ARTIFACT — DO NOT ACTIVATE.'",
            "You find a sliver of metal with a symbol fragment etched in micro-grooves.",
          ],
          effects: [{ type: "addFlag", flag: "symFrag1", value: true }],
        },
        {
          id: "hs_tapestry",
          label: "Torn Tapestry",
          type: "inspect",
          text: [
            "Behind the cloth: soot, scratches… and a second symbol fragment, like part of a key.",
            "The court would call it a ward. You call it a sequence.",
          ],
          effects: [{ type: "addFlag", flag: "symFrag2", value: true }],
        },
        {
          id: "hs_side_altar",
          label: "Side Altar of Oaths",
          type: "inspect",
          text: [
            "Oath tokens. Melted wax. A third symbol fragment hidden inside a cracked seal.",
            "Three pieces. A lock that expects obedience.",
          ],
          effects: [{ type: "addFlag", flag: "symFrag3", value: true }],
        },
        {
          id: "hs_talk_archivist",
          label: "Speak to the Archivist",
          type: "talk",
          characterId: "archivist",
          text: [
            "He watches you like a man watching a knife: interested, careful.",
            "He seems less afraid of monsters than of decisions.",
          ],
          choices: [
            {
              id: "c2_magic",
              label: "Ask what the court calls it: 'magic'.",
              resultText: [
                "'Magic is the name they use when ignorance feels safer than repair,' he says.",
                "'Find three certainties. Then you may ask the room to remember.'",
              ],
              effects: [{ type: "addFlag", flag: "archivistHint", value: "threeCertainties" }],
              next: null,
            },
            {
              id: "c2_injection",
              label: "Ask about memory injection.",
              resultText: [
                "His eyes narrow—moral arithmetic in motion.",
                "Injection forces a past to speak. Not always the truth. Often the cruelest version.",
                "If you do it, you become responsible for what you awaken.",
              ],
              effects: [{ type: "addFlag", flag: "learnedInjectionRisk", value: true }],
              next: null,
            },
          ],
        },

        // Puzzle #2 entry (symbol order) — only appears when all 3 fragments found
        {
          id: "hs_symbol_puzzle",
          label: "Hidden Compartment Lock (Sigil Dial)",
          type: "puzzle",
          puzzleId: "puzzle_sigil_order",
          showIf: [{ type: "allFlagsTrue", flags: ["symFrag1", "symFrag2", "symFrag3"] }],
        },

        // Injection entry — only when the 3 key clues are collected
        {
          id: "hs_injection_node",
          label: "The Dais Interface (Memory Port)",
          type: "action",
          text: [
            "A recessed port waits beneath the stone, like a mouth that only feeds on history.",
            "You can force a memory out of the room. You can also corrupt yourself doing it.",
          ],
          showIf: [{ type: "hasClues", clues: ["clue_burnpattern", "clue_imprint", "clue_resonance"] }],
          choices: [
            {
              id: "c_inject",
              label: "Inject memory (accept the moral risk).",
              resultText: [
                "You place your hand where the stone is warm.",
                "You do not know if you are interrogating the past… or manufacturing it.",
              ],
              effects: [{ type: "addFlag", flag: "didInjection", value: true }],
              next: "s3_injection",
            },
          ],
        },
      ],

      // No generic proceed button; player progresses via injection node.
      proceed: null,

      puzzles: {
        puzzle_sigil_order: {
          id: "puzzle_sigil_order",
          title: "Sigil Dial — Order the Three Marks",
          intro: [
            "Three sigils must be set in the correct order.",
            "The fragments hint at hierarchy: what rules, what follows, what remains.",
          ],
          // Correct order (simple and thematic)
          correctOrder: ["sigil_crown", "sigil_sun", "sigil_ash"],
          rewardText: [
            "The lock yields with a sound like a page turning.",
            "Inside: a thin cartridge labeled INJECTION // COURT ETHICS: RED.",
            "And a sealed folio stamped BLACK LIBRARY.",
          ],
          effectsOnSolve: [
            { type: "addFlag", flag: "sigilPuzzleSolved", value: true },
            { type: "addLore", loreId: "lore_blacklibrary" },
            { type: "addLore", loreId: "lore_unicorns" },
          ],
        },
      },
    },

    s3_injection: {
      id: "s3_injection",
      title: "Scene III — The Remembered Room",
      image: "assets/img/placeholder/scene3.svg",
      dossierStamp: "RECONSTRUCTION // NONCONSENSUAL MEMORY",
      entryText: [
        "The throne room blinks—once—like an eye reopening in a dead face.",
        "Sound becomes structured. Dust becomes a stage.",
        "A presence forms where presence should not exist.",
      ],

      characters: [
        {
          id: "echo",
          name: "The Echo",
          role: "Memory-Entity (Corrupted Adviser)",
          voice: [
            "Do you want absolution, or do you want accuracy?",
            "Careful. Some crowns are not worn. Some are inherited like disease.",
          ],
        },
      ],

      hotspots: [
        {
          id: "hs_echo_talk",
          label: "Face the Echo",
          type: "talk",
          characterId: "echo",
          text: [
            "It speaks with the cadence of counsel—soft, inevitable.",
            "You feel the injection tug at your judgment, trying to rewrite you into a role.",
          ],
          choices: [
            {
              id: "end_choice",
              label: "Demand the truth of what happened here.",
              resultText: [
                "The Echo tilts its head, as if listening to a crown that is not present.",
                // Ending text is dynamically appended in app.js based on flags
              ],
              effects: [{ type: "addFlag", flag: "reachedEnding", value: true }],
              next: "END",
            },
          ],
        },
      ],

      proceed: null,
    },
  },

  // Clue display copy
  clues: {
    clue_burnpattern: {
      title: "Focused Burn Pattern",
      desc: "The scorch suggests an energy discharge, not candlefire.",
    },
    clue_imprint: {
      title: "Melted Sigil Imprint",
      desc: "The marks look stamped by heat and pressure—manufactured, not mystical.",
    },
    clue_resonance: {
      title: "Dais Resonance",
      desc: "A low hum implies an active mechanism beneath the throne.",
    },
  },
};
