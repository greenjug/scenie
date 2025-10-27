(function() {
    'use strict';

    console.log('emit.js loaded');

    // Global emit function for event tracking
    window.emit = function(data) {
        // Ensure all required fields are present
        const emitData = {
            scene: data.scene || '',
            sub_scene: data.sub_scene || '',
            action: data.action || '',
            self: data.self || '',
            value: data.value || '',
            target: data.target || ''
        };
        
        // Check verbosity setting
        const verbosity = window.emitVerbosity || 'console';
        if (verbosity === 'console') {
            console.log('EMIT:', emitData);
        } else if (verbosity === 'silent') {
            // Do nothing
        } else if (verbosity === 'server') {
            // TODO: Send to server via sendBeacon
            console.log('EMIT (would send to server):', emitData);
        }
    };

})();