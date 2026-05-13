"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, Zap } from "lucide-react";
import { Button } from "@multica/ui/components/ui/button";
import { Textarea } from "@multica/ui/components/ui/textarea";
import { Label } from "@multica/ui/components/ui/label";
import { Checkbox } from "@multica/ui/components/ui/checkbox";
import { toast } from "sonner";
import { useWorkspacePaths } from "@multica/core/paths";
import { useNavigation } from "../navigation";

const CHANNELS = [
  { id: "reddit",  label: "Reddit",       color: "#ff4500" },
  { id: "x",       label: "X (Twitter)",  color: "#1d9bf0" },
  { id: "blog",    label: "Blog",         color: "#10b981" },
  { id: "video",   label: "Video/TikTok", color: "#ef4444" },
  { id: "kol-koc", label: "KOL / KOC",   color: "#f59e0b" },
  { id: "landing", label: "Landing",      color: "#8b5cf6" },
];

interface DropsNewViewProps {
  workspaceSlug: string;
  initialTitle?: string;
}

export function DropsNewView({ workspaceSlug, initialTitle = "" }: DropsNewViewProps) {
  const navigate = useNavigation();
  const paths = useWorkspacePaths();
  const [angle, setAngle] = useState(initialTitle);
  const [context, setContext] = useState("");
  const [selected, setSelected] = useState<string[]>(["reddit", "x", "blog"]);

  const createDrop = useMutation({
    mutationFn: async () => {
      const base = process.env.NEXT_PUBLIC_GTM_API_URL ?? "";
      const res = await fetch(`${base}/api/drops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_slug: workspaceSlug, angle, context, channels: selected, priority: "high" }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "failed");
      return res.json();
    },
    onSuccess: (d: { child_issues: unknown[] }) => {
      toast.success(`ContentDrop 触发 — ${d.child_issues.length} 个渠道`);
      navigate.push(paths.issues());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (id: string) =>
    setSelected(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]);

  return (
    <div className="max-w-lg mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate.back()}>
          <ChevronLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="size-4 text-violet-500" /> 新建 ContentDrop
          </h1>
          <p className="text-xs text-muted-foreground">一个角度，全渠道扩散</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label>产品角度 *</Label>
        <Textarea placeholder='例："QA 团队每周节省 40 小时"' value={angle}
          onChange={e => setAngle(e.target.value)} rows={3} className="resize-none" />
      </div>
      <div className="space-y-2">
        <Label>背景（可选）</Label>
        <Textarea placeholder="数据依据 / 客户访谈..." value={context}
          onChange={e => setContext(e.target.value)} rows={2} className="resize-none" />
      </div>
      <div className="space-y-2">
        <Label>渠道</Label>
        <div className="grid grid-cols-2 gap-2">
          {CHANNELS.map(ch => (
            <label key={ch.id} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/40">
              <Checkbox checked={selected.includes(ch.id)} onCheckedChange={() => toggle(ch.id)} />
              <span className="text-sm" style={{ color: selected.includes(ch.id) ? ch.color : undefined }}>{ch.label}</span>
            </label>
          ))}
        </div>
      </div>
      <Button className="w-full" disabled={!angle.trim() || !selected.length || createDrop.isPending}
        onClick={() => createDrop.mutate()}>
        {createDrop.isPending ? "触发中..." : <><Zap className="size-3.5 mr-1.5" />触发 Drop ({selected.length} 渠道)</>}
      </Button>
    </div>
  );
}
