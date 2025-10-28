"use strict";

async function fetchGameConfig() {
    const response = await fetch('game.json');
    return await response.json();
}

function Game(config) {
    this.gameConfig = config;
    this.currentScene = null;
    this.selectedAnswers = [];
    this.defaultScaleDuration = this.gameConfig.game.defaultScaleDuration || 500;
    this.autoTransitionTimeout = null; // Store current autoTransition timeout
    
    // Quiz-related properties (will be used if quiz.js is loaded)
    this.quizConfig = null;
    this.currentQuestionIndex = 0;
    this.questionClicks = {};
    this.isInInterstitial = false;
    this.lastQuestionCorrect = null;
    
    this.init();
}

Game.prototype.init = function() {
    document.title = this.gameConfig.game.title;

    if (this.gameConfig.game.preloadImages) {
        this.preloadAllImages().then(() => {
            this.completeInit();
        });
    } else {
        this.completeInit();
    }
};

Game.prototype.completeInit = function() {
    // Initialize viewport height for mobile browsers
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    this.setupBackground();
    this.setupScenes();
    
    // Emit scene_loaded for initial scene
    if (window.emit && this.currentScene) {
        window.emit({
            scene: this.currentScene,
            sub_scene: '',
            action: 'scene_load',
            self: '',
            value: '',
            target: ''
        });
    }
    
    if (this.gameConfig.game.containerBackground) {
        this.setupBackground('game-container', this.gameConfig.game.containerBackground);
    }
    this.resizeTimeout = null;
    window.addEventListener('resize', () => {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.setupBackground();
            if (this.gameConfig.game.containerBackground) {
                this.setupBackground('game-container', this.gameConfig.game.containerBackground);
            }

            // Apply current scene background overrides
            const currentSceneConfig = this.gameConfig.scenes.find(s => s.name === this.currentScene);
            if (currentSceneConfig && currentSceneConfig.pageBackground) {
                this.setupBackground('background', currentSceneConfig.pageBackground);
            }
            if (currentSceneConfig && currentSceneConfig.containerBackground) {
                this.setupBackground('game-container', currentSceneConfig.containerBackground);
            }
        }, this.gameConfig.game.resizeDebounce);
    });

    // Handle orientation changes on mobile devices
    window.addEventListener('orientationchange', () => {
        // Delay to allow the browser to complete the orientation change
        setTimeout(() => {
            this.handleOrientationChange();
        }, 100);
    });

    // Prevent context menu on long press
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Prevent zoom on input focus (iOS)
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.setAttribute('readonly', 'readonly');
            setTimeout(() => {
                input.removeAttribute('readonly');
                input.focus();
            }, 100);
        });
    });

    // Set dynamic transition duration for scenes
    const scenes = document.querySelectorAll('.scene');
    scenes.forEach(scene => {
        scene.style.transition = `opacity ${this.gameConfig.game.fadeDuration}ms ease-in-out`;
    });
};

Game.prototype.handleOrientationChange = function() {
    // Force a complete background and container recalculation
    this.setupBackground();
    if (this.gameConfig.game.containerBackground) {
        this.setupBackground('game-container', this.gameConfig.game.containerBackground);
    }

    // Apply current scene background overrides
    const currentSceneConfig = this.gameConfig.scenes.find(s => s.name === this.currentScene);
    if (currentSceneConfig && currentSceneConfig.pageBackground) {
        this.setupBackground('background', currentSceneConfig.pageBackground);
    }
    if (currentSceneConfig && currentSceneConfig.containerBackground) {
        this.setupBackground('game-container', currentSceneConfig.containerBackground);
    }

    // Update viewport height for mobile browsers that don't handle 100vh correctly
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // Force a reflow to ensure proper rendering
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
};

Game.prototype.preloadAllImages = function() {
    return new Promise((resolve) => {
        const { urls, backgroundUrls } = this.collectImageUrls();
        const allUrls = [...urls, ...backgroundUrls];
        if (allUrls.length === 0) {
            this.hideLoadingOverlay();
            resolve();
            return;
        }

        // Create a hidden container for preloading images
        const preloadContainer = document.createElement('div');
        preloadContainer.id = 'preload-container';
        preloadContainer.style.position = 'absolute';
        preloadContainer.style.left = '-10000px';
        preloadContainer.style.top = '-10000px';
        preloadContainer.style.width = '1px';
        preloadContainer.style.height = '1px';
        preloadContainer.style.overflow = 'hidden';
        document.body.appendChild(preloadContainer);

        // Store references to preloaded images to prevent garbage collection
        this.preloadedImages = [];
        
        this.showLoadingOverlay();
        let loadedCount = 0;
        let failedCount = 0;
        const totalImages = allUrls.length;
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second

        const updateProgress = () => {
            const progress = ((loadedCount + failedCount) / totalImages) * 100;
            this.updateLoadingProgress(progress);
        };

        const onImageComplete = () => {
            loadedCount++;
            updateProgress();

            if (loadedCount + failedCount === totalImages) {
                this.hideLoadingOverlay();
                // Keep the preload container hidden to maintain cache
                resolve();
            }
        };

        const attemptLoadImage = (url, attempt = 1, isBackground = false) => {
            // For all images, create an img element to properly wait for load
            const img = document.createElement('img');
            img.style.display = 'none';
            preloadContainer.appendChild(img);
            
            // Store reference to prevent garbage collection
            this.preloadedImages.push(img);

            if (isBackground) {
                // For background images, also create a div with background-image to populate CSS cache
                const div = document.createElement('div');
                div.style.width = '100px';
                div.style.height = '100px';
                div.style.backgroundImage = `url(${url})`;
                div.style.backgroundSize = 'cover';
                preloadContainer.appendChild(div);
                this.preloadedImages.push(div);
            }

            const onSuccess = () => {
                onImageComplete();
            };

            const onError = () => {
                if (attempt < maxRetries) {
                    // Retry with exponential backoff
                    setTimeout(() => {
                        attemptLoadImage(url, attempt + 1, isBackground);
                    }, retryDelay * attempt);
                } else {
                    console.warn(`Failed to load image after ${maxRetries} attempts: ${url}`);
                    failedCount++;
                    updateProgress();

                    if (loadedCount + failedCount === totalImages) {
                        this.hideLoadingOverlay();
                        // Keep the preload container hidden to maintain cache
                        resolve();
                    }
                }
            };

            img.onload = onSuccess;
            img.onerror = onError;
            img.src = url;
        };

        // Start loading all images
        urls.forEach(url => {
            attemptLoadImage(url, 1, false);
        });
        backgroundUrls.forEach(url => {
            attemptLoadImage(url, 1, true);
        });
    });
};

Game.prototype.showLoadingOverlay = function() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
};

Game.prototype.hideLoadingOverlay = function() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        // Add a slight delay for smooth transition
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 500);
    }
};

Game.prototype.updateLoadingProgress = function(percentage) {
    const fill = document.getElementById('loading-fill');
    const percentageText = document.getElementById('loading-percentage');

    if (fill) {
        fill.style.width = `${percentage}%`;
    }

    if (percentageText) {
        percentageText.textContent = `${Math.round(percentage)}%`;
    }
};

Game.prototype.collectImageUrls = function() {
    const urls = new Set();
    const backgroundUrls = new Set();

    // Helper function to process background arrays
    const processBackgrounds = (backgrounds, isBackground = false) => {
        if (!backgrounds) return;
        const bgArr = Array.isArray(backgrounds) ? backgrounds : [backgrounds];
        bgArr.forEach(bg => {
            if (bg.type === 'image') {
                if (isBackground) {
                    backgroundUrls.add(bg.value);
                } else {
                    urls.add(bg.value);
                }
            }
        });
    };

    // Collect from game level
    processBackgrounds(this.gameConfig.game.pageBackground, true);
    processBackgrounds(this.gameConfig.game.containerBackground, true);

    // Collect from scenes
    this.gameConfig.scenes.forEach(scene => {
        processBackgrounds(scene.background, true);
        processBackgrounds(scene.pageBackground, true);
        processBackgrounds(scene.containerBackground, true);

        // Collect from elements
        const collectFromElements = (elements) => {
            elements.forEach(element => {
                if (element.type === 'container' && element.elements) {
                    collectFromElements(element.elements);
                }

                // Element backgrounds
                processBackgrounds(element.background, true);

                // Picture URLs
                if (element.type === 'picture' && element.url) {
                    if (element.location === 'local') {
                        urls.add(element.url);
                    } else if (element.location === 'external') {
                        urls.add(element.url);
                    }
                }
            });
        };

        if (scene.elements) {
            collectFromElements(scene.elements);
        }
    });

    return { urls: Array.from(urls), backgroundUrls: Array.from(backgroundUrls) };
};

Game.prototype.setupBackground = function(elementId = 'background', bgArray = null) {
    if (!bgArray) bgArray = this.gameConfig.game.pageBackground;
    const background = document.getElementById(elementId);
    const width = window.innerWidth;
    let selectedBg = null;
    let highestPriority = -1;

    const priorities = { 'all': 0, 'mobile': 1, 'tablet': 2, 'desktop': 3 };

    const bgArr = Array.isArray(bgArray) ? bgArray : [bgArray];

    bgArr.forEach(bg => {
        if (bg.target === 'all' || (bg.target === 'mobile' && width < this.gameConfig.game.tabletSize) ||
            (bg.target === 'tablet' && width >= this.gameConfig.game.tabletSize && width < this.gameConfig.game.desktopSize) ||
            (bg.target === 'desktop' && width >= this.gameConfig.game.desktopSize)) {
            if (priorities[bg.target] > highestPriority) {
                highestPriority = priorities[bg.target];
                selectedBg = bg;
            }
        }
    });

    if (selectedBg) {
        if (selectedBg.type === 'image') {
            background.style.backgroundImage = '';
            background.style.backgroundColor = selectedBg.fallback_colour || '';
            if (selectedBg.value) {
                let url = selectedBg.value;
                if (selectedBg.variant === 'local') {
                    url = selectedBg.value;
                }

                // If images were preloaded, set background immediately (they should be cached)
                // Otherwise, test loading first
                if (this.gameConfig.game.preloadImages) {
                    background.style.backgroundImage = `url(${url})`;
                    background.style.backgroundSize = selectedBg.size || 'cover';
                    background.style.backgroundRepeat = selectedBg.repeat || 'no-repeat';
                    background.style.backgroundPosition = selectedBg.position || 'center center';
                } else {
                    // Test if image loads successfully
                    const testImg = new Image();
                    testImg.onload = () => {
                        background.style.backgroundImage = `url(${url})`;
                        background.style.backgroundSize = selectedBg.size || 'cover';
                        background.style.backgroundRepeat = selectedBg.repeat || 'no-repeat';
                        background.style.backgroundPosition = selectedBg.position || 'center center';
                    };
                    testImg.onerror = () => {
                        console.warn(`Failed to load background image: ${url}`);
                        // Keep fallback color, don't set background image
                        background.style.backgroundImage = '';
                    };
                    testImg.src = url;
                }
            } else {
                background.style.backgroundImage = ''; // Clear image
            }
        } else if (selectedBg.type === 'colour') {
            background.style.backgroundImage = ''; // Clear image
            if (selectedBg.variant === 'hex') {
                if (selectedBg.value === 'transparent') {
                    background.style.backgroundColor = 'transparent';
                } else {
                    background.style.backgroundColor = '#' + selectedBg.value;
                }
            } else if (selectedBg.variant === 'literal') {
                background.style.backgroundColor = selectedBg.value;
            } else if (selectedBg.variant === 'rgb') {
                background.style.backgroundColor = `rgb(${selectedBg.value})`;
            } else if (selectedBg.variant === 'rgba') {
                background.style.backgroundColor = `rgba(${selectedBg.value})`;
            }
        }
    }

    // Only adjust container if it's the main background
    if (elementId === 'background') {
        const container = document.getElementById('game-container');
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const aspect = this.gameConfig.game.containerAspectRatio;
        if (vw / vh > aspect) {
            // Screen is wider than aspect, fit height
            container.style.height = '100vh';
            container.style.width = `${100 * aspect}vh`;
        } else {
            // Screen is taller, fit width
            container.style.width = '100vw';
            container.style.height = `${100 / aspect}vw`;
        }
    }
};

Game.prototype.setupScenes = function() {
    const gameContainer = document.getElementById('game-container');
    this.gameConfig.scenes.forEach(sceneConfig => {
        const sceneDiv = document.createElement('div');
        sceneDiv.id = sceneConfig.name + '-scene';
        sceneDiv.className = 'scene';
        sceneDiv.setAttribute('data-scene', sceneConfig.name);
        if (!sceneConfig.initial) {
            sceneDiv.classList.add('hidden');
            sceneDiv.style.display = 'none';
        } else {
            this.currentScene = sceneConfig.name;
        }
        gameContainer.appendChild(sceneDiv);

        if (sceneConfig.elements) {
            this.createElements(sceneConfig.elements, sceneDiv);
        }

        // Setup scene background
        if (sceneConfig.background) {
            this.setupBackground(sceneConfig.name + '-scene', sceneConfig.background);
        }
    });
};

Game.prototype.createElements = function(elements, parentElement) {
    elements.forEach(element => {
        this.createElement(element, parentElement);
    });
};

Game.prototype.createElement = function(element, parentElement) {
    if (element.type === 'container') {
        const containerDiv = document.createElement('div');
        containerDiv.id = element.id;
        containerDiv.className = 'game-element container';
        if (element.hidden) containerDiv.classList.add('hidden');
        containerDiv.style.position = 'relative';
        if (element.variant === 'vflex') {
            containerDiv.style.flexDirection = 'column';
        } else if (element.variant === 'hflex') {
            containerDiv.style.flexDirection = 'row';
        }
        if (element.width) containerDiv.style.width = element.width;
        else containerDiv.style.width = '100%';
        if (element.height) containerDiv.style.height = element.height;
        else containerDiv.style.height = '100%';
        containerDiv.style.alignItems = element.alignItems || 'center';
        if (element.flexGrow !== undefined) containerDiv.style.flexGrow = element.flexGrow;
        if (element.flexShrink !== undefined) containerDiv.style.flexShrink = element.flexShrink;
        if (element.flexBasis !== undefined) containerDiv.style.flexBasis = element.flexBasis + '%';

        parentElement.appendChild(containerDiv);

        if (element.background) {
            this.setupBackground(element.id, element.background);
        }

        if (element.elements) {
            this.createElements(element.elements, containerDiv);
        }
    } else if (element.type === 'picture') {
        const picture = document.createElement('picture');
        picture.id = element.id;
        picture.className = 'game-element picture';
        if (element.clickable) picture.classList.add('clickable');
        if (element.hidden) picture.classList.add('hidden');
        picture.style.position = 'absolute';
        picture.style.top = `${element.y}%`;
        picture.style.left = `${element.x}%`;
        picture.style.transform = 'translate(-50%, -50%)';
        // Store original transform for affirmation reset
        picture.dataset.originalTransform = 'translate(-50%, -50%)';
        picture.style.width = element.width;
        picture.style.aspectRatio = element.aspectRatio;

        const img = document.createElement('img');
        img.src = element.location === 'local' ? element.url : element.url;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';

        // Add error handling with placeholder
        img.onerror = () => {
            console.warn(`Failed to load image: ${img.src}`);
            // Create a placeholder with a simple icon
            img.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.style.width = '100%';
            placeholder.style.height = '100%';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.background = 'rgba(200, 200, 200, 0.3)';
            placeholder.style.border = '2px dashed rgba(150, 150, 150, 0.5)';
            placeholder.style.borderRadius = '4px';
            placeholder.style.color = 'rgba(100, 100, 100, 0.7)';
            placeholder.style.fontSize = '14px';
            placeholder.innerHTML = '📷<br>Image<br>Failed';
            picture.appendChild(placeholder);
        };

        picture.appendChild(img);

        if (element.clickable) {
            img.style.transition = `transform ${this.defaultScaleDuration}ms ease`;
            img.style.transformOrigin = 'center';
            picture.classList.add('clickable');
            picture.style.cursor = 'pointer';
            picture.addEventListener('click', () => {
                // Find target scene from click actions
                let targetScene = '';
                if (element.clickActions) {
                    const navigateAction = element.clickActions.find(action => action.action === 'navigate' && action.target === 'scene');
                    if (navigateAction) {
                        targetScene = navigateAction.value;
                    }
                }
                
                // Determine value for quiz answers or navigation
                let value = '';
                if (this.quizConfig && element.clickActions && element.clickActions.some(action => action.action === 'selectAnswer')) {
                    // This is a quiz answer button
                    const currentQuestion = this.quizConfig.questions[this.currentQuestionIndex];
                    const answer = currentQuestion.answers.find(a => a.element === element.id);
                    if (answer) {
                        value = answer.correct ? 'correct' : 'incorrect';
                    }
                } else if (targetScene) {
                    // This is a navigation button
                    value = 'navigate';
                }
                
                // Determine sub_scene
                let subScene = '';
                if (this.currentScene === 'quiz' && this.quizConfig && this.currentQuestionIndex >= 0) {
                    const currentQuestion = this.quizConfig.questions[this.currentQuestionIndex];
                    if (currentQuestion) {
                        subScene = currentQuestion.id;
                    }
                }
                
                // Emit button click event
                if (window.emit) {
                    window.emit({
                        scene: this.currentScene,
                        sub_scene: subScene,
                        action: 'button_click',
                        self: element.id,
                        value: value,
                        target: targetScene
                    });
                }
                
                this.executeClickActions(element.clickActions, img);
            });
        }

        parentElement.appendChild(picture);
    } else if (element.type === 'quiz') {
        // Quiz elements will be handled by quiz.js if loaded
        // Store quiz config for later use
        this.quizConfig = element.config;
        this.currentQuestionIndex = 0;
        // Quiz elements are not visual, just configuration
        return;
    }
};

Game.prototype.executeClickActions = function(actions, targetElement) {
    if (!actions) return;
    actions.forEach(action => {
        if (action.action === 'scale') {
            const duration = action.duration || this.defaultScaleDuration;
            targetElement.style.transition = `transform ${duration}ms ease`;
            targetElement.style.transform = `scale(${action.value})`;
            
            setTimeout(() => {
                targetElement.style.transform = '';
            }, duration);
        } else if (action.action === 'visibility') {
            const targetEl = document.getElementById(action.target);
            if (targetEl) {
                if (action.value === 'visible') {
                    targetEl.classList.remove('hidden');
                } else if (action.value === 'hidden') {
                    targetEl.classList.add('hidden');
                }
            }
        } else if (action.action === 'navigate') {
            // Delay navigation if there's a scale action
            const hasScale = actions.some(a => a.action === 'scale');
            const delay = hasScale ? (actions.find(a => a.action === 'scale').duration || this.defaultScaleDuration) * 2 : 0;
            
            setTimeout(() => {
                if (action.target === 'scene') {
                    // Reset continuation flag when starting fresh quiz
                    if (action.value === 'quiz') {
                        this.isContinuingFromInterstitial = false;
                    }
                    this.switchScene(action.value);
                }
            }, delay);
        } else if (action.action === 'selectAnswer') {
            // This will be handled by quiz.js if loaded
            if (typeof this.selectQuizAnswer === 'function') {
                this.selectQuizAnswer(action.value);
            }
        } else if (action.action === 'continueFromInterstitial') {
            // This will be handled by quiz.js if loaded
            if (typeof this.continueFromInterstitial === 'function') {
                this.continueFromInterstitial();
            }
        }
    });
};

Game.prototype.switchScene = function(scene, duration = this.gameConfig.game.fadeDuration) {
    const currentSceneEl = document.querySelector(`[data-scene="${this.currentScene}"]`);
    const nextSceneEl = document.querySelector(`[data-scene="${scene}"]`);

    // Find the target scene config
    const targetSceneConfig = this.gameConfig.scenes.find(s => s.name === scene);

    // Clear any existing autoTransition timeout
    if (this.autoTransitionTimeout) {
        clearTimeout(this.autoTransitionTimeout);
        this.autoTransitionTimeout = null;
    }

    currentSceneEl.classList.add('hidden');
    setTimeout(() => {
        currentSceneEl.style.display = 'none';

        // Clear scene if configured to do so
        if (targetSceneConfig && targetSceneConfig.clear) {
            this.clearScene(targetSceneConfig.name);
        } else if (scene === 'quiz' && this.quizConfig && this.quizConfig.clear) {
            // Special handling for quiz clear configuration
            this.clearScene('quiz');
            // Reset quiz state only when starting fresh (not continuing from interstitial)
            if (!this.isContinuingFromInterstitial && typeof this.resetQuizState === 'function') {
                this.resetQuizState();
            }
        }

        nextSceneEl.style.display = 'block';
        nextSceneEl.classList.remove('hidden');
        this.currentScene = scene;

        // Emit scene_loaded event
        if (window.emit) {
            window.emit({
                scene: scene,
                sub_scene: '',
                action: 'scene_load',
                self: '',
                value: '',
                target: ''
            });
        }

        // Apply scene-specific background overrides
        if (targetSceneConfig.pageBackground) {
            this.setupBackground('background', targetSceneConfig.pageBackground);
        }
        if (targetSceneConfig.containerBackground) {
            this.setupBackground('game-container', targetSceneConfig.containerBackground);
        }

        // Set up autoTransition if configured
        if (targetSceneConfig && targetSceneConfig.autoTransition) {
            const { delay, scene: targetScene } = targetSceneConfig.autoTransition;
            this.autoTransitionTimeout = setTimeout(() => {
                this.switchScene(targetScene);
            }, delay);
        }

        if (scene === 'gameplay') {
            this.resetGameplay();
        }
    }, duration);
};

Game.prototype.clearScene = function(sceneName) {
    const sceneElement = document.getElementById(sceneName + '-scene');
    if (sceneElement) {
        this.clearSceneElements(this.gameConfig.scenes.find(s => s.name === sceneName).elements);
    }
    
    // Reset quiz state is now handled in switchScene for quiz
};

Game.prototype.clearSceneElements = function(elements) {
    elements.forEach(element => {
        // Clear container elements
        if (element.type === 'container' && element.elements) {
            this.clearSceneElements(element.elements);
        }

        // Reset picture elements
        if (element.type === 'picture') {
            const domElement = document.getElementById(element.id);
            if (domElement) {
                // Re-hide or show elements based on their config
                if (element.hidden) {
                    domElement.classList.add('hidden');
                } else {
                    domElement.classList.remove('hidden');
                }

                // Re-enable clicking
                if (element.clickable) {
                    domElement.classList.add('clickable');
                    domElement.style.pointerEvents = '';
                }

                // Reset affirmation styling
                domElement.style.opacity = '';
                domElement.style.border = '';
                // Reset transform to original positioning (removes scale from affirmation)
                domElement.style.transform = domElement.dataset.originalTransform || '';
                domElement.style.transformOrigin = '';
                domElement.style.transition = '';

                // Remove affirmation icons and overlays
                const icons = domElement.querySelectorAll('.affirmation-icon');
                icons.forEach(icon => icon.remove());
                const overlays = domElement.querySelectorAll('.affirmation-overlay');
                overlays.forEach(overlay => overlay.remove());
            }
        }

        // Reset container elements (for affirmation on parent)
        if (element.type === 'container') {
            const domElement = document.getElementById(element.id);
            if (domElement) {
                // Re-hide or show elements based on their config
                if (element.hidden) {
                    domElement.classList.add('hidden');
                } else {
                    domElement.classList.remove('hidden');
                }
                domElement.style.opacity = '';
                const overlays = domElement.querySelectorAll('.affirmation-overlay');
                overlays.forEach(overlay => overlay.remove());
            }
        }
    });
};

Game.prototype.resetGameplay = function() {
    // Placeholder for gameplay reset - can be overridden
};