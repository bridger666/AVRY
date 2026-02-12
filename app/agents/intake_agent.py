from app.agents.base import BaseAgent

class IntakeAgent(BaseAgent):
    async def process(self, input_data: dict) -> dict:
        """Process user answers and structure them for evaluation"""
        user_answers = input_data.get("answers", {})
        
        system_prompt = "You are an intake specialist for AI readiness diagnostics. Extract and structure key information from user responses."
        prompt = f"User responses: {user_answers}\n\nExtract key business context, current AI usage, and pain points."
        
        structured_data = await self.llm.generate(prompt, system_prompt)
        
        return {
            "raw_answers": user_answers,
            "structured_context": structured_data
        }
