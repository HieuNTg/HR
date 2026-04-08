import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { createJobPositionSchema } from "@/lib/validations/jd";
import { getJobs, createJob } from "@/lib/services/jd-service";
import { UserRole } from "@/generated/prisma";

// GET /api/jds - Danh sách JD có phân trang, lọc, tìm kiếm
export async function GET(req: NextRequest) {
  const session = await auth();

  try {
    requirePermission(session, "view:jobs");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "10")));
  const status = searchParams.get("status") as "DRAFT" | "ACTIVE" | "ARCHIVED" | null;
  const search = searchParams.get("search") ?? undefined;

  try {
    const result = await getJobs({ page, limit, status: status ?? undefined, search });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/jds] error:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}

// POST /api/jds - Tạo JD mới (RECRUITER/ADMIN only)
export async function POST(req: NextRequest) {
  const session = await auth();

  try {
    requirePermission(session, "manage:jobs");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    return NextResponse.json({ error: "Không có quyền tạo JD" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createJobPositionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const userId = (session!.user as { id: string; role: UserRole }).id;
    const job = await createJob(parsed.data, userId);

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/jds] error:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
