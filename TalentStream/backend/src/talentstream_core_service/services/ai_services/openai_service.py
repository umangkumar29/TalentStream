from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
from talentstream_core_service.configs.config import settings


class OpenAIService:
    def __init__(self):
        self._client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL if settings.OPENAI_BASE_URL else None,
        ) if settings.OPENAI_API_KEY else None

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def get_embedding(self, text: str) -> list[float]:
        """
        Returns a 1536-dimensional embedding vector using OpenAI text-embedding-3-small.
        Both JD and resume embeddings MUST use this same model so cosine similarity is meaningful.
        Falls back to a zero vector if the API key is not configured.
        """
        if not self._client:
            # Zero vector fallback — similarity searches will return no results but won't crash
            return [0.0] * settings.OPENAI_EMBEDDING_DIMENSION

        # Truncate to ~8000 chars — well within the 8191 token limit of text-embedding-3-small
        truncated_text = text[:8000]
        response = self._client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=truncated_text,
        )
        return response.data[0].embedding

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def generate_match_justification(self, job_description: str, resume_text: str) -> str:
        """
        Uses GPT-4o to assess how well a candidate fits the job description.
        Returns a structured 2–3 sentence justification.
        """
        if not self._client:
            return "Mock justification: OpenAI API key not configured."

        system_prompt = (
            "You are an expert technical recruiter. Given a job description and a candidate's "
            "resume, produce a concise 2–3 sentence 'Match Justification' that highlights key "
            "matching strengths and any notable gaps. Be specific and factual."
        )
        user_prompt = (
            f"### Job Description\n{job_description}\n\n"
            f"### Candidate Resume\n{resume_text[:6000]}\n\n"
            "### Match Justification:"
        )

        response = self._client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=256,
        )
        return response.choices[0].message.content.strip()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def generate_jd_from_keywords(self, keywords: str, role_title: str) -> str:
        """
        Synthesizes a professional job description from a set of keywords and a role title.
        """
        if not self._client:
            return f"Mock JD for {role_title}: OpenAI API key not configured."

        system_prompt = (
            "You are an expert technical writer and recruiter. Create a professional, clear, and "
            "compelling job description based on the provided role title and keywords. "
            "Include sections for 'Role Overview', 'Key Responsibilities', and 'Required Technical Skills'.\n\n"
            "IMPORTANT:\n"
            "- Do not use bold (**) or heading (###) markdown, keep headers as plain text on their own line.\n"
            "- YOU MUST USE the hyphen character '-' for bullet points in the Responsibilities and Skills sections.\n"
            "- Keep formatting clean and suitable for rendering.\n\n"
            "Structure:\n"
            "Job Title\n"
            "Role Overview\n"
            "Key Responsibilities\n"
            "Required Skills\n\n"
            "Keep the tone professional and concise."
        )
        user_prompt = f"Role: {role_title}\nKeywords: {keywords}\n\nGenerate JD:"

        response = self._client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=1000,
        )
        return response.choices[0].message.content.strip()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def parse_resume_to_json(self, resume_text: str) -> dict:
        """
        Parses a raw resume text into the agreed structured JSON schema.
        Returns a dict matching the canonical candidate JSON format.
        Falls back to a minimal stub if the AI client is not configured.
        """
        if not self._client:
            return {
                "candidate": {
                    "name": "Unknown",
                    "total_experience_years": 0.0,
                    "professional_summary": "AI parsing not configured.",
                    "skills": [],
                    "domain_expertise": [],
                    "work_experience": [],
                    "key_projects": [],
                    "education_and_certifications": []
                }
            }

        system_prompt = (
            "You are an expert resume parser. Extract structured information from the resume text "
            "and return ONLY a valid JSON object — no markdown, no extra text, no code fences.\n\n"
            "The JSON must strictly follow this schema:\n"
            "{\n"
            "  \"candidate\": {\n"
            "    \"name\": \"string\",\n"
            "    \"email\": \"string or null\",\n"
            "    \"phone\": \"string or null\",\n"
            "    \"total_experience_years\": number,\n"
            "    \"professional_summary\": \"1-2 sentence summary\",\n"
            "    \"skills\": [\"skill1\", \"skill2\", ...],\n"
            "    \"domain_expertise\": [\"domain1\", ...],\n"
            "    \"work_experience\": [\n"
            "      {\n"
            "        \"role\": \"string\",\n"
            "        \"company\": \"string\",\n"
            "        \"duration\": \"string\",\n"
            "        \"technologies\": [\"string\"],\n"
            "        \"key_achievements\": [\"string\"]\n"
            "      }\n"
            "    ],\n"
            "    \"key_projects\": [\n"
            "      {\n"
            "        \"project_name\": \"string\",\n"
            "        \"role_played\": \"string\",\n"
            "        \"technologies_used\": [\"string\"],\n"
            "        \"description\": \"string\"\n"
            "      }\n"
            "    ],\n"
            "    \"education_and_certifications\": [\"string\"]\n"
            "  }\n"
            "}\n\n"
            "Rules:\n"
            "- skills: flat list of ALL skills (technical + soft), no nesting\n"
            "- total_experience_years: numeric only (e.g. 6.5)\n"
            "- email: extract email address if present, else null\n"
            "- phone: extract phone number if present, else null\n"
            "- If a field has no data, use an empty list [] or 0 or null\n"
            "- Return ONLY the JSON, nothing else"
        )
        user_prompt = f"Resume Text:\n{resume_text[:8000]}\n\nExtract JSON:"

        response = self._client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        import json
        content = response.choices[0].message.content
        if not content:
            return {
                "candidate": {
                    "name": "Unknown",
                    "total_experience_years": 0.0,
                    "professional_summary": "AI extraction returned empty.",
                    "skills": [],
                    "domain_expertise": [],
                    "work_experience": [],
                    "key_projects": [],
                    "education_and_certifications": []
                }
            }
        try:
            content = content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            return json.loads(content.strip())
        except json.JSONDecodeError:
            return {
                "candidate": {
                    "name": "Unknown",
                    "total_experience_years": 0.0,
                    "professional_summary": "Failed to parse AI output.",
                    "skills": [],
                    "domain_expertise": [],
                    "work_experience": [],
                    "key_projects": [],
                    "education_and_certifications": []
                }
            }


openai_service = OpenAIService()
