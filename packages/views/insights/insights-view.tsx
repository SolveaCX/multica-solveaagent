"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceId } from "@multica/core/hooks";
import { api } from "@multica/core/api";
import { Sparkles, TrendingUp, Trash2, Zap } from "lucide-react";
import { Button } from "@multica/ui/components/ui/button";
import { Badge } from "@multica/ui/components/ui/badge";
import { toast } from "sonner";
import { useWorkspacePaths } from "@multica/core/paths";
import { useNavigation } from "../navigation";
import type { Issue } from "@multica/core/types";

export function InsightsView() {
  const wsId = useWorkspaceId();
  const qc = useQueryClient();
  const navigate = useNavigation();
  const paths = useWorkspacePaths();

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ["gtm-insights", wsId],
    queryFn: async () => {
      const res = await api.listIssues({ workspace_id: wsId, status: "backlog", limit: 200 });
      return res.issues.filter((i: Issue) => i.labels?.some(l => l.name === "gtm-insight"));
    },
    refetchInterval: 30000,
  });

  const dismissMutation = useMutation({
    mutationFn: (issueId: string) => api.updateIssue(issueId, { status: "cancelled" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gtm-insights", wsId] });
      toast.success("标记为噪音");
    },
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">加载中...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <Sparkles className="size-4 text-yellow-500" />
        <h1 className="font-semibold">Insights</h1>
        <Badge variant="secondary" className="ml-auto">{insights.length}</Badge>
      </div>
      {insights.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          <div className="text-center space-y-1">
            <TrendingUp className="size-8 mx-auto opacity-30" />
            <p>暂无 Insight 信号</p>
            <p className="text-xs">Agent 持续互动中，高价值信号会在这里出现</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y">
          {insights.map(insight => (
            <div key={insight.id} className="px-6 py-4 hover:bg-muted/30 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{insight.title}</p>
                  {insight.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {insight.description.replace(/^## Insight Signal\n\n/, "").split("\n")[0]}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="default" className="h-7 text-xs gap-1"
                    onClick={() => navigate.push(paths.dropsNew() + `?title=${encodeURIComponent(insight.title)}`)}>
                    <Zap className="size-3" /> 升级为 Drop
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => dismissMutation.mutate(insight.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
