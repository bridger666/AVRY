"""Scoring configuration for AI readiness diagnostic"""

# 12 diagnostic questions with 4 options each (scored 0-3)
DIAGNOSTIC_QUESTIONS = [
    {
        "id": "business_objective",
        "question": "What is your primary business objective for AI?",
        "options": [
            {"text": "No clear objective", "score": 0},
            {"text": "Vague goals (e.g., 'be innovative')", "score": 1},
            {"text": "Specific goal (e.g., 'reduce costs')", "score": 2},
            {"text": "Quantified goal (e.g., 'reduce costs by 20%')", "score": 3}
        ]
    },
    {
        "id": "current_ai_usage",
        "question": "What is your current AI usage?",
        "options": [
            {"text": "No AI usage", "score": 0},
            {"text": "Exploring/researching", "score": 1},
            {"text": "Running pilots", "score": 2},
            {"text": "Production deployment", "score": 3}
        ]
    },
    {
        "id": "data_availability",
        "question": "How is your data availability & quality?",
        "options": [
            {"text": "No centralized data", "score": 0},
            {"text": "Siloed data across departments", "score": 1},
            {"text": "Partially centralized", "score": 2},
            {"text": "Fully centralized and accessible", "score": 3}
        ]
    },
    {
        "id": "process_documentation",
        "question": "What is your level of process documentation?",
        "options": [
            {"text": "No documentation", "score": 0},
            {"text": "Informal/tribal knowledge", "score": 1},
            {"text": "Some processes documented", "score": 2},
            {"text": "Comprehensive documentation", "score": 3}
        ]
    },
    {
        "id": "workflow_standardization",
        "question": "How standardized are your workflows?",
        "options": [
            {"text": "Ad-hoc workflows", "score": 0},
            {"text": "Some standardization", "score": 1},
            {"text": "Mostly standardized", "score": 2},
            {"text": "Fully standardized", "score": 3}
        ]
    },
    {
        "id": "erp_integration",
        "question": "What is your ERP / system integration level?",
        "options": [
            {"text": "No systems", "score": 0},
            {"text": "Disconnected systems", "score": 1},
            {"text": "Some integration", "score": 2},
            {"text": "Fully integrated", "score": 3}
        ]
    },
    {
        "id": "automation_level",
        "question": "What is your current automation level?",
        "options": [
            {"text": "Fully manual", "score": 0},
            {"text": "Minimal automation (<10%)", "score": 1},
            {"text": "Moderate automation (10-50%)", "score": 2},
            {"text": "High automation (>50%)", "score": 3}
        ]
    },
    {
        "id": "decision_speed",
        "question": "How fast is your decision-making?",
        "options": [
            {"text": "Months", "score": 0},
            {"text": "Weeks", "score": 1},
            {"text": "Days", "score": 2},
            {"text": "Hours", "score": 3}
        ]
    },
    {
        "id": "leadership_alignment",
        "question": "What is your leadership alignment on AI?",
        "options": [
            {"text": "No alignment", "score": 0},
            {"text": "Some interest", "score": 1},
            {"text": "Supportive", "score": 2},
            {"text": "Championing AI", "score": 3}
        ]
    },
    {
        "id": "budget_ownership",
        "question": "What is your budget situation for AI?",
        "options": [
            {"text": "No budget", "score": 0},
            {"text": "Exploring budget", "score": 1},
            {"text": "Budget allocated", "score": 2},
            {"text": "Dedicated AI budget", "score": 3}
        ]
    },
    {
        "id": "change_readiness",
        "question": "How ready is your organization for change?",
        "options": [
            {"text": "Resistant to change", "score": 0},
            {"text": "Cautious", "score": 1},
            {"text": "Open to change", "score": 2},
            {"text": "Embracing change", "score": 3}
        ]
    },
    {
        "id": "internal_capability",
        "question": "What is your internal AI capability?",
        "options": [
            {"text": "No technical team", "score": 0},
            {"text": "Limited technical skills", "score": 1},
            {"text": "Some AI knowledge", "score": 2},
            {"text": "Strong AI team", "score": 3}
        ]
    }
]

# Maximum possible score
MAX_RAW_SCORE = 36  # 12 questions × 3 points

# Category definitions
CATEGORY_RANGES = {
    "AI Unready": (0, 30),
    "AI Curious": (31, 50),
    "AI Ready": (51, 70),
    "AI Native": (71, 100)
}

# Category explanations
CATEGORY_EXPLANATIONS = {
    "AI Unready": "Your organization is in the early stages of AI readiness. Significant foundational work is needed before AI can deliver value.",
    "AI Curious": "Your organization is exploring AI with some foundational elements in place. Strategic investments in data and processes will accelerate AI adoption.",
    "AI Ready": "Your organization demonstrates strong AI readiness with solid foundations. You're prepared to pursue meaningful AI initiatives with high success probability.",
    "AI Native": "Your organization operates at the forefront of AI adoption. You're positioned to leverage AI as a core strategic differentiator."
}


def get_question_score_mapping() -> dict:
    """
    Get a mapping of question IDs to their score options.
    
    Returns:
        Dict mapping question_id -> list of (option_index, score) tuples
    """
    mapping = {}
    for question in DIAGNOSTIC_QUESTIONS:
        question_id = question["id"]
        mapping[question_id] = [
            (idx, opt["score"]) 
            for idx, opt in enumerate(question["options"])
        ]
    return mapping
