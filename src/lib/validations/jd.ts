import { z } from "zod";

export const createJobPositionSchema = z.object({
  title: z.string().min(2).max(200),
  department: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"])
    .default("FULL_TIME"),
  description: z.string().max(10000).optional(),
  rawJdText: z.string().max(50000).optional(),
  interviewSettings: z.record(z.string(), z.unknown()).default({}),
});

export const updateJobPositionSchema = createJobPositionSchema.partial().extend({
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
});

export const createJobRequirementSchema = z.object({
  jobId: z.string().cuid(),
  type: z.enum(["TECHNICAL", "SOFT", "EXPERIENCE", "EDUCATION", "CERTIFICATION"]),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  level: z.string().max(50).optional(),
  yearsRequired: z.number().int().min(0).max(50).optional(),
  isRequired: z.boolean().default(true),
  weight: z.number().min(0).max(10).default(1.0),
});

export const parseJdSchema = z.object({
  rawText: z.string().min(50).max(50000),
  jobId: z.string().cuid().optional(),
});

export type CreateJobPositionInput = z.infer<typeof createJobPositionSchema>;
export type UpdateJobPositionInput = z.infer<typeof updateJobPositionSchema>;
export type CreateJobRequirementInput = z.infer<typeof createJobRequirementSchema>;
export type ParseJdInput = z.infer<typeof parseJdSchema>;
