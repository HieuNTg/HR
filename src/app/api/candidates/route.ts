import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { getCandidates, createCandidate } from "@/lib/services/cv-service";
import { UserRole } from "@/generated/prisma";

const createCandidateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

// GET /api/candidates - Paginated list with filters
export async function GET(req: NextRequest) {
  const session = await auth();
  try {
    requirePermission(session, "view:candidates");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "10")));
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const jdId = searchParams.get("jdId") ?? undefined;

  try {
    const result = await getCandidates({ page, limit, status, search, jdId });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/candidates]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/candidates - Create candidate (RECRUITER/ADMIN)
export async function POST(req: NextRequest) {
  const session = await auth();
  try {
    requirePermission(session, "manage:candidates");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createCandidateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const userId = (session!.user as { id: string; role: UserRole }).id;
    const candidate = await createCandidate(parsed.data, userId);
    return NextResponse.json({ candidate }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return NextResponse.json({ error: "Candidate with this email already exists" }, { status: 409 });
    }
    console.error("[POST /api/candidates]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
