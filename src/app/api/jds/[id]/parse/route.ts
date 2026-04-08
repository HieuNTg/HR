import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { getJobById, parseAndUpdateJob } from "@/lib/services/jd-service";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/jds/[id]/parse - Kích hoạt parse JD bằng Gemini
export async function POST(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();

  try {
    requirePermission(session, "manage:jobs");
  } catch {
    if (!session?.user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const existing = await getJobById(id);
    if (!existing) return NextResponse.json({ error: "Không tìm thấy JD" }, { status: 404 });

    if (!existing.rawJdText && !existing.description) {
      return NextResponse.json(
        { error: "JD không có nội dung để parse" },
        { status: 400 }
      );
    }

    const job = await parseAndUpdateJob(id);
    return NextResponse.json({ job, message: "Parse JD thành công" });
  } catch (error) {
    console.error("[POST /api/jds/[id]/parse] error:", error);
    const message = error instanceof Error ? error.message : "Lỗi máy chủ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
