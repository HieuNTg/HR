import getGemini from "@/lib/gemini";

// Cấu trúc dữ liệu sau khi parse JD bằng Gemini
export interface ParsedJdData {
  position: {
    title: string;
    level: "junior" | "mid" | "senior" | "lead" | "manager" | "director";
    department: string;
    location: string;
    employmentType: string;
  };
  requirements: {
    technical: Array<{
      name: string;
      level: string;
      yearsRequired: number | null;
      isRequired: boolean;
    }>;
    soft: Array<{ name: string; isRequired: boolean }>;
    experience: { totalYears: number; specificAreas: string[] };
    education: Array<{ level: string; field: string; isRequired: boolean }>;
    certifications: string[];
  };
  responsibilities: Array<{ description: string; skills: string[] }>;
  keywords: string[];
  interviewFocusAreas: {
    technical: number;
    problemSolving: number;
    behavioral: number;
    cultureFit: number;
  };
}

const PARSE_PROMPT = `You are an expert HR analyst. Parse the job description and extract structured data.

EXAMPLE INPUT: "Senior Backend Engineer at TechCorp. Requires 5+ years Node.js, TypeScript. Must have AWS experience. Team player, strong communicator."

EXAMPLE OUTPUT:
{
  "position": { "title": "Senior Backend Engineer", "level": "senior", "department": "Engineering", "location": "Remote", "employmentType": "FULL_TIME" },
  "requirements": {
    "technical": [
      { "name": "Node.js", "level": "advanced", "yearsRequired": 5, "isRequired": true },
      { "name": "TypeScript", "level": "intermediate", "yearsRequired": null, "isRequired": true },
      { "name": "AWS", "level": "intermediate", "yearsRequired": null, "isRequired": true }
    ],
    "soft": [
      { "name": "Team collaboration", "isRequired": true },
      { "name": "Communication", "isRequired": true }
    ],
    "experience": { "totalYears": 5, "specificAreas": ["backend development", "cloud infrastructure"] },
    "education": [],
    "certifications": []
  },
  "responsibilities": [
    { "description": "Build and maintain backend services", "skills": ["Node.js", "TypeScript"] }
  ],
  "keywords": ["backend", "Node.js", "TypeScript", "AWS", "senior"],
  "interviewFocusAreas": { "technical": 50, "problemSolving": 25, "behavioral": 15, "cultureFit": 10 }
}

Now parse this job description:
`;

// Parse JD text bằng Gemini Pro, trả về cấu trúc ParsedJdData
export async function parseJobDescription(rawText: string): Promise<ParsedJdData> {
  const prompt = `${PARSE_PROMPT}\n\n${rawText}`;

  const result = await getGemini().generateJSON<ParsedJdData>(prompt, {
    model: "gemini-3.1-flash-lite-preview",
    temperature: 0.3,
    maxOutputTokens: 4096,
  });

  // Validate và normalize interviewFocusAreas để tổng = 100
  const focus = result.interviewFocusAreas;
  const total = focus.technical + focus.problemSolving + focus.behavioral + focus.cultureFit;
  if (total !== 100 && total > 0) {
    result.interviewFocusAreas = {
      technical: Math.round((focus.technical / total) * 100),
      problemSolving: Math.round((focus.problemSolving / total) * 100),
      behavioral: Math.round((focus.behavioral / total) * 100),
      cultureFit: 100 - Math.round((focus.technical / total) * 100) - Math.round((focus.problemSolving / total) * 100) - Math.round((focus.behavioral / total) * 100),
    };
  }

  return result;
}
