import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { calculateMatch } from "@/lib/services/matching-engine";
import type { ParsedJdData } from "@/lib/services/jd-parser";
import type { ParsedCvData } from "@/lib/validations/cv";

type RouteContext = { params: Promise<{ id: string; jobId: string }> };

// GET /api/candidates/[id]/match/[jobId] - Calculate match score
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  try {
    requirePermission(session, "view:candidates");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, jobId } = await params;

  const latestCv = await prisma.cV.findFirst({
    where: { candidateId: id, parsingStatus: "COMPLETED" },
    orderBy: { uploadedAt: "desc" },
  });

  if (!latestCv?.parsedData) {
    return NextResponse.json(
      { error: "No parsed CV found. Upload and parse a CV first." },
      { status: 400 }
    );
  }

  const job = await prisma.jobPosition.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (!job.parsedData) {
    return NextResponse.json(
      { error: "Job has no parsed data. Parse the JD first." },
      { status: 400 }
    );
  }

  try {
    const result = await calculateMatch(
      job.parsedData as unknown as ParsedJdData,
      latestCv.parsedData as unknown as ParsedCvData
    );
    return NextResponse.json({ match: result, candidateId: id, jobId });
  } catch (error) {
    console.error("[GET /api/candidates/[id]/match/[jobId]]", error);
    return NextResponse.json({ error: "Match calculation failed" }, { status: 500 });
  }
}
