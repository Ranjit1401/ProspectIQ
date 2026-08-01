"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_RESEARCH_STATUS } from "@/lib/mock-data";

const COLORS: Record<string, string> = {
  analyzed: "#e5e4e2",
  "in-review": "#8a8a8a",
  queued: "#3a3a3a",
};

const LABELS: Record<string, string> = {
  analyzed: "Analyzed",
  "in-review": "Pending",
  queued: "Queued",
};

export function ResearchStatusDonut() {
  const total = MOCK_RESEARCH_STATUS.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={MOCK_RESEARCH_STATUS}
                dataKey="count"
                nameKey="status"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={3}
                strokeWidth={0}
              >
                {MOCK_RESEARCH_STATUS.map((entry) => (
                  <Cell key={entry.status} fill={COLORS[entry.status]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#151515",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "#fff",
                }}
                formatter={(value: number, name: string) => [value, LABELS[name] ?? name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-white">{total}</span>
            <span className="text-[10px] text-white/35">accounts</span>
          </div>
        </div>
        <div className="mt-2 flex justify-center gap-4">
          {MOCK_RESEARCH_STATUS.map((entry) => (
            <div key={entry.status} className="flex items-center gap-1.5 text-[11px] text-white/45">
              <span className="h-2 w-2 rounded-full" style={{ background: COLORS[entry.status] }} />
              {LABELS[entry.status]}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
