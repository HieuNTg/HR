import getGemini from "@/lib/gemini";
import type { ParsedJdData } from "./jd-parser";
import type { ParsedCvData } from "@/lib/validations/cv";

export interface MatchResult {
  overallScore: number;
  breakdown: {
    technicalSkills: { score: number; matched: string[]; missing: string[] };
    experience: { score: number; yearsRequired: number; yearsActual: number; level: string };
    education: { score: number; matched: string[]; missing: string[] };
    niceToHave: { score: number; matched: string[]; missing: string[] };
  };
  strengths: string[];
  gaps: string[];
  recommendedFocusAreas: string[];
}

function keywordMatch(required: string[], available: string[]): { matched: string[]; missing: string[] } {
  const lowerAvail = available.map((s) => s.toLowerCase());
  const matched: string[] = [];
  const missing: string[] = [];
  for (const req of required) {
    const found = lowerAvail.some((a) => a.includes(req.toLowerCase()) || req.toLowerCase().includes(a));
    (found ? matched : missing).push(req);
  }
  return { matched, missing };
}

export async function calculateMatch(
  parsedJd: ParsedJdData,
  parsedCv: ParsedCvData
): Promise<MatchResult> {
  const cvSkillNames = parsedCv.skills.map((s) => s.skillName);

  // Technical skills - required only
  const requiredTech = parsedJd.requirements.technical
    .filter((t) => t.isRequired)
    .map((t) => t.name);
  const niceToHaveTech = parsedJd.requirements.technical
    .filter((t) => !t.isRequired)
    .map((t) => t.name);

  const techMatch = keywordMatch(requiredTech, cvSkillNames);
  const niceMatch = keywordMatch(niceToHaveTech, cvSkillNames);

  const techScore = requiredTech.length > 0
    ? Math.round((techMatch.matched.length / requiredTech.length) * 100)
    : 100;
  const niceScore = niceToHaveTech.length > 0
    ? Math.round((niceMatch.matched.length / niceToHaveTech.length) * 100)
    : 100;

  // Experience
  const yearsRequired = parsedJd.requirements.experience.totalYears ?? 0;
  const yearsActual = parsedCv.totalYearsExperience ?? 0;
  const expScore = yearsRequired === 0
    ? 100
    : Math.min(100, Math.round((yearsActual / yearsRequired) * 100));

  const expLevel =
    yearsActual >= yearsRequired * 1.5 ? "exceeds"
    : yearsActual >= yearsRequired ? "meets"
    : yearsActual >= yearsRequired * 0.7 ? "close"
    : "below";

  // Education - keyword match on degree/institution
  const requiredEdu = parsedJd.requirements.education
    .filter((e) => e.isRequired)
    .map((e) => `${e.level} ${e.field}`);
  const cvEdu = parsedCv.education.map((e) => `${e.degree} ${e.field ?? ""} ${e.institution}`);
  const eduMatch = keywordMatch(requiredEdu, cvEdu);
  const eduScore = requiredEdu.length > 0
    ? Math.round((eduMatch.matched.length / requiredEdu.length) * 100)
    : 100;

  // Weighted overall score: must-have 70%, nice-to-have 30%
  // must-have = tech(40%) + exp(20%) + edu(10%) of 70
  const mustHaveScore = (techScore * 0.4 + expScore * 0.2 + eduScore * 0.1) / 0.7;
  const overallScore = Math.round(mustHaveScore * 0.7 + niceScore * 0.3);

  // Use Gemini for semantic strengths/gaps analysis
  const prompt = `Given this job-candidate match analysis, provide strengths, gaps, and recommended focus areas.

Job requires: ${requiredTech.join(", ")} | ${yearsRequired}+ years experience
Candidate has: ${cvSkillNames.slice(0, 15).join(", ")} | ${yearsActual} years experience
Technical match: ${techScore}% | Experience match: ${expScore}%
Missing skills: ${techMatch.missing.join(", ")}

Respond ONLY with JSON:
{
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"],
  "recommendedFocusAreas": ["area1", "area2", "area3"]
}`;

  let strengths: string[] = [];
  let gaps: string[] = [];
  let recommendedFocusAreas: string[] = [];

  try {
    const semantic = await getGemini().generateJSON<{
      strengths: string[];
      gaps: string[];
      recommendedFocusAreas: string[];
    }>(prompt, { model: "gemini-3.1-flash-lite-preview", temperature: 0.3 });
    strengths = semantic.strengths ?? [];
    gaps = semantic.gaps ?? [];
    recommendedFocusAreas = semantic.recommendedFocusAreas ?? [];
  } catch {
    // Fallback: derive from keyword analysis
    strengths = techMatch.matched.slice(0, 3).map((s) => `Strong ${s} skills`);
    gaps = techMatch.missing.slice(0, 3).map((s) => `Missing ${s} requirement`);
    recommendedFocusAreas = techMatch.missing.slice(0, 3);
  }

  return {
    overallScore,
    breakdown: {
      technicalSkills: { score: techScore, matched: techMatch.matched, missing: techMatch.missing },
      experience: { score: expScore, yearsRequired, yearsActual, level: expLevel },
      education: { score: eduScore, matched: eduMatch.matched, missing: eduMatch.missing },
      niceToHave: { score: niceScore, matched: niceMatch.matched, missing: niceMatch.missing },
    },
    strengths,
    gaps,
    recommendedFocusAreas,
  };
}
