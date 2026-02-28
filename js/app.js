// ============================================
// QuoQuizizz - Complete Application Script
// All JavaScript functionality in one file
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    let questions = []; let tfAnswers = [null, null, null, null]; let draggedIcon = null;
    let studentQuiz = {}; let currentQuestionIndex = 0; let studentScore = 0;
    let studentTfAnswers = []; let studentDraggedIcon = null; let quizReviewData = [];
    let originalQuestions = []; 
    let isRedemptionMode = false;
    let autoAdvanceDelay = 1500;
    let studentAutoAdvancePref = '5000';
    
    // Timer mode variables
    let timerInterval = null;
    let timeRemaining = 0;
    let timerPaused = false;
    let quizStartTime = null;
    let questionStartTimes = [];
    
    // Touch/swipe support
    let touchStartX = 0;
    let touchStartY = 0;
    
    // Statistics
    let quizStatistics = {
        totalQuizzesTaken: 0,
        totalQuestionsAnswered: 0,
        correctAnswers: 0,
        averageScore: 0,
        averageTime: 0,
        categoryStats: {}
    };
    
    const get = (id) => document.getElementById(id);
    const homeView = get('homeView'), creatorView = get('creatorView'), studentView = get('studentView'), historyView = get('historyView'), libraryView = get('libraryView');
    const navHome = get('nav-home'), navCreate = get('nav-create'), navStudent = get('nav-student'), navHistory = get('nav-history'), navLibrary = get('nav-library');
    const homeCreateCard = get('home-create-card'), homeStudentCard = get('home-student-card');
    const headerTitleText = get('header-title-text');
    const themeSettingsBtn = get('theme-settings-btn');
    const questionText = get('questionText'), addMcqBtn = get('add-mcq-btn'), addTfBtn = get('add-tf-btn');
    const questionsListDiv = get('questionsList'), previewQuizBtn = get('preview-quiz-btn'), exportJsonBtn = get('export-json-btn');
    const quizUploadArea = get('quizUploadArea'), quizFileInput = get('quizFileInput');
    const resumeQuizPrompt = get('resumeQuizPrompt'), uploadBox = get('uploadBox'), resumeBtn = get('resumeBtn'), startNewBtn = get('startNewBtn');
    const quizPlayArea = get('quizPlayArea'), quizResultsArea = get('quizResultsArea');
    const quizTitle = get('quizTitle'), quizProgress = get('quizProgress'), quizQuestionText = get('quizQuestionText');
    const studentDragIconsTop = get('studentDragIconsTop'), studentDragIconsSide = get('studentDragIconsSide'), quizOptionsContainer = get('quizOptionsContainer');
    const quizFeedback = get('quizFeedback'), actionBtn = get('action-btn');
    const quizScore = get('quizScore'), quizPercentage = get('quizPercentage'), quizEvaluation = get('quizEvaluation'), quizReviewContainer = get('quizReviewContainer');
    const redemptionQuizBtn = get('redemptionQuizBtn'), restartQuizBtn = get('restart-quiz-btn'), loadAnotherQuizBtn = get('load-another-quiz-btn');
    const previewModal = get('previewModal'), modalCloseBtn = get('modal-close-btn'), previewContent = get('previewContent');
    const mcqModeDiv = get('multipleChoiceMode'), tfModeDiv = get('trueFalseMode');
    const studentAutoAdvanceSelect = get('studentAutoAdvanceSelect');
    const soundEnabledToggle = get('soundEnabledToggle');
    const shareLinkBtn = get('share-link-btn'), copyShareLinkBtn = get('copy-share-link-btn');
    const shareLinkOutput = get('shareLinkOutput'), shareLinkRow = get('share-link-row'), shareLinkHint = get('share-link-hint');
    const linkFileInput = get('linkFileInput');
    const fileShareLinkRow = get('file-share-link-row');
    const fileShareLinkOutput = get('fileShareLinkOutput');
    const copyFileShareLinkBtn = get('copy-file-share-link-btn');
    const fileShareLinkHint = get('file-share-link-hint');
    const quizIntroOverlay = get('quizIntroOverlay');
    const quizIntroTitle = get('quizIntroTitle');
    const quizIntroQuestionCount = get('quizIntroQuestionCount');
    const quizIntroShuffle = get('quizIntroShuffle');
    const quizIntroAutoAdvance = get('quizIntroAutoAdvance');
    const quizIntroExtra = get('quizIntroExtra');
    const quizIntroStartBtn = get('quizIntroStartBtn');
    const quizIntroCancelBtn = get('quizIntroCancelBtn');
    
    // New UI elements
    const quickDarkModeToggle = get('quick-dark-mode-toggle');
    const headerThemeIcon = get('header-theme-icon');
    const timerModeSetting = get('timerModeSetting');
    const timerDuration = get('timerDuration');
    const quizCategory = get('quizCategory');
    const quizTimer = get('quizTimer');
    const timerDisplay = get('timerDisplay');
    const timerPauseBtn = get('timerPauseBtn');
    const quizIntroTimer = get('quizIntroTimer');
    const quizIntroTimerText = get('quizIntroTimerText');

    const sanitizeInput = (input) => {
        if (typeof input !== 'string') return '';
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .trim();
    };

    const escapeHTML = (input) => sanitizeInput(String(input || ''));

    function normalizeQuestion(rawQuestion, fallbackId) {
        const base = rawQuestion || {};
        const question = {
            id: Number(base.id) || fallbackId || Date.now(),
            text: sanitizeInput(base.text || ''),
            type: base.type === 'truefalse' ? 'truefalse' : 'multiple',
            answers: [],
            correctAnswer: 0,
            answerStates: []
        };

        if (!Array.isArray(base.answers) || base.answers.length === 0) {
            throw new Error('Câu hỏi thiếu danh sách đáp án.');
        }

        question.answers = base.answers.map((ans) => sanitizeInput(ans)).filter(Boolean);
        if (question.type === 'multiple') {
            const correct = Number(base.correctAnswer);
            if (Number.isNaN(correct) || correct < 0 || correct >= question.answers.length) {
                throw new Error('Vị trí đáp án đúng không hợp lệ.');
            }
            question.correctAnswer = correct;
        } else {
            if (!Array.isArray(base.answerStates) || base.answerStates.length !== base.answers.length) {
                throw new Error('Câu hỏi Đúng/Sai thiếu trạng thái đáp án.');
            }
            question.answerStates = base.answerStates.map((state) => {
                if (state === true || state === false) return state;
                return null;
            });
        }

        return question;
    }

    function validateQuizPayload(rawQuiz) {
        if (!rawQuiz || typeof rawQuiz !== 'object') {
            throw new Error('Tệp không đúng định dạng quiz.');
        }

        const title = sanitizeInput(rawQuiz.title || 'Bài Quiz Mới');
        const settings = {
            shuffleQuestions: !!(rawQuiz.settings && rawQuiz.settings.shuffleQuestions),
            shuffleAnswers: !!(rawQuiz.settings && rawQuiz.settings.shuffleAnswers),
            autoAdvance: !!(rawQuiz.settings && rawQuiz.settings.autoAdvance),
            soundEnabled: rawQuiz.settings && 'soundEnabled' in rawQuiz.settings ? !!rawQuiz.settings.soundEnabled : true
        };

        if (!Array.isArray(rawQuiz.questions) || rawQuiz.questions.length === 0) {
            throw new Error('Tệp quiz không có câu hỏi nào.');
        }

        const normalizedQuestions = rawQuiz.questions.map((q, idx) => normalizeQuestion(q, Date.now() + idx));

        return { title, settings, questions: normalizedQuestions };
    }

    function cloneSafe(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function getCurrentSettings() {
        const shuffleQEl = get('shuffleQuestionsSetting');
        const shuffleAEl = get('shuffleAnswersSetting');
        const autoAdvanceEl = get('autoAdvanceSetting');
        const soundEnabledEl = get('soundEnabledSetting');
        return {
            shuffleQuestions: shuffleQEl ? shuffleQEl.checked : false,
            shuffleAnswers: shuffleAEl ? shuffleAEl.checked : false,
            autoAdvance: autoAdvanceEl ? autoAdvanceEl.checked : false,
            soundEnabled: soundEnabledEl ? soundEnabledEl.checked : true
        };
    }

    function buildQuizPayload(titleInput) {
        const quizTitle = sanitizeInput(titleInput || 'Bài Quiz Mới');
        const category = quizCategory ? quizCategory.value : '';
        const timerEnabled = timerModeSetting ? timerModeSetting.checked : false;
        const timerMinutes = timerDuration ? parseInt(timerDuration.value) || 10 : 10;
        
        return {
            title: quizTitle,
            category: category,
            settings: {
                shuffleQuestions: get('shuffleQuestionsSetting').checked,
                shuffleAnswers: get('shuffleAnswersSetting').checked,
                autoAdvance: get('autoAdvanceSetting').checked,
                soundEnabled: get('soundEnabledSetting') ? get('soundEnabledSetting').checked : true,
                timerEnabled: timerEnabled,
                timerDuration: timerMinutes
            },
            questions: cloneSafe(questions)
        };
    }
    
    // ===== NEW FEATURES =====
    
    // Timer Functions
    function startTimer(minutes) {
        if (timerInterval) clearInterval(timerInterval);
        timeRemaining = minutes * 60;
        timerPaused = false;
        updateTimerDisplay();
        if (quizTimer) quizTimer.classList.remove('hidden');
        
        timerInterval = setInterval(() => {
            if (!timerPaused) {
                timeRemaining--;
                updateTimerDisplay();
                
                if (timeRemaining <= 60 && timeRemaining > 0) {
                    if (timerDisplay) timerDisplay.classList.add('warning');
                }
                if (timeRemaining <= 10 && timeRemaining > 0) {
                    if (timerDisplay) {
                        timerDisplay.classList.remove('warning');
                        timerDisplay.classList.add('danger');
                    }
                }
                
                if (timeRemaining <= 0) {
                    clearInterval(timerInterval);
                    finishQuizDueToTimeout();
                }
            }
        }, 1000);
    }
    
    function updateTimerDisplay() {
        if (!timerDisplay) return;
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    function finishQuizDueToTimeout() {
        alert('⏱️ Hết giờ! Quiz sẽ được nộp tự động.');
        finishQuiz();
    }
    
    function pauseResumeTimer() {
        timerPaused = !timerPaused;
        if (timerPauseBtn) {
            timerPauseBtn.textContent = timerPaused ? '▶️' : '⏸️';
            timerPauseBtn.title = timerPaused ? 'Tiếp tục timer' : 'Tạm dừng timer';
        }
    }
    
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (quizTimer) quizTimer.classList.add('hidden');
        if (timerDisplay) {
            timerDisplay.classList.remove('warning', 'danger');
        }
    }
    
    // Confetti Animation
    function createConfetti() {
        const colors = ['#FF6B35', '#DC143C', '#FFD700', '#28a745', '#8854C0', '#F037A5'];
        const confettiCount = 100;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 3000);
            }, i * 30);
        }
    }
    
    // Loading Overlay
    function showLoadingOverlay(text = 'Đang tải...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${text}</div>
        `;
        document.body.appendChild(overlay);
    }
    
    function hideLoadingOverlay() {
        const overlay = get('loadingOverlay');
        if (overlay) overlay.remove();
    }
    
    // Statistics Functions
    function loadStatistics() {
        const stored = localStorage.getItem('quizStatistics');
        if (stored) {
            try {
                quizStatistics = JSON.parse(stored);
            } catch (e) {
                console.error('Error loading statistics:', e);
            }
        }
    }
    
    function saveStatistics() {
        localStorage.setItem('quizStatistics', JSON.stringify(quizStatistics));
    }
    
    function updateStatistics(score, total, category, timeSpent) {
        quizStatistics.totalQuizzesTaken++;
        quizStatistics.totalQuestionsAnswered += total;
        quizStatistics.correctAnswers += score;
        
        const percentage = (score / total) * 100;
        quizStatistics.averageScore = ((quizStatistics.averageScore * (quizStatistics.totalQuizzesTaken - 1)) + percentage) / quizStatistics.totalQuizzesTaken;
        
        if (timeSpent) {
            quizStatistics.averageTime = ((quizStatistics.averageTime * (quizStatistics.totalQuizzesTaken - 1)) + timeSpent) / quizStatistics.totalQuizzesTaken;
        }
        
        if (category) {
            if (!quizStatistics.categoryStats[category]) {
                quizStatistics.categoryStats[category] = { total: 0, correct: 0, attempts: 0 };
            }
            quizStatistics.categoryStats[category].attempts++;
            quizStatistics.categoryStats[category].total += total;
            quizStatistics.categoryStats[category].correct += score;
        }
        
        saveStatistics();
    }
    
    // Keyboard Shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }
            
            // Space or Enter: Next question / Submit answer
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (actionBtn && !actionBtn.classList.contains('hidden')) {
                    actionBtn.click();
                }
            }
            
            // Number keys 1-4: Select MCQ answer
            if (['1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault();
                // Check if quiz is active and it's a multiple choice question
                if (!quizPlayArea || quizPlayArea.classList.contains('hidden')) return;
                
                const questionType = studentQuiz.questions && studentQuiz.questions[currentQuestionIndex] ? studentQuiz.questions[currentQuestionIndex].type : null;
                if (questionType === 'multiple' && quizOptionsContainer) {
                    const options = quizOptionsContainer.querySelectorAll('.quiz-option-btn');
                    const index = parseInt(e.key) - 1;
                    if (options[index] && !options[index].disabled) {
                        options[index].click();
                    }
                }
            }
            
            // P: Pause/Resume timer
            if (e.key === 'p' || e.key === 'P') {
                if (timerPauseBtn && quizTimer && !quizTimer.classList.contains('hidden')) {
                    e.preventDefault();
                    pauseResumeTimer();
                }
            }
            
            // H: Go to home
            if (e.key === 'h' || e.key === 'H') {
                switchView('home');
            }
        });
    }
    
    // Swipe Gesture Support
    function setupSwipeGestures() {
        if (quizPlayArea) {
            quizPlayArea.addEventListener('touchstart', handleTouchStart, { passive: true });
            quizPlayArea.addEventListener('touchmove', handleTouchMove, { passive: true });
            quizPlayArea.addEventListener('touchend', handleTouchEnd, { passive: true });
        }
    }
    
    function handleTouchStart(e) {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }
    
    function handleTouchMove(e) {
        if (!touchStartX || !touchStartY) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        
        // Detect horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                // Swipe right - maybe previous question in the future
            } else {
                // Swipe left - next question
                if (actionBtn && !actionBtn.classList.contains('hidden')) {
                    showSwipeIndicator('⬅️ Next Question');
                }
            }
        }
    }
    
    function handleTouchEnd(e) {
        if (!touchStartX || !touchStartY) return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        
        if (Math.abs(deltaX) > 100) {
            if (deltaX < 0 && actionBtn && !actionBtn.classList.contains('hidden')) {
                // Swipe left confirmed - next question
                setTimeout(() => actionBtn.click(), 100);
            }
        }
        
        touchStartX = 0;
        touchStartY = 0;
    }
    
    function showSwipeIndicator(text) {
        const existing = document.querySelector('.swipe-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.className = 'swipe-indicator';
        indicator.textContent = text;
        document.body.appendChild(indicator);
        
        setTimeout(() => indicator.remove(), 2000);
    }
    
    // Quick Dark Mode Toggle
    function toggleQuickDarkMode() {
        const currentTheme = localStorage.getItem('quizTheme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('quizTheme', newTheme);
        applyTheme(newTheme);
        updateThemeToggle();
        updateHeaderThemeIcon();
    }
    
    function updateHeaderThemeIcon() {
        const currentTheme = localStorage.getItem('quizTheme') || 'light';
        if (headerThemeIcon) {
            headerThemeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        }
    }
    
    // Timer setting toggle visibility
    function toggleTimerDurationVisibility() {
        const timerDurationSetting = document.querySelector('.timer-duration-setting');
        if (timerDurationSetting) {
            if (timerModeSetting && timerModeSetting.checked) {
                timerDurationSetting.classList.remove('hidden');
            } else {
                timerDurationSetting.classList.add('hidden');
            }
        }
    }

    const safeBase64Encode = (str) => {
        try {
            return btoa(unescape(encodeURIComponent(str)));
        } catch (e) {
            throw new Error('Không thể mã hóa dữ liệu (UTF-8).');
        }
    };

    const safeBase64Decode = (b64) => {
        try {
            return decodeURIComponent(escape(atob(b64)));
        } catch (e) {
            throw new Error('Link quiz bị hỏng hoặc đã chỉnh sửa.');
        }
    };

    function encodeQuizPayloadToUrl(payload) {
        const apiUrl = 'https://dpaste.com/api/';
        
        if (shareLinkHint) shareLinkHint.textContent = '⏳ Đang tạo link ngắn...';
        if (fileShareLinkHint) fileShareLinkHint.textContent = '⏳ Đang tạo link ngắn...';
        
        const formData = new FormData();
        formData.append('content', JSON.stringify(payload));
        formData.append('syntax', 'json');
        formData.append('expiry_days', 365);
        
        return fetch(apiUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) throw new Error('Không thể tạo link');
            return response.text();
        })
        .then(pasteUrl => {
            const pasteId = pasteUrl.trim().split('/').filter(Boolean).pop();
            const baseUrl = `${window.location.origin}${window.location.pathname}`;
            return `${baseUrl}#id=${pasteId}`;
        })
        .catch(error => {
            console.error('Lỗi tạo link:', error);
            const jsonStr = JSON.stringify(payload);
            const compressed = LZString.compressToEncodedURIComponent(jsonStr);
            const baseUrl = `${window.location.origin}${window.location.pathname}`;
            return `${baseUrl}#quiz=${compressed}`;
        });
    }

    function shuffleArray(array) { 
        for (let i = array.length - 1; i > 0; i--) { 
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; 
        } 
    }
    
    window.toggleQuizMenu = function() {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            if (confirm('Bạn có muốn thoát khỏi bài quiz?\n\nTiến độ của bạn sẽ được lưu lại.')) {
                if (studentQuiz && Object.keys(studentQuiz).length > 0 && currentQuestionIndex > 0) {
                    saveToHistory(false);
                }
                switchView('student');
                quizPlayArea.classList.add('hidden');
                quizUploadArea.classList.remove('hidden');
                document.body.classList.remove('quiz-active');
            }
        } else {
            alert('Menu chỉ khả dụng trên mobile');
        }
    };
    
    // THEME SWITCHING LOGIC
    function updateThemeToggle() {
        const currentTheme = localStorage.getItem('quizTheme') || 'light';
        const toggleIcon = get('toggleIcon');
        const toggleText = get('toggleText');
        const mobileThemeToggle = get('mobileThemeToggle');
        const soundPref = studentQuiz && studentQuiz.settings && studentQuiz.settings.soundEnabled === false ? 'Tắt' : 'Bật';
        
        if (toggleIcon) {
            toggleIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        }
        if (toggleText) {
            toggleText.textContent = currentTheme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối';
        }
        if (mobileThemeToggle) {
            mobileThemeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        }
        if (soundEnabledToggle) {
            soundEnabledToggle.checked = soundPref === 'Bật';
        }
    }
    
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        updateThemeToggle();
    }

    function applyColorTheme(themeName) {
        document.body.classList.remove('tet-theme', 'christmas-theme');
        
        if (themeName !== 'christmas') {
            removeSnowfall();
        }
        
        if (themeName === 'tet') {
            document.body.classList.add('tet-theme');
        } else if (themeName === 'christmas') {
            document.body.classList.add('christmas-theme');
            if (document.body.classList.contains('quiz-active')) {
                createSnowfall();
            }
        }
        
        localStorage.setItem('colorTheme', themeName);
        updateThemeOptions();
    }
    
    function updateThemeOptions() {
        const currentColorTheme = localStorage.getItem('colorTheme') || 'christmas';
        document.querySelectorAll('.theme-option').forEach(option => {
            if (option.getAttribute('data-theme') === currentColorTheme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    function currentSoundEnabled() {
        return !(studentQuiz && studentQuiz.settings && studentQuiz.settings.soundEnabled === false);
    }

    function syncSoundToggle() {
        if (soundEnabledToggle) {
            soundEnabledToggle.checked = currentSoundEnabled();
        }
    }

    const savedColorTheme = localStorage.getItem('colorTheme') || 'christmas';
    applyColorTheme(savedColorTheme);

    const themeModal = get('themeModal');
    const themeModalClose = get('themeModalClose');
    const themeModalToggleBtn = get('themeModalToggle');

    if (themeSettingsBtn) {
        themeSettingsBtn.addEventListener('click', () => {
            if (themeModal) {
                themeModal.classList.remove('hidden');
                updateThemeOptions();
                updateThemeToggle();
                syncSoundToggle();
            }
        });
    }

    if (soundEnabledToggle) {
        soundEnabledToggle.addEventListener('change', () => {
            const enabled = soundEnabledToggle.checked;
            if (!studentQuiz.settings) studentQuiz.settings = {};
            studentQuiz.settings.soundEnabled = enabled;
            saveProgress();
        });
    }

    if (themeModalClose) {
        themeModalClose.addEventListener('click', () => {
            themeModal.classList.add('hidden');
        });
    }

    if (themeModal) {
        themeModal.addEventListener('click', (e) => {
            if (e.target === themeModal) {
                themeModal.classList.add('hidden');
            }
        });
    }

    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
            const themeName = option.getAttribute('data-theme');
            applyColorTheme(themeName);
        });
    });

    if (themeModalToggleBtn) {
        themeModalToggleBtn.addEventListener('click', () => {
            const currentTheme = localStorage.getItem('quizTheme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('quizTheme', newTheme);
            applyTheme(newTheme);
        });
    }

    const quizSettingsBtn = get('quizSettingsBtn');
    const quizSettingsModal = get('quizSettingsModal');
    const quizSettingsClose = get('quizSettingsClose');
    const quizThemeSelect = get('quizThemeSelect');
    const mobileSettingsBtn = get('mobileSettingsBtn');

    if (quizSettingsBtn) {
        quizSettingsBtn.addEventListener('click', () => {
            quizSettingsModal.classList.remove('hidden');
        });
    }

    if (mobileSettingsBtn) {
        mobileSettingsBtn.addEventListener('click', () => {
            if (themeModal) {
                themeModal.classList.remove('hidden');
                updateThemeOptions();
                updateThemeToggle();
            }
        });
    }

    if (quizSettingsClose) {
        quizSettingsClose.addEventListener('click', () => {
            quizSettingsModal.classList.add('hidden');
        });
    }

    if (quizSettingsModal) {
        quizSettingsModal.addEventListener('click', (e) => {
            if (e.target === quizSettingsModal) {
                quizSettingsModal.classList.add('hidden');
            }
        });
    }

    if (quizThemeSelect) {
        quizThemeSelect.addEventListener('change', (e) => {
            applyColorTheme(e.target.value);
        });
    }

    // PROGRESS SAVING
    function saveProgress() { 
        if (!studentQuiz || Object.keys(studentQuiz).length === 0 || isRedemptionMode) return;
        const progress = { studentQuiz, originalQuestions, currentQuestionIndex, studentScore, quizReviewData, timestamp: new Date().getTime() }; 
        localStorage.setItem('quizMasterProgress', JSON.stringify(progress));
    }
    
    function loadProgress() { 
        try { 
            const savedJSON = localStorage.getItem('quizMasterProgress');
            if (!savedJSON) return; 
            const savedData = JSON.parse(savedJSON); 
            if (!savedData.studentQuiz || !savedData.studentQuiz.questions || !savedData.originalQuestions) { 
                throw new Error("Dữ liệu lưu không hợp lệ.");
            } 
            const validatedQuiz = validateQuizPayload(savedData.studentQuiz);
            const validatedOriginalQuiz = validateQuizPayload({
                title: validatedQuiz.title,
                settings: validatedQuiz.settings,
                questions: savedData.originalQuestions
            });

            studentQuiz = validatedQuiz; 
            originalQuestions = cloneSafe(validatedOriginalQuiz.questions); 
            currentQuestionIndex = Number(savedData.currentQuestionIndex) || 0; 
            studentScore = Number(savedData.studentScore) || 0; 
            quizReviewData = Array.isArray(savedData.quizReviewData) ? savedData.quizReviewData : []; 
            quizUploadArea.classList.add('hidden'); 
            quizResultsArea.classList.add('hidden'); 
            quizPlayArea.classList.remove('hidden');
            document.body.classList.add('quiz-active');
            quizPlayArea.classList.add('winter-theme');
            quizTitle.textContent = studentQuiz.title; 
            renderStudentQuestion(); 
        } catch (error) { 
            console.error("Lỗi khi tải tiến trình:", error);
            alert("Không thể tải bài làm dang dở do dữ liệu bị lỗi. Vui lòng bắt đầu bài mới."); 
            clearProgress(); 
            checkForSavedProgress();
        } 
    }
    
    function clearProgress() { localStorage.removeItem('quizMasterProgress'); }
    
    function checkForSavedProgress() { 
        const savedData = localStorage.getItem('quizMasterProgress');
        if (savedData) { 
            uploadBox.classList.add('hidden'); 
            resumeQuizPrompt.classList.remove('hidden'); 
        } else { 
            uploadBox.classList.remove('hidden'); 
            resumeQuizPrompt.classList.add('hidden');
        } 
    }
    
    // VIEW SWITCHING
    function switchView(view) {
        homeView.classList.add('hidden');
        creatorView.classList.add('hidden');
        studentView.classList.add('hidden');
        historyView.classList.add('hidden');
        const libraryView = get('libraryView');
        if (libraryView) libraryView.classList.add('hidden');
        
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        
        if (view === 'home') {
            homeView.classList.remove('hidden');
            navHome.classList.add('active');
            headerTitleText.textContent = 'Chào mừng đến Quiz Master! 👋';
        } else if (view === 'creator') {
            creatorView.classList.remove('hidden');
            navCreate.classList.add('active');
            headerTitleText.textContent = 'Tạo Quiz Mới ✏️';
            showQuizTypeSelector();
        } else if (view === 'library') {
            if (libraryView) libraryView.classList.remove('hidden');
            const navLibrary = get('nav-library');
            if (navLibrary) navLibrary.classList.add('active');
            headerTitleText.textContent = 'Thư viện Quiz 📚';
            loadLibrary();
        } else if (view === 'student') {
            studentView.classList.remove('hidden');
            navStudent.classList.add('active');
            headerTitleText.textContent = 'Làm Bài Quiz 👨‍🎓';
            checkForSavedProgress();
        } else if (view === 'history') {
            historyView.classList.remove('hidden');
            navHistory.classList.add('active');
            headerTitleText.textContent = 'Lịch sử làm bài 📖';
            displayHistory('all');
        }
    }
    
    navHome.addEventListener('click', () => switchView('home'));
    navCreate.addEventListener('click', () => switchView('creator'));
    navStudent.addEventListener('click', () => switchView('student'));
    navHistory.addEventListener('click', () => switchView('history'));
    homeCreateCard.addEventListener('click', () => switchView('creator'));
    homeStudentCard.addEventListener('click', () => switchView('student'));
    
    const brandBadge = get('brand-badge');
    if (brandBadge) brandBadge.addEventListener('click', () => switchView('home'));
    
    const brandBadgeQuiz = get('brand-badge-quiz');
    if (brandBadgeQuiz) {
        brandBadgeQuiz.addEventListener('click', () => {
            if (confirm('Bạn có muốn thoát khỏi bài quiz?\n\nTiến độ của bạn sẽ được lưu lại.')) {
                if (studentQuiz && Object.keys(studentQuiz).length > 0 && currentQuestionIndex > 0) {
                    saveToHistory(false);
                }
                switchView('student');
                quizPlayArea.classList.add('hidden');
                quizUploadArea.classList.remove('hidden');
                document.body.classList.remove('quiz-active');
            }
        });
    }
    
    const homeHistoryCard = get('home-history-card');
    if (homeHistoryCard) homeHistoryCard.addEventListener('click', () => switchView('history'));
    
    updateThemeToggle();
    updateThemeOptions();
    
    quizFileInput.addEventListener('change', (e) => {
        clearProgress();
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                const validatedQuiz = validateQuizPayload(parsed);
                handleLoadedQuiz(validatedQuiz);
            } catch (err) {
                alert('Lỗi: Tệp quiz không hợp lệ hoặc đã bị chỉnh sửa. Vui lòng kiểm tra lại.');
                console.error(err);
            }
        };
        reader.readAsText(file);
    });

    function prepareStudentQuizPlayArea() {
        homeView.classList.add('hidden');
        creatorView.classList.add('hidden');
        historyView.classList.add('hidden');
        studentView.classList.remove('hidden');
        quizUploadArea.classList.add('hidden');
        quizResultsArea.classList.add('hidden');
        quizPlayArea.classList.remove('hidden');
        document.body.classList.add('quiz-active');
        quizPlayArea.classList.add('winter-theme');
        quizTitle.textContent = studentQuiz.title || 'Bài làm';
        updateScoreDisplay();
        
        if (document.body.classList.contains('christmas-theme')) {
            createSnowfall();
        }
    }

    function createSnowfall() {
        const existingSnowflakes = quizPlayArea.querySelectorAll('.snowflake');
        existingSnowflakes.forEach(flake => flake.remove());
        
        for (let i = 0; i < 30; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.textContent = '❄';
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
            snowflake.style.animationDelay = (Math.random() * 5) + 's';
            snowflake.style.fontSize = (Math.random() * 10 + 15) + 'px';
            snowflake.style.opacity = Math.random() * 0.7 + 0.3;
            quizPlayArea.appendChild(snowflake);
        }
    }

    function removeSnowfall() {
        const allSnowflakes = document.querySelectorAll('.snowflake');
        allSnowflakes.forEach(flake => flake.remove());
    }

    function updateQuizIntroCard() {
        if (!quizIntroOverlay) return;
        const totalQuestions = (studentQuiz.questions || []).length;
        const settings = studentQuiz.settings || {};
        const shuffleQuestionsLabel = settings.shuffleQuestions ? 'Có' : 'Không';
        const shuffleAnswersLabel = settings.shuffleAnswers ? 'Có' : 'Không';
        const autoAdvanceLabel = settings.autoAdvance ? 'Tự động chuyển câu' : 'Thủ công (nhấn Next)';
        const soundLabel = settings.soundEnabled === false ? 'Tắt' : 'Bật';

        if (quizIntroTitle) quizIntroTitle.textContent = studentQuiz.title || 'Bài làm sẵn sàng';
        if (quizIntroQuestionCount) quizIntroQuestionCount.textContent = `${totalQuestions} câu hỏi`;
        if (quizIntroShuffle) quizIntroShuffle.textContent = `Xáo trộn: Câu hỏi ${shuffleQuestionsLabel}, đáp án ${shuffleAnswersLabel}`;
        if (quizIntroAutoAdvance) quizIntroAutoAdvance.textContent = `Chế độ chuyển câu: ${autoAdvanceLabel}`;
        
        // Show timer info if enabled
        if (settings.timerEnabled && quizIntroTimer && quizIntroTimerText) {
            quizIntroTimer.classList.remove('hidden');
            const timerMinutes = settings.timerDuration || 10;
            quizIntroTimerText.textContent = `Giới hạn thời gian: ${timerMinutes} phút`;
        } else if (quizIntroTimer) {
            quizIntroTimer.classList.add('hidden');
        }
        
        // Show category if available
        let extraInfo = `Âm thanh phản hồi: ${soundLabel}.`;
        if (studentQuiz.category) {
            extraInfo += ` 📂 Danh mục: ${studentQuiz.category}.`;
        }
        extraInfo += ` ℹ️ Bài có ${totalQuestions} câu. Điểm sẽ được tính dựa trên đáp án chính xác. Kiểm tra lại link nếu thông tin chưa đúng.`;
        
        if (quizIntroExtra) quizIntroExtra.textContent = extraInfo;
    }

    function showQuizIntroCard() {
        updateQuizIntroCard();
        if (quizIntroOverlay) quizIntroOverlay.classList.remove('hidden');
    }

    function hideQuizIntroCard() {
        if (quizIntroOverlay) quizIntroOverlay.classList.add('hidden');
    }

    function returnToUploadArea() {
        hideQuizIntroCard();
        quizPlayArea.classList.add('hidden');
        document.body.classList.remove('quiz-active');
        quizUploadArea.classList.remove('hidden');
        const quizLinkInput = get('quizLinkInput');
        if (quizLinkInput) quizLinkInput.focus();
    }

    function handleLoadedQuiz(validatedQuiz, { showIntroCard = false } = {}) {
        studentQuiz = validatedQuiz;
        originalQuestions = cloneSafe(validatedQuiz.questions);
        currentQuestionIndex = 0;
        studentScore = 0;
        quizReviewData = [];
        isRedemptionMode = false;
        questions = [];
        clearProgress();

        prepareStudentQuizPlayArea();
        if (showIntroCard) {
            showQuizIntroCard();
            return;
        }
        startQuiz();
    }

    async function loadQuizFromHash(hash) {
        if (!hash || (!hash.includes('quiz=') && !hash.includes('id='))) {
            throw new Error('Link không chứa dữ liệu quiz hợp lệ (#quiz= hoặc #id=).');
        }

        if (hash.includes('#id=')) {
            const pasteId = hash.split('#id=')[1];
            const apiUrl = `https://dpaste.com/${pasteId}.txt`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Quiz không tìm thấy hoặc link đã hết hạn.');
            const text = await response.text();
            const parsed = JSON.parse(text);
            return validateQuizPayload(parsed);
        }

        const quizParam = hash.split('quiz=')[1];
        const jsonStr = LZString.decompressFromEncodedURIComponent(quizParam);
        if (!jsonStr) {
            throw new Error('Không thể giải nén dữ liệu quiz từ link.');
        }
        const parsed = JSON.parse(jsonStr);
        return validateQuizPayload(parsed);
    }

    async function loadQuizFromShareLink(rawLink) {
        let normalizedLink = rawLink.trim();
        if (!normalizedLink.startsWith('http://') && !normalizedLink.startsWith('https://') && !normalizedLink.startsWith('#')) {
            normalizedLink = 'https://' + normalizedLink;
        }

        let hashPart = '';
        if (normalizedLink.startsWith('#')) {
            hashPart = normalizedLink;
        } else {
            try {
                const urlObj = new URL(normalizedLink);
                hashPart = urlObj.hash;
            } catch (err) {
                throw new Error('Link không hợp lệ. Vui lòng kiểm tra lại.');
            }
        }

        if (!hashPart) {
            throw new Error('Link chưa chứa phần #id hoặc #quiz của bài làm.');
        }

        return loadQuizFromHash(hashPart);
    }

    if (quizIntroStartBtn) {
        quizIntroStartBtn.addEventListener('click', () => {
            hideQuizIntroCard();
            startQuiz();
        });
    }

    if (quizIntroCancelBtn) {
        quizIntroCancelBtn.addEventListener('click', () => {
            returnToUploadArea();
        });
    }

    const quizLinkInput = get('quizLinkInput');
    const loadQuizFromLinkBtn = get('loadQuizFromLinkBtn');
    const linkErrorMsg = get('linkErrorMsg');
    const linkLoadingContainer = get('linkLoadingContainer');

    if (loadQuizFromLinkBtn) {
        loadQuizFromLinkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const linkUrl = quizLinkInput.value.trim();
            
            if (!linkUrl) {
                linkErrorMsg.textContent = '❌ Vui lòng nhập hoặc dán link quiz.';
                linkErrorMsg.style.display = 'block';
                linkLoadingContainer.classList.remove('show');
                return;
            }

            linkErrorMsg.style.display = 'none';
            linkLoadingContainer.classList.add('show');
            
            loadQuizFromLinkBtn.disabled = true;
            loadQuizFromLinkBtn.textContent = '⏳ Đang tải...';
            loadQuizFromShareLink(linkUrl)
                .then(validatedQuiz => {
                    linkLoadingContainer.classList.remove('show');
                    handleLoadedQuiz(validatedQuiz, { showIntroCard: true });
                    quizLinkInput.value = '';
                })
                .catch(err => {
                    linkLoadingContainer.classList.remove('show');
                    let errorMessage = '❌ Lỗi: ' + err.message;
                    
                    if (err.message.includes('Quiz không tìm thấy') || err.message.includes('hết hạn')) {
                        errorMessage += ' Link có thể đã hết hạn hoặc bị xóa.';
                    } else if (err.message.includes('không hợp lệ')) {
                        errorMessage += ' Vui lòng kiểm tra lại định dạng link.';
                    } else if (err.message.includes('Không thể giải nén')) {
                        errorMessage += ' Dữ liệu link bị lỗi hoặc không đúng định dạng.';
                    } else if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
                        errorMessage = '❌ Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
                    }
                    
                    linkErrorMsg.textContent = errorMessage;
                    linkErrorMsg.style.display = 'block';
                })
                .finally(() => {
                    loadQuizFromLinkBtn.disabled = false;
                    loadQuizFromLinkBtn.textContent = '🔗 Tải Quiz';
                });
        });
    }

    if (quizLinkInput) {
        quizLinkInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loadQuizFromLinkBtn.click();
            }
        });
    }

    function startQuiz() {
        hideQuizIntroCard();
        isRedemptionMode = false;
        if (!originalQuestions || originalQuestions.length === 0) {
            console.error("Lỗi: Không có câu hỏi gốc để bắt đầu quiz.");
            return;
        }
        studentQuiz.questions = JSON.parse(JSON.stringify(originalQuestions));
        currentQuestionIndex = 0;
        studentScore = 0;
        quizReviewData = [];
        quizStartTime = Date.now(); // Record start time for statistics
        questionStartTimes = [];
        
        if (studentQuiz.settings && studentQuiz.settings.shuffleQuestions) { shuffleArray(studentQuiz.questions); }
        
        // Start timer if enabled
        if (studentQuiz.settings && studentQuiz.settings.timerEnabled) {
            const timerMinutes = studentQuiz.settings.timerDuration || 10;
            startTimer(timerMinutes);
        }
        
        saveProgress();
        prepareStudentQuizPlayArea();
        renderStudentQuestion();
    }

    function updateScoreDisplay() {
        const scoreDisplay = document.getElementById('quizScoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.textContent = studentScore;
        }
    }

    function startRedemptionQuiz(redemptionQuestions) {
        isRedemptionMode = true;
        studentQuiz.questions = redemptionQuestions;
        currentQuestionIndex = 0;
        quizUploadArea.classList.add('hidden');
        quizResultsArea.classList.add('hidden');
        quizPlayArea.classList.remove('hidden');
        document.body.classList.add('quiz-active');
        quizPlayArea.classList.add('winter-theme');
        quizTitle.textContent = "Vòng gỡ điểm";
        renderStudentQuestion();
    }

    function finishQuiz() {
        stopTimer(); // Stop timer when quiz finishes
        
        // Calculate time spent
        let timeSpent = 0;
        if (quizStartTime) {
            timeSpent = Math.floor((Date.now() - quizStartTime) / 1000); // in seconds
        }
        
        // Update statistics
        const category = studentQuiz.category || 'Uncategorized';
        const totalQuestions = originalQuestions.length;
        updateStatistics(studentScore, totalQuestions, category, timeSpent);
        
        if (isRedemptionMode) {
            showFinalResults(true);
        } else {
            showFinalResults(false);
        }
    }

    function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < studentQuiz.questions.length) {
            if (!isRedemptionMode) saveProgress();
            renderStudentQuestion();
        } else {
            finishQuiz();
        }
    }

    function showFinalResults(isAfterRedemption) {
        if (!isAfterRedemption) {
            saveToHistory(true);
        }
        clearProgress();
        quizPlayArea.classList.add('hidden');
        document.body.classList.remove('quiz-active');
        quizResultsArea.classList.remove('hidden');
        
        const incorrectQuestions = quizReviewData.filter(r => !r.isCorrect);
        if (!isAfterRedemption && incorrectQuestions.length > 0) {
            redemptionQuizBtn.classList.remove('hidden');
        } else {
            redemptionQuizBtn.classList.add('hidden');
        }

        const totalQuestions = originalQuestions.length;
        const percentage = totalQuestions > 0 ? Math.round((studentScore / totalQuestions) * 100) : 0;
        quizScore.textContent = `Điểm của bạn: ${studentScore} / ${totalQuestions}`;
        quizPercentage.textContent = `Tỷ lệ đúng: ${percentage}%`;

        if (isAfterRedemption) {
            quizEvaluation.textContent = "Đã hoàn thành Vòng gỡ điểm. Đây là kết quả cuối cùng của bạn.";
        } else {
            if (percentage === 100) { 
                quizEvaluation.textContent = "Kết quả: Hoàn hảo! 🎉"; 
                createConfetti(); // Confetti for perfect score!
            }
            else if (percentage >= 80) { 
                quizEvaluation.textContent = "Kết quả: Xuất sắc! ✨"; 
                createConfetti(); // Confetti for excellent score!
            } 
            else if (percentage >= 50) { quizEvaluation.textContent = "Kết quả: Khá tốt! 👍"; }
            else { quizEvaluation.textContent = "Kết quả: Cần cố gắng thêm! 📖"; }
        }
        
        let reviewHtml = '<h3>🔍 Xem lại bài làm</h3>';
        originalQuestions.forEach((q, index) => {
            const review = quizReviewData.find(r => r.question.id === q.id);
            if (!review) return;

            reviewHtml += `<div class="review-question-item"><p class="review-question-title">${index + 1}. ${review.question.text}</p><ul class="review-options-list">`;
            
            if (review.question.type === 'multiple') {
                const originalCorrectAnswerText = review.question.answers[review.question.correctAnswer];
                review.question.answers.forEach(answer => {
                    const isCorrect = answer === originalCorrectAnswerText;
                    const studentAnswerText = review.studentAnswer ? review.studentAnswer.substring(review.studentAnswer.indexOf(' ') + 1) : '';
                    const isStudentChoice = answer === studentAnswerText;
                    let classes = '';
                    if (isCorrect) classes += ' correct-answer';
                    if (isStudentChoice) classes += ' student-choice';
                    let icon = '';
                    if (isStudentChoice) {
                        icon = isCorrect ? '<span class="review-icon correct">✓</span>' : '<span class="review-icon incorrect">✗</span>';
                    } else if (isCorrect) {
                        icon = '<span class="review-icon correct">✓</span>';
                    }
                    reviewHtml += `<li class="${classes}">${answer}${icon}</li>`;
                });
            } else { 
                review.question.answers.forEach((answer, i) => {
                    const studentAns = review.studentAnswer[i];
                    const correctAns = review.question.answerStates[i];
                    let studentIcon = studentAns === true ? 'O' : (studentAns === false ? 'X' : '?');
                    let correctIcon = correctAns === true ? 'O' : (correctAns === false ? 'X' : '?');
                    let icon = (String(studentAns) === String(correctAns)) ? '<span class="review-icon correct">✓</span>' : '<span class="review-icon incorrect">✗</span>';
                    reviewHtml += `<li><span>${answer}</span><span>(Bạn chọn: ${studentIcon}, Đáp án: ${correctIcon}) ${icon}</span></li>`;
                });
            }
            reviewHtml += `</ul></div>`;
        });
        quizReviewContainer.innerHTML = reviewHtml;
    }
    
    function showFeedbackWithAnimation(text, color) {
        quizFeedback.textContent = text;
        quizFeedback.style.color = color;
        quizFeedback.style.animation = 'none';
        setTimeout(() => {
            quizFeedback.style.animation = 'floatUp 2s ease-in-out forwards';
        }, 10);
    }

    function playFeedbackSound(isCorrect) {
        const isSoundDisabled = studentQuiz && studentQuiz.settings && studentQuiz.settings.soundEnabled === false;
        if (isSoundDisabled) return;
        const sound = document.getElementById(isCorrect ? 'correctSound' : 'wrongSound');
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(err => console.log('Error playing sound:', err));
        }
    }
    
    function handleMcqAnswer(e) {
        const selectedBtn = e.target.closest('.quiz-option-btn');
        const isCorrect = selectedBtn.dataset.isCorrect === 'true';
        playFeedbackSound(isCorrect);

        if (!isRedemptionMode) {
            quizReviewData.push({ question: studentQuiz.questions[currentQuestionIndex], studentAnswer: selectedBtn.textContent, isCorrect: isCorrect });
            if (isCorrect) {
                studentScore++;
                updateScoreDisplay();
            }
        }
        showFeedbackWithAnimation(isCorrect ? 'LÀ NGON LUÔN!' : 'NHƯ MUỐI BỎ BIỂN!', isCorrect ? 'var(--success-color)' : 'var(--danger-color)');
        selectedBtn.classList.add(isCorrect ? 'correct' : 'incorrect');
        if (!isCorrect) { Array.from(quizOptionsContainer.children).find(btn => btn.dataset.isCorrect === 'true').classList.add('correct'); }
        Array.from(quizOptionsContainer.children).forEach(btn => btn.disabled = true);
        studentAutoAdvancePref = studentAutoAdvanceSelect.value;
        if (studentAutoAdvancePref !== 'manual') {
            actionBtn.classList.add('hidden');
            setTimeout(nextQuestion, parseInt(studentAutoAdvancePref));
        } else {
            actionBtn.textContent = 'Câu tiếp theo ➡️';
            actionBtn.classList.remove('hidden');
            actionBtn.onclick = nextQuestion;
        }
    }
    
    function checkTfAnswer() {
        let allCorrect = true;
        studentDragIconsTop.classList.add('hidden');
        studentDragIconsSide.classList.add('hidden');
        const tfItems = quizOptionsContainer.querySelectorAll('.quiz-tf-item');
        tfItems.forEach(item => { const dropZone = item.querySelector('.tf-drop-zone'); dropZone.onclick = null; dropZone.style.cursor = 'default'; });
        tfItems.forEach((item, index) => {
            const dropZone = item.querySelector('.tf-drop-zone');
            const studentAnswer = studentTfAnswers[index];
            if (String(studentAnswer) !== item.dataset.correctState) {
                allCorrect = false;
            }
            dropZone.classList.add(String(studentAnswer) === item.dataset.correctState ? 'correct-answer' : 'incorrect-answer');
        });

        playFeedbackSound(allCorrect);

        if (!isRedemptionMode) {
            quizReviewData.push({ question: studentQuiz.questions[currentQuestionIndex], studentAnswer: [...studentTfAnswers], isCorrect: allCorrect });
            if (allCorrect) {
                studentScore++;
                updateScoreDisplay();
            }
        }
        showFeedbackWithAnimation(allCorrect ? 'Chính xác!' : 'Chưa hoàn toàn chính xác!', allCorrect ? 'var(--success-color)' : 'var(--danger-color)');
        
        studentAutoAdvancePref = studentAutoAdvanceSelect.value;
        if (studentAutoAdvancePref !== 'manual') {
            actionBtn.classList.add('hidden');
            setTimeout(nextQuestion, parseInt(studentAutoAdvancePref));
        } else {
            actionBtn.textContent = 'Câu tiếp theo ➡️';
            actionBtn.onclick = nextQuestion;
        }
    }
    
    // ALL OTHER FUNCTIONS
    function generateCreatorInputs() { 
        const mcqGrid = mcqModeDiv.querySelector('.answers-grid');
        const tfContainer = tfModeDiv.querySelector('.tf-answers-container'); 
        mcqGrid.innerHTML = ''; tfContainer.innerHTML = '';
        for (let i = 0; i < 4; i++) { 
            mcqGrid.innerHTML += `<div class="answer-input"><input type="radio" name="correctAnswer" value="${i}" id="answer${i}"><input type="text" id="answerText${i}" placeholder="Đáp án ${String.fromCharCode(65 + i)}"></div>`;
            tfContainer.innerHTML += `<div class="tf-answer-item"><input type="text" id="tfAnswer${i}" placeholder="Mệnh đề ${String.fromCharCode(65 + i)}" class="tf-answer-input"><div class="tf-drop-zone" data-answer-index="${i}">?</div></div>`; 
        } 
        setupCreatorDragAndDrop();
    }

    function setupCreatorDragAndDrop() { 
        document.querySelectorAll('#creatorView .drag-icon').forEach(icon => { 
            icon.addEventListener('dragstart', (e) => { draggedIcon = icon; setTimeout(() => icon.classList.add('dragging'), 0); }); 
            icon.addEventListener('dragend', () => draggedIcon.classList.remove('dragging')); 
        });
        document.querySelectorAll('#creatorView .tf-drop-zone').forEach(zone => { 
            zone.addEventListener('dragover', (e) => { e.preventDefault(); if (!zone.classList.contains('has-answer')) zone.classList.add('drag-over'); }); 
            zone.addEventListener('dragleave', () => zone.classList.remove('drag-over')); 
            zone.addEventListener('drop', (e) => { 
                e.preventDefault(); zone.classList.remove('drag-over'); 
                if (draggedIcon) { 
                    const isCorrect = draggedIcon.dataset.answer === 'true'; 
                    const index = parseInt(zone.dataset.answerIndex); 
                    tfAnswers[index] = isCorrect; 
                    fillDropZone(zone, isCorrect); 
                    zone.onclick = () => resetDropZone(zone); 
                } 
            }); 
        });
        enableTouchDragAndDrop('#creatorView .drag-icons', '#creatorView', (zone, answer) => { 
            tfAnswers[parseInt(zone.dataset.answerIndex)] = answer; 
            zone.onclick = () => resetDropZone(zone); 
        });
    }

    function addMcqQuestion() { 
        const questionTextValue = sanitizeInput(questionText.value);
        if (!questionTextValue) { alert('Vui lòng nhập nội dung câu hỏi!'); return; } 
        
        const question = { id: Date.now(), text: questionTextValue, type: 'multiple' };
        
        // Get answers from the answer grid
        const answerContainer = get('answersGridMcq');
        if (!answerContainer) { alert('Lỗi: Không tìm thấy container đáp án.'); return; }
        
        const answerRows = answerContainer.querySelectorAll('.answer-row-modern');
        const answers = [];
        let correctIndex = null;
        
        answerRows.forEach((row, idx) => {
            const radioBtn = row.querySelector('input[type="radio"]');
            const textInput = row.querySelector('input[type="text"]');
            
            if (textInput && textInput.value.trim()) {
                const answerText = sanitizeInput(textInput.value.trim());
                answers.push(answerText);
                
                if (radioBtn && radioBtn.checked) {
                    correctIndex = answers.length - 1;
                }
            }
        });
        
        if (answers.length < 2) { 
            alert('Vui lòng nhập ít nhất 2 đáp án!'); 
            return; 
        }
        if (correctIndex === null) { 
            alert('Vui lòng chọn đáp án đúng!'); 
            return; 
        }
        
        question.answers = answers;
        question.correctAnswer = correctIndex;
        questions.push(question);
        displayQuestions();
        clearMcqForm();
    }

    function addTfQuestion() { 
        const questionTextTfElement = get('questionTextTf');
        const questionTextValue = sanitizeInput(questionTextTfElement ? questionTextTfElement.value : '');
        
        // Question text is optional for T/F
        const question = { id: Date.now() + 1, text: questionTextValue || 'Câu hỏi Đúng/Sai', type: 'truefalse' };
        
        const answers = [];
        const answerStates = [];
        
        // Get statements from the statement container
        const stmtContainer = get('tfStatementsContainer');
        if (!stmtContainer) { alert('Lỗi: Không tìm thấy container mệnh đề.'); return; }
        
        const statementRows = stmtContainer.querySelectorAll('.tf-statement-row');
        statementRows.forEach((row, idx) => {
            const inputEl = row.querySelector('input[type="text"]');
            const dropZone = row.querySelector('.tf-drop-zone');
            
            if (inputEl && inputEl.value.trim()) {
                const stmtText = sanitizeInput(inputEl.value.trim());
                answers.push(stmtText);
                
                // Get the state from tfAnswers array (filled by drag-drop)
                const state = tfAnswers[idx] !== null ? tfAnswers[idx] : null;
                answerStates.push(state);
            }
        });
        
        if (answers.length === 0) { 
            alert('Vui lòng nhập ít nhất 1 mệnh đề!'); 
            return; 
        }
        if (answerStates.filter(s => s !== null).length === 0) { 
            alert('Vui lòng kéo thả icon O (đúng) hoặc X (sai) để đánh dấu từng mệnh đề!'); 
            return; 
        }
        
        question.answers = answers;
        question.answerStates = answerStates;
        questions.push(question);
        displayQuestions();
        clearTfForm();
    }

    function displayQuestions() { 
        if (questions.length === 0) { 
            questionsListDiv.innerHTML = '<h2>📋 Danh sách câu hỏi</h2><p style="text-align: center; color: #666; margin-top: 20px;">Chưa có câu hỏi nào.</p>';
            return; 
        } 
        let html = '<h2>📋 Danh sách câu hỏi</h2>';
        questions.forEach((q, index) => { 
            const safeQuestionText = escapeHTML(q.text);
            html += `<div class="question-item"><div class="question-title">${index + 1}. ${safeQuestionText}</div>`; 
            if (q.type === 'multiple') { 
                html += '<div class="answers-grid">'; 
                q.answers.forEach((ans, i) => { const safeAns = escapeHTML(ans); html += `<div class="answer-option ${i === q.correctAnswer ? 'correct' : ''}">${String.fromCharCode(65 + i)}. ${safeAns}</div>`; }); 
                html += '</div>'; 
            } else { 
                html += '<div class="answers-grid">'; 
                q.answers.forEach((ans, i) => { 
                    const safeAns = escapeHTML(ans);
                    let state = q.answerStates[i], stateClass = state === true ? 'correct' : (state === false ? 'incorrect' : ''), stateSymbol = state === true ? 'O' : (state === false ? 'X' : '?'); 
                    html += `<div class="answer-option ${stateClass}" style="${state === false ? 'background: var(--danger-color); color: white;' : ''}">${String.fromCharCode(65 + i)}. ${safeAns} <span style="float: right; font-weight: bold;">${stateSymbol}</span></div>`; 
                }); 
                html += '</div>'; 
            } 
            html += `<div style="text-align: right; margin-top: 15px;"><button class="btn" style="background: var(--danger-color); color: white; padding: 8px 15px; font-size: 0.9rem;" onclick="deleteQuestion(${q.id})">🗑️ Xóa</button></div></div>`; 
        }); 
        questionsListDiv.innerHTML = html; 
    }
    
    window.deleteQuestion = (id) => { 
        if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) { 
            questions = questions.filter(q => q.id !== id); 
            displayQuestions(); 
        } 
    };

    function clearCreatorForm() { 
        questionText.value = ''; 
        for (let i = 0; i < 4; i++) { 
            get(`answerText${i}`).value = ''; 
            get(`answer${i}`).checked = false; 
        } 
        tfAnswers = [null, null, null, null]; 
        for (let i = 0; i < 4; i++) { 
            const zone = document.querySelector(`#creatorView .tf-drop-zone[data-answer-index="${i}"]`); 
            get(`tfAnswer${i}`).value = ''; 
            if(zone) { resetDropZoneStyle(zone); } 
        } 
    }

    function exportToJSON() { 
        if (questions.length === 0) { alert('Chưa có câu hỏi nào để xuất!'); return; } 
        const quizTitle = prompt("Nhập tên cho bài quiz của bạn:", "Bài Quiz Mới"); 
        if (!quizTitle) return; 
        const payload = buildQuizPayload(quizTitle);
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); 
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a');
        a.href = url; a.download = `${payload.title.replace(/\s+/g, '-')}.json`; 
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    function generateShareLink() {
        if (questions.length === 0) { alert('Chưa có câu hỏi nào để chia sẻ!'); return; }
        
        const quizTitle = prompt('Nhập tên cho bài quiz của bạn:', 'Bài Quiz Mới');
        if (!quizTitle) return;
        
        const payload = {
            title: sanitizeInput(quizTitle),
            settings: {
                shuffleQuestions: get('shuffleQuestionsSetting').checked,
                shuffleAnswers: get('shuffleAnswersSetting').checked,
                autoAdvance: get('autoAdvanceSetting').checked,
                soundEnabled: get('soundEnabledSetting') ? get('soundEnabledSetting').checked : true
            },
            questions: cloneSafe(questions)
        };
        
        const jsonSize = JSON.stringify(payload).length;
        if (jsonSize > 500000) {
            alert('⚠️ Bài quiz quá lớn (>500KB). Hãy giảm số lượng câu hỏi hoặc độ dài câu hỏi.');
            return;
        }
        
        try {
            const storageUsed = Object.keys(localStorage).reduce((sum, key) => {
                return sum + localStorage[key].length;
            }, 0);
            if (storageUsed > 5000000) {
                const clearOld = confirm('💾 Bộ nhớ trình duyệt gần đầy. Xóa dữ liệu cũ?');
                if (clearOld) {
                    localStorage.removeItem('quizHistory');
                    alert('✅ Đã xóa lịch sử. Hãy thử lại.');
                }
                return;
            }
        } catch (e) {
            console.warn('Không thể kiểm tra dung lượng storage:', e);
        }
        
        encodeQuizPayloadToUrl(payload).then(shareUrl => {
            if (shareUrl.length > 2000) {
                alert('⚠️ Link quá dài (>2000 ký tự). Một số trình duyệt/nền tảng có thể không hỗ trợ. Hãy giảm độ phức tạp của quiz.');
                return;
            }
            
            if (shareLinkOutput) shareLinkOutput.value = shareUrl;
            if (shareLinkRow) shareLinkRow.classList.remove('hidden');
            if (copyShareLinkBtn) copyShareLinkBtn.disabled = false;
            if (shareLinkHint) {
                shareLinkHint.textContent = '✅ Link ngắn đã sẵn sàng! Gửi cho học sinh, họ chỉ cần mở link để làm bài.';
            }
        });
    }

    function copyShareLink() {
        if (!shareLinkOutput || !shareLinkOutput.value) return;
        navigator.clipboard.writeText(shareLinkOutput.value)
            .then(() => {
                if (shareLinkHint) {
                    shareLinkHint.textContent = 'Đã copy link vào clipboard! Gửi ngay cho học sinh.';
                }
            })
            .catch(() => alert('Không thể copy link. Bạn có thể tự copy thủ công.'));
    }

    function generateShareLinkFromFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                const validatedQuiz = validateQuizPayload(parsed);
                
                encodeQuizPayloadToUrl(validatedQuiz).then(shareUrl => {
                    if (fileShareLinkOutput) fileShareLinkOutput.value = shareUrl;
                    if (fileShareLinkRow) fileShareLinkRow.classList.remove('hidden');
                    if (copyFileShareLinkBtn) copyFileShareLinkBtn.disabled = false;
                    if (fileShareLinkHint) {
                        fileShareLinkHint.textContent = '✅ Link ngắn đã sẵn sàng! Gửi cho học sinh, họ chỉ cần mở link để làm bài.';
                    }
                });
            } catch (err) {
                alert('File JSON không hợp lệ hoặc đã bị chỉnh sửa.');
                console.error(err);
            }
        };
        reader.readAsText(file);
    }

    function copyFileShareLink() {
        if (!fileShareLinkOutput || !fileShareLinkOutput.value) return;
        navigator.clipboard.writeText(fileShareLinkOutput.value)
            .then(() => {
                if (fileShareLinkHint) {
                    fileShareLinkHint.textContent = 'Đã copy link vào clipboard! Gửi ngay cho học sinh.';
                }
            })
            .catch(() => alert('Không thể copy link. Bạn có thể tự copy thủ công.'));
    }

    function tryLoadQuizFromUrlParam() {
        const hash = window.location.hash;
        if (!hash || (!hash.includes('quiz=') && !hash.includes('id='))) return;

        loadQuizFromHash(hash)
            .then(sharedQuiz => {
                handleLoadedQuiz(sharedQuiz, { showIntroCard: true });
            })
            .catch(error => {
                console.error('Lỗi khi tải quiz từ link:', error);
                alert('Link quiz không hợp lệ hoặc đã bị hỏng.\n\nLỗi: ' + error.message + '\n\nThử tạo link mới hoặc dùng file JSON trực tiếp.');
            });
    }

    function showPreviewModal() { 
        if (questions.length === 0) { alert('Chưa có câu hỏi nào để xem trước!'); return; } 
        let html = ''; 
        questions.forEach((q, index) => { 
            const safeQuestionText = escapeHTML(q.text);
            html += `<div class="question-item" style="background: var(--light-gray)"><div class="question-title">${index + 1}. ${safeQuestionText}</div>`; 
            if (q.type === 'multiple') { 
                html += '<div class="answers-grid">'; 
                q.answers.forEach((ans, i) => { const safeAns = escapeHTML(ans); html += `<div class="answer-option ${i === q.correctAnswer ? 'correct' : ''}">${String.fromCharCode(65 + i)}. ${safeAns}</div>`; }); 
                html += '</div>'; 
            } else { 
                html += '<div class="answers-grid">'; 
                q.answers.forEach((ans, i) => { const safeAns = escapeHTML(ans); let state = q.answerStates[i], stateSymbol = state === true ? '✓' : (state === false ? '✗' : '?'); html += `<div class="answer-option">${String.fromCharCode(65 + i)}. ${safeAns} [${stateSymbol}]</div>`; }); 
                html += '</div>'; 
            } 
            html += `</div>`; 
        });
        previewContent.innerHTML = html; previewModal.style.display = 'flex'; 
    }

    function renderStudentQuestion() { 
        quizFeedback.textContent = '';
        actionBtn.classList.add('hidden'); 
        const question = studentQuiz.questions[currentQuestionIndex]; 
        const progressText = isRedemptionMode ?
            `Gỡ điểm: ${currentQuestionIndex + 1} / ${studentQuiz.questions.length}` : 
            `Câu ${currentQuestionIndex + 1} / ${originalQuestions.length}`; 
        quizProgress.textContent = progressText; 
        quizQuestionText.textContent = question.text;
        quizOptionsContainer.innerHTML = ''; 
        const shouldShuffleAnswers = studentQuiz.settings && studentQuiz.settings.shuffleAnswers; 
        const mainContentWrapper = get('quizPlayArea').querySelector('.quiz-main-content'); 
        studentDragIconsTop.classList.add('hidden'); 
        studentDragIconsSide.classList.add('hidden');
        
        if (question.type === 'multiple') { 
            if (mainContentWrapper) mainContentWrapper.style.display = 'block'; 
            quizOptionsContainer.className = 'quiz-options';
            let answerOptions = question.answers.map((answer, index) => ({ text: answer, isCorrect: index === question.correctAnswer })); 
            if (shouldShuffleAnswers) { shuffleArray(answerOptions); } 
            answerOptions.forEach((option, displayIndex) => { 
                const optionBtn = document.createElement('button'); 
                optionBtn.className = 'quiz-option-btn'; 
                optionBtn.textContent = option.text; 
                optionBtn.dataset.isCorrect = option.isCorrect; 
                optionBtn.dataset.optionNumber = displayIndex + 1;
                optionBtn.onclick = handleMcqAnswer; 
                quizOptionsContainer.appendChild(optionBtn); 
            });
        } else { 
            if (mainContentWrapper) mainContentWrapper.style.display = 'flex'; 
            quizOptionsContainer.className = 'quiz-tf-options';
            let answerOptions = question.answers.map((answer, index) => ({ text: answer, state: question.answerStates[index] })); 
            if (shouldShuffleAnswers) { shuffleArray(answerOptions); } 
            studentTfAnswers = new Array(answerOptions.length).fill(null); 
            answerOptions.forEach((option, index) => { 
                const item = document.createElement('div'); 
                item.className = 'quiz-tf-item'; 
                item.innerHTML = `<span>${option.text}</span><div class="tf-drop-zone" data-shuffled-index="${index}">?</div>`; 
                item.dataset.correctState = option.state; 
                quizOptionsContainer.appendChild(item); 
            });
            setupStudentDragAndDrop(); 
            actionBtn.textContent = 'Kiểm tra đáp án'; 
            actionBtn.classList.remove('hidden'); 
            actionBtn.onclick = checkTfAnswer;
        } 
    }

    function resetDropZone(zone) { 
        let index;
        if (zone.dataset.answerIndex !== undefined) index = parseInt(zone.dataset.answerIndex); 
        else index = parseInt(zone.dataset.shuffledIndex); 
        if (studentView.contains(zone)) { studentTfAnswers[index] = null; } 
        else { tfAnswers[index] = null; } 
        resetDropZoneStyle(zone); 
    }

    function resetDropZoneStyle(zone) { 
        zone.textContent = '?';
        zone.style.background = ''; 
        zone.style.color = ''; 
        zone.style.border = '3px dashed #ddd'; 
        zone.classList.remove('has-answer', 'filled', 'correct', 'incorrect'); 
        zone.onclick = null;
    }

    function fillDropZone(zone, answer) { 
        zone.textContent = answer ? 'O' : 'X'; 
        zone.classList.add('has-answer', 'filled'); 
        zone.style.background = answer ? 'var(--success-color)' : 'var(--danger-color)'; 
        zone.style.color = 'white'; 
        zone.style.borderStyle = 'solid';
    }

    function setupStudentDragAndDrop() { 
        const isLandscape = window.matchMedia("(max-height: 500px) and (orientation: landscape)").matches;
        const iconContainerSelector = isLandscape ? '#studentDragIconsSide' : '#studentDragIconsTop'; 
        const iconContainerElement = get(isLandscape ? 'studentDragIconsSide' : 'studentDragIconsTop'); 
        iconContainerElement.classList.remove('hidden');
        
        document.querySelectorAll(`${iconContainerSelector} .drag-icon`).forEach(icon => { 
            icon.addEventListener('dragstart', (e) => { studentDraggedIcon = icon; }); 
        });
        
        document.querySelectorAll('#studentView .tf-drop-zone').forEach(zone => { 
            zone.addEventListener('dragover', (e) => { 
                e.preventDefault(); 
                if (!zone.classList.contains('has-answer')) zone.classList.add('drag-over'); 
            }); 
            zone.addEventListener('dragleave', () => zone.classList.remove('drag-over')); 
            zone.addEventListener('drop', (e) => { 
                e.preventDefault(); 
                zone.classList.remove('drag-over'); 
                if (studentDraggedIcon) { 
                    const droppedAnswer = studentDraggedIcon.dataset.answer === 'true'; 
                    fillDropZone(zone, droppedAnswer); 
                    studentTfAnswers[parseInt(zone.dataset.shuffledIndex)] = droppedAnswer; 
                    zone.onclick = () => resetDropZone(zone); 
                }
            }); 
        });
        
        enableTouchDragAndDrop(iconContainerSelector, '#studentView', (zone, answer) => { 
            studentTfAnswers[parseInt(zone.dataset.shuffledIndex)] = answer; 
            zone.onclick = () => resetDropZone(zone); 
        });
    }

    modalCloseBtn.addEventListener('click', () => previewModal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target == previewModal) { previewModal.style.display = 'none'; } });

    function enableTouchDragAndDrop(iconContainerSelector, viewContainerSelector, onDropCallback) { 
        const container = document.querySelector(viewContainerSelector); 
        if (!container) return; 
        let draggedClone = null; let originalIcon = null;
        let offsetX, offsetY; 
        const iconContainer = document.querySelector(iconContainerSelector); 
        if (!iconContainer) return;
        
        iconContainer.querySelectorAll('.drag-icon').forEach(icon => { 
            icon.addEventListener('touchstart', (e) => { 
                e.preventDefault(); 
                originalIcon = e.target; 
                draggedClone = originalIcon.cloneNode(true); 
                draggedClone.classList.add('touch-drag-clone'); 
                document.body.appendChild(draggedClone); 
                const touch = e.touches[0]; 
                const rect = originalIcon.getBoundingClientRect(); 
                offsetX = touch.clientX - rect.left; 
                offsetY = touch.clientY - rect.top; 
                draggedClone.style.left = `${touch.clientX - offsetX}px`; 
                draggedClone.style.top = `${touch.clientY - offsetY}px`; 
                originalIcon.style.opacity = '0.5'; 
            }, { passive: false }); 
        });

        document.body.addEventListener('touchmove', (e) => { 
            if (!draggedClone) return; 
            e.preventDefault(); 
            const touch = e.touches[0]; 
            draggedClone.style.left = `${touch.clientX - offsetX}px`; 
            draggedClone.style.top = `${touch.clientY - offsetY}px`; 
            container.querySelectorAll('.tf-drop-zone').forEach(zone => zone.classList.remove('drag-over')); 
            const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY); 
            if (elementUnderTouch && elementUnderTouch.classList.contains('tf-drop-zone') && !elementUnderTouch.classList.contains('has-answer')) { 
                elementUnderTouch.classList.add('drag-over'); 
            } 
        }, { passive: false });

        document.body.addEventListener('touchend', (e) => { 
            if (!draggedClone) return; 
            const touch = e.changedTouches[0]; 
            const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY); 
            if (elementUnderTouch && elementUnderTouch.classList.contains('tf-drop-zone') && !elementUnderTouch.classList.contains('has-answer')) { 
                const droppedAnswer = originalIcon.dataset.answer === 'true'; 
                fillDropZone(elementUnderTouch, droppedAnswer); 
                onDropCallback(elementUnderTouch, droppedAnswer); 
            } 
            if(draggedClone) {document.body.removeChild(draggedClone); } 
            if(originalIcon) {originalIcon.style.opacity = '1';} 
            draggedClone = null; originalIcon = null; 
            container.querySelectorAll('.tf-drop-zone').forEach(zone => zone.classList.remove('drag-over')); 
        });
    }

    addMcqBtn.addEventListener('click', addMcqQuestion);
    addTfBtn.addEventListener('click', addTfQuestion);
    exportJsonBtn.addEventListener('click', exportToJSON);
    if (shareLinkBtn) shareLinkBtn.addEventListener('click', generateShareLink);
    if (copyShareLinkBtn) copyShareLinkBtn.addEventListener('click', copyShareLink);
    if (linkFileInput) {
        linkFileInput.addEventListener('change', (e) => generateShareLinkFromFile(e.target.files[0]));
    }
    if (copyFileShareLinkBtn) copyFileShareLinkBtn.addEventListener('click', copyFileShareLink);
    previewQuizBtn.addEventListener('click', showPreviewModal);
    resumeBtn.addEventListener('click', loadProgress);
    startNewBtn.addEventListener('click', () => { clearProgress(); checkForSavedProgress(); });
    restartQuizBtn.addEventListener('click', () => { isRedemptionMode = false; startQuiz(); });
    loadAnotherQuizBtn.addEventListener('click', () => { isRedemptionMode = false; quizResultsArea.classList.add('hidden'); quizUploadArea.classList.remove('hidden'); checkForSavedProgress(); });
    
    redemptionQuizBtn.addEventListener('click', () => {
        const incorrectQuestions = quizReviewData
            .filter(r => !r.isCorrect)
            .map(r => r.question);
            
        if (incorrectQuestions.length > 0) {
            startRedemptionQuiz(incorrectQuestions);
        } else {
            alert("Bạn không có câu sai nào để làm lại!");
        }
    });

    const savedTheme = localStorage.getItem('quizTheme');
    if (savedTheme) { applyTheme(savedTheme); }

    const savedAutoAdvancePref = localStorage.getItem('studentAutoAdvancePref');
    if (savedAutoAdvancePref) {
        studentAutoAdvancePref = savedAutoAdvancePref;
        studentAutoAdvanceSelect.value = savedAutoAdvancePref;
    }
    
    studentAutoAdvanceSelect.addEventListener('change', (e) => {
        studentAutoAdvancePref = e.target.value;
        localStorage.setItem('studentAutoAdvancePref', studentAutoAdvancePref);
    });
    
    window.addEventListener('beforeunload', (e) => {
        if (studentQuiz && Object.keys(studentQuiz).length > 0 && currentQuestionIndex > 0 && !isRedemptionMode) {
            saveToHistory(false);
        }
    });

    // HISTORY MANAGEMENT
    function saveToHistory(isCompleted) {
        const historyItem = {
            id: Date.now(),
            title: studentQuiz.title,
            date: new Date(),
            dateString: new Date().toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            totalQuestions: originalQuestions.length,
            score: studentScore,
            percentage: Math.round((studentScore / originalQuestions.length) * 100),
            status: isCompleted ? 'completed' : 'unfinished',
            currentQuestion: currentQuestionIndex,
            quizData: JSON.parse(JSON.stringify(studentQuiz)),
            originalQuestions: JSON.parse(JSON.stringify(originalQuestions)),
            quizReviewData: JSON.parse(JSON.stringify(quizReviewData))
        };
        
        let history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
        history.unshift(historyItem);
        
        if (history.length > 50) history = history.slice(0, 50);
        
        localStorage.setItem('quizHistory', JSON.stringify(history));
    }
    
    function displayHistory(filter) {
        const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
        const historyGrid = get('historyGrid');
        
        let filteredHistory = history;
        if (filter === 'completed') {
            filteredHistory = history.filter(item => item.status === 'completed');
        } else if (filter === 'unfinished') {
            filteredHistory = history.filter(item => item.status === 'unfinished');
        }
        
        if (filteredHistory.length === 0) {
            historyGrid.innerHTML = `
                <div class="history-empty">
                    <div class="history-empty-icon">📭</div>
                    <h3>Chưa có lịch sử nào</h3>
                    <p>Các bài quiz bạn đã làm sẽ hiển thị ở đây</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        filteredHistory.forEach(item => {
            const scoreClass = item.percentage >= 80 ? 'excellent' : 
                              item.percentage >= 60 ? 'good' : 
                              item.percentage >= 40 ? 'average' : 'poor';
            
            const statusText = item.status === 'completed' ? '✅ Hoàn thành' : '⏳ Chưa xong';
            const statusClass = item.status === 'completed' ? 'completed' : 'unfinished';
            
            const dateObj = new Date(item.date);
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            
            html += `
                <div class="history-card">
                    <div class="history-card-status ${statusClass}">${statusText}</div>
                    <div class="history-card-title">${item.title}</div>
                    <div class="history-card-info">
                        <div class="history-info-item">
                            <span class="icon">📅</span>
                            <span>${day}/${month}/${year} - ${hours}:${minutes}</span>
                        </div>
                        <div class="history-info-item">
                            <span class="icon">📝</span>
                            <span>${item.totalQuestions} câu hỏi</span>
                        </div>
                        ${item.status === 'unfinished' ? `
                        <div class="history-info-item">
                            <span class="icon">⏱️</span>
                            <span>Đã làm: ${item.currentQuestion}/${item.totalQuestions}</span>
                        </div>
                        ` : ''}
                    </div>
                    ${item.status === 'completed' ? `
                        <div class="history-card-score ${scoreClass}">
                            ${item.score}/${item.totalQuestions}
                            <div style="font-size: 1rem; color: var(--text-secondary); margin-top: 5px;">${item.percentage}%</div>
                        </div>
                    ` : `
                        <div class="history-card-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(item.currentQuestion / item.totalQuestions) * 100}%"></div>
                            </div>
                            <span>${item.percentage}%</span>
                        </div>
                    `}
                    <div class="history-card-actions">
                        ${item.status === 'unfinished' ? `
                            <button class="btn btn-primary" onclick="resumeFromHistory(${item.id})">▶️ Tiếp tục</button>
                            <button class="btn btn-info" onclick="restartFromHistory(${item.id})" style="flex: 0; padding: 10px 20px;">🔄 Làm lại</button>
                        ` : `
                            <button class="btn btn-info" onclick="reviewFromHistory(${item.id})">👁️ Xem lại</button>
                            <button class="btn btn-success" onclick="retryFromHistory(${item.id})" style="flex: 0; padding: 10px 20px;">🔄 Làm lại</button>
                        `}
                        <button class="btn btn-danger" onclick="deleteHistoryItem(${item.id})" style="flex: 0; padding: 10px 20px;">🗑️</button>
                    </div>
                </div>
            `;
        });
        
        historyGrid.innerHTML = html;
    }
    
    window.resumeFromHistory = (id) => {
        const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
        const item = history.find(h => h.id === id);
        if (!item) return;
        
        studentQuiz = item.quizData;
        originalQuestions = JSON.parse(JSON.stringify(item.originalQuestions));
        currentQuestionIndex = item.currentQuestion;
        studentScore = item.score;
        quizReviewData = JSON.parse(JSON.stringify(item.quizReviewData || []));
        
        switchView('student');
        quizUploadArea.classList.add('hidden');
        quizResultsArea.classList.add('hidden');
        quizPlayArea.classList.remove('hidden');
        quizPlayArea.classList.add('winter-theme');
        quizTitle.textContent = studentQuiz.title;
        renderStudentQuestion();
    };
    
    window.restartFromHistory = (id) => {
        const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
        const item = history.find(h => h.id === id);
        if (!item) return;
        
        if (!confirm(`Bạn muốn làm lại bài "${item.title}" từ đầu?`)) return;
        
        studentQuiz = item.quizData;
        originalQuestions = JSON.parse(JSON.stringify(item.originalQuestions));
        currentQuestionIndex = 0;
        studentScore = 0;
        quizReviewData = [];
        isRedemptionMode = false;
        
        switchView('student');
        quizUploadArea.classList.add('hidden');
        quizResultsArea.classList.add('hidden');
        quizPlayArea.classList.remove('hidden');
        quizPlayArea.classList.add('winter-theme');
        quizTitle.textContent = studentQuiz.title;
        renderStudentQuestion();
    };
    
    window.retryFromHistory = (id) => {
        const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
        const item = history.find(h => h.id === id);
        if (!item) return;
        
        if (!confirm(`Bạn muốn làm lại bài "${item.title}" từ đầu?`)) return;
        
        studentQuiz = item.quizData;
        originalQuestions = JSON.parse(JSON.stringify(item.originalQuestions));
        currentQuestionIndex = 0;
        studentScore = 0;
        quizReviewData = [];
        isRedemptionMode = false;
        
        switchView('student');
        quizUploadArea.classList.add('hidden');
        quizResultsArea.classList.add('hidden');
        quizPlayArea.classList.remove('hidden');
        quizPlayArea.classList.add('winter-theme');
        quizTitle.textContent = studentQuiz.title;
        renderStudentQuestion();
    };
    
    window.reviewFromHistory = (id) => {
        const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
        const item = history.find(h => h.id === id);
        if (!item || item.status === 'unfinished') {
            alert('Chỉ có thể xem lại bài hoàn thành!');
            return;
        }
        
        quizPlayArea.classList.add('hidden');
        document.body.classList.remove('quiz-active');
        quizUploadArea.classList.add('hidden');
        quizResultsArea.classList.remove('hidden');
        
        const totalQuestions = item.totalQuestions;
        quizScore.textContent = `Điểm của bạn: ${item.score} / ${totalQuestions}`;
        quizPercentage.textContent = `Tỷ lệ đúng: ${item.percentage}%`;
        
        if (item.percentage === 100) { quizEvaluation.textContent = "Kết quả: Hoàn hảo! 🎉"; }
        else if (item.percentage >= 80) { quizEvaluation.textContent = "Kết quả: Xuất sắc! ✨"; } 
        else if (item.percentage >= 50) { quizEvaluation.textContent = "Kết quả: Khá tốt! 👍"; }
        else { quizEvaluation.textContent = "Kết quả: Cần cố gắng thêm! 📖"; }
        
        const quizReviewDataToShow = item.quizReviewData || [];
        let reviewHtml = '<h3>🔍 Xem lại bài làm</h3>';
        
        item.originalQuestions.forEach((q, index) => {
            const review = quizReviewDataToShow.find(r => r.question && r.question.id === q.id);
            if (!review) return;

            reviewHtml += `<div class="review-question-item"><p class="review-question-title">${index + 1}. ${review.question.text}</p><ul class="review-options-list">`;
            
            if (review.question.type === 'multiple') {
                const originalCorrectAnswerText = review.question.answers[review.question.correctAnswer];
                review.question.answers.forEach(answer => {
                    const isCorrect = answer === originalCorrectAnswerText;
                    const studentAnswerText = review.studentAnswer ? review.studentAnswer.substring(review.studentAnswer.indexOf(' ') + 1) : '';
                    const isStudentChoice = answer === studentAnswerText;
                    let classes = '';
                    if (isCorrect) classes += ' correct-answer';
                    if (isStudentChoice) classes += ' student-choice';
                    let icon = '';
                    if (isStudentChoice) {
                        icon = isCorrect ? '<span class="review-icon correct">✓</span>' : '<span class="review-icon incorrect">✗</span>';
                    } else if (isCorrect) {
                        icon = '<span class="review-icon correct">✓</span>';
                    }
                    reviewHtml += `<li class="${classes}">${answer}${icon}</li>`;
                });
            } else { 
                review.question.answers.forEach((answer, i) => {
                    const studentAns = review.studentAnswer[i];
                    const correctAns = review.question.answerStates[i];
                    let studentIcon = studentAns === true ? 'O' : (studentAns === false ? 'X' : '?');
                    let correctIcon = correctAns === true ? 'O' : (correctAns === false ? 'X' : '?');
                    let icon = (String(studentAns) === String(correctAns)) ? '<span class="review-icon correct">✓</span>' : '<span class="review-icon incorrect">✗</span>';
                    reviewHtml += `<li><span>${answer}</span><span>(Bạn chọn: ${studentIcon}, Đáp án: ${correctIcon}) ${icon}</span></li>`;
                });
            }
            reviewHtml += `</ul></div>`;
        });
        quizReviewContainer.innerHTML = reviewHtml;
    };
    
    window.deleteHistoryItem = (id) => {
        if (!confirm('Bạn có chắc muốn xóa mục này khỏi lịch sử?')) return;
        
        let history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
        history = history.filter(item => item.id !== id);
        localStorage.setItem('quizHistory', JSON.stringify(history));
        
        const activeFilter = document.querySelector('.history-filter-btn.active');
        displayHistory(activeFilter ? activeFilter.dataset.filter : 'all');
    };
    
    document.querySelectorAll('.history-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.filter === 'clear') {
                if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử làm bài?')) {
                    localStorage.removeItem('quizHistory');
                    displayHistory('all');
                }
                return;
            }
            
            document.querySelectorAll('.history-filter-btn').forEach(b => {
                if (b.dataset.filter !== 'clear') b.classList.remove('active');
            });
            btn.classList.add('active');
            displayHistory(btn.dataset.filter);
        });
    });
    
    // ===== NEW FEATURE EVENT LISTENERS =====
    
    // Quick dark mode toggle in header
    if (quickDarkModeToggle) {
        quickDarkModeToggle.addEventListener('click', toggleQuickDarkMode);
    }
    
    // Timer mode setting toggle
    if (timerModeSetting) {
        timerModeSetting.addEventListener('change', toggleTimerDurationVisibility);
        toggleTimerDurationVisibility(); // Set initial visibility
    }
    
    // Timer pause/resume button
    if (timerPauseBtn) {
        timerPauseBtn.addEventListener('click', pauseResumeTimer);
    }
    
    // Initialize features
    loadStatistics();
    setupKeyboardShortcuts();
    setupSwipeGestures();
    updateHeaderThemeIcon();
    
    // Show keyboard shortcuts hint on first load
    const hasSeenShortcutsHint = localStorage.getItem('hasSeenShortcutsHint');
    if (!hasSeenShortcutsHint) {
        setTimeout(() => {
            const hint = document.createElement('div');
            hint.className = 'swipe-indicator';
            hint.innerHTML = '⌨️ Phím tắt: Space/Enter=Tiếp, 1-4=Chọn đáp án, P=Tạm dừng timer, H=Trang chủ';
            hint.style.bottom = '80px';
            hint.style.animation = 'fadeInOut 5s ease-in-out';
            document.body.appendChild(hint);
            setTimeout(() => hint.remove(), 5000);
            localStorage.setItem('hasSeenShortcutsHint', 'true');
        }, 2000);
    }
    
    // ===== NEW MODERN UI FUNCTIONS =====
    
    // Quiz Type Selector
    function showQuizTypeSelector() {
        const typeSelector = get('quizTypeSelector');
        const mcqCreator = get('multipleChoiceCreator');
        const tfCreator = get('trueFalseCreator');
        const essayCreator = get('essayCreator');
        const questionsList = get('questionsList');
        const settingsExport = get('settingsExportSection');
        
        if (typeSelector) typeSelector.classList.remove('hidden');
        if (mcqCreator) mcqCreator.classList.add('hidden');
        if (tfCreator) tfCreator.classList.add('hidden');
        if (essayCreator) essayCreator.classList.add('hidden');
        if (questionsList) questionsList.classList.add('hidden');
        if (settingsExport) settingsExport.classList.add('hidden');
    }
    
    window.selectQuizType = function(type) {
        const typeSelector = get('quizTypeSelector');
        const mcqCreator = get('multipleChoiceCreator');
        const tfCreator = get('trueFalseCreator');
        const essayCreator = get('essayCreator');
        const questionsList = get('questionsList');
        const settingsExport = get('settingsExportSection');
        
        if (typeSelector) typeSelector.classList.add('hidden');
        if (questionsList) questionsList.classList.remove('hidden');
        if (settingsExport) settingsExport.classList.remove('hidden');
        
        if (type === 'multiple') {
            if (mcqCreator) mcqCreator.classList.remove('hidden');
            if (tfCreator) tfCreator.classList.add('hidden');
            if (essayCreator) essayCreator.classList.add('hidden');
            initializeMcqCreator();
        } else if (type === 'truefalse') {
            if (mcqCreator) mcqCreator.classList.add('hidden');
            if (tfCreator) tfCreator.classList.remove('hidden');
            if (essayCreator) essayCreator.classList.add('hidden');
            initializeTfCreator();
        } else if (type === 'essay') {
            if (mcqCreator) mcqCreator.classList.add('hidden');
            if (tfCreator) tfCreator.classList.add('hidden');
            if (essayCreator) essayCreator.classList.remove('hidden');
        }
    };
    
    window.backToTypeSelector = function() {
        showQuizTypeSelector();
    };
    
    // MCQ Creator Functions
    function initializeMcqCreator() {
        const container = get('answersGridMcq');
        if (!container) return;
        
        container.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            addMcqAnswerField();
        }
    }
    
    window.addMcqAnswerField = function() {
        const container = get('answersGridMcq');
        if (!container) return;
        
        const index = container.children.length;
        const row = document.createElement('div');
        row.className = 'answer-row-modern';
        row.innerHTML = `
            <input type="radio" name="correctAnswer" value="${index}" ${index === 0 ? 'checked' : ''}>
            <input type="text" placeholder="Nhập đáp án ${index + 1}..." data-answer-index="${index}">
            ${index >= 2 ? '<button class="btn-remove-answer" onclick="removeMcqAnswer(this)">×</button>' : ''}
        `;
        container.appendChild(row);
    };
    
    window.removeMcqAnswer = function(btn) {
        btn.parentElement.remove();
        updateAnswerIndices();
    };
    
    function updateAnswerIndices() {
        const container = get('answersGridMcq');
        if (!container) return;
        
        Array.from(container.children).forEach((row, index) => {
            const radio = row.querySelector('input[type="radio"]');
            const input = row.querySelector('input[type="text"]');
            if (radio) radio.value = index;
            if (input) {
                input.dataset.answerIndex = index;
                input.placeholder = `Nhập đáp án ${index + 1}...`;
            }
        });
    }
    
    window.clearMcqForm = function() {
        const questionText = get('questionText');
        if (questionText) questionText.value = '';
        initializeMcqCreator();
    };
    
    // True/False Creator Functions
    function initializeTfCreator() {
        const container = get('tfStatementsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        tfAnswers = [null, null, null, null];
        
        for (let i = 0; i < 4; i++) {
            const row = document.createElement('div');
            row.className = 'tf-statement-row';
            row.innerHTML = `
                <input type="text" placeholder="Nhập mệnh đề ${i + 1}..." data-statement-index="${i}">
                <div class="tf-drop-zone" data-drop-index="${i}"></div>
            `;
            container.appendChild(row);
        }
        
        setupTfDragAndDrop();
    }
    
    function setupTfDragAndDrop() {
        const icons = document.querySelectorAll('.drag-icon-modern');
        const dropZones = document.querySelectorAll('.tf-drop-zone');
        
        icons.forEach(icon => {
            icon.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('answer', icon.dataset.answer);
            });
        });
        
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });
            
            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                
                const answer = e.dataTransfer.getData('answer') === 'true';
                const index = parseInt(zone.dataset.dropIndex);
                tfAnswers[index] = answer;
                
                zone.textContent = answer ? 'O' : 'X';
                zone.classList.add('filled');
                zone.style.color = answer ? 'var(--success-color)' : 'var(--danger-color)';
                zone.style.borderColor = answer ? 'var(--success-color)' : 'var(--danger-color)';
                
                // Add click handler to reset when user clicks on filled zone
                zone.onclick = (clickEvent) => {
                    clickEvent.stopPropagation();
                    resetTfDropZone(zone);
                };
            });
        });
    }
    
    function resetTfDropZone(zone) {
        const index = parseInt(zone.dataset.dropIndex);
        tfAnswers[index] = null;
        
        zone.textContent = '?';
        zone.classList.remove('filled');
        zone.style.color = '';
        zone.style.borderColor = '';
        zone.onclick = null;
    }
    
    window.clearTfForm = function() {
        const questionTextTf = get('questionTextTf');
        if (questionTextTf) questionTextTf.value = '';
        initializeTfCreator();
    };
    
    // Essay Question Functions (NEW)
    window.clearEssayForm = function() {
        const questionTextEssay = get('questionTextEssay');
        const essayGuidelines = get('essayGuidelines');
        const essayExpectedAnswer = get('essayExpectedAnswer');
        const essayMinWords = get('essayMinWords');
        const essayMaxWords = get('essayMaxWords');
        
        if (questionTextEssay) questionTextEssay.value = '';
        if (essayGuidelines) essayGuidelines.value = '';
        if (essayExpectedAnswer) essayExpectedAnswer.value = '';
        if (essayMinWords) essayMinWords.value = '50';
        if (essayMaxWords) essayMaxWords.value = '500';
    };
    
    // Add Essay Question Handler
    const addEssayBtn = get('add-essay-btn');
    if (addEssayBtn) {
        addEssayBtn.addEventListener('click', () => {
            const questionTextEssay = get('questionTextEssay');
            const essayGuidelines = get('essayGuidelines');
            const essayExpectedAnswer = get('essayExpectedAnswer');
            const essayMinWords = get('essayMinWords');
            const essayMaxWords = get('essayMaxWords');
            
            const text = questionTextEssay ? questionTextEssay.value.trim() : '';
            if (!text) {
                alert('Vui lòng nhập nội dung câu hỏi!');
                return;
            }
            
            const question = {
                id: Date.now(),
                text: sanitizeInput(text),
                type: 'essay',
                guidelines: essayGuidelines ? sanitizeInput(essayGuidelines.value) : '',
                expectedAnswer: essayExpectedAnswer ? sanitizeInput(essayExpectedAnswer.value) : '',
                minWords: essayMinWords ? parseInt(essayMinWords.value) : 50,
                maxWords: essayMaxWords ? parseInt(essayMaxWords.value) : 500
            };
            
            questions.push(question);
            displayQuestions();
            clearEssayForm();
            alert('Đã thêm câu hỏi tự luận!');
        });
    }
    
    // Library Management
    function loadLibrary() {
        const library = JSON.parse(localStorage.getItem('quizLibrary') || '[]');
        displayLibrary(library);
    }
    
    function displayLibrary(library) {
        const libraryGrid = get('libraryGrid');
        if (!libraryGrid) return;
        
        if (library.length === 0) {
            libraryGrid.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-secondary);">Chưa có quiz nào trong thư viện. Tạo quiz mới để bắt đầu! 📝</div>';
            return;
        }
        
        libraryGrid.innerHTML = library.map(quiz => `
            <div class="library-card" data-quiz-id="${quiz.id}">
                <div class="library-card-header">
                    <h3 class="library-card-title">${escapeHTML(quiz.title)}</h3>
                    <span class="library-card-badge">${quiz.category || 'Chưa phân loại'}</span>
                </div>
                <div class="library-card-meta">
                    <span>📝 ${quiz.questions.length} câu hỏi</span>
                    <span>📅 ${new Date(quiz.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div class="library-card-actions">
                    <button class="btn-edit" onclick="editQuizFromLibrary(${quiz.id})">✏️ Sửa</button>
                    <button class="btn-share" onclick="shareQuizFromLibrary(${quiz.id})">🔗 Chia sẻ</button>
                    <button class="btn-delete" onclick="deleteQuizFromLibrary(${quiz.id})">🗑️ Xóa</button>
                </div>
            </div>
        `).join('');
    }
    
    window.editQuizFromLibrary = function(quizId) {
        const library = JSON.parse(localStorage.getItem('quizLibrary') || '[]');
        const quiz = library.find(q => q.id === quizId);
        if (!quiz) return;
        
        // Load quiz data into creator
        questions = [...quiz.questions];
        displayQuestions();
        
        // Set quiz metadata
        const quizTitleInput = get('quizTitleInput');
        const quizCategory = get('quizCategory');
        if (quizTitleInput) quizTitleInput.value = quiz.title;
        if (quizCategory) quizCategory.value = quiz.category || '';
        
        // Switch to creator view
        switchView('creator');
        showQuizTypeSelector();
        
        alert('Quiz đã được tải! Bạn có thể chỉnh sửa và lưu lại.');
    };
    
    window.shareQuizFromLibrary = function(quizId) {
        const library = JSON.parse(localStorage.getItem('quizLibrary') || '[]');
        const quiz = library.find(q => q.id === quizId);
        if (!quiz) return;
        
        showLoadingOverlay('Đang tạo link chia sẻ...');
        encodeQuizPayloadToUrl(quiz).then(url => {
            hideLoadingOverlay();
            prompt('Link chia sẻ quiz (Ctrl+C để copy):', url);
        }).catch(err => {
            hideLoadingOverlay();
            alert('Lỗi tạo link: ' + err.message);
        });
    };
    
    window.deleteQuizFromLibrary = function(quizId) {
        if (!confirm('Bạn có chắc muốn xóa quiz này khỏi thư viện?')) return;
        
        let library = JSON.parse(localStorage.getItem('quizLibrary') || '[]');
        library = library.filter(q => q.id !== quizId);
        localStorage.setItem('quizLibrary', JSON.stringify(library));
        loadLibrary();
    };
    
    // Save to Library with Duplicate Check
    const saveToLibraryBtn = get('save-to-library-btn');
    if (saveToLibraryBtn) {
        saveToLibraryBtn.addEventListener('click', () => {
            if (questions.length === 0) {
                alert('Vui lòng thêm ít nhất một câu hỏi!');
                return;
            }
            
            const quizTitleInput = get('quizTitleInput');
            const title = quizTitleInput ? quizTitleInput.value.trim() : '';
            if (!title) {
                alert('Vui lòng nhập tên quiz!');
                return;
            }
            
            // Check for duplicate name
            const library = JSON.parse(localStorage.getItem('quizLibrary') || '[]');
            const existingQuiz = library.find(q => q.title.toLowerCase() === title.toLowerCase());
            
            if (existingQuiz) {
                if (!confirm(`Quiz "${title}" đã tồn tại trong thư viện. Bạn có muốn ghi đè không?`)) {
                    return;
                }
                // Remove old version
                const updatedLibrary = library.filter(q => q.id !== existingQuiz.id);
                localStorage.setItem('quizLibrary', JSON.stringify(updatedLibrary));
            }
            
            const quizPayload = buildQuizPayload(title);
            quizPayload.id = Date.now();
            quizPayload.createdAt = new Date().toISOString();
            
            const currentLibrary = JSON.parse(localStorage.getItem('quizLibrary') || '[]');
            currentLibrary.push(quizPayload);
            localStorage.setItem('quizLibrary', JSON.stringify(currentLibrary));
            
            alert('✅ Đã lưu quiz vào thư viện!');
            questions = [];
            displayQuestions();
            if (quizTitleInput) quizTitleInput.value = '';
        });
    }
    
    // Library Search
    const librarySearchInput = get('librarySearchInput');
    if (librarySearchInput) {
        librarySearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const library = JSON.parse(localStorage.getItem('quizLibrary') || '[]');
            
            if (searchTerm === '') {
                displayLibrary(library);
                return;
            }
            
            const filtered = library.filter(quiz => 
                quiz.title.toLowerCase().includes(searchTerm) ||
                (quiz.category && quiz.category.toLowerCase().includes(searchTerm))
            );
            displayLibrary(filtered);
        });
    }
    
    // Library Category Filter
    document.querySelectorAll('.library-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.library-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.dataset.category;
            const library = JSON.parse(localStorage.getItem('quizLibrary') || '[]');
            
            if (category === 'all') {
                displayLibrary(library);
            } else {
                const filtered = library.filter(quiz => quiz.category === category);
                displayLibrary(filtered);
            }
        });
    });
    
    // History Search
    const historySearchInput = get('historySearchInput');
    if (historySearchInput) {
        historySearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
            
            if (searchTerm === '') {
                const activeFilter = document.querySelector('.history-filter-btn.active');
                displayHistory(activeFilter ? activeFilter.dataset.filter : 'all');
                return;
            }
            
            const filtered = history.filter(item => 
                item.quizTitle.toLowerCase().includes(searchTerm)
            );
            
            const historyGrid = get('historyGrid');
            if (!historyGrid) return;
            
            if (filtered.length === 0) {
                historyGrid.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-secondary);">Không tìm thấy kết quả nào 🔍</div>';
                return;
            }
            
            // Display filtered results (reuse existing display logic structure)
            displayHistoryItems(filtered);
        });
    }
    
    function displayHistoryItems(items) {
        const historyGrid = get('historyGrid');
        if (!historyGrid) return;
        
        historyGrid.innerHTML = items.map(item => {
            const percentage = item.totalQuestions > 0 ? Math.round((item.correctAnswers / item.totalQuestions) * 100) : 0;
            const status = item.isComplete ? '✅ Hoàn thành' : '⏳ Chưa hoàn thành';
            const statusClass = item.isComplete ? 'completed' : 'unfinished';
            
            return `
                <div class="history-card ${statusClass}">
                    <div class="history-card-header">
                        <h3>${escapeHTML(item.quizTitle)}</h3>
                        <span class="history-badge ${statusClass}">${status}</span>
                    </div>
                    <div class="history-stats">
                        <div class="stat-item"><span class="stat-icon">📊</span><span>${percentage}%</span></div>
                        <div class="stat-item"><span class="stat-icon">✓</span><span>${item.correctAnswers}/${item.totalQuestions}</span></div>
                        <div class="stat-item"><span class="stat-icon">📅</span><span>${new Date(item.timestamp).toLocaleDateString('vi-VN')}</span></div>
                    </div>
                    <div class="history-actions">
                        ${!item.isComplete ? `<button class="btn btn-success" onclick="resumeFromHistory(${item.id})">▶️ Tiếp tục</button>` : ''}
                        <button class="btn btn-info" onclick="reviewFromHistory(${item.id})">👁️ Xem lại</button>
                        <button class="btn btn-danger" onclick="deleteHistoryItem(${item.id})">🗑️ Xóa</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    checkForSavedProgress();
    // generateCreatorInputs(); // Disabled: Not needed with modern UI - inputs are initialized when user selects quiz type
    displayQuestions();
    
    // Initialize modern UI
    showQuizTypeSelector();
    
    // Export functions to window scope so HTML onclick handlers can call them
    window.switchView = switchView;
    
    setTimeout(() => {
        tryLoadQuizFromUrlParam();
    }, 100);
});
