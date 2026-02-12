# Design Document: Aivory AI Readiness Platform

## Overview

Aivory is a complete web application that provides AI readiness diagnostics, monetization pathways, and consultation funnels. The system consists of a responsive frontend (HTML/CSS/JavaScript) and a Python FastAPI backend with Mistral-7B-Instruct LLM integration. The architecture prioritizes graceful degradation, ensuring the UI functions even when AI enrichment fails.

The platform delivers value in under 3 minutes through a 12-question diagnostic that produces a normalized AI readiness score (0-100), category classification, personalized insights, and actionable recommendations. Users are then guided through tiered monetization offerings ($49, $150, Custom) and consultation pathways for automation build and AI system design services.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Homepage │  │ Diagnostic│  │  Results │  │ Contact  │   │
│  │          │  │   Flow    │  │   Page   │  │   Form   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/JSON
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   API Routes                          │  │
│  │  /diagnostic/run  │  /contact  │  /health            │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Service Layer                            │  │
│  │  • Scoring Service (Mandatory)                        │  │
│  │  • AI Enrichment Service (Optional)                   │  │
│  │  • Badge Generation Service                           │  │
│  │  • Static Fallback Service                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              LLM Integration                          │  │
│  │  Mistral-7B-Instruct (with timeout & error handling)  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Journey Start**: User lands on homepage, selects "Start Diagnostic"
2. **Question Flow**: Frontend presents 12 questions sequentially
3. **Submission**: Frontend sends answers to `/api/v1/diagnostic/run`
4. **Mandatory Scoring**: Backend calculates raw score, normalizes to 0-100, assigns category
5. **AI Enrichment (Optional)**: Backend attempts to generate insights/recommendations via LLM
6. **Graceful Degradation**: If LLM fails, backend uses static content for category
7. **Response**: Backend returns score, category, insights, recommendations
8. **Result Display**: Frontend renders results with badge download option
9. **Monetization**: Frontend displays tiered offerings and consultation CTAs

## Components and Interfaces

### Frontend Components

#### 1. Homepage Component

**Purpose**: Landing page with value proposition and three entry points

**Structure**:
```html
<Homepage>
  <Header>
    <h1>Make AI Make Sense for Your Organization</h1>
    <p>Diagnose how your organization really works...</p>
  </Header>
  
  <ModelCards>
    <Card id="diagnostic">
      <Title>AI Readiness Diagnostic</Title>
      <Description>12-question assessment</Description>
      <Button>Start Diagnostic</Button>
    </Card>
    
    <Card id="automation">
      <Title>Build Automation with Aivory</Title>
      <Description>Turn insights into implementations</Description>
      <Button>Build Automation Now</Button>
    </Card>
    
    <Card id="design">
      <Title>Design Your AI System</Title>
      <Description>Strategic architecture planning</Description>
      <Button>Design My AI System</Button>
    </Card>
  </ModelCards>
</Homepage>
```

**Interactions**:
- Click "Start Diagnostic" → Navigate to Diagnostic Flow
- Click "Build Automation Now" → Navigate to Automation Section
- Click "Design My AI System" → Navigate to Design Section

#### 2. Diagnostic Flow Component

**Purpose**: Google Form-style 12-question assessment

**Question Set** (with scoring 0-3 per question):

1. **Primary business objective for AI**
   - 0: No clear objective
   - 1: Vague goals (e.g., "be innovative")
   - 2: Specific goal (e.g., "reduce costs")
   - 3: Quantified goal (e.g., "reduce costs by 20%")

2. **Current AI usage**
   - 0: No AI usage
   - 1: Exploring/researching
   - 2: Running pilots
   - 3: Production deployment

3. **Data availability & quality**
   - 0: No centralized data
   - 1: Siloed data across departments
   - 2: Partially centralized
   - 3: Fully centralized and accessible

4. **Process documentation**
   - 0: No documentation
   - 1: Informal/tribal knowledge
   - 2: Some processes documented
   - 3: Comprehensive documentation

5. **Workflow standardization**
   - 0: Ad-hoc workflows
   - 1: Some standardization
   - 2: Mostly standardized
   - 3: Fully standardized

6. **ERP / system integration**
   - 0: No systems
   - 1: Disconnected systems
   - 2: Some integration
   - 3: Fully integrated

7. **Automation level**
   - 0: Fully manual
   - 1: Minimal automation (<10%)
   - 2: Moderate automation (10-50%)
   - 3: High automation (>50%)

8. **Decision-making speed**
   - 0: Months
   - 1: Weeks
   - 2: Days
   - 3: Hours

9. **Leadership alignment**
   - 0: No alignment
   - 1: Some interest
   - 2: Supportive
   - 3: Championing AI

10. **Budget ownership**
    - 0: No budget
    - 1: Exploring budget
    - 2: Budget allocated
    - 3: Dedicated AI budget

11. **Change readiness**
    - 0: Resistant to change
    - 1: Cautious
    - 2: Open to change
    - 3: Embracing change

12. **Internal AI capability**
    - 0: No technical team
    - 1: Limited technical skills
    - 2: Some AI knowledge
    - 3: Strong AI team

**Interface**:
```javascript
interface DiagnosticAnswer {
  questionId: string;
  selectedOption: number; // 0-3
}

interface DiagnosticSubmission {
  answers: DiagnosticAnswer[];
  timestamp: string;
}
```

#### 3. Loading State Component

**Purpose**: Provide feedback during backend processing

**Behavior**:
- Display immediately after form submission
- Show animated spinner
- Display message: "AI is analyzing how your organization works…"
- Minimum display time: 1 second (for UX smoothness)
- Transition to results when backend responds

#### 4. Results Page Component

**Purpose**: Display AI readiness score, insights, and monetization paths

**Structure**:
```html
<ResultsPage>
  <ScoreSection>
    <ScoreNumber>75</ScoreNumber>
    <Category>AI Ready</Category>
    <CategoryExplanation>...</CategoryExplanation>
  </ScoreSection>
  
  <InsightsSection>
    <Insight>• Insight 1</Insight>
    <Insight>• Insight 2</Insight>
    <Insight>• Insight 3</Insight>
  </InsightsSection>
  
  <RecommendationSection>
    <Paragraph>Recommendation text...</Paragraph>
  </RecommendationSection>
  
  <BadgeSection>
    <BadgePreview />
    <DownloadButton>Download Badge</DownloadButton>
    <SocialShareHint>Share your readiness score</SocialShareHint>
  </BadgeSection>
  
  <TieredOfferingsSection>
    <Tier level="1">
      <Title>Quick AI Snapshot</Title>
      <Price>$49</Price>
      <Description>High-level diagnosis...</Description>
      <Button>Get Snapshot</Button>
    </Tier>
    <Tier level="2">
      <Title>Operational Diagnostic</Title>
      <Price>$150</Price>
      <Description>Deeper workflow analysis...</Description>
      <Button>Get Diagnostic</Button>
    </Tier>
    <Tier level="3">
      <Title>Deep AI Transformation</Title>
      <Price>Custom</Price>
      <Description>End-to-end transformation...</Description>
      <Button>Contact Us</Button>
    </Tier>
  </TieredOfferingsSection>
</ResultsPage>
```

#### 5. Build Automation Section

**Purpose**: Explain automation services and funnel to consultation

**Content**:
- Headline: "Turn Diagnostic Insights into Real Automation"
- Description: Workflow automation, AI agents, ERP integration, decision support
- CTA: "Build Automation with Aivory Team" → Contact Form

#### 6. Design AI System Section

**Purpose**: Explain strategic architecture services and funnel to consultation

**Content**:
- Headline: "Design Your AI System Architecture"
- Description: Strategic planning using diagnostic signals, architecture & roadmap focus
- CTA: "Design My AI System" → Contact Form

#### 7. Contact Form Component

**Purpose**: Capture consultation requests

**Fields**:
- Name (required)
- Company (required)
- Email (required, validated)
- What do you want to build? (required, textarea)

**Submission**: POST to `/api/v1/contact`

### Backend Components

#### 1. API Routes

**Diagnostic Endpoint**:
```python
@router.post("/diagnostic/run")
async def run_diagnostic(submission: DiagnosticSubmission) -> DiagnosticResult:
    """
    Process diagnostic answers and return results.
    
    Steps:
    1. Validate submission
    2. Calculate mandatory score
    3. Attempt AI enrichment (with timeout)
    4. Fall back to static content if AI fails
    5. Generate badge data
    6. Return complete result
    """
```

**Contact Endpoint**:
```python
@router.post("/contact")
async def submit_contact(contact: ContactForm) -> ContactResponse:
    """
    Process contact form submission.
    
    Steps:
    1. Validate contact data
    2. Store or forward to CRM/email
    3. Return success confirmation
    """
```

**Health Endpoint**:
```python
@router.get("/health")
async def health_check() -> HealthStatus:
    """
    Check system health including LLM availability.
    """
```

#### 2. Scoring Service (Mandatory)

**Purpose**: Calculate AI readiness score deterministically

**Algorithm**:
```python
def calculate_score(answers: List[DiagnosticAnswer]) -> ScoringResult:
    # Sum all answer values (0-3 each)
    raw_score = sum(answer.selectedOption for answer in answers)
    
    # Normalize to 0-100 scale
    max_score = 36  # 12 questions × 3 points
    normalized_score = (raw_score / max_score) * 100
    
    # Assign category
    if normalized_score <= 30:
        category = "AI Unready"
    elif normalized_score <= 50:
        category = "AI Curious"
    elif normalized_score <= 70:
        category = "AI Ready"
    else:
        category = "AI Native"
    
    return ScoringResult(
        raw_score=raw_score,
        normalized_score=normalized_score,
        category=category
    )
```

**Category Definitions**:
- **AI Unready (0-30)**: Significant foundational gaps; focus on data and process basics
- **AI Curious (31-50)**: Some readiness; need to address data centralization and standardization
- **AI Ready (51-70)**: Good foundation; ready for targeted AI pilots
- **AI Native (71-100)**: Strong AI maturity; ready for advanced implementations

#### 3. AI Enrichment Service (Optional)

**Purpose**: Generate personalized insights and recommendations using LLM

**Process**:
```python
async def enrich_with_ai(
    answers: List[DiagnosticAnswer],
    score: ScoringResult,
    timeout: float = 5.0
) -> Optional[AIEnrichment]:
    """
    Attempt to generate AI-powered insights.
    
    Returns None if LLM fails or times out.
    """
    try:
        # Generate 3 insights
        insights_prompt = build_insights_prompt(answers, score)
        insights = await llm_client.generate(
            insights_prompt,
            timeout=timeout
        )
        
        # Generate recommendation
        rec_prompt = build_recommendation_prompt(answers, score)
        recommendation = await llm_client.generate(
            rec_prompt,
            timeout=timeout
        )
        
        # Generate narrative
        narrative_prompt = build_narrative_prompt(answers, score)
        narrative = await llm_client.generate(
            narrative_prompt,
            timeout=timeout
        )
        
        return AIEnrichment(
            insights=parse_insights(insights),
            recommendation=recommendation,
            narrative=narrative
        )
    except (TimeoutError, ConnectionError, LLMError) as e:
        logger.warning(f"AI enrichment failed: {e}")
        return None
```

**Prompt Templates**:

*Insights Prompt*:
```
Based on this AI readiness diagnostic:
- Score: {score}/100 ({category})
- Key answers: {summarize_answers}

Generate exactly 3 short, actionable insights (1-2 sentences each) about this organization's AI readiness. Focus on specific strengths or gaps.

Format as bullet points.
```

*Recommendation Prompt*:
```
Based on this AI readiness diagnostic:
- Score: {score}/100 ({category})
- Key answers: {summarize_answers}

Write a single paragraph (3-4 sentences) recommending the next steps this organization should take to improve AI readiness or begin AI adoption.
```

*Narrative Prompt*:
```
Based on this AI readiness diagnostic:
- Score: {score}/100 ({category})

Write a 2-sentence narrative explaining what this score means for the organization's AI journey.
```

#### 4. Static Fallback Service

**Purpose**: Provide quality content when AI enrichment fails

**Static Content by Category**:

```python
STATIC_CONTENT = {
    "AI Unready": {
        "insights": [
            "Your organization lacks foundational data infrastructure needed for AI adoption",
            "Process documentation and standardization should be prioritized before AI initiatives",
            "Leadership alignment on AI goals is critical for successful transformation"
        ],
        "recommendation": (
            "Focus on building foundational capabilities before pursuing AI. "
            "Start by centralizing data sources, documenting key processes, and "
            "establishing clear business objectives for AI adoption. "
            "Consider a phased approach beginning with process automation."
        ),
        "narrative": (
            "Your organization is in the early stages of AI readiness. "
            "Significant foundational work is needed before AI can deliver value."
        )
    },
    "AI Curious": {
        "insights": [
            "Your organization shows interest in AI but faces data accessibility challenges",
            "Workflow standardization would significantly improve AI implementation success",
            "Decision-making processes could benefit from data-driven automation"
        ],
        "recommendation": (
            "You're ready to begin targeted AI pilots in specific areas. "
            "Focus on use cases with clear ROI and available data. "
            "Prioritize data centralization and process standardization to "
            "unlock broader AI opportunities across the organization."
        ),
        "narrative": (
            "Your organization is exploring AI with some foundational elements in place. "
            "Strategic investments in data and processes will accelerate AI adoption."
        )
    },
    "AI Ready": {
        "insights": [
            "Your organization has strong foundational capabilities for AI adoption",
            "Data infrastructure and process standardization support AI initiatives",
            "Leadership alignment positions you well for successful AI implementation"
        ],
        "recommendation": (
            "You're well-positioned to implement AI solutions across multiple use cases. "
            "Focus on high-impact areas where AI can drive measurable business outcomes. "
            "Consider building internal AI capabilities while partnering with experts "
            "for complex implementations."
        ),
        "narrative": (
            "Your organization demonstrates strong AI readiness with solid foundations. "
            "You're prepared to pursue meaningful AI initiatives with high success probability."
        )
    },
    "AI Native": {
        "insights": [
            "Your organization exhibits advanced AI maturity across all dimensions",
            "Strong technical capabilities and leadership support enable ambitious AI initiatives",
            "Data infrastructure and processes are optimized for AI-driven operations"
        ],
        "recommendation": (
            "You're ready for advanced AI implementations including custom models, "
            "autonomous agents, and AI-driven decision systems. Focus on strategic "
            "differentiation through AI and building proprietary capabilities that "
            "create competitive advantages in your market."
        ),
        "narrative": (
            "Your organization operates at the forefront of AI adoption. "
            "You're positioned to leverage AI as a core strategic differentiator."
        )
    }
}
```

#### 5. Badge Generation Service

**Purpose**: Create downloadable visual badge for users

**Badge Design**:
- SVG format for scalability
- Display score prominently (large number)
- Display category label
- Include Aivory branding
- Color scheme based on category:
  - AI Unready: Red/Orange (#E74C3C)
  - AI Curious: Yellow/Amber (#F39C12)
  - AI Ready: Blue (#3498DB)
  - AI Native: Green (#27AE60)

**Implementation**:
```python
def generate_badge(score: int, category: str) -> str:
    """
    Generate SVG badge as string.
    
    Returns SVG markup that can be:
    - Embedded in HTML
    - Downloaded as .svg file
    - Converted to PNG for sharing
    """
    color = get_category_color(category)
    
    svg_template = f"""
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="{color}" rx="10"/>
      <text x="150" y="80" font-size="60" fill="white" 
            text-anchor="middle" font-weight="bold">{score}</text>
      <text x="150" y="120" font-size="20" fill="white" 
            text-anchor="middle">{category}</text>
      <text x="150" y="180" font-size="14" fill="white" 
            text-anchor="middle">Aivory AI Readiness</text>
    </svg>
    """
    
    return svg_template
```

#### 6. LLM Integration

**Purpose**: Interface with Mistral-7B-Instruct model

**Configuration**:
```python
class LLMConfig:
    model: str = "mistralai/Mistral-7B-Instruct"
    base_url: str = "http://localhost:11434"  # Ollama default
    timeout: float = 5.0
    max_tokens: int = 500
    temperature: float = 0.7
```

**Client Interface**:
```python
class MistralClient:
    async def generate(
        self,
        prompt: str,
        timeout: float = 5.0
    ) -> str:
        """
        Generate text from prompt with timeout.
        
        Raises:
        - TimeoutError: If generation exceeds timeout
        - ConnectionError: If LLM service unavailable
        - LLMError: If generation fails
        """
```

## Data Models

### Frontend Models

```typescript
interface DiagnosticAnswer {
  questionId: string;
  selectedOption: number; // 0-3
}

interface DiagnosticSubmission {
  answers: DiagnosticAnswer[];
  timestamp: string;
}

interface DiagnosticResult {
  score: number; // 0-100
  category: string; // "AI Unready" | "AI Curious" | "AI Ready" | "AI Native"
  categoryExplanation: string;
  insights: string[]; // Array of 3 insights
  recommendation: string;
  badgeSvg: string;
  enrichedByAI: boolean; // True if AI enrichment succeeded
}

interface ContactForm {
  name: string;
  company: string;
  email: string;
  message: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
}
```

### Backend Models

```python
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

class DiagnosticAnswer(BaseModel):
    question_id: str
    selected_option: int = Field(ge=0, le=3)

class DiagnosticSubmission(BaseModel):
    answers: List[DiagnosticAnswer] = Field(min_items=12, max_items=12)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ScoringResult(BaseModel):
    raw_score: int = Field(ge=0, le=36)
    normalized_score: float = Field(ge=0, le=100)
    category: str

class AIEnrichment(BaseModel):
    insights: List[str] = Field(min_items=3, max_items=3)
    recommendation: str
    narrative: str

class DiagnosticResult(BaseModel):
    score: float
    category: str
    category_explanation: str
    insights: List[str]
    recommendation: str
    badge_svg: str
    enriched_by_ai: bool

class ContactForm(BaseModel):
    name: str = Field(min_length=1)
    company: str = Field(min_length=1)
    email: EmailStr
    message: str = Field(min_length=10)

class ContactResponse(BaseModel):
    success: bool
    message: str

class HealthStatus(BaseModel):
    status: str
    llm_available: bool
    timestamp: datetime
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

- **Scoring properties (3.1, 3.4, 3.5, 5.1)** can be consolidated into comprehensive scoring properties
- **Navigation properties (1.7, 9.6)** can be combined into a general navigation property
- **Graceful degradation properties (6.4, 6.5, 18.1, 20.4)** can be consolidated into comprehensive fallback properties
- **Validation properties (12.2, 16.2, 17.3)** can be combined into general validation properties
- **Error handling properties (6.7, 18.2, 18.3, 18.4)** can be consolidated into comprehensive error handling properties

The following properties provide unique validation value after consolidation:

### Core Scoring Properties

**Property 1: Answer Score Range Validity**

*For any* answer option in the diagnostic, the assigned score value must be in the range [0, 3].

**Validates: Requirements 3.1**

**Property 2: Maximum Score Invariant**

*For any* diagnostic configuration, the maximum possible raw score must equal 36 (12 questions × 3 points maximum per question).

**Validates: Requirements 3.2**

**Property 3: Score Calculation Correctness**

*For any* set of 12 diagnostic answers, the raw score must equal the sum of all individual answer scores, and the normalized score must equal (raw_score / 36) × 100.

**Validates: Requirements 3.4, 3.5, 5.1**

**Property 4: Category Assignment Boundaries**

*For any* normalized score value:
- If score ∈ [0, 30] → category = "AI Unready"
- If score ∈ (30, 50] → category = "AI Curious"  
- If score ∈ (50, 70] → category = "AI Ready"
- If score ∈ (70, 100] → category = "AI Native"

**Validates: Requirements 5.2**

**Property 5: Category Explanation Completeness**

*For any* readiness category ("AI Unready", "AI Curious", "AI Ready", "AI Native"), a category explanation must exist and be non-empty.

**Validates: Requirements 5.3**

### Resilience and Graceful Degradation Properties

**Property 6: Scoring Independence from LLM**

*For any* set of diagnostic answers, the scoring calculation (raw score, normalized score, category assignment) must complete successfully regardless of LLM availability status.

**Validates: Requirements 5.4, 5.5**

**Property 7: Static Fallback Completeness**

*For any* readiness category, static fallback content must exist containing exactly 3 insights, 1 recommendation paragraph, and 1 narrative.

**Validates: Requirements 20.1, 20.2, 20.3**

**Property 8: Graceful Degradation to Static Content**

*For any* diagnostic result where AI enrichment fails, the system must return static insights, recommendations, and narrative matching the user's readiness category.

**Validates: Requirements 6.4, 6.5, 18.1, 20.4**

**Property 9: Diagnostic Flow Completion Guarantee**

*For any* diagnostic submission, the system must complete the flow and return results (score, category, insights, recommendations, badge) regardless of LLM availability.

**Validates: Requirements 6.6**

**Property 10: Error Logging Without User Exposure**

*For any* AI enrichment failure, the system must log the error internally while returning user-friendly content without exposing technical error details.

**Validates: Requirements 6.7**

**Property 11: LLM Failure Non-Crash**

*For any* LLM request that fails (timeout, connection error, or other failure), the system must handle the failure gracefully without crashing or returning 500 errors.

**Validates: Requirements 14.4**

**Property 12: UI Rendering Resilience**

*For any* backend error or AI enrichment failure, the result page must render all required sections (score, category, insights, recommendations, badge) using either AI-generated or static content.

**Validates: Requirements 7.8, 18.5**

### Badge Generation Properties

**Property 13: Badge Score Inclusion**

*For any* AI readiness score value, the generated badge SVG must contain that score as a visible text element.

**Validates: Requirements 8.1**

**Property 14: Badge Category Inclusion**

*For any* readiness category, the generated badge SVG must contain that category label as a visible text element.

**Validates: Requirements 8.2**

**Property 15: Badge Generation Independence**

*For any* diagnostic result, a badge must be generated successfully regardless of whether AI enrichment succeeded or failed.

**Validates: Requirements 8.5**

### User Interface Properties

**Property 16: Homepage Card Structure**

*For any* rendering of the homepage, exactly 3 model cards must be present, each containing a title and a call-to-action button.

**Validates: Requirements 1.3**

**Property 17: Question Display Format**

*For any* question in the diagnostic flow, when displayed, it must show exactly 4 answer options.

**Validates: Requirements 2.2**

**Property 18: Answer Recording**

*For any* question and any selected answer option, the selection must be recorded in the submission data structure.

**Validates: Requirements 2.4**

**Property 19: Navigation Correctness**

*For any* clickable card or tier button, clicking it must navigate to the corresponding section or form (diagnostic → diagnostic flow, automation → automation section, design → design section, tier → contact/purchase flow).

**Validates: Requirements 1.7, 9.6**

**Property 20: Tiered Offering CTA Presence**

*For any* tier in the monetization offerings, a clear call-to-action button must be present.

**Validates: Requirements 9.5**

### Data Validation Properties

**Property 21: Form Validation Enforcement**

*For any* form submission (contact form or diagnostic), if any required field is missing or invalid, the system must prevent submission and return validation errors.

**Validates: Requirements 12.2, 16.2, 17.3**

**Property 22: Validation Error Detail**

*For any* invalid data submission, the system must return validation errors with field-level details indicating which fields failed validation and why.

**Validates: Requirements 17.4, 18.2**

**Property 23: Diagnostic Answer Count Constraint**

*For any* diagnostic submission, the system must validate that exactly 12 answers are provided (no more, no fewer).

**Validates: Requirements 2.1, 2.5** (implicit constraint)

### API Response Properties

**Property 24: Diagnostic Response Structure**

*For any* successful diagnostic submission, the API response must be valid JSON containing fields: score (number), category (string), insights (array of 3 strings), recommendation (string), badge_svg (string), enriched_by_ai (boolean).

**Validates: Requirements 15.4**

**Property 25: HTTP Status Code Appropriateness**

*For any* API response:
- Successful operations → 200 or 201
- Validation errors → 400 or 422
- Server errors → 500
- LLM unavailable (with fallback) → 200 (success with static content)

**Validates: Requirements 15.5, 18.4**

**Property 26: LLM Response Parsing**

*For any* valid LLM response text, the parsing function must extract structured data (insights as array, recommendation as string) without throwing exceptions.

**Validates: Requirements 14.6**

### Error Handling Properties

**Property 27: Error Message User-Friendliness**

*For any* error condition (validation failure, unexpected error, LLM timeout), the error message returned to users must be user-friendly and not expose technical implementation details (stack traces, internal paths, database errors).

**Validates: Requirements 18.3**


## Error Handling

### Error Categories

The system handles four primary error categories:

1. **Validation Errors**: Invalid user input (missing fields, wrong formats, out-of-range values)
2. **LLM Errors**: Mistral LLM unavailable, timeout, or generation failure
3. **System Errors**: Unexpected exceptions, database errors, file system errors
4. **Network Errors**: Frontend-backend communication failures

### Error Handling Strategy

#### 1. Validation Errors

**Detection**: Pydantic models automatically validate incoming data

**Handling**:
```python
@router.post("/diagnostic/run")
async def run_diagnostic(submission: DiagnosticSubmission):
    try:
        # Pydantic validates automatically
        result = await diagnostic_service.process(submission)
        return result
    except ValidationError as e:
        # Return 422 with field-level details
        return JSONResponse(
            status_code=422,
            content={
                "error": "Validation failed",
                "details": e.errors()
            }
        )
```

**User Experience**: Frontend displays field-specific error messages, allows correction and resubmission

#### 2. LLM Errors (Graceful Degradation)

**Detection**: Timeout, connection error, or invalid response from Mistral LLM

**Handling**:
```python
async def enrich_with_ai(answers, score):
    try:
        # Attempt AI enrichment with timeout
        async with timeout(5.0):
            insights = await llm_client.generate_insights(answers, score)
            recommendation = await llm_client.generate_recommendation(answers, score)
            narrative = await llm_client.generate_narrative(score)
            
            return AIEnrichment(
                insights=insights,
                recommendation=recommendation,
                narrative=narrative
            )
    except (TimeoutError, ConnectionError, LLMError) as e:
        # Log error internally
        logger.warning(f"AI enrichment failed: {e}")
        
        # Return None to trigger fallback
        return None

# In main diagnostic flow
ai_enrichment = await enrich_with_ai(answers, score)

if ai_enrichment is None:
    # Use static fallback content
    content = STATIC_CONTENT[score.category]
    insights = content["insights"]
    recommendation = content["recommendation"]
    narrative = content["narrative"]
    enriched_by_ai = False
else:
    insights = ai_enrichment.insights
    recommendation = ai_enrichment.recommendation
    narrative = ai_enrichment.narrative
    enriched_by_ai = True
```

**User Experience**: User receives complete results with static content, unaware of LLM failure. System logs indicate fallback was used.

#### 3. System Errors

**Detection**: Unexpected exceptions during processing

**Handling**:
```python
@router.post("/diagnostic/run")
async def run_diagnostic(submission: DiagnosticSubmission):
    try:
        result = await diagnostic_service.process(submission)
        return result
    except ValidationError as e:
        # Handled above
        pass
    except Exception as e:
        # Log full error with stack trace
        logger.error(f"Unexpected error in diagnostic: {e}", exc_info=True)
        
        # Return user-friendly message
        return JSONResponse(
            status_code=500,
            content={
                "error": "An unexpected error occurred",
                "message": "Please try again. If the problem persists, contact support."
            }
        )
```

**User Experience**: User sees friendly error message, can retry. Support team has full error details in logs.

#### 4. Network Errors

**Detection**: Frontend fetch() fails or times out

**Handling**:
```javascript
async function submitDiagnostic(answers) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/diagnostic/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers }),
            signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your connection and try again.');
        } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to server. Please check your connection.');
        } else {
            throw new Error('An error occurred. Please try again.');
        }
    }
}
```

**User Experience**: Clear error messages guide user to check connection or retry. Loading state is dismissed.

### Error Logging

**Log Levels**:
- **ERROR**: System errors, unexpected exceptions
- **WARNING**: LLM failures, degraded functionality
- **INFO**: Successful operations, fallback usage
- **DEBUG**: Detailed flow information

**Log Format**:
```python
import logging

logger = logging.getLogger("aivory")
logger.setLevel(logging.INFO)

# Example log entries
logger.info(f"Diagnostic completed: score={score}, category={category}, ai_enriched={enriched}")
logger.warning(f"LLM enrichment failed, using static content: {error}")
logger.error(f"Unexpected error in diagnostic flow: {error}", exc_info=True)
```

### Health Monitoring

**Health Check Endpoint**:
```python
@router.get("/health")
async def health_check():
    llm_available = await check_llm_availability()
    
    return {
        "status": "healthy",
        "llm_available": llm_available,
        "timestamp": datetime.utcnow().isoformat()
    }
```

**Purpose**: Allows monitoring systems to detect when LLM is unavailable (system still healthy, using fallbacks)

## Testing Strategy

### Dual Testing Approach

The system requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide input space.

### Property-Based Testing Configuration

**Library**: Use `hypothesis` for Python backend, `fast-check` for JavaScript frontend

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `# Feature: aivory-diagnostic-mvp, Property {number}: {property_text}`

**Example Property Test**:
```python
from hypothesis import given, strategies as st
import pytest

# Feature: aivory-diagnostic-mvp, Property 3: Score Calculation Correctness
@given(st.lists(st.integers(min_value=0, max_value=3), min_size=12, max_size=12))
def test_score_calculation_correctness(answer_scores):
    """
    For any set of 12 diagnostic answers, the raw score must equal 
    the sum of all individual answer scores, and the normalized score 
    must equal (raw_score / 36) × 100.
    """
    answers = [
        DiagnosticAnswer(question_id=f"q{i}", selected_option=score)
        for i, score in enumerate(answer_scores)
    ]
    
    result = calculate_score(answers)
    
    expected_raw = sum(answer_scores)
    expected_normalized = (expected_raw / 36) * 100
    
    assert result.raw_score == expected_raw
    assert abs(result.normalized_score - expected_normalized) < 0.01
```

### Unit Testing Strategy

**Focus Areas**:
- Specific examples demonstrating correct behavior
- Edge cases (empty inputs, boundary values, maximum values)
- Error conditions (invalid data, LLM failures, timeouts)
- Integration points between components

**Avoid**: Writing too many unit tests for scenarios already covered by property tests

**Example Unit Tests**:
```python
def test_category_assignment_boundaries():
    """Test specific boundary values for category assignment"""
    assert get_category(0) == "AI Unready"
    assert get_category(30) == "AI Unready"
    assert get_category(31) == "AI Curious"
    assert get_category(50) == "AI Curious"
    assert get_category(51) == "AI Ready"
    assert get_category(70) == "AI Ready"
    assert get_category(71) == "AI Native"
    assert get_category(100) == "AI Native"

def test_llm_timeout_fallback():
    """Test that LLM timeout triggers static fallback"""
    # Mock LLM to timeout
    with patch('llm_client.generate', side_effect=TimeoutError):
        result = await diagnostic_service.process(sample_submission)
        
        assert result.enriched_by_ai == False
        assert len(result.insights) == 3
        assert result.recommendation is not None

def test_contact_form_email_validation():
    """Test that invalid emails are rejected"""
    invalid_form = ContactForm(
        name="John Doe",
        company="Acme Inc",
        email="not-an-email",
        message="I want to build AI"
    )
    
    with pytest.raises(ValidationError) as exc_info:
        validate_contact_form(invalid_form)
    
    assert "email" in str(exc_info.value)
```

### Frontend Testing

**Unit Tests** (using Jest or similar):
- Component rendering with different props
- Form validation logic
- State management
- API response handling

**Example**:
```javascript
describe('DiagnosticFlow', () => {
    test('displays exactly 12 questions', () => {
        const { getAllByRole } = render(<DiagnosticFlow />);
        const questions = getAllByRole('group');
        expect(questions).toHaveLength(12);
    });
    
    test('records answer selection', () => {
        const { getByLabelText } = render(<DiagnosticFlow />);
        const option = getByLabelText('Increase revenue');
        
        fireEvent.click(option);
        
        expect(option).toBeChecked();
    });
});
```

**Integration Tests**:
- Complete diagnostic flow from start to results
- Error handling and retry logic
- Navigation between sections

### Backend Testing

**Unit Tests**:
- Scoring calculation with various inputs
- Category assignment at boundaries
- Static fallback content retrieval
- Badge SVG generation
- Data model validation

**Integration Tests**:
- Complete diagnostic endpoint flow
- LLM integration with mocked responses
- Database operations (if added)
- Health check endpoint

**Property Tests**:
- All 27 correctness properties from design document
- Each property implemented as a separate test
- Minimum 100 iterations per test

### Test Coverage Goals

- **Backend**: 80%+ line coverage, 100% of critical paths
- **Frontend**: 70%+ line coverage, 100% of user flows
- **Property Tests**: All 27 properties implemented and passing

### Continuous Integration

**Pre-commit**:
- Run linters (pylint, eslint)
- Run type checkers (mypy, TypeScript)
- Run fast unit tests

**CI Pipeline**:
- Run all unit tests
- Run all property tests (100 iterations each)
- Check test coverage
- Build frontend
- Run integration tests

**Deployment Gate**: All tests must pass before deployment

