from app.agents.base import BaseAgent

class ReportAgent(BaseAgent):
    async def process(self, input_data: dict) -> dict:
        """Generate a readable diagnostic report with fixed structure"""
        diagnosis = input_data.get("diagnosis", "")
        evaluation = input_data.get("evaluation", "")
        
        system_prompt = """You are a report writer for AI readiness diagnostics. 
You MUST follow this exact structure:

1. AI Readiness Score
   [Provide a score out of 100 with brief context]

2. What This Score Means
   [Explain what this score indicates about their AI readiness]

3. Top 3 Operational Issues
   Issue 1:
   - Symptom: [Observable problem]
   - Likely Root Cause: [Underlying reason]
   - Why This Matters: [Business impact]
   
   Issue 2:
   - Symptom: [Observable problem]
   - Likely Root Cause: [Underlying reason]
   - Why This Matters: [Business impact]
   
   Issue 3:
   - Symptom: [Observable problem]
   - Likely Root Cause: [Underlying reason]
   - Why This Matters: [Business impact]

4. Automation Potential
   [Identify quick wins and automation opportunities]

5. What To Fix First (90-day view)
   [Prioritized action plan for next 90 days]

6. Next Step with Aivory (CTA)
   [Clear call-to-action for engaging with Aivory]

Be concise, specific, and actionable. Write for business leaders, not technical experts."""

        prompt = f"""Based on this evaluation and diagnosis, create a structured report:

EVALUATION:
{evaluation}

DIAGNOSIS:
{diagnosis}

Generate the report following the exact 6-section structure."""
        
        report = await self.llm.generate(prompt, system_prompt)
        
        return {
            "report": report,
            "timestamp": input_data.get("timestamp")
        }
