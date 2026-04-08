import prisma from "@/lib/prisma";
import { parseJobDescription } from "./jd-parser";
import { generateEvaluationRubric } from "./evaluation-rubric-generator";
import type { CreateJobPositionInput, UpdateJobPositionInput } from "@/lib/validations/jd";

interface GetJobsParams {
  page?: number;
  limit?: number;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  search?: string;
}

// Lấy danh sách JD có phân trang và lọc
export async function getJobs(params: GetJobsParams = {}) {
  const { page = 1, limit = 10, status, search } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { department: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.jobPosition.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { requirements: true, interviews: true } } },
    }),
    prisma.jobPosition.count({ where }),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Lấy chi tiết một JD kèm requirements
export async function getJobById(id: string) {
  return prisma.jobPosition.findUnique({
    where: { id },
    include: { requirements: { orderBy: { createdAt: "asc" } } },
  });
}

// Tạo JD mới, nếu có rawJdText thì tự động parse
export async function createJob(data: CreateJobPositionInput, userId: string) {
  const job = await prisma.jobPosition.create({
    data: {
      title: data.title,
      department: data.department,
      location: data.location,
      employmentType: data.employmentType as never,
      description: data.description,
      rawJdText: data.rawJdText,
      interviewSettings: data.interviewSettings as never,
      createdById: userId,
    },
    include: { requirements: true },
  });

  // Auto parse nếu có rawJdText
  if (data.rawJdText) {
    return parseAndUpdateJob(job.id);
  }

  return job;
}

// Cập nhật JD
export async function updateJob(id: string, data: UpdateJobPositionInput) {
  return prisma.jobPosition.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.department !== undefined && { department: data.department }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.employmentType !== undefined && { employmentType: data.employmentType as never }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.rawJdText !== undefined && { rawJdText: data.rawJdText }),
      ...(data.interviewSettings !== undefined && { interviewSettings: data.interviewSettings as never }),
      ...(data.status !== undefined && { status: data.status as never }),
    },
    include: { requirements: true },
  });
}

// Soft delete: chuyển status thành ARCHIVED
export async function deleteJob(id: string) {
  return prisma.jobPosition.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

// Parse JD bằng Gemini và cập nhật parsedData, evaluationRubric, requirements
export async function parseAndUpdateJob(id: string) {
  const job = await prisma.jobPosition.findUnique({ where: { id } });
  if (!job) throw new Error("Job not found");

  const rawText = job.rawJdText || job.description;
  if (!rawText) throw new Error("No text to parse");

  // Gọi Gemini để parse
  const parsedData = await parseJobDescription(rawText);
  const evaluationRubric = generateEvaluationRubric(parsedData);

  // Xóa requirements tự động cũ, tạo mới từ dữ liệu parse
  await prisma.jobRequirement.deleteMany({ where: { jobId: id } });

  const requirementCreates = buildRequirementsFromParsed(id, parsedData);

  // Transaction: cập nhật job + tạo requirements
  const [updatedJob] = await prisma.$transaction([
    prisma.jobPosition.update({
      where: { id },
      data: {
        parsedData: parsedData as never,
        evaluationRubric: evaluationRubric as never,
      },
      include: { requirements: true },
    }),
    ...requirementCreates.map((r) => prisma.jobRequirement.create({ data: r })),
  ]);

  return prisma.jobPosition.findUnique({
    where: { id },
    include: { requirements: true },
  });
}

// Xây dựng danh sách requirements từ ParsedJdData
function buildRequirementsFromParsed(
  jobId: string,
  parsed: ReturnType<typeof parseJobDescription> extends Promise<infer T> ? T : never
) {
  const reqs: Array<{
    jobId: string;
    type: "TECHNICAL" | "SOFT" | "EXPERIENCE" | "EDUCATION" | "CERTIFICATION";
    name: string;
    description?: string;
    level?: string;
    yearsRequired?: number;
    isRequired: boolean;
    weight: number;
  }> = [];

  // Kỹ năng kỹ thuật
  for (const tech of parsed.requirements.technical) {
    reqs.push({
      jobId,
      type: "TECHNICAL",
      name: tech.name,
      level: tech.level,
      yearsRequired: tech.yearsRequired ?? undefined,
      isRequired: tech.isRequired,
      weight: tech.isRequired ? 2.0 : 1.0,
    });
  }

  // Kỹ năng mềm
  for (const soft of parsed.requirements.soft) {
    reqs.push({
      jobId,
      type: "SOFT",
      name: soft.name,
      isRequired: soft.isRequired,
      weight: 1.0,
    });
  }

  // Kinh nghiệm tổng quát
  if (parsed.requirements.experience.totalYears > 0) {
    reqs.push({
      jobId,
      type: "EXPERIENCE",
      name: `${parsed.requirements.experience.totalYears}+ years experience`,
      description: parsed.requirements.experience.specificAreas.join(", "),
      isRequired: true,
      weight: 2.0,
    });
  }

  // Học vấn
  for (const edu of parsed.requirements.education) {
    reqs.push({
      jobId,
      type: "EDUCATION",
      name: `${edu.level} in ${edu.field}`,
      isRequired: edu.isRequired,
      weight: 1.0,
    });
  }

  // Chứng chỉ
  for (const cert of parsed.requirements.certifications) {
    reqs.push({
      jobId,
      type: "CERTIFICATION",
      name: cert,
      isRequired: false,
      weight: 0.5,
    });
  }

  return reqs;
}
