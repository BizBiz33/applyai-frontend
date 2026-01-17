/* ============================================
   ApplyAI - Typeform Style JavaScript
   Navigation, Validation, Micro-interactions
   ============================================ */

// Configuration
const N8N_WEBHOOK_URL = 'https://bizbiz.app.n8n.cloud/webhook/user-registration';
const TOTAL_QUESTIONS = 15;

// State
let currentQuestion = 1;
let formData = {};
let isAnimating = false;

// DOM Elements
const form = document.getElementById('typeform');
const progressBar = document.getElementById('progressBar');
const currentQuestionEl = document.getElementById('currentQuestion');
const totalQuestionsEl = document.getElementById('totalQuestions');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    totalQuestionsEl.textContent = TOTAL_QUESTIONS;
    updateProgress();
    initKeyboardNavigation();
    initChoiceListeners();
    initInputListeners();
    initUploadZone();

    // Focus first input after animation
    setTimeout(() => {
        focusCurrentInput();
    }, 500);
});

// ============================================
// NAVIGATION
// ============================================

function nextQuestion() {
    if (isAnimating) return;

    // Validate current question
    if (!validateCurrentQuestion()) {
        return;
    }

    // Save current question data
    saveCurrentQuestionData();

    // Check if it's the last question
    if (currentQuestion >= TOTAL_QUESTIONS) {
        submitForm();
        return;
    }

    // Animate transition
    animateTransition('next');
}

function prevQuestion() {
    if (isAnimating || currentQuestion <= 1) return;

    animateTransition('prev');
}

function goToQuestion(questionNumber) {
    if (isAnimating || questionNumber < 1 || questionNumber > TOTAL_QUESTIONS) return;

    const direction = questionNumber > currentQuestion ? 'next' : 'prev';
    currentQuestion = questionNumber - (direction === 'next' ? 1 : -1);
    animateTransition(direction);
}

function animateTransition(direction) {
    isAnimating = true;

    const currentEl = document.querySelector(`.tf-question[data-question="${currentQuestion}"]`);
    const nextQuestionNum = direction === 'next' ? currentQuestion + 1 : currentQuestion - 1;
    const nextEl = document.querySelector(`.tf-question[data-question="${nextQuestionNum}"]`);

    if (!nextEl) {
        isAnimating = false;
        return;
    }

    // Add exit animation class
    currentEl.classList.add(direction === 'next' ? 'slide-up' : 'slide-down');

    // Wait for exit animation
    setTimeout(() => {
        currentEl.classList.remove('active', 'slide-up', 'slide-down');

        // Update current question
        currentQuestion = nextQuestionNum;

        // Show next question
        nextEl.classList.add('active');

        // Update UI
        updateProgress();
        updateNavButtons();

        // Focus input
        setTimeout(() => {
            focusCurrentInput();
            isAnimating = false;
        }, 100);

    }, 300);
}

function updateProgress() {
    const progress = (currentQuestion / TOTAL_QUESTIONS) * 100;
    progressBar.style.width = `${progress}%`;
    currentQuestionEl.textContent = currentQuestion;
}

function updateNavButtons() {
    prevBtn.disabled = currentQuestion <= 1;

    // Update next button text for last question
    if (currentQuestion >= TOTAL_QUESTIONS) {
        nextBtn.innerHTML = `
            <span>Terminer</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;
    } else {
        nextBtn.innerHTML = `
            <span>OK</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;
    }
}

function focusCurrentInput() {
    const currentEl = document.querySelector(`.tf-question[data-question="${currentQuestion}"]`);
    if (!currentEl) return;

    const input = currentEl.querySelector('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="number"]');
    if (input) {
        input.focus();
    }
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================

function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Enter key - go to next question
        if (e.key === 'Enter' && !e.shiftKey) {
            const activeElement = document.activeElement;
            if (activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                nextQuestion();
            }
        }

        // Escape key - go to previous question
        if (e.key === 'Escape') {
            prevQuestion();
        }

        // Letter keys for choices (A, B, C, etc.)
        if (/^[a-gA-G1-5]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
            const currentEl = document.querySelector(`.tf-question[data-question="${currentQuestion}"]`);
            const choices = currentEl?.querySelectorAll('.tf-choice');

            if (choices && choices.length > 0) {
                const activeElement = document.activeElement;
                // Only if not typing in an input
                if (activeElement.tagName !== 'INPUT' || activeElement.type === 'radio' || activeElement.type === 'checkbox') {
                    const key = e.key.toUpperCase();
                    const choice = currentEl.querySelector(`.tf-choice[data-key="${key}"]`);

                    if (choice) {
                        const input = choice.querySelector('input');
                        if (input.type === 'checkbox') {
                            input.checked = !input.checked;
                        } else {
                            input.checked = true;
                        }

                        // Trigger change event
                        input.dispatchEvent(new Event('change', { bubbles: true }));

                        // Add visual feedback
                        choice.classList.add('pressed');
                        setTimeout(() => choice.classList.remove('pressed'), 200);

                        // Auto-advance for radio buttons
                        if (input.type === 'radio') {
                            setTimeout(() => nextQuestion(), 400);
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// CHOICE LISTENERS
// ============================================

function initChoiceListeners() {
    document.querySelectorAll('.tf-choice input[type="radio"]').forEach(input => {
        input.addEventListener('change', () => {
            // Auto-advance after selection (with delay for visual feedback)
            setTimeout(() => {
                nextQuestion();
            }, 400);
        });
    });

    // For checkbox multi-select, don't auto-advance
    document.querySelectorAll('.tf-choice input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
            // Just visual feedback, no auto-advance
            updateCheckboxState(input);
        });
    });
}

function updateCheckboxState(input) {
    const choice = input.closest('.tf-choice');
    if (input.checked) {
        choice.classList.add('selected');
    } else {
        choice.classList.remove('selected');
    }
}

// ============================================
// INPUT LISTENERS
// ============================================

function initInputListeners() {
    document.querySelectorAll('.tf-input').forEach(input => {
        // Focus animation
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });

        // Remove error state on input
        input.addEventListener('input', () => {
            input.classList.remove('error');
        });

        // Enter key to advance
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nextQuestion();
            }
        });
    });
}

// ============================================
// UPLOAD ZONE
// ============================================

function initUploadZone() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('cvFile');

    if (!uploadZone || !fileInput) return;

    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

function handleFileUpload(file) {
    // For now, just show the file name
    // In production, you'd upload to a service and get a URL
    const uploadZone = document.getElementById('uploadZone');
    uploadZone.innerHTML = `
        <span class="tf-upload-icon">✓</span>
        <span class="tf-upload-text">${file.name}</span>
    `;
    uploadZone.classList.add('uploaded');

    // Store file reference
    formData.cvFile = file;
}

// ============================================
// VALIDATION
// ============================================

function validateCurrentQuestion() {
    const currentEl = document.querySelector(`.tf-question[data-question="${currentQuestion}"]`);
    if (!currentEl) return true;

    // Check required inputs
    const requiredInputs = currentEl.querySelectorAll('input[required], select[required]');
    let isValid = true;

    requiredInputs.forEach(input => {
        if (input.type === 'radio') {
            // Check if any radio in the group is selected
            const name = input.name;
            const checked = currentEl.querySelector(`input[name="${name}"]:checked`);
            if (!checked) {
                isValid = false;
                showError(input.closest('.tf-choices'));
            }
        } else if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
            shakeElement(input);
        }
    });

    // Special validation for email
    const emailInput = currentEl.querySelector('input[type="email"]');
    if (emailInput && emailInput.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            isValid = false;
            emailInput.classList.add('error');
            shakeElement(emailInput);
        }
    }

    // Validation for domains (multi-select) - at least one required
    if (currentQuestion === 13) {
        const checkedDomains = currentEl.querySelectorAll('input[name="domains"]:checked');
        if (checkedDomains.length === 0) {
            isValid = false;
            shakeElement(currentEl.querySelector('.tf-choices'));
        }
    }

    return isValid;
}

function showError(element) {
    if (!element) return;
    element.classList.add('error');
    setTimeout(() => element.classList.remove('error'), 1000);
}

function shakeElement(element) {
    if (!element) return;
    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow
    element.style.animation = 'shake 0.4s ease';
}

// ============================================
// DATA COLLECTION
// ============================================

function saveCurrentQuestionData() {
    const currentEl = document.querySelector(`.tf-question[data-question="${currentQuestion}"]`);
    if (!currentEl) return;

    // Get all inputs in current question
    const inputs = currentEl.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        if (input.type === 'radio') {
            if (input.checked) {
                formData[input.name] = input.value;
            }
        } else if (input.type === 'checkbox') {
            if (!formData[input.name]) {
                formData[input.name] = [];
            }
            if (input.checked && !formData[input.name].includes(input.value)) {
                formData[input.name].push(input.value);
            } else if (!input.checked) {
                formData[input.name] = formData[input.name].filter(v => v !== input.value);
            }
        } else if (input.value) {
            formData[input.name] = input.value;
        }
    });
}

function collectAllData() {
    // Make sure we have all data
    document.querySelectorAll('.tf-question').forEach(question => {
        const inputs = question.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'radio' && input.checked) {
                formData[input.name] = input.value;
            } else if (input.type === 'checkbox' && input.checked) {
                if (!formData[input.name]) formData[input.name] = [];
                if (!formData[input.name].includes(input.value)) {
                    formData[input.name].push(input.value);
                }
            } else if (input.type !== 'radio' && input.type !== 'checkbox' && input.value) {
                formData[input.name] = input.value;
            }
        });
    });

    // Structure data for API
    return {
        email: formData.email,
        emailProvider: formData.emailProvider,
        fullName: formData.fullName,
        phone: formData.phone || null,
        linkedinUrl: formData.linkedinUrl || null,
        portfolioUrl: null,

        currentEducation: {
            school: formData.currentSchool,
            program: formData.currentProgram,
            currentYear: formData.currentYear,
            programDuration: null,
            major: formData.currentMajor,
            expectedGraduation: parseInt(formData.expectedGraduation)
        },

        completedEducation: [],
        experiences: [],
        skills: [],
        languages: [],
        cvUrl: formData.cvUrl,

        jobPreferences: {
            contractType: formData.contractType,
            domains: formData.domains || [],
            location: formData.location,
            specificPosition: formData.specificPosition || null,
            salaryMin: null,
            seniority: null,
            flexibility: null
        }
    };
}

// ============================================
// FORM SUBMISSION
// ============================================

async function submitForm() {
    // Save last question data
    saveCurrentQuestionData();

    // Collect all data
    const data = collectAllData();

    console.log('Submitting data:', data);

    // Show loading state
    nextBtn.disabled = true;
    nextBtn.innerHTML = `
        <span class="tf-spinner-small"></span>
        <span>Envoi...</span>
    `;

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'inscription');
        }

        const result = await response.json();
        console.log('Response:', result);

        // Show success screen
        showSuccessScreen();

    } catch (error) {
        console.error('Error:', error);

        // Re-enable button
        nextBtn.disabled = false;
        nextBtn.innerHTML = `
            <span>Réessayer</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;

        // Show error (you could add a toast notification)
        alert('Une erreur est survenue. Veuillez réessayer.');
    }
}

function showSuccessScreen() {
    // Hide current question
    const currentEl = document.querySelector(`.tf-question[data-question="${currentQuestion}"]`);
    if (currentEl) {
        currentEl.classList.add('slide-up');
        setTimeout(() => {
            currentEl.classList.remove('active', 'slide-up');
        }, 300);
    }

    // Show success screen
    setTimeout(() => {
        const successEl = document.querySelector('.tf-success');
        if (successEl) {
            successEl.classList.add('active');
        }

        // Hide navigation
        document.querySelector('.tf-nav').style.display = 'none';

        // Update progress to 100%
        progressBar.style.width = '100%';
        currentQuestionEl.textContent = TOTAL_QUESTIONS;
    }, 300);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Add CSS for small spinner
const style = document.createElement('style');
style.textContent = `
    .tf-spinner-small {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    .tf-choice.pressed {
        transform: scale(0.98);
    }

    .tf-upload-zone.uploaded {
        border-style: solid;
        border-color: var(--green-500);
        background: rgba(34, 197, 94, 0.1);
    }

    .tf-upload-zone.uploaded .tf-upload-icon {
        color: var(--green-500);
    }

    .tf-choices.error .tf-choice {
        border-color: #ef4444;
    }
`;
document.head.appendChild(style);
