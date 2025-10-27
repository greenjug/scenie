// Scenie Bootstrap - Loads framework based on game.json configuration
(async () => {
    // Load game configuration
    const response = await fetch('game.json');
    const config = await response.json();

    // Determine framework versions and CDN type
    const coreVersion = config.game.requiredCoreVersion || '0.1.2';
    const useCDN = config.game.useCDN !== false; // Default to true

    // Load from CDN (jsDelivr is more reliable than raw GitHub)
    const baseUrl = `https://cdn.jsdelivr.net/gh/greenjug/scenie@v${coreVersion}`;

    // Load core framework
    await loadScript(`${baseUrl}/core.js`);

    // Load required modules
    if (config.game.requires && Array.isArray(config.game.requires)) {
        for (const req of config.game.requires) {
            let scriptName, moduleVersion;
            if (typeof req === 'string') {
                scriptName = req;
                moduleVersion = config.game[`required${scriptName.charAt(0).toUpperCase() + scriptName.slice(1)}Version`] || coreVersion;
            } else {
                scriptName = req.module;
                moduleVersion = req.version;
                // Handle special modules
                if (scriptName === 'emit') {
                    // Set global verbosity for emit module
                    window.emitVerbosity = req.verbosity || 'console';
                }
            }
            const moduleBaseUrl = `https://cdn.jsdelivr.net/gh/greenjug/scenie@v${moduleVersion}`;
            await loadScript(`${moduleBaseUrl}/${scriptName}.js`);
        }
    }

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