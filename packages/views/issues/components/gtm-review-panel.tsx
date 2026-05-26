"use client";

import { useMemo } from "react";
import { CheckCircle, XCircle, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@multica/ui/components/ui/button";
import { useUpdateIssue } from "@multica/core/issues/mutations";
import type { Issue, TimelineEntry } from "@multica/core/types";

interface GTMReviewPanelProps {
  issue: Issue;
  timeline: TimelineEntry[];
  wsId: string;
}

interface ParsedReview {
  score: number;
  recommendation: string;
  summary: string;
  checklist: { passed: boolean; text: string; note?: string }[];
  annotations: { quote: string; issue: string; suggestion: string }[];
}

function parseReviewComment(content: string): ParsedReview | null {
  if (!content.startsWith("## 🤖 AI Review")) return null;
  try {
    const scoreMatch = content.match(/— (\d+)\/100/);
    const score = Number(scoreMatch?.[1] ?? 0);
    const recMatch = content.match(/推荐: (✓ Approve|✗ Reject|✏ Revise)/);
    const recommendation = recMatch?.[1] ?? "";
    const summaryMatch = content.match(/\*\*总结:\*\* (.+)/);
    const summary = summaryMatch?.[1] ?? "";
    const checklistSection = content.match(/### Checklist\n([\s\S]*?)(?:\n###|$)/)?.[1] ?? "";
    const checklist = checklistSection.trim().split("\n").filter(Boolean).map(line => {
      const [text = "", note] = line.replace(/^[✓⚠] /, "").split(" — ");
      return {
        passed: line.startsWith("✓"),
        text,
        note,
      };
    });
    const annotationsSection = content.match(/### 内联批注\n([\s\S]*?)$/)?.[1] ?? "";
    const annotations: ParsedReview["annotations"] = [];
    for (const block of annotationsSection.split("\n\n").filter(b => b.includes("> "))) {
      const quote = block.match(/> "(.+?)"/)?.[1] ?? "";
      const issue = block.match(/→ \*\*问题:\*\* (.+)/)?.[1] ?? "";
      const suggestion = block.match(/→ \*\*建议:\*\* (.+)/)?.[1] ?? "";
      if (quote) annotations.push({ quote, issue, suggestion });
    }
    return { score, recommendation, summary, checklist, annotations };
  } catch {
    return null;
  }
}

export function GTMReviewPanel({ issue, timeline, wsId }: GTMReviewPanelProps) {
  const updateIssue = useUpdateIssue();

  const isGTMContent = issue.labels?.some(l => l.name === "gtm-content");
  if (!isGTMContent) return null;

  const reviewEntry = useMemo(
    () => [...timeline].reverse().find(e =>
      e.type === "comment" && e.content?.startsWith("## 🤖 AI Review")
    ),
    [timeline]
  );
  const review = useMemo(
    () => reviewEntry?.content ? parseReviewComment(reviewEntry.content) : null,
    [reviewEntry]
  );

  if (!review) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Sparkles className="size-3.5" />
          AI Review
        </div>
        <p className="text-xs text-muted-foreground">
          {issue.status === "in_review" ? "正在生成审核..." : "等待草稿..."}
        </p>
      </div>
    );
  }

  const scoreColor = review.score >= 80 ? "text-green-500"
    : review.score >= 60 ? "text-yellow-500"
    : "text-red-500";

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="size-3.5 text-violet-500" />
          AI Review
        </div>
        <span className={`text-lg font-bold tabular-nums ${scoreColor}`}>
          {review.score}<span className="text-xs text-muted-foreground font-normal">/100</span>
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{review.summary}</p>
      <div className="space-y-1">
        {review.checklist.map((item, i) => (
          <div key={i} className="flex items-start gap-1.5">
            {item.passed
              ? <CheckCircle className="size-3.5 text-green-500 mt-0.5 shrink-0" />
              : <AlertCircle className="size-3.5 text-yellow-500 mt-0.5 shrink-0" />}
            <span className={`text-xs ${item.passed ? "text-foreground" : "text-yellow-600 dark:text-yellow-400"}`}>
              {item.text}
              {item.note && <span className="text-muted-foreground"> — {item.note}</span>}
            </span>
          </div>
        ))}
      </div>
      {review.annotations.length > 0 && (
        <div className="space-y-2 border-t pt-2">
          <p className="text-xs font-medium text-muted-foreground">内联批注</p>
          {review.annotations.map((ann, i) => (
            <div key={i} className="rounded bg-muted/50 p-2 space-y-1">
              <p className="text-xs italic text-muted-foreground">"{ann.quote}"</p>
              <p className="text-xs text-destructive">{ann.issue}</p>
              <p className="text-xs text-green-600 dark:text-green-400">→ {ann.suggestion}</p>
            </div>
          ))}
        </div>
      )}
      {issue.status === "in_review" && (
        <div className="flex gap-2 pt-1 border-t">
          <Button size="sm" variant="default" className="flex-1 h-7 text-xs"
            onClick={() => updateIssue.mutate({ id: issue.id, status: "done" })}>
            <CheckCircle className="size-3 mr-1" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
            onClick={() => updateIssue.mutate({ id: issue.id, status: "cancelled" })}>
            <XCircle className="size-3 mr-1" /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}
