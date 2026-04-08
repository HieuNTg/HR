import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { getCandidateById, updateCandidate, softDeleteCandidate } from "@/lib/services/cv-service";

type RouteContext = { params: Promise<{ id: string }> };

const updateCandidateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

// GET /api/candidates/[id]
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  try {
    requirePermission(session, "view:candidates");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const candidate = await getCandidateById(id);
    if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("[GET /api/candidates/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/candidates/[id]
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  try {
    requirePermission(session, "manage:candidates");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const existing = await getCandidateById(id);
    if (!existing) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

    const body = await req.json();
    const parsed = updateCandidateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const candidate = await updateCandidate(id, parsed.data);
    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("[PUT /api/candidates/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/candidates/[id] - soft delete (set WITHDRAWN)
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  try {
    requirePermission(session, "manage:candidates");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const existing = await getCandidateById(id);
    if (!existing) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

    await softDeleteCandidate(id);
    return NextResponse.json({ message: "Candidate withdrawn" });
  } catch (error) {
    console.error("[DELETE /api/candidates/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
