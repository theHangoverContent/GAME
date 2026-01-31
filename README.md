# Crownline: Prologue

A choice-driven narrative investigation game built as a single-page web app for GitHub Pages.

## 🎮 Play the Game

[Play Crownline: Prologue](https://theHangoverContent.github.io/GAME/)

## 📖 About

**Crownline: Prologue** is a 10-20 minute browser-based narrative experience set in a post-collapse world where magic and technology blur into mystery. You investigate the ruins of a fallen throne room, uncovering clues about what really happened when the crown fell.

### Features

- **3 Atmospheric Scenes**: Progress through the Ash Antechamber, the Ruined Throne Room, and the Remembered Room
- **2 Investigation Puzzles**:
  - **The Three Truths**: Collect key clues to unlock the memory injection
  - **Sigil Dial**: Solve a symbol order puzzle to unlock hidden lore
- **3 Unique Characters**: Interact with the Warden, the Soot Archivist, and the Echo
- **Personalized Ending**: Your choices affect the final narrative
- **Collectible Lore**: Discover 3 hidden lore pages that expand the world
- **Royal Dossier UI**: Immersive parchment-and-stamp aesthetic

## 🛠️ Technical Details

Built with vanilla HTML, CSS, and JavaScript:
- **Engine**: Content-driven architecture (`app.js`)
- **Content**: All narrative, puzzles, and lore in `content.js`
- **Theme**: "Royal dossier" visual style with parchment textures and official stamps
- **No dependencies**: Pure vanilla JavaScript, ready for GitHub Pages

## 📁 Project Structure

```
GAME/
├── index.html          # Main HTML structure
├── styles.css          # Royal dossier theme styling
├── app.js             # Game engine (rendering, state, puzzles)
├── content.js         # All game content (scenes, lore, puzzles)
└── assets/
    ├── img/placeholder/   # Scene images (SVG placeholders)
    │   ├── scene1.svg
    │   ├── scene2.svg
    │   └── scene3.svg
    └── sfx/              # Sound effects (optional)
```

## 🚀 Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/theHangoverContent/GAME.git
   cd GAME
   ```

2. Serve locally with any HTTP server:
   ```bash
   python3 -m http.server 8080
   # or
   npx serve
   ```

3. Open `http://localhost:8080` in your browser

## 🎨 Customization

The game uses a content-driven architecture. To modify the game:

### Adding New Scenes
Edit `content.js` and add new scene objects to the `GAME.scenes` object.

### Adding Lore Pages
Add new entries to `GAME.lore` in `content.js`.

### Changing Art
Replace the SVG files in `assets/img/placeholder/` with your own images (WebP, PNG, or SVG).

### Modifying Puzzles
Edit the puzzle configurations in `content.js` under `scenes.s2_throneroom.puzzles`.

## 📜 License

This project is open source and available under the MIT License.

## 🙏 Credits

Created as a narrative-driven browser game prototype.

---

*"The crown is broken, the truth is incomplete, and you are not done yet."*
