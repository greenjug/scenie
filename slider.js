// Scenie Framework Slider Module

// Slider-specific functionality for the Scenie game system

// Store slider states per slider ID
Game.prototype.sliderStates = {};

Game.prototype.getSliderState = function(sliderId) {
    if (!this.sliderStates[sliderId]) {
        this.sliderStates[sliderId] = {
            currentSlideIndex: 0,
            config: null,
            container: null,
            slidesContainer: null,
            indicators: []
        };
    }
    return this.sliderStates[sliderId];
};

Game.prototype.setupSliderTouchEvents = function(container, sliderId) {
    const sliderState = this.getSliderState(sliderId);
    if (!sliderState.config) return;

    let startX = 0;
    let startY = 0;
    let isSwiping = false;
    const minSwipeDistance = 50; // Minimum distance for swipe recognition

    container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = startX - currentX;
        const diffY = startY - currentY;

        // Prevent scrolling if it's a horizontal swipe
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
            e.preventDefault();
        }
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
        if (!isSwiping) return;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = startX - endX;
        const diffY = startY - endY;

        isSwiping = false;

        // Check if it's a horizontal swipe
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
            if (diffX > 0) {
                // Swipe left - next slide
                this.nextSlide(sliderId);
            } else {
                // Swipe right - previous slide
                this.previousSlide(sliderId);
            }
        }
    }, { passive: true });
};

Game.prototype.createSliderElement = function(element) {
    if (element.type !== 'slider') return;

    const sliderId = element.id;
    const sliderState = this.getSliderState(sliderId);
    
    // Store slider config in state
    sliderState.config = element.config;

    // Set up touch/swipe event listeners for this slider
    // (will be called after the container is created and added to DOM)

    // Create slider container
    const sliderContainer = document.createElement('div');
    sliderContainer.id = element.id;
    sliderContainer.className = 'game-element slider-container';
    sliderContainer.style.position = 'absolute';
    sliderContainer.style.width = element.width || '100%';
    sliderContainer.style.height = element.height || '100%';
    sliderContainer.style.overflow = 'hidden';

    // Position the container
    sliderContainer.style.top = `${element.y}%`;
    sliderContainer.style.left = `${element.x}%`;
    sliderContainer.style.transform = 'translate(-50%, -50%)';

    // Create slides container
    const slidesContainer = document.createElement('div');
    slidesContainer.className = 'slider-slides';
    slidesContainer.style.width = '100%';
    slidesContainer.style.height = '100%';
    slidesContainer.style.display = 'flex';
    slidesContainer.style.transition = `transform ${sliderState.config.transitionDuration || 300}ms ease-in-out`;

    // Create individual slides
    sliderState.config.slides.forEach((slide, index) => {
        const slideDiv = document.createElement('div');
        slideDiv.id = `slide-${index}`;
        slideDiv.className = 'slider-slide';
        slideDiv.style.width = '100%';
        slideDiv.style.height = '100%';
        slideDiv.style.flexShrink = '0';
        slideDiv.style.position = 'relative';

        // Add slide background if specified
        if (slide.background) {
            this.setElementBackground(slideDiv, slide.background);
        }

        // Add slide elements
        if (slide.elements) {
            slide.elements.forEach(slideElement => {
                this.createElement(slideElement, slideDiv);
            });
        }

        slidesContainer.appendChild(slideDiv);
    });

    sliderContainer.appendChild(slidesContainer);

    // Add navigation indicators if enabled
    if (sliderState.config.showIndicators !== false) {
        this.createSliderIndicators(sliderId, sliderContainer);
    }

    // Add navigation arrows if enabled
    if (sliderState.config.showArrows !== false) {
        this.createSliderArrows(sliderId, sliderContainer);
    }

    // Store reference
    sliderState.container = sliderContainer;
    sliderState.slidesContainer = slidesContainer;

    // Set up touch/swipe event listeners now that the container exists
    this.setupSliderTouchEvents(sliderContainer, sliderId);

    // Initialize the first slide
    this.showSlide(sliderId, 0);

    return sliderContainer;
};

Game.prototype.createSliderIndicators = function(sliderId, container) {
    const sliderState = this.getSliderState(sliderId);
    const indicatorsContainer = document.createElement('div');
    indicatorsContainer.className = 'slider-indicators';
    indicatorsContainer.style.position = 'absolute';
    indicatorsContainer.style.bottom = '20px';
    indicatorsContainer.style.left = '50%';
    indicatorsContainer.style.transform = 'translateX(-50%)';
    indicatorsContainer.style.display = 'flex';
    indicatorsContainer.style.gap = '10px';

    sliderState.config.slides.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.className = `slider-indicator ${index === 0 ? 'active' : ''}`;
        indicator.style.width = '12px';
        indicator.style.height = '12px';
        indicator.style.borderRadius = '50%';
        indicator.style.backgroundColor = index === 0 ? '#007bff' : '#ccc';
        indicator.style.cursor = 'pointer';
        indicator.style.transition = 'background-color 0.3s ease';

        indicator.addEventListener('click', () => {
            this.goToSlide(sliderId, index);
        });

        indicatorsContainer.appendChild(indicator);
        sliderState.indicators.push(indicator);
    });

    container.appendChild(indicatorsContainer);
};

Game.prototype.createSliderArrows = function(sliderId, container) {
    // Previous arrow
    const prevArrow = document.createElement('div');
    prevArrow.className = 'slider-arrow slider-arrow-prev';
    prevArrow.innerHTML = '‹';
    prevArrow.style.position = 'absolute';
    prevArrow.style.left = '20px';
    prevArrow.style.top = '50%';
    prevArrow.style.transform = 'translateY(-50%)';
    prevArrow.style.fontSize = '24px';
    prevArrow.style.color = '#fff';
    prevArrow.style.cursor = 'pointer';
    prevArrow.style.userSelect = 'none';
    prevArrow.style.zIndex = '10';
    prevArrow.style.textShadow = '0 0 5px rgba(0,0,0,0.5)';

    prevArrow.addEventListener('click', () => {
        this.previousSlide(sliderId);
    });

    // Next arrow
    const nextArrow = document.createElement('div');
    nextArrow.className = 'slider-arrow slider-arrow-next';
    nextArrow.innerHTML = '›';
    nextArrow.style.position = 'absolute';
    nextArrow.style.right = '20px';
    nextArrow.style.top = '50%';
    nextArrow.style.transform = 'translateY(-50%)';
    nextArrow.style.fontSize = '24px';
    nextArrow.style.color = '#fff';
    nextArrow.style.cursor = 'pointer';
    nextArrow.style.userSelect = 'none';
    nextArrow.style.zIndex = '10';
    nextArrow.style.textShadow = '0 0 5px rgba(0,0,0,0.5)';

    nextArrow.addEventListener('click', () => {
        this.nextSlide(sliderId);
    });

    container.appendChild(prevArrow);
    container.appendChild(nextArrow);
};

Game.prototype.showSlide = function(sliderId, index) {
    const sliderState = this.getSliderState(sliderId);
    if (!sliderState.slidesContainer || !sliderState.config) return;

    const totalSlides = sliderState.config.slides.length;
    sliderState.currentSlideIndex = Math.max(0, Math.min(index, totalSlides - 1));

    // Update slide position
    const translateX = -sliderState.currentSlideIndex * 100;
    sliderState.slidesContainer.style.transform = `translateX(${translateX}%)`;

    // Update indicators
    if (sliderState.indicators) {
        sliderState.indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === sliderState.currentSlideIndex);
            indicator.style.backgroundColor = i === sliderState.currentSlideIndex ? '#007bff' : '#ccc';
        });
    }

    // Trigger slide change callback if defined
    if (sliderState.config.onSlideChange) {
        this.executeSliderCallback(sliderState.config.onSlideChange, sliderState.currentSlideIndex);
    }
};

Game.prototype.nextSlide = function(sliderId) {
    const sliderState = this.getSliderState(sliderId);
    const nextIndex = sliderState.currentSlideIndex + 1;
    if (nextIndex < sliderState.config.slides.length) {
        this.showSlide(sliderId, nextIndex);
    } else if (sliderState.config.loop) {
        this.showSlide(sliderId, 0);
    }
};

Game.prototype.previousSlide = function(sliderId) {
    const sliderState = this.getSliderState(sliderId);
    const prevIndex = sliderState.currentSlideIndex - 1;
    if (prevIndex >= 0) {
        this.showSlide(sliderId, prevIndex);
    } else if (sliderState.config.loop) {
        this.showSlide(sliderId, sliderState.config.slides.length - 1);
    }
};

Game.prototype.goToSlide = function(sliderId, index) {
    this.showSlide(sliderId, index);
};

Game.prototype.executeSliderCallback = function(callbackConfig, slideIndex) {
    if (!callbackConfig) return;

    // Support for clickActions-style callbacks
    if (Array.isArray(callbackConfig)) {
        callbackConfig.forEach(action => {
            if (action.action === 'navigate' && action.target === 'scene') {
                this.switchScene(action.value);
            }
            // Add other actions as needed
        });
    }
};

// Extend core createElement to handle slider type
const originalCreateElement = Game.prototype.createElement;
Game.prototype.createElement = function(element, parentElement) {
    if (element.type === 'slider') {
        const sliderElement = this.createSliderElement(element);
        if (sliderElement) {
            parentElement.appendChild(sliderElement);
        }
        return;
    }

    // Call original method for other element types
    return originalCreateElement.call(this, element, parentElement);
};

Game.prototype.setElementBackground = function(element, bgArray) {
    const bgArr = Array.isArray(bgArray) ? bgArray : [bgArray];
    const width = window.innerWidth;
    let selectedBg = null;
    let highestPriority = -1;

    const priorities = { 'all': 0, 'mobile': 1, 'tablet': 2, 'desktop': 3 };

    bgArr.forEach(bg => {
        const target = bg.target || 'all';
        if (target === 'all' || (target === 'mobile' && width < this.gameConfig.game.tabletSize) ||
            (target === 'tablet' && width >= this.gameConfig.game.tabletSize && width < this.gameConfig.game.desktopSize) ||
            (target === 'desktop' && width >= this.gameConfig.game.desktopSize)) {
            if (priorities[target] > highestPriority) {
                highestPriority = priorities[target];
                selectedBg = bg;
            }
        }
    });

    if (selectedBg) {
        if (selectedBg.type === 'image') {
            element.style.backgroundColor = selectedBg.fallback_colour || '';
            if (selectedBg.value) {
                let url = selectedBg.value;
                if (selectedBg.variant === 'local') {
                    url = selectedBg.value;
                }
                element.style.backgroundImage = `url(${url})`;
                element.style.backgroundSize = selectedBg.size || 'cover';
                element.style.backgroundRepeat = selectedBg.repeat || 'no-repeat';
                element.style.backgroundPosition = selectedBg.position || 'center center';
            } else {
                element.style.backgroundImage = '';
            }
        } else if (selectedBg.type === 'colour') {
            element.style.backgroundImage = ''; // Clear image
            if (selectedBg.variant === 'hex') {
                if (selectedBg.value === 'transparent') {
                    element.style.backgroundColor = 'transparent';
                } else {
                    element.style.backgroundColor = '#' + selectedBg.value;
                }
            } else if (selectedBg.variant === 'literal') {
                element.style.backgroundColor = selectedBg.value;
            } else if (selectedBg.variant === 'rgb') {
                element.style.backgroundColor = `rgb(${selectedBg.value})`;
            } else if (selectedBg.variant === 'rgba') {
                element.style.backgroundColor = `rgba(${selectedBg.value})`;
            }
        }
    }
};