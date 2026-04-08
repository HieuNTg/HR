import type { ParsedJdData } from "./jd-parser";

// Cấu trúc rubric đánh giá phỏng vấn
export interface EvaluationRubric {
  dimensions: Array<{
    name: string;
    weight: number; // 0-1, tổng = 1
    criteria: Array<{
      criterion: string;
      excellentDescription: string;
      goodDescription: string;
      poorDescription: string;
    }>;
  }>;
  totalQuestions: number;
  estimatedDuration: number; // phút
}

// Tạo rubric đánh giá dựa trên dữ liệu JD đã parse
export function generateEvaluationRubric(parsedJd: ParsedJdData): EvaluationRubric {
  const { interviewFocusAreas, requirements } = parsedJd;

  // Chuyển percentage thành weight (0-1)
  const technicalWeight = interviewFocusAreas.technical / 100;
  const problemSolvingWeight = interviewFocusAreas.problemSolving / 100;
  const behavioralWeight = interviewFocusAreas.behavioral / 100;
  const cultureFitWeight = interviewFocusAreas.cultureFit / 100;

  const dimensions: EvaluationRubric["dimensions"] = [];

  // Dimension: Technical Skills
  if (technicalWeight > 0) {
    const topSkills = requirements.technical.slice(0, 3).map((s) => s.name);
    dimensions.push({
      name: "Technical Skills",
      weight: technicalWeight,
      criteria: [
        {
          criterion: `Core technical knowledge (${topSkills.join(", ") || "relevant technologies"})`,
          excellentDescription: "Demonstrates deep expertise, provides detailed examples, identifies edge cases",
          goodDescription: "Solid understanding, can apply knowledge to practical problems",
          poorDescription: "Limited knowledge, struggles with basic concepts",
        },
        {
          criterion: "Code quality and best practices",
          excellentDescription: "Discusses patterns, testing, maintainability proactively",
          goodDescription: "Aware of best practices, applies them when prompted",
          poorDescription: "No awareness of code quality considerations",
        },
      ],
    });
  }

  // Dimension: Problem Solving
  if (problemSolvingWeight > 0) {
    dimensions.push({
      name: "Problem Solving",
      weight: problemSolvingWeight,
      criteria: [
        {
          criterion: "Analytical thinking and approach",
          excellentDescription: "Breaks down complex problems systematically, considers multiple solutions",
          goodDescription: "Logical approach, arrives at correct solution with minor guidance",
          poorDescription: "Struggles to decompose problems, jumps to solutions without analysis",
        },
        {
          criterion: "Handling ambiguity",
          excellentDescription: "Asks clarifying questions, defines assumptions clearly",
          goodDescription: "Acknowledges ambiguity, seeks clarification when needed",
          poorDescription: "Proceeds without clarification, misses key constraints",
        },
      ],
    });
  }

  // Dimension: Behavioral
  if (behavioralWeight > 0) {
    const softSkills = requirements.soft.slice(0, 2).map((s) => s.name);
    dimensions.push({
      name: "Behavioral Competencies",
      weight: behavioralWeight,
      criteria: [
        {
          criterion: `Soft skills (${softSkills.join(", ") || "collaboration, communication"})`,
          excellentDescription: "Provides specific STAR examples demonstrating impact",
          goodDescription: "Gives relevant examples showing competency",
          poorDescription: "Vague answers, cannot recall specific examples",
        },
        {
          criterion: "Growth mindset and learning",
          excellentDescription: "Demonstrates continuous learning with concrete examples",
          goodDescription: "Open to feedback, shows willingness to learn",
          poorDescription: "Resistant to feedback, limited learning examples",
        },
      ],
    });
  }

  // Dimension: Culture Fit
  if (cultureFitWeight > 0) {
    dimensions.push({
      name: "Culture Fit",
      weight: cultureFitWeight,
      criteria: [
        {
          criterion: "Alignment with team values",
          excellentDescription: "Strong alignment, articulates shared values with examples",
          goodDescription: "General alignment, understands team dynamics",
          poorDescription: "Misaligned values or unclear about team culture",
        },
      ],
    });
  }

  // Ước tính số câu hỏi và thời gian phỏng vấn
  const techQuestions = requirements.technical.length > 0 ? Math.min(requirements.technical.length * 2, 8) : 4;
  const softQuestions = requirements.soft.length > 0 ? Math.min(requirements.soft.length, 4) : 2;
  const totalQuestions = techQuestions + softQuestions + 2; // +2 for behavioral/culture

  return {
    dimensions,
    totalQuestions,
    estimatedDuration: Math.ceil(totalQuestions * 3.5), // ~3.5 phút mỗi câu
  };
}
