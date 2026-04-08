import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { uploadAndParseCv } from "@/lib/services/cv-service";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/candidates/[id]/cv - List CVs for candidate
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  try {
    requirePermission(session, "view:candidates");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const cvs = await prisma.cV.findMany({
    where: { candidateId: id },
    orderBy: { uploadedAt: "desc" },
    include: { skills: true },
  });

  return NextResponse.json({ cvs });
}

// POST /api/candidates/[id]/cv - Upload CV file
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  try {
    requirePermission(session, "manage:candidates");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const allowed = ["application/pdf", "text/plain"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Only PDF and TXT files are accepted" }, { status: 400 });
    }

    const result = await uploadAndParseCv(id, file);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[POST /api/candidates/[id]/cv]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
