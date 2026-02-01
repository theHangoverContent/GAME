# Deployment Guide

## GitHub Pages Setup

1. Go to your GitHub repository settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select the branch: `copilot/save-code-changes`
4. Select folder: `/ (root)`
5. Click "Save"
6. Wait a few minutes for deployment
7. Your game will be available at: `https://theHangoverContent.github.io/GAME/`

## Testing Locally

```bash
# Using Python 3
python3 -m http.server 8080

# Using Node.js
npx serve

# Using PHP
php -S localhost:8080
```

Then visit `http://localhost:8080` in your browser.

## File Structure

```
GAME/
├── index.html          # Entry point
├── styles.css          # Royal dossier theme
├── app.js             # Game engine
├── content.js         # All game content
├── assets/
│   ├── img/placeholder/   # Scene images (SVG)
│   └── sfx/              # Sound effects (optional)
└── README.md          # Documentation
```

## Customization Tips

### Adding Custom Images

Replace the SVG files in `assets/img/placeholder/` with your own:
- Recommended: 800x600px WebP or PNG
- Format: Any web-compatible image format
- Update `content.js` to reference new filenames

### Adding Sound Effects

1. Add your click sound to `assets/sfx/click.ogg` (or `click.mp3`)
2. Update `content.js` `sfx.click` path if needed
3. The game will gracefully handle missing sounds

### Modifying Content

All narrative, puzzles, and lore are in `content.js`:
- Edit scene text in `GAME.scenes`
- Add new lore in `GAME.lore`
- Modify puzzle solutions in puzzle configurations
- Change character dialogue in scene objects

### Styling Changes

Modify `styles.css` CSS variables for the dark royal dossier theme:
```css
:root {
  --bg: #0f1113;           /* Dark background */
  --paper: #14171a;        /* Card background */
  --ink: #e7e1d7;          /* Text color */
  --muted: #b6afa6;        /* Muted text */
  --accent: rgba(231, 225, 215, 0.9);  /* Accent color */
  /* ... more variables ... */
}
```

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

Requires ES6 module support (all modern browsers).

## Troubleshooting

**Problem**: Blank page or "Loading..." stuck
- **Solution**: Check browser console for errors. Ensure all files are served over HTTP (not `file://`)

**Problem**: Images not loading
- **Solution**: Verify SVG files exist in `assets/img/placeholder/`

**Problem**: JavaScript errors
- **Solution**: Ensure `type="module"` is in the script tag in `index.html`

## Performance

- No build step required
- No external dependencies
- Minimal asset loading
- Fast page load (~35KB total)
- Mobile-friendly responsive design

## Next Steps

1. Deploy to GitHub Pages (see above)
2. Test the deployed version
3. Share the link: `https://theHangoverContent.github.io/GAME/`
4. Collect feedback
5. Iterate on content and design

---

**Ready to deploy!** 🚀
