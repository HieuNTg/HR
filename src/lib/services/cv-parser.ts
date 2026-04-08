import gemini from "@/lib/gemini";
import { parsedCvDataSchema, type ParsedCvData } from "@/lib/validations/cv";

const PARSE_PROMPT = `You are an expert HR analyst. Extract structured data from this CV/resume.

EXAMPLE OUTPUT:
{
  "personalInfo": { "name": "Jane Doe", "email": "jane@example.com", "phone": "+1-555-0100", "location": "San Francisco, CA" },
  "summary": "Full-stack developer with 5 years experience building scalable web applications.",
  "skills": [
    { "skillName": "TypeScript", "skillCategory": "TECHNICAL", "proficiencyLevel": "advanced", "yearsExperience": 4 },
    { "skillName": "React", "skillCategory": "TECHNICAL", "proficiencyLevel": "advanced", "yearsExperience": 4 },
    { "skillName": "Communication", "skillCategory": "SOFT", "proficiencyLevel": "strong" }
  ],
  "experience": [
    { "title": "Senior Frontend Engineer", "company": "TechCorp", "startDate": "2020-01", "endDate": "2024-01", "description": "Led frontend development for SaaS platform", "yearsInRole": 4 }
  ],
  "education": [
    { "degree": "Bachelor of Science", "institution": "State University", "field": "Computer Science", "graduationYear": 2019 }
  ],
  "certifications": ["AWS Certified Developer"],
  "languages": [{ "language": "English", "proficiency": "native" }, { "language": "Spanish", "proficiency": "conversational" }],
  "totalYearsExperience": 5
}

Rules:
- skillCategory must be one of: TECHNICAL, SOFT, LANGUAGE, TOOL
- Dates as "YYYY-MM" or "YYYY" strings
- If field is unclear or missing, omit it
- Calculate totalYearsExperience from work history

Now parse this CV:
`;

export async function parseCvText(rawText: string): Promise<ParsedCvData> {
  const prompt = `${PARSE_PROMPT}\n\n${rawText}`;

  const raw = await gemini.generateJSON<unknown>(prompt, {
    model: "gemini-3.1-flash-lite-preview",
    temperature: 0.3,
    maxOutputTokens: 4096,
  });

  const result = parsedCvDataSchema.safeParse(raw);
  if (!result.success) {
    // Return partial data with defaults on validation error
    const partial = parsedCvDataSchema.safeParse({
      ...(raw as object),
      skills: [],
      experience: [],
      education: [],
      certifications: [],
      languages: [],
    });
    if (partial.success) return partial.data;
    throw new Error(`CV parse validation failed: ${result.error.message}`);
  }

  return result.data;
}
