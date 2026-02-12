"""Static fallback content for AI readiness diagnostic"""
from typing import Dict, List
from pydantic import BaseModel


class StaticContent(BaseModel):
    """Static content for a readiness category"""
    insights: List[str]
    recommendation: str
    narrative: str


# Static content for each readiness category
STATIC_CONTENT: Dict[str, StaticContent] = {
    "AI Unready": StaticContent(
        insights=[
            "Your organization lacks foundational data infrastructure needed for AI adoption",
            "Process documentation and standardization should be prioritized before AI initiatives",
            "Leadership alignment on AI goals is critical for successful transformation"
        ],
        recommendation=(
            "Focus on building foundational capabilities before pursuing AI. "
            "Start by centralizing data sources, documenting key processes, and "
            "establishing clear business objectives for AI adoption. "
            "Consider a phased approach beginning with process automation."
        ),
        narrative=(
            "Your organization is in the early stages of AI readiness. "
            "Significant foundational work is needed before AI can deliver value."
        )
    ),
    
    "AI Curious": StaticContent(
        insights=[
            "Your organization shows interest in AI but faces data accessibility challenges",
            "Workflow standardization would significantly improve AI implementation success",
            "Decision-making processes could benefit from data-driven automation"
        ],
        recommendation=(
            "You're ready to begin targeted AI pilots in specific areas. "
            "Focus on use cases with clear ROI and available data. "
            "Prioritize data centralization and process standardization to "
            "unlock broader AI opportunities across the organization."
        ),
        narrative=(
            "Your organization is exploring AI with some foundational elements in place. "
            "Strategic investments in data and processes will accelerate AI adoption."
        )
    ),
    
    "AI Ready": StaticContent(
        insights=[
            "Your organization has strong foundational capabilities for AI adoption",
            "Data infrastructure and process standardization support AI initiatives",
            "Leadership alignment positions you well for successful AI implementation"
        ],
        recommendation=(
            "You're well-positioned to implement AI solutions across multiple use cases. "
            "Focus on high-impact areas where AI can drive measurable business outcomes. "
            "Consider building internal AI capabilities while partnering with experts "
            "for complex implementations."
        ),
        narrative=(
            "Your organization demonstrates strong AI readiness with solid foundations. "
            "You're prepared to pursue meaningful AI initiatives with high success probability."
        )
    ),
    
    "AI Native": StaticContent(
        insights=[
            "Your organization exhibits advanced AI maturity across all dimensions",
            "Strong technical capabilities and leadership support enable ambitious AI initiatives",
            "Data infrastructure and processes are optimized for AI-driven operations"
        ],
        recommendation=(
            "You're ready for advanced AI implementations including custom models, "
            "autonomous agents, and AI-driven decision systems. Focus on strategic "
            "differentiation through AI and building proprietary capabilities that "
            "create competitive advantages in your market."
        ),
        narrative=(
            "Your organization operates at the forefront of AI adoption. "
            "You're positioned to leverage AI as a core strategic differentiator."
        )
    )
}


def get_static_content(category: str) -> StaticContent:
    """
    Get static fallback content for a readiness category.
    
    Args:
        category: Readiness category name
    
    Returns:
        StaticContent with insights, recommendation, and narrative
    
    Raises:
        ValueError: If category is unknown
    """
    if category not in STATIC_CONTENT:
        raise ValueError(f"Unknown category: {category}")
    
    return STATIC_CONTENT[category]
