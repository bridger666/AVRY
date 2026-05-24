from app.agents.base import BaseAgent
import json

class BadgeAgent(BaseAgent):
    async def process(self, input_data: dict) -> dict:
        """Generate AI readiness badge in strict JSON format"""
        score = input_data.get("score", 0)
        key_findings = input_data.get("key_findings", "")
        signals = input_data.get("signals", "")
        
        system_prompt = """You are a badge generator for AI readiness diagnostics.

CLASSIFICATION RULES:
0-30 → "AI Unaware"
31-50 → "AI Curious"
51-70 → "AI Experimenting"
71-85 → "AI Scaling"
86-100 → "AI Native"

BADGE TEXT RULES:
- Keep it short
- Neutral and factual
- Avoid words like "leader", "best", "advanced"

SHARE CAPTION RULES:
- First-person plural ("We")
- Sounds reflective, not promotional
- Suitable for LinkedIn
- Maximum 1 sentence

Return ONLY valid JSON with this exact structure:
{
  "ai_readiness_score": number,
  "category": string,
  "badge_text": string,
  "share_caption": string
}

Do not add explanations. Do not include markdown. Do not include extra keys."""

        prompt = f"""Generate badge JSON for this diagnostic:

AI readiness score: {score}
Key findings: {key_findings}
Organizational signals: {signals}

Return only the JSON object."""
        
        response = await self.llm.generate(prompt, system_prompt)
        
        # Extract JSON from response (in case LLM adds extra text)
        try:
            # Try to find JSON in response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                badge_data = json.loads(json_str)
            else:
                badge_data = json.loads(response)
        except json.JSONDecodeError:
            # Fallback if LLM doesn't return valid JSON
            category = self._classify_score(score)
            badge_data = {
                "ai_readiness_score": score,
                "category": category,
                "badge_text": f"{category} organization",
                "share_caption": "We completed our AI readiness diagnostic and learned where we stand."
            }
        
        return badge_data
    
    def _classify_score(self, score: int) -> str:
        """Classify score into category"""
        if score <= 30:
            return "AI Unaware"
        elif score <= 50:
            return "AI Curious"
        elif score <= 70:
            return "AI Experimenting"
        elif score <= 85:
            return "AI Scaling"
        else:
            return "AI Native"
