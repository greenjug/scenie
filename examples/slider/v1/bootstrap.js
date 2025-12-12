// Scenie Bootstrap - Local development version for slider example
(async () => {
    // Load game configuration
    const response = await fetch('game.json');
    const config = await response.json();

    // Set emit verbosity if configured
    if (config.game.requires && Array.isArray(config.game.requires)) {
        const emitReq = config.game.requires.find(req => (typeof req === 'object' && req.module === 'emit'));
        if (emitReq && emitReq.verbosity) {
            window.emitVerbosity = emitReq.verbosity;
        }
    }

    // Load framework files locally (absolute paths from server root)
    await loadScript('/core.js');
    await loadScript('/emit.js');
    await loadScript('/quiz.js');
    await loadScript('/slider.js');

    // Initialize the game
    new Game(config);
})();

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}