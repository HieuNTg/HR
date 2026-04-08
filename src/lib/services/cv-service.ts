import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";
import { parseCvText } from "./cv-parser";
import type { ParsedCvData } from "@/lib/validations/cv";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

// ─── Candidate CRUD ────────────────────────────────────────────────────────────

interface CreateCandidateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  source?: string;
  notes?: string;
}

export async function createCandidate(data: CreateCandidateInput, userId: string) {
  // Create a system user for the candidate record if needed
  return prisma.candidate.create({
    data: {
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      source: data.source,
      notes: data.notes,
    },
  });
}

interface GetCandidatesParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  jdId?: string;
}

export async function getCandidates(params: GetCandidatesParams = {}) {
  const { page = 1, limit = 10, status, search, jdId } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...(status ? { currentStatus: status as never } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(jdId ? { interviews: { some: { jobId: jdId } } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { cvs: true, interviews: true } },
      },
    }),
    prisma.candidate.count({ where }),
  ]);

  return {
    items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getCandidateById(id: string) {
  return prisma.candidate.findUnique({
    where: { id },
    include: {
      cvs: { orderBy: { uploadedAt: "desc" } },
      interviews: {
        orderBy: { createdAt: "desc" },
        include: { job: { select: { id: true, title: true } } },
      },
    },
  });
}

export async function updateCandidate(id: string, data: Partial<CreateCandidateInput>) {
  return prisma.candidate.update({ where: { id }, data });
}

export async function softDeleteCandidate(id: string) {
  return prisma.candidate.update({
    where: { id },
    data: { currentStatus: "WITHDRAWN" },
  });
}

// ─── CV Upload & Parsing ───────────────────────────────────────────────────────

export async function uploadAndParseCv(
  candidateId: string,
  file: File
): Promise<{ cv: Awaited<ReturnType<typeof prisma.cV.findUnique>>; parseTriggered: boolean }> {
  await ensureUploadsDir();

  const ext = path.extname(file.name) || (file.type === "application/pdf" ? ".pdf" : ".txt");
  const savedName = `${uuidv4()}${ext}`;
  const savedPath = path.join(UPLOADS_DIR, savedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(savedPath, buffer);

  const fileUrl = `/uploads/${savedName}`;

  const cv = await prisma.cV.create({
    data: {
      candidateId,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      parsingStatus: "PENDING",
    },
  });

  // Auto-parse: extract text then send to Gemini
  let parseTriggered = false;
  try {
    let rawText = "";

    if (file.type === "text/plain") {
      rawText = buffer.toString("utf-8");
    } else if (file.type === "application/pdf") {
      const pdfModule = await import("pdf-parse");
      const pdfParse = (pdfModule as { default?: unknown }).default ?? pdfModule;
      const pdfData = await (pdfParse as (buf: Buffer) => Promise<{ text: string }>)(buffer);
      rawText = pdfData.text;
    }

    if (rawText.trim()) {
      parseTriggered = true;
      // Fire-and-forget parse (don't block response)
      parseCvRecord(cv.id, rawText).catch((err) =>
        console.error(`[cv-service] background parse failed for cv=${cv.id}:`, err)
      );
    }
  } catch (err) {
    console.error("[cv-service] text extraction error:", err);
    await prisma.cV.update({
      where: { id: cv.id },
      data: { parsingStatus: "FAILED", parsingError: String(err) },
    });
  }

  const fresh = await prisma.cV.findUnique({ where: { id: cv.id } });
  return { cv: fresh, parseTriggered };
}

export async function parseExistingCv(cvId: string) {
  const cv = await prisma.cV.findUnique({ where: { id: cvId } });
  if (!cv) throw new Error("CV not found");

  const filePath = path.join(process.cwd(), cv.fileUrl);
  const buffer = await fs.readFile(filePath);

  let rawText = "";
  if (cv.fileUrl.endsWith(".pdf")) {
    const pdfModule = await import("pdf-parse");
    const pdfParse = (pdfModule as { default?: unknown }).default ?? pdfModule;
    const pdfData = await (pdfParse as (buf: Buffer) => Promise<{ text: string }>)(buffer);
    rawText = pdfData.text;
  } else {
    rawText = buffer.toString("utf-8");
  }

  return parseCvRecord(cvId, rawText);
}

async function parseCvRecord(cvId: string, rawText: string) {
  await prisma.cV.update({
    where: { id: cvId },
    data: { rawText, parsingStatus: "PROCESSING" },
  });

  try {
    const parsed: ParsedCvData = await parseCvText(rawText);

    // Delete old skills before re-creating
    await prisma.cvSkill.deleteMany({ where: { cvId } });

    await prisma.$transaction([
      prisma.cV.update({
        where: { id: cvId },
        data: {
          parsedData: parsed as never,
          parsingStatus: "COMPLETED",
          processedAt: new Date(),
          parsingError: null,
        },
      }),
      ...parsed.skills.map((skill) =>
        prisma.cvSkill.create({
          data: {
            cvId,
            skillName: skill.skillName,
            skillCategory: skill.skillCategory as never,
            proficiencyLevel: skill.proficiencyLevel,
            yearsExperience: skill.yearsExperience,
            sourceSection: skill.sourceSection,
            confidenceScore: skill.confidenceScore,
          },
        })
      ),
    ]);

    return prisma.cV.findUnique({
      where: { id: cvId },
      include: { skills: true },
    });
  } catch (err) {
    await prisma.cV.update({
      where: { id: cvId },
      data: { parsingStatus: "FAILED", parsingError: String(err) },
    });
    throw err;
  }
}
