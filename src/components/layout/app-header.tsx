"use client"

import { usePathname } from "next/navigation"
import { Moon, Sun, User, Settings } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Tổng quan",
  "/jobs": "Vị trí tuyển dụng",
  "/candidates": "Ứng viên",
  "/interviews": "Phỏng vấn",
  "/reports": "Báo cáo",
  "/settings": "Cài đặt",
}

function getBreadcrumb(pathname: string): string {
  for (const [key, label] of Object.entries(breadcrumbMap)) {
    if (pathname === key || pathname.startsWith(key + "/")) return label
  }
  return "HR Interview AI"
}

export function AppHeader() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const pageTitle = getBreadcrumb(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="flex flex-1 items-center gap-2">
        <nav className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground">HR Interview AI</span>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="font-medium">{pageTitle}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Chuyển giao diện"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="relative flex h-8 w-8 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Tài khoản"
              />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">AD</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@company.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Hồ sơ</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Cài đặt</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
