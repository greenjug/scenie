# Scenie Framework Slider Component

The Slider component provides touch/swipe navigation through a series of slides, perfect for interactive presentations, tutorials, or image galleries within Scenie games.

## Features

### Core Navigation
- **Touch/Swipe Support**: Full touch gesture support for mobile devices with configurable swipe sensitivity
- **Optional Indicators**: Dot indicators showing current slide position (enabled by default, can be disabled)
- **Optional Arrows**: Left/right navigation arrows (enabled by default, can be disabled)
- **Loop Mode**: Seamless looping through slides when reaching the end
- **Smooth Transitions**: Configurable transition duration between slides

### Content & Styling
- **Background Support**: Each slide can have color or image backgrounds
- **Element Integration**: Full support for all Scenie element types within slides
- **Responsive Design**: Slides automatically adapt to container size
- **Scene Reset**: Optional automatic reset to first slide when re-entering scene

### Interactivity
- **Clickable Elements**: Elements within slides can be made clickable
- **Slide Actions**: Jump to specific slides using the "slide" action
- **Scene Navigation**: Elements can trigger scene transitions
- **Combined Actions**: Support for multiple actions (scale + navigate, etc.)

## Configuration

Add a slider to your game configuration:

```json
{
    "id": "my_slider",
    "type": "slider",
    "x": 50,
    "y": 50,
    "width": "80%",
    "height": "60%",
    "config": {
        "slides": [
            {
                "background": [{"type": "colour", "variant": "hex", "value": "ff0000"}],
                "elements": [
                    {
                        "id": "slide_content",
                        "type": "picture",
                        "location": "local",
                        "url": "images/content.webp",
                        "y": 50,
                        "x": 50,
                        "clickable": true,
                        "clickActions": [{"action": "slide", "target": "my_slider", "value": 1}]
                    }
                ]
            }
        ],
        "transitionDuration": 500,
        "showIndicators": true,
        "showArrows": true,
        "loop": true,
        "resetOnSceneEnter": true
    }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `slides` | Array | Required | Array of slide objects |
| `transitionDuration` | Number | 300 | Transition time in milliseconds |
| `showIndicators` | Boolean | `true` | Show dot indicators |
| `showArrows` | Boolean | `true` | Show navigation arrows |
| `loop` | Boolean | `false` | Enable infinite looping |
| `resetOnSceneEnter` | Boolean | `false` | Reset to first slide when scene is entered |

### Slide Configuration

Each slide object supports:
- `background`: Background configuration (same format as scene/page backgrounds)
- `elements`: Array of Scenie elements to display on the slide

## Actions

### Slide Action
Jump to a specific slide (0-indexed):

```json
{
    "action": "slide",
    "target": "slider_id",
    "value": 2
}
```

### Combined Actions
Elements can have multiple actions:

```json
"clickActions": [
    {"action": "scale", "target": "self", "value": "0.9", "duration": 250},
    {"action": "slide", "target": "my_slider", "value": 1}
]
```

## Usage Examples

### Basic Color Slides
```json
"slides": [
    {"background": [{"type": "colour", "variant": "hex", "value": "ff0000"}]},
    {"background": [{"type": "colour", "variant": "hex", "value": "00ff00"}]},
    {"background": [{"type": "colour", "variant": "hex", "value": "0000ff"}]}
]
```

### Image Background Slides
```json
"slides": [
    {"background": [{"type": "image", "variant": "local", "value": "images/slide1.webp"}]},
    {"background": [{"type": "image", "variant": "local", "value": "images/slide2.webp"}]}
]
```

### Interactive Slides with Navigation
```json
"slides": [
    {
        "elements": [
            {
                "type": "picture",
                "url": "images/next_button.webp",
                "clickable": true,
                "clickActions": [{"action": "slide", "target": "slider1", "value": 1}]
            }
        ]
    }
]
```

## Module Requirements

Include the slider module in your game's requirements:

```json
"requires": [
    {"module": "slider", "version": "0.1.14"}
]
```

## Roadmap

Future enhancements planned for the Slider component:

- **Keyboard Navigation**: Arrow key support for desktop navigation
- **Auto-play**: Automatic slide progression with configurable intervals
- **Pause on Hover**: Pause auto-play when user hovers over slider
- **Vertical Sliding**: Option for vertical slide transitions
- **Custom Styling**: Configurable indicator and arrow appearances
- **Accessibility**: ARIA labels, focus management, and screen reader support
- **Multiple Visible Slides**: Carousel-style with multiple slides visible
- **Touch Gestures**: Enhanced gesture recognition (pinch zoom, etc.)

## Technical Details

- Built as a modular extension to the core Scenie framework
- Touch events use passive listeners for optimal performance
- State management per slider instance
- Full integration with existing Scenie action system
- Responsive design that works across all device sizes