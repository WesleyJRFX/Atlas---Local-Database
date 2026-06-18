import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline" | "edit" | "danger" | "success";
}) {
  const variants = {
    default: "bg-zinc-300 text-zinc-950 hover:bg-zinc-200",
    secondary: "bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
    destructive: "bg-zinc-700 text-zinc-100 hover:bg-zinc-600",
    outline: "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800",
    edit: "bg-blue-600 text-white shadow-sm shadow-blue-950/30 hover:bg-blue-500",
    danger: "bg-red-600 text-white shadow-sm shadow-red-950/30 hover:bg-red-500",
    success: "bg-emerald-600 text-white shadow-sm shadow-emerald-950/30 hover:bg-emerald-500",
  };

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
