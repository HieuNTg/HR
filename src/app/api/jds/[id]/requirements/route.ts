import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { createJobRequirementSchema } from "@/lib/validations/jd";
import { getJobById } from "@/lib/services/jd-service";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/jds/[id]/requirements - Danh sách requirements của JD
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();

  try {
    requirePermission(session, "view:jobs");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const job = await getJobById(id);
    if (!job) return NextResponse.json({ error: "Không tìm thấy JD" }, { status: 404 });

    return NextResponse.json({ requirements: job.requirements });
  } catch (error) {
    console.error("[GET /api/jds/[id]/requirements] error:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}

// POST /api/jds/[id]/requirements - Thêm requirement thủ công
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();

  try {
    requirePermission(session, "manage:jobs");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const job = await getJobById(id);
    if (!job) return NextResponse.json({ error: "Không tìm thấy JD" }, { status: 404 });

    const body = await req.json();
    // jobId luôn lấy từ URL params, không từ body
    const parsed = createJobRequirementSchema.safeParse({ ...body, jobId: id });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const requirement = await prisma.jobRequirement.create({
      data: parsed.data as never,
    });

    return NextResponse.json({ requirement }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/jds/[id]/requirements] error:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
