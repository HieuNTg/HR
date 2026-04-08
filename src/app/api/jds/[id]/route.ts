import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { updateJobPositionSchema } from "@/lib/validations/jd";
import { getJobById, updateJob, deleteJob } from "@/lib/services/jd-service";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/jds/[id] - Chi tiết JD kèm requirements
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

    return NextResponse.json({ job });
  } catch (error) {
    console.error("[GET /api/jds/[id]] error:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}

// PUT /api/jds/[id] - Cập nhật JD (RECRUITER/ADMIN only)
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await auth();

  try {
    requirePermission(session, "manage:jobs");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    return NextResponse.json({ error: "Không có quyền cập nhật JD" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const existing = await getJobById(id);
    if (!existing) return NextResponse.json({ error: "Không tìm thấy JD" }, { status: 404 });

    const body = await req.json();
    const parsed = updateJobPositionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const job = await updateJob(id, parsed.data);
    return NextResponse.json({ job });
  } catch (error) {
    console.error("[PUT /api/jds/[id]] error:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}

// DELETE /api/jds/[id] - Soft delete (RECRUITER/ADMIN only)
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();

  try {
    requirePermission(session, "manage:jobs");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    return NextResponse.json({ error: "Không có quyền xóa JD" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const existing = await getJobById(id);
    if (!existing) return NextResponse.json({ error: "Không tìm thấy JD" }, { status: 404 });

    await deleteJob(id);
    return NextResponse.json({ message: "JD đã được lưu trữ" });
  } catch (error) {
    console.error("[DELETE /api/jds/[id]] error:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
