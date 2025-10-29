// Scenie Framework Exploration Module

// Exploration-specific functionality for the Scenie game system
// Allows users to drag a magnifying glass to discover hidden targets

// Extend the core Game with exploration methods
Game.prototype.initExploration = function(config) {
    this.explorationConfig = config;
    this.discoveredTargets = new Set();
    this.explorationState = {
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        currentPopup: null,
        progressImageIndex: 0,
        hasInteracted: false
    };

    // Initialize magnifier position
    this.setupExplorationMagnifier();

    // Setup hitbox images
    this.setupExplorationHitboxes();

    // Setup progress display
    this.setupExplorationProgress();
};



Game.prototype.setupExplorationMagnifier = function() {
    const config = this.explorationConfig;
    const magnifier = document.createElement('div');
    magnifier.id = 'exploration-magnifier';
    magnifier.className = 'exploration-magnifier';
    magnifier.style.position = 'absolute';
    magnifier.style.width = config.magnifier.size || '15%';
    magnifier.style.height = 'auto';
    magnifier.style.cursor = 'grab';
    magnifier.style.zIndex = '1000';

    // Set initial position
    const initialPos = config.magnifier.initialPosition || { x: 50, y: 50 };
    magnifier.style.left = `${initialPos.x}%`;
    magnifier.style.top = `${initialPos.y}%`;
    magnifier.style.transform = 'translate(-50%, -50%)';

    // Create magnifier image
    const img = document.createElement('img');
    img.src = config.magnifier.image;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.pointerEvents = 'none';
    magnifier.appendChild(img);

    // Add drag event listeners
    this.setupMagnifierDrag(magnifier);

    // Add pulse animation if configured
    if (config.magnifier.pulse) {
        magnifier.classList.add('exploration-magnifier-pulse');
        // Set custom properties for configurable duration and scale
        if (config.magnifier.pulseDuration) {
            magnifier.style.setProperty('--pulse-duration', config.magnifier.pulseDuration);
        }
        if (config.magnifier.pulseScale) {
            magnifier.style.setProperty('--pulse-scale', config.magnifier.pulseScale);
        }
    }

    // Add to current scene
    const currentSceneEl = document.querySelector(`[data-scene="${this.currentScene}"]`);
    if (currentSceneEl) {
        currentSceneEl.appendChild(magnifier);
    }
};

Game.prototype.setupExplorationHitboxes = function() {
    const config = this.explorationConfig;
    
    for (const target of config.targets) {
        if (target.image) {
            const hitboxImg = document.createElement('img');
            hitboxImg.id = `exploration-hitbox-${target.id}`;
            hitboxImg.className = 'exploration-hitbox';
            hitboxImg.src = target.image;
            hitboxImg.style.position = 'absolute';
            hitboxImg.style.left = `${target.hitbox.position.x}%`;
            hitboxImg.style.top = `${target.hitbox.position.y}%`;
            hitboxImg.style.width = target.hitbox.size.width;
            hitboxImg.style.aspectRatio = target.hitbox.size.aspectRatio;
            hitboxImg.style.objectFit = 'contain';
            hitboxImg.style.zIndex = '800';
            hitboxImg.style.pointerEvents = 'none'; // Don't interfere with magnifier dragging
            
            // Add to current scene
            const currentSceneEl = document.querySelector(`[data-scene="${this.currentScene}"]`);
            if (currentSceneEl) {
                currentSceneEl.appendChild(hitboxImg);
            }
        }
    }
};

Game.prototype.setupMagnifierDrag = function(magnifier) {
    const self = this;

    // Mouse events
    magnifier.addEventListener('mousedown', (e) => {
        self.startMagnifierDrag(e, magnifier);
    });

    // Touch events
    magnifier.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        self.startMagnifierDrag(touch, magnifier);
    });

    // Global mouse move/up for drag continuation
    this.dragUpdateListener = (e) => {
        if (self.explorationState.isDragging) {
            self.updateMagnifierDrag(e, magnifier);
        }
    };
    document.addEventListener('mousemove', this.dragUpdateListener);

    this.dragEndListener = () => {
        if (self.explorationState.isDragging) {
            self.endMagnifierDrag(magnifier);
        }
    };
    document.addEventListener('mouseup', this.dragEndListener);

    // Global touch move/end
    this.touchUpdateListener = (e) => {
        if (self.explorationState.isDragging) {
            e.preventDefault();
            const touch = e.touches[0];
            self.updateMagnifierDrag(touch, magnifier);
        }
    };
    document.addEventListener('touchmove', this.touchUpdateListener);

    this.touchEndListener = () => {
        if (self.explorationState.isDragging) {
            self.endMagnifierDrag(magnifier);
        }
    };
    document.addEventListener('touchend', this.touchEndListener);
};

Game.prototype.startMagnifierDrag = function(event, magnifier) {
    this.explorationState.isDragging = true;
    magnifier.style.cursor = 'grabbing';

    // Stop pulse animation on first interaction
    if (!this.explorationState.hasInteracted) {
        this.explorationState.hasInteracted = true;
        magnifier.classList.remove('exploration-magnifier-pulse');
    }

    const rect = magnifier.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    this.explorationState.dragOffset = {
        x: event.clientX - centerX,
        y: event.clientY - centerY
    };
};

Game.prototype.updateMagnifierDrag = function(event, magnifier) {
    if (!this.explorationState.isDragging) return;

    const container = document.getElementById('game-container');
    const containerRect = container.getBoundingClientRect();

    const newCenterX = event.clientX - this.explorationState.dragOffset.x;
    const newCenterY = event.clientY - this.explorationState.dragOffset.y;

    // Constrain to container bounds if configured
    let constrainedX = newCenterX;
    let constrainedY = newCenterY;
    if (this.explorationConfig.magnifier.dragBounds !== 'full') {
        const magnifierRect = magnifier.getBoundingClientRect();
        const halfWidth = magnifierRect.width / 2;
        const halfHeight = magnifierRect.height / 2;
        constrainedX = Math.max(containerRect.left + halfWidth, Math.min(constrainedX, containerRect.right - halfWidth));
        constrainedY = Math.max(containerRect.top + halfHeight, Math.min(constrainedY, containerRect.bottom - halfHeight));
    }

    // Convert to percentage
    const percentX = ((constrainedX - containerRect.left) / containerRect.width) * 100;
    const percentY = ((constrainedY - containerRect.top) / containerRect.height) * 100;

    magnifier.style.left = `${percentX}%`;
    magnifier.style.top = `${percentY}%`;
};

Game.prototype.endMagnifierDrag = function(magnifier) {
    this.explorationState.isDragging = false;
    magnifier.style.cursor = 'grab';

    // Check for target hits
    this.checkTargetHits(magnifier);
};

Game.prototype.checkTargetHits = function(magnifier) {
    const config = this.explorationConfig;
    const magnifierRect = magnifier.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();

    // Convert magnifier position to container-relative percentages
    const magnifierCenterX = ((magnifierRect.left + magnifierRect.width / 2 - containerRect.left) / containerRect.width) * 100;
    const magnifierCenterY = ((magnifierRect.top + magnifierRect.height / 2 - containerRect.top) / containerRect.height) * 100;

    for (const target of config.targets) {
        // Skip if already discovered and multiple discoveries not allowed
        if (this.discoveredTargets.has(target.id) && !(target.allowMultipleDiscoveries || false)) {
            continue;
        }

        const hitbox = target.hitbox;
        const [num, denom] = hitbox.size.aspectRatio.split('/').map(Number);
        const ratio = num / denom;
        const width = parseFloat(hitbox.size.width);
        const height = width * ratio;

        if (magnifierCenterX >= hitbox.position.x && magnifierCenterX <= hitbox.position.x + width &&
            magnifierCenterY >= hitbox.position.y && magnifierCenterY <= hitbox.position.y + height) {

            // Hit detected!
            this.discoverTarget(target, magnifier);
            break; // Only allow one discovery per drag release
        }
    }
};

Game.prototype.discoverTarget = function(target, magnifier) {
    // Mark as discovered
    this.discoveredTargets.add(target.id);

    // Change hitbox image if discovered image is specified
    if (target.discoveredImage) {
        const hitboxImg = document.getElementById(`exploration-hitbox-${target.id}`);
        if (hitboxImg) {
            hitboxImg.src = target.discoveredImage;
        }
    }

    // Snap magnifier to target position
    const hitbox = target.hitbox;
    const [num, denom] = hitbox.size.aspectRatio.split('/').map(Number);
    const ratio = num / denom;
    const width = parseFloat(hitbox.size.width);
    const height = width * ratio;
    const snapPos = target.snapPosition || { x: hitbox.position.x + width / 2, y: hitbox.position.y + height / 2 };
    const offset = target.snapOffset || { x: 0, y: 0 };

    magnifier.style.left = `${snapPos.x + offset.x}%`;
    magnifier.style.top = `${snapPos.y + offset.y}%`;
    magnifier.style.transition = 'left 0.3s ease, top 0.3s ease';

    // Remove transition after animation
    setTimeout(() => {
        magnifier.style.transition = '';
    }, 300);

    // Show popup
    this.showTargetPopup(target);

    // Update progress
    this.updateExplorationProgress();

    // Check for completion
    this.checkExplorationCompletion();
};

Game.prototype.showTargetPopup = function(target) {
    // Hide existing popup if any (unless multiple popups allowed)
    if (!this.explorationConfig.allowMultiplePopups && this.explorationState.currentPopup) {
        this.explorationState.currentPopup.remove();
    }

    const popup = document.createElement('div');
    popup.id = `exploration-popup-${target.id}`;
    popup.className = 'exploration-popup';
    popup.style.position = 'absolute';
    popup.style.zIndex = '999';
    popup.style.opacity = '0';
    popup.style.transition = 'opacity 0.3s ease';

    // Set size if configured
    if (target.popup.width) {
        popup.style.width = target.popup.width;
    }
    if (target.popup.aspectRatio) {
        popup.style.aspectRatio = target.popup.aspectRatio;
    }

    // Position relative to target center
    const hitbox = target.hitbox;
    const [num, denom] = hitbox.size.aspectRatio.split('/').map(Number);
    const ratio = num / denom;
    const width = parseFloat(hitbox.size.width);
    const height = width * ratio;
    const targetCenterX = hitbox.position.x + width / 2;
    const targetCenterY = hitbox.position.y + height / 2;
    const popupPos = target.popup.position;

    popup.style.left = `${targetCenterX + popupPos.x}%`;
    popup.style.top = `${targetCenterY + popupPos.y}%`;
    popup.style.transform = 'translate(-50%, -50%)';

    // Create popup image
    const img = document.createElement('img');
    img.src = target.popup.image;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    popup.appendChild(img);

    // Add dismiss button if configured
    if (target.popup.dismiss && target.popup.dismiss.type === 'button') {
        const dismissBtn = document.createElement('div');
        dismissBtn.style.position = 'absolute';
        dismissBtn.style.top = target.popup.dismiss.position.y + '%';
        dismissBtn.style.left = target.popup.dismiss.position.x + '%';
        dismissBtn.style.transform = 'translate(-50%, -50%)';
        dismissBtn.style.cursor = 'pointer';
        dismissBtn.style.zIndex = '1000';

        const dismissImg = document.createElement('img');
        dismissImg.src = target.popup.dismiss.image;
        dismissImg.style.width = '100%';
        dismissImg.style.height = '100%';
        dismissBtn.appendChild(dismissImg);

        dismissBtn.addEventListener('click', () => {
            this.hideTargetPopup(popup);
        });

        popup.appendChild(dismissBtn);
    }

    // Add to scene
    const currentSceneEl = document.querySelector(`[data-scene="${this.currentScene}"]`);
    if (currentSceneEl) {
        currentSceneEl.appendChild(popup);
    }

    // Fade in
    setTimeout(() => {
        popup.style.opacity = '1';
    }, 10);

    // Update current popup (only if not allowing multiple)
    if (!this.explorationConfig.allowMultiplePopups) {
        this.explorationState.currentPopup = popup;
    }

    // Auto-dismiss if configured
    if (target.popup.dismiss && target.popup.dismiss.type === 'time') {
        setTimeout(() => {
            this.hideTargetPopup(popup);
        }, target.popup.dismiss.delay || 3000);
    }
};

Game.prototype.hideTargetPopup = function(popup = null) {
    const targetPopup = popup || this.explorationState.currentPopup;
    if (targetPopup) {
        targetPopup.style.opacity = '0';
        setTimeout(() => {
            if (targetPopup.parentElement) {
                targetPopup.remove();
            }
            if (targetPopup === this.explorationState.currentPopup) {
                this.explorationState.currentPopup = null;
            }
        }, 300);
    }
};

Game.prototype.setupExplorationProgress = function() {
    const config = this.explorationConfig;
    if (!config.progress || !config.progress.enabled) return;

    const progressContainer = document.createElement('div');
    progressContainer.id = 'exploration-progress';
    progressContainer.className = 'exploration-progress';
    progressContainer.style.position = 'absolute';
    progressContainer.style.left = `${config.progress.position.x}%`;
    progressContainer.style.top = `${config.progress.position.y}%`;
    progressContainer.style.transform = 'translate(-50%, -50%)';
    progressContainer.style.zIndex = '900';

    // Set size if configured
    if (config.progress.width) {
        progressContainer.style.width = config.progress.width;
    }
    if (config.progress.aspectRatio) {
        progressContainer.style.aspectRatio = config.progress.aspectRatio;
    }

    const img = document.createElement('img');
    img.id = 'exploration-progress-img';
    img.src = config.progress.images["0"] || config.progress.images[0];
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    progressContainer.appendChild(img);

    // Add to scene
    const currentSceneEl = document.querySelector(`[data-scene="${this.currentScene}"]`);
    if (currentSceneEl) {
        currentSceneEl.appendChild(progressContainer);
    }
};

Game.prototype.updateExplorationProgress = function() {
    const config = this.explorationConfig;
    if (!config.progress || !config.progress.enabled) return;

    const discoveredCount = this.discoveredTargets.size;
    const progressImg = document.getElementById('exploration-progress-img');

    const key = discoveredCount.toString();
    if (progressImg && config.progress.images[key]) {
        progressImg.src = config.progress.images[key];
        this.explorationState.progressImageIndex = discoveredCount;
    }
};

Game.prototype.checkExplorationCompletion = function() {
    const config = this.explorationConfig;
    const totalTargets = config.targets.length;
    const discoveredCount = this.discoveredTargets.size;

    if (discoveredCount >= totalTargets) {
        // Show continue button
        this.showExplorationContinueButton();
    }
};

Game.prototype.showExplorationContinueButton = function() {
    const config = this.explorationConfig;
    if (!config.completion || !config.completion.continueButton) return;

    const button = document.createElement('div');
    button.id = 'exploration-continue-btn';
    button.className = 'exploration-continue-btn';
    button.style.position = 'absolute';
    button.style.left = `${config.completion.continueButton.position.x}%`;
    button.style.top = `${config.completion.continueButton.position.y}%`;
    button.style.transform = 'translate(-50%, -50%)';
    button.dataset.originalTransform = 'translate(-50%, -50%)';
    button.style.cursor = 'pointer';
    button.style.zIndex = '1001';
    button.style.opacity = '0';
    button.style.transition = 'opacity 0.5s ease';

    // Set size if configured
    if (config.completion.continueButton.width) {
        button.style.width = config.completion.continueButton.width;
    }
    if (config.completion.continueButton.aspectRatio) {
        button.style.aspectRatio = config.completion.continueButton.aspectRatio;
    }

    const img = document.createElement('img');
    img.src = config.completion.continueButton.image;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    button.appendChild(img);

    button.addEventListener('click', () => {
        // Add scale animation like other clickable elements
        const scaleDuration = config.completion.continueButton.scaleDuration || 250;
        button.style.transition = `transform ${scaleDuration}ms ease`;
        button.style.transform = button.dataset.originalTransform + ' scale(0.9)';
        
        // Emit continue button click event
        if (window.emit) {
            window.emit({
                scene: this.currentScene,
                sub_scene: '',
                action: 'continue_button_click',
                self: 'exploration-continue-btn',
                value: '',
                target: config.completion.continueButton.scene
            });
        }
        
        // Switch scene after animation
        setTimeout(() => {
            this.switchScene(config.completion.continueButton.scene);
        }, scaleDuration);
    });

    // Add to scene
    const currentSceneEl = document.querySelector(`[data-scene="${this.currentScene}"]`);
    if (currentSceneEl) {
        currentSceneEl.appendChild(button);
    }

    // Fade in after delay
    const delay = config.completion.continueButton.fadeInDelay || 1000;
    setTimeout(() => {
        button.style.opacity = '1';
    }, delay);
};

// Clean up exploration when scene changes
Game.prototype.cleanupExploration = function() {
    // Remove all exploration elements
    const explorationElements = document.querySelectorAll('.exploration-magnifier, .exploration-hitbox, .exploration-popup, .exploration-progress, .exploration-continue-btn');
    explorationElements.forEach(element => element.remove());
    
    // Also remove any exploration-related elements by ID
    const magnifier = document.getElementById('exploration-magnifier');
    if (magnifier) magnifier.remove();
    
    const progress = document.getElementById('exploration-progress');
    if (progress) progress.remove();
    
    const continueBtn = document.getElementById('exploration-continue-btn');
    if (continueBtn) continueBtn.remove();
    
    // Hide and remove any current popup
    if (this.explorationState.currentPopup) {
        this.explorationState.currentPopup.remove();
    }
    
    // Remove drag event listeners
    if (this.dragUpdateListener) {
        document.removeEventListener('mousemove', this.dragUpdateListener);
        this.dragUpdateListener = null;
    }
    if (this.dragEndListener) {
        document.removeEventListener('mouseup', this.dragEndListener);
        this.dragEndListener = null;
    }
    if (this.touchUpdateListener) {
        document.removeEventListener('touchmove', this.touchUpdateListener);
        this.touchUpdateListener = null;
    }
    if (this.touchEndListener) {
        document.removeEventListener('touchend', this.touchEndListener);
        this.touchEndListener = null;
    }
    
    // Clear runtime state but preserve config
    this.discoveredTargets.clear();
    this.explorationState = {
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        currentPopup: null,
        progressImageIndex: 0,
        hasInteracted: false
    };
    // Don't clear this.explorationConfig - it comes from JSON and is needed for re-init
};