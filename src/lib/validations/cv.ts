import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["application/pdf", "text/plain"];

export const uploadCvSchema = z.object({
  candidateId: z.string().cuid(),
  fileName: z.string().min(1).max(255),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE, "File must be under 10MB"),
  mimeType: z.enum(["application/pdf", "text/plain"]),
  fileUrl: z.string().url(),
});

export const parseCvSchema = z.object({
  cvId: z.string().cuid(),
  forceReparse: z.boolean().default(false),
});

export const cvSkillSchema = z.object({
  skillName: z.string().min(1).max(100),
  skillCategory: z
    .enum(["TECHNICAL", "SOFT", "LANGUAGE", "TOOL"])
    .default("TECHNICAL"),
  proficiencyLevel: z.string().max(50).optional(),
  yearsExperience: z.number().min(0).max(50).optional(),
  sourceSection: z.string().max(100).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
});

export const parsedCvDataSchema = z.object({
  personalInfo: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      linkedinUrl: z.string().url().optional(),
      portfolioUrl: z.string().url().optional(),
    })
    .optional(),
  summary: z.string().optional(),
  skills: z.array(cvSkillSchema).default([]),
  experience: z
    .array(
      z.object({
        title: z.string(),
        company: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
        yearsInRole: z.number().optional(),
      })
    )
    .default([]),
  education: z
    .array(
      z.object({
        degree: z.string(),
        institution: z.string(),
        field: z.string().optional(),
        graduationYear: z.number().int().optional(),
      })
    )
    .default([]),
  certifications: z.array(z.string()).default([]),
  languages: z
    .array(
      z.object({
        language: z.string(),
        proficiency: z.string().optional(),
      })
    )
    .default([]),
  totalYearsExperience: z.number().optional(),
});

export const ALLOWED_CV_MIME_TYPES = ALLOWED_MIME_TYPES;

export type UploadCvInput = z.infer<typeof uploadCvSchema>;
export type ParseCvInput = z.infer<typeof parseCvSchema>;
export type CvSkillInput = z.infer<typeof cvSkillSchema>;
export type ParsedCvData = z.infer<typeof parsedCvDataSchema>;
