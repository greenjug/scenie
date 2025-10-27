# Scenie Framework

A modular JavaScript framework for creating interactive quizzes and games.

## Version

**v0.1.0**

## CDN Usage

```html
<script src="https://cdn.jsdelivr.net/gh/greenjug/scenie@v0.1.0/core.js"></script>
<script src="https://cdn.jsdelivr.net/gh/greenjug/scenie@v0.1.0/quiz.js"></script>
```

## Features

- **Modular Architecture**: Core engine with extensible modules
- **JSON-Driven Configuration**: Define games entirely through JSON
- **Image Preloading**: Optimized loading with caching
- **Responsive Design**: Mobile-first approach
- **Quiz System**: Complete quiz functionality with affirmations and outcomes

## Quick Start

1. Include the framework scripts in your HTML
2. Create a `game.json` configuration file
3. Add your game assets (images, etc.)
4. Open `index.html` in a browser

## Project Structure

```
your-quiz-project/
├── index.html          # Main HTML file
├── game.json          # Game configuration
├── images/            # Game assets
└── styles.css         # Custom styles (optional)
```

## Version Compatibility

Games should specify required framework versions in `game.json`:

```json
{
  "game": {
    "requiredCoreVersion": "0.1.0",
    "requiredQuizVersion": "0.1.0"
  }
}
```

## Development

### Prerequisites

- Modern web browser with ES6+ support
- Local web server (for development)

### Building

The framework uses vanilla JavaScript with no build process required.

### Testing

Test your quiz by opening `index.html` in a web browser.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Changelog

### v0.1.0
- Initial release
- Core game engine
- Quiz module with affirmations
- Image preloading and caching
- JSON configuration system