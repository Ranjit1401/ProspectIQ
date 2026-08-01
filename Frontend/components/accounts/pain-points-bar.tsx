"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_PAIN_POINTS_BY_INDUSTRY } from "@/lib/mock-data";
import { CHART_COLORS } from "@/lib/constants";

export function PainPointsBarChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pain Points by Industry</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_PAIN_POINTS_BY_INDUSTRY} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis
                dataKey="industry"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
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
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill={CHART_COLORS.silver} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
