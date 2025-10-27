// Scenie Framework Quiz Module - v0.1.0
const SCENIE_QUIZ_VERSION = '0.1.0';

// Quiz-specific functionality for the Scenie game system

// Extend the core Game with quiz methods
Game.prototype.selectQuizAnswer = function(answerElementId) {
    if (!this.quizConfig) return;

    const currentQuestion = this.quizConfig.questions[this.currentQuestionIndex];

    // Initialize click tracking for this question if not exists
    if (!this.questionClicks) {
        this.questionClicks = {};
    }
    if (!this.questionClicks[currentQuestion.id]) {
        this.questionClicks[currentQuestion.id] = 0;
    }

    // Check if max clicks reached
    const maxClicks = currentQuestion.maxClicks || currentQuestion.answers.length;
    if (this.questionClicks[currentQuestion.id] >= maxClicks) {
        return; // Already reached max clicks
    }

    // Increment click count
    this.questionClicks[currentQuestion.id]++;

    // Track selected answers for correctness checking
    if (!this.selectedAnswers) {
        this.selectedAnswers = {};
    }
    if (!this.selectedAnswers[currentQuestion.id]) {
        this.selectedAnswers[currentQuestion.id] = [];
    }

    const selectedAnswer = currentQuestion.answers.find(a => a.element === answerElementId);
    if (selectedAnswer) {
        this.selectedAnswers[currentQuestion.id].push(selectedAnswer);
    }

    // Check if we've reached max clicks and should exit
    if (this.questionClicks[currentQuestion.id] >= maxClicks) {
        this.lockQuizAnswers();
        setTimeout(() => {
            this.executeExitAction(currentQuestion);
        }, 1000); // Give time for brushes to show
    }
};

Game.prototype.lockQuizAnswers = function() {
    if (!this.quizConfig) return;

    const currentQuestion = this.quizConfig.questions[this.currentQuestionIndex];
    currentQuestion.answers.forEach(answer => {
        const element = document.getElementById(answer.element);
        if (element) {
            element.classList.remove('clickable');
        }
    });
};

Game.prototype.executeExitAction = function(question) {
    const selectedAnswers = this.selectedAnswers[question.id] || [];
    const correctAnswers = question.answers.filter(a => a.correct);

    // Check if user got all correct answers
    const gotAllCorrect = correctAnswers.every(correctAns =>
        selectedAnswers.some(selectedAns => selectedAns.element === correctAns.element)
    );

    // Check if user didn't select any wrong answers
    const noWrongAnswers = selectedAnswers.every(selectedAns => selectedAns.correct);

    const isCorrect = gotAllCorrect && noWrongAnswers && selectedAnswers.length === correctAnswers.length;

    // Store the correctness for interstitial navigation
    this.lastQuestionCorrect = isCorrect;

    // Check if there's an interstitial configured for this question
    const hasInterstitial = question.interstitials && 
        ((isCorrect && question.interstitials.correct) || (!isCorrect && question.interstitials.incorrect));

    // Show affirmation before navigating
    if (this.quizConfig.affirmation) {
        this.showAffirmation(question, selectedAnswers);
        // Get the merged affirmation config to determine duration
        const quizAffirmation = this.quizConfig.affirmation;
        const questionAffirmation = question.affirmation;
        const affirmation = this.mergeAffirmations(quizAffirmation, questionAffirmation);
        setTimeout(() => {
            if (hasInterstitial) {
                // Clear the quiz scene to remove affirmation before navigating to interstitial
                this.clearScene('quiz');
                // Navigate to interstitial scene
                this.isInInterstitial = true;
                const interstitialScene = isCorrect ? question.interstitials.correct : question.interstitials.incorrect;
                this.switchScene(interstitialScene);
            } else {
                // No interstitial, proceed to next question or outcome
                this.proceedAfterQuestion();
            }
        }, affirmation.duration || 2000);
    } else {
        // No affirmation, proceed immediately
        if (hasInterstitial) {
            // Clear the quiz scene to remove any potential affirmation before navigating to interstitial
            this.clearScene('quiz');
            this.isInInterstitial = true;
            const interstitialScene = isCorrect ? question.interstitials.correct : question.interstitials.incorrect;
            this.switchScene(interstitialScene);
        } else {
            this.proceedAfterQuestion();
        }
    }
};

Game.prototype.showAffirmation = function(question, selectedAnswers) {
    // Get affirmation with inheritance: question overrides quiz defaults
    const quizAffirmation = this.quizConfig.affirmation;
    const questionAffirmation = question.affirmation;

    // If neither quiz nor question has affirmation, return early
    if (!quizAffirmation && !questionAffirmation) return;

    // Merge affirmation configs (question overrides quiz)
    const affirmation = this.mergeAffirmations(quizAffirmation, questionAffirmation);
    if (!affirmation) return;

    // Get all answer elements with their corresponding answer data
    const answerItems = question.answers.map(ans => ({
        element: document.getElementById(ans.element),
        answer: ans
    }));

    const target = affirmation.target || 'element';

    if (affirmation.type === 'dim') {
        if (target === 'parent') {
            answerItems.forEach(item => {
                if (item.element && !item.answer.correct) {
                    const parent = item.element.parentElement;
                    if (parent) {
                        parent.style.opacity = affirmation.opacity || 0.3;
                    }
                }
            });
        } else {
            answerItems.forEach(item => {
                if (item.element && !item.answer.correct) {
                    item.element.style.opacity = affirmation.opacity || 0.3;
                }
            });
        }
    } else if (affirmation.type === 'overlay') {
        if (target === 'parent') {
            answerItems.forEach(item => {
                if (item.element && !item.answer.correct) {
                    const parent = item.element.parentElement;
                    if (parent) {
                        this.addAffirmationOverlay(parent, affirmation);
                    }
                }
            });
        } else {
            answerItems.forEach(item => {
                if (item.element && !item.answer.correct) {
                    this.addAffirmationOverlay(item.element, affirmation);
                }
            });
        }
    } else if (affirmation.type === 'animation') {
        const audience = affirmation.audience || 'incorrect';
        console.log('Applying animation affirmation to', audience, 'answers');
        const targets = audience === 'incorrect' ? answerItems.filter(item => !item.answer.correct) :
                      audience === 'correct' ? answerItems.filter(item => item.answer.correct) :
                      answerItems;
        console.log('Targets for animation affirmation:', targets);
        targets.forEach(item => {
            const element = item.element;
            const scaleDuration = affirmation.scaleDuration || 500;
            // Preserve existing transform (like translate for positioning) and combine with scale
            const currentTransform = element.style.transform || '';
            const scaleValue = affirmation.scale || 0.8;
            const newTransform = currentTransform ? `${currentTransform} scale(${scaleValue})` : `scale(${scaleValue})`;

            element.style.transition = `opacity ${scaleDuration}ms ease, transform ${scaleDuration}ms ease`;
            element.style.opacity = affirmation.opacity || 0.5;
            element.style.transform = newTransform;
        });
    }
};

Game.prototype.mergeAffirmations = function(quizAffirmation, questionAffirmation) {
    // If no quiz affirmation, return question affirmation (or undefined)
    if (!quizAffirmation) return questionAffirmation;

    // If no question affirmation, return quiz affirmation
    if (!questionAffirmation) return quizAffirmation;

    // Deep merge: question properties override quiz properties
    return this.deepMerge(quizAffirmation, questionAffirmation);
};

Game.prototype.deepMerge = function(target, source) {
    const result = { ...target };

    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            // Recursively merge nested objects
            result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
            // Override with source value
            result[key] = source[key];
        }
    }

    return result;
};

Game.prototype.addAffirmationOverlay = function(element, overlayConfig) {
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'affirmation-overlay';
    overlay.style.position = 'absolute';
    const widthPercent = overlayConfig.widthPercent || 100;
    const heightPercent = overlayConfig.heightPercent || 100;
    const position = overlayConfig.position || 'center';
    const offsetX = overlayConfig.offsetX || 0;
    const offsetY = overlayConfig.offsetY || 0;
    overlay.style.width = widthPercent + '%';
    overlay.style.height = heightPercent + '%';
    if (position === 'center') {
        overlay.style.left = '50%';
        overlay.style.top = '50%';
        overlay.style.transform = 'translate(-50%, -50%)';
    } else if (position === 'topleft') {
        overlay.style.left = offsetX + '%';
        overlay.style.top = offsetY + '%';
        overlay.style.transform = 'none';
    }
    overlay.style.backgroundColor = overlayConfig.colour || '#000000';
    overlay.style.opacity = overlayConfig.opacity || 0.5;
    overlay.style.borderRadius = (overlayConfig.borderRadius || 0) + 'px';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '10';

    element.appendChild(overlay);
};

Game.prototype.getOutcomeScene = function() {
    // Calculate overall score
    let correctCount = 0;
    const totalQuestions = this.quizConfig.questions.length;
    
    this.quizConfig.questions.forEach(q => {
        const sel = this.selectedAnswers[q.id];
        if (sel && sel.length > 0) {
            const corr = q.answers.filter(a => a.correct);
            const isCorrect = corr.every(correctAns =>
                sel.some(selectedAns => selectedAns.element === correctAns.element)
            ) && sel.every(selectedAns => selectedAns.correct) && sel.length === corr.length;
            if (isCorrect) correctCount++;
        }
    });
    
    const score = correctCount / totalQuestions;
    
    // Find the highest threshold that the score meets
    const thresholds = this.quizConfig.outcomes.thresholds || [];
    for (const threshold of thresholds) {
        if (score >= threshold.minScore) {
            return threshold.scene;
        }
    }
    
    // Fallback to the last threshold (should be 0.0)
    return thresholds[thresholds.length - 1]?.scene || 'outcome_incorrect';
};

Game.prototype.proceedAfterQuestion = function() {
    // Check if this is the last question
    if (this.currentQuestionIndex < this.quizConfig.questions.length - 1) {
        // Move to next question
        this.currentQuestionIndex++;
        this.showCurrentQuestion();
    } else {
        // All questions answered, determine outcome based on thresholds
        const targetScene = this.getOutcomeScene();
        this.switchScene(targetScene);
    }
};

Game.prototype.continueFromInterstitial = function() {
    // Reset interstitial state
    this.isInInterstitial = false;
    this.lastQuestionCorrect = null;
    
    // Check if this was the last question
    if (this.currentQuestionIndex >= this.quizConfig.questions.length - 1) {
        // Go directly to outcome scene
        const targetScene = this.getOutcomeScene();
        this.switchScene(targetScene);
    } else {
        // Continue to next question
        this.isContinuingFromInterstitial = true;
        this.switchScene('quiz');
        setTimeout(() => {
            this.proceedAfterQuestion();
        }, this.gameConfig.game.fadeDuration + 50);
    }
};

Game.prototype.showCurrentQuestion = function() {
    if (!this.quizConfig) return;

    const questions = this.quizConfig.questions;
    questions.forEach((question, index) => {
        const element = document.getElementById(question.questionElement);
        if (element) {
            if (index === this.currentQuestionIndex) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        }
    });
};

Game.prototype.resetQuizState = function() {
    // Don't reset if we're continuing from an interstitial
    if (this.isContinuingFromInterstitial) {
        this.isContinuingFromInterstitial = false;
        return;
    }
    
    // Reset quiz state when starting fresh
    this.currentQuestionIndex = 0;
    this.selectedAnswers = {};
    this.questionClicks = {};
    this.isInInterstitial = false;
    this.lastQuestionCorrect = null;
    
    // Show the first question
    this.showCurrentQuestion();
};