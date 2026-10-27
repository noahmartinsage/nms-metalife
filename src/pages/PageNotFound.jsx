import React from "react";
import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function PageNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="num text-6xl font-black gradient-text">404</span>
      <p className="mt-3 text-sm font-semibold">页面不存在</p>
      <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-muted-foreground">
        你访问的链上页面未找到，可能已被迁移或尚未上线。
      </p>
      <div className="mt-4 flex gap-2">
        <Link to={createPageUrl("Home")}>
          <Button size="sm">
            <Home className="h-3.5 w-3.5" /> 返回首页
          </Button>
        </Link>
        <Link to={createPageUrl("Discover")}>
          <Button size="sm" variant="outline">
            <Compass className="h-3.5 w-3.5" /> 去发现
          </Button>
        </Link>
      </div>
    </div>
  );
}
