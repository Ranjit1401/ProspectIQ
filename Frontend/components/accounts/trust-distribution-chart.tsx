"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_TRUST_DISTRIBUTION } from "@/lib/mock-data";
import { CHART_COLORS } from "@/lib/constants";

function colorFor(bucket: string) {
  const low = parseInt(bucket.split("-")[0], 10);
  if (low >= 80) return "#22c55e";
  if (low >= 60) return "#e5e4e2";
  if (low >= 40) return "#8a8a8a";
  return "#4a4a4a";
}

export function TrustDistributionChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trust Score Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_TRUST_DISTRIBUTION} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis
                dataKey="bucket"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
              />
              <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                contentStyle={{
                  background: "#151515",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "#fff",
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {MOCK_TRUST_DISTRIBUTION.map((entry) => (
                  <Cell key={entry.bucket} fill={colorFor(entry.bucket)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
