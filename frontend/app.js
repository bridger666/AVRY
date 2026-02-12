// API Configuration
const API_BASE_URL = 'http://localhost:8081';

// User State (simulated - in production this would come from backend)
let userState = {
    tier: null, // 'foundation', 'acceleration', 'intelligence'
    activeWorkflows: 0,
    monthlyExecutionCount: 0,
    executionResetDate: null
};

// Tier Limits
const TIER_LIMITS = {
    foundation: {
        maxWorkflows: 3,
        maxExecutions: 3000,
        price: 200
    },
    acceleration: {
        maxWorkflows: 10,
        maxExecutions: 15000,
        price: 500
    },
    intelligence: {
        maxWorkflows: Infinity,
        maxExecutions: Infinity,
        price: 1000
    }
};

// Plan Selection
function selectPlan(tier) {
    console.log(`Selected plan: ${tier}`);
    // In production, this would redirect to payment/signup flow
    showSection('contact');
}

// Scroll to Pricing
function scrollToPricing() {
    const pricingSection = document.getElementById('pricing-section');
    if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Upgrade Modal Functions
function showUpgradeModal(title, message) {
    const modal = document.getElementById('upgrade-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    modal.style.display = 'flex';
}

function closeUpgradeModal() {
    document.getElementById('upgrade-modal').style.display = 'none';
}

function showUpgradePlans() {
    closeUpgradeModal();
    showSection('homepage');
    setTimeout(() => scrollToPricing(), 100);
}

// Workflow Limit Check
function canCreateWorkflow() {
    if (!userState.tier) {
        // No tier selected - allow for demo purposes
        return true;
    }
    
    const limits = TIER_LIMITS[userState.tier];
    if (userState.activeWorkflows >= limits.maxWorkflows) {
        showUpgradeModal(
            'Workflow Limit Reached',
            `You've reached your workflow limit of ${limits.maxWorkflows}. Upgrade your plan to create more workflows.`
        );
        return false;
    }
    return true;
}

// Execution Limit Check
function canExecuteWorkflow() {
    if (!userState.tier) {
        // No tier selected - allow for demo purposes
        return true;
    }
    
    const limits = TIER_LIMITS[userState.tier];
    if (userState.monthlyExecutionCount >= limits.maxExecutions) {
        showUpgradeModal(
            'Execution Limit Reached',
            `You've reached your monthly execution limit of ${limits.maxExecutions.toLocaleString()}. Upgrade your plan to continue.`
        );
        return false;
    }
    return true;
}

// Increment Execution Count
function incrementExecutionCount() {
    if (!userState.tier) return;
    
    userState.monthlyExecutionCount++;
    
    // In production, this would sync with backend
    console.log(`Execution count: ${userState.monthlyExecutionCount}`);
    
    // Check if limit reached
    const limits = TIER_LIMITS[userState.tier];
    if (userState.monthlyExecutionCount >= limits.maxExecutions) {
        showUpgradeModal(
            'Execution Limit Reached',
            `You've reached your monthly execution limit of ${limits.maxExecutions.toLocaleString()}. Upgrade your plan to continue.`
        );
    }
}

// Reset Execution Count (called monthly)
function resetExecutionCount() {
    userState.monthlyExecutionCount = 0;
    userState.executionResetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    console.log('Execution count reset');
}

// Recommendation Engine (inlined)
function getUpgradeRecommendation(data) {
    if (data.score < 40) return "snapshot";
    if (data.orgSize === "enterprise") return "enterprise";
    if (data.automationPotential > 70) return "acceleration";
    if (data.score > 70) return "acceleration";
    return "deep";
}

function getRecommendationDetails(tier, score) {
    const recommendations = {
        snapshot: {
            title: "AI Snapshot",
            price: "$49",
            reason: `Your score of ${Math.round(score)} indicates you need quick clarity on AI readiness. Get actionable insights in 24 hours.`,
            cta: "Get AI Snapshot"
        },
        deep: {
            title: "AI Deep Diagnostic",
            price: "$149",
            reason: `Your score of ${Math.round(score)} shows potential. A deep diagnostic will map specific opportunities across your organization.`,
            cta: "Run Deep Diagnostic"
        },
        acceleration: {
            title: "Acceleration Plan",
            price: "$500/month",
            reason: `Your score of ${Math.round(score)} shows strong readiness. Accelerate your AI transformation with ongoing optimization and strategy.`,
            cta: "Upgrade to Acceleration"
        },
        enterprise: {
            title: "Enterprise AI Audit",
            price: "Starting $5,000",
            reason: "Your organization needs a comprehensive transformation blueprint with executive roadmap and change strategy.",
            cta: "Request Enterprise Audit"
        }
    };
    return recommendations[tier];
}

// Diagnostic Questions (matching backend scoring config)
const DIAGNOSTIC_QUESTIONS = [
    {
        id: "business_objective",
        question: "What is your primary business objective for AI?",
        options: [
            "No clear objective",
            "Vague goals (e.g., 'be innovative')",
            "Specific goal (e.g., 'reduce costs')",
            "Quantified goal (e.g., 'reduce costs by 20%')"
        ]
    },
    {
        id: "current_ai_usage",
        question: "What is your current AI usage?",
        options: [
            "No AI usage",
            "Exploring/researching",
            "Running pilots",
            "Production deployment"
        ]
    },
    {
        id: "data_availability",
        question: "How is your data availability & quality?",
        options: [
            "No centralized data",
            "Siloed data across departments",
            "Partially centralized",
            "Fully centralized and accessible"
        ]
    },
    {
        id: "process_documentation",
        question: "What is your level of process documentation?",
        options: [
            "No documentation",
            "Informal/tribal knowledge",
            "Some processes documented",
            "Comprehensive documentation"
        ]
    },
    {
        id: "workflow_standardization",
        question: "How standardized are your workflows?",
        options: [
            "Ad-hoc workflows",
            "Some standardization",
            "Mostly standardized",
            "Fully standardized"
        ]
    },
    {
        id: "erp_integration",
        question: "What is your ERP / system integration level?",
        options: [
            "No systems",
            "Disconnected systems",
            "Some integration",
            "Fully integrated"
        ]
    },
    {
        id: "automation_level",
        question: "What is your current automation level?",
        options: [
            "Fully manual",
            "Minimal automation (<10%)",
            "Moderate automation (10-50%)",
            "High automation (>50%)"
        ]
    },
    {
        id: "decision_speed",
        question: "How fast is your decision-making?",
        options: [
            "Months",
            "Weeks",
            "Days",
            "Hours"
        ]
    },
    {
        id: "leadership_alignment",
        question: "What is your leadership alignment on AI?",
        options: [
            "No alignment",
            "Some interest",
            "Supportive",
            "Championing AI"
        ]
    },
    {
        id: "budget_ownership",
        question: "What is your budget situation for AI?",
        options: [
            "No budget",
            "Exploring budget",
            "Budget allocated",
            "Dedicated AI budget"
        ]
    },
    {
        id: "change_readiness",
        question: "How ready is your organization for change?",
        options: [
            "Resistant to change",
            "Cautious",
            "Open to change",
            "Embracing change"
        ]
    },
    {
        id: "internal_capability",
        question: "What is your internal AI capability?",
        options: [
            "No technical team",
            "Limited technical skills",
            "Some AI knowledge",
            "Strong AI team"
        ]
    }
];

// State
let currentQuestionIndex = 0;
let answers = {};
let diagnosticResult = null;

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    window.scrollTo(0, 0);
    
    // Initialize diagnostic if showing that section
    if (sectionId === 'diagnostic') {
        initializeDiagnostic();
    }
}

// Diagnostic Flow
function initializeDiagnostic() {
    currentQuestionIndex = 0;
    answers = {};
    
    // Show questions, hide loading and results
    document.getElementById('diagnostic-questions').style.display = 'block';
    document.getElementById('diagnostic-loading').style.display = 'none';
    document.getElementById('diagnostic-results').style.display = 'none';
    
    renderQuestion();
}

function renderQuestion() {
    const question = DIAGNOSTIC_QUESTIONS[currentQuestionIndex];
    const container = document.getElementById('question-container');
    
    // Update progress
    const progress = ((currentQuestionIndex + 1) / DIAGNOSTIC_QUESTIONS.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    
    // Render question
    container.innerHTML = `
        <div class="question-card">
            <h3>${question.question}</h3>
            <div class="options-container">
                ${question.options.map((option, index) => `
                    <button class="option-button ${answers[question.id] === index ? 'selected' : ''}" 
                            onclick="selectOption(${index})">
                        ${option}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    // Update navigation buttons
    document.getElementById('prev-button').disabled = currentQuestionIndex === 0;
    document.getElementById('next-button').disabled = answers[question.id] === undefined;
    
    // Show/hide submit button
    if (currentQuestionIndex === DIAGNOSTIC_QUESTIONS.length - 1) {
        document.getElementById('next-button').style.display = 'none';
        document.getElementById('submit-button').style.display = answers[question.id] !== undefined ? 'block' : 'none';
    } else {
        document.getElementById('next-button').style.display = 'block';
        document.getElementById('submit-button').style.display = 'none';
    }
}

function selectOption(optionIndex) {
    const question = DIAGNOSTIC_QUESTIONS[currentQuestionIndex];
    answers[question.id] = optionIndex;
    renderQuestion();
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < DIAGNOSTIC_QUESTIONS.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    }
}

async function submitDiagnostic() {
    // Validate all questions answered
    if (Object.keys(answers).length !== DIAGNOSTIC_QUESTIONS.length) {
        alert('Please answer all questions before submitting.');
        return;
    }
    
    // Show loading state
    document.getElementById('diagnostic-questions').style.display = 'none';
    document.getElementById('diagnostic-loading').style.display = 'block';
    
    try {
        // Format answers for API
        const formattedAnswers = Object.entries(answers).map(([question_id, selected_option]) => ({
            question_id,
            selected_option
        }));
        
        // Call backend API
        const response = await fetch(`${API_BASE_URL}/api/v1/diagnostic/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ answers: formattedAnswers })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        diagnosticResult = await response.json();
        
        // Display results
        displayResults(diagnosticResult);
        
    } catch (error) {
        console.error('Diagnostic failed:', error);
        alert('Failed to run diagnostic. Please ensure the backend is running on port 8081 and try again.');
        document.getElementById('diagnostic-loading').style.display = 'none';
        document.getElementById('diagnostic-questions').style.display = 'block';
    }
}

function displayResults(result) {
    // Hide loading, show results
    document.getElementById('diagnostic-loading').style.display = 'none';
    document.getElementById('diagnostic-results').style.display = 'block';
    
    // Update score
    document.getElementById('score-number').textContent = Math.round(result.score);
    document.getElementById('score-category').textContent = result.category;
    document.getElementById('category-explanation').textContent = result.category_explanation;
    
    // Update insights
    const insightsList = document.getElementById('insights-list');
    insightsList.innerHTML = '';
    result.insights.forEach(insight => {
        const li = document.createElement('li');
        li.textContent = insight;
        insightsList.appendChild(li);
    });
    
    // Update recommendation
    document.getElementById('recommendation-text').textContent = result.recommendation;
    
    // Display badge
    const badgeContainer = document.getElementById('badge-container');
    badgeContainer.innerHTML = result.badge_svg;
    
    // Generate upgrade recommendation
    displayUpgradeRecommendation(result);
    
    // Scroll to top of results
    window.scrollTo(0, 0);
}

function displayUpgradeRecommendation(result) {
    const data = {
        score: result.score,
        orgSize: estimateOrgSize(result.score),
        automationPotential: estimateAutomationPotential(result.score)
    };
    
    const recommendedTier = getUpgradeRecommendation(data);
    const details = getRecommendationDetails(recommendedTier, result.score);
    
    const recommendationContent = document.getElementById('recommendation-content');
    recommendationContent.innerHTML = `
        <div class="recommendation-card">
            <h4>${details.title}</h4>
            <div class="recommendation-price">${details.price}</div>
            <p class="recommendation-reason">${details.reason}</p>
            <button class="cta-button primary" onclick="showSection('contact')">${details.cta}</button>
            <p class="secondary-option"><a href="#" onclick="showSection('homepage')">View all options</a></p>
        </div>
    `;
}

function estimateOrgSize(score) {
    return score > 70 ? "enterprise" : "mid-market";
}

function estimateAutomationPotential(score) {
    return score > 60 ? 75 : 50;
}

function downloadBadge() {
    if (!diagnosticResult) return;
    
    // Create a blob from the SVG
    const svgBlob = new Blob([diagnosticResult.badge_svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `aivory-readiness-badge-${Math.round(diagnosticResult.score)}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Contact Form
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('name'),
                company: formData.get('company'),
                email: formData.get('email'),
                message: formData.get('message')
            };
            
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                const result = await response.json();
                
                // Show success message
                contactForm.style.display = 'none';
                document.getElementById('contact-success').style.display = 'block';
                
            } catch (error) {
                console.error('Contact form submission failed:', error);
                alert('Failed to send message. Please try again or contact us directly.');
            }
        });
    }
});
