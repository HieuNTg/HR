import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { parseExistingCv } from "@/lib/services/cv-service";

type RouteContext = { params: Promise<{ id: string; cvId: string }> };

// POST /api/candidates/[id]/cv/[cvId]/parse - Re-parse existing CV
export async function POST(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  try {
    requirePermission(session, "manage:candidates");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { cvId } = await params;

  try {
    const cv = await parseExistingCv(cvId);
    return NextResponse.json({ cv });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Parse failed";
    if (msg === "CV not found") {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    console.error("[POST /api/candidates/[id]/cv/[cvId]/parse]", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
