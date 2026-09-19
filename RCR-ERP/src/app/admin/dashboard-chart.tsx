"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export function DashboardChart({ data }: { data: { name: string; amount: number }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No bills generated yet — this chart fills in as you generate running bills.</p>;
  }

  // Create a nice gradient for the bars
  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.9}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
            axisLine={false} 
            tickLine={false} 
            dy={10} 
          />
          <YAxis 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
            axisLine={false} 
            tickLine={false}
            tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`} 
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
            contentStyle={{ 
              backgroundColor: "rgba(15, 23, 42, 0.7)", 
              backdropFilter: "blur(8px)", 
              border: "1px solid rgba(255,255,255,0.1)", 
              borderRadius: "8px",
              color: "#fff",
              fontSize: 13,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
            }}
            itemStyle={{ color: "#e2e8f0" }}
            formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Billed Amount"]}
          />
          <Bar 
            dataKey="amount" 
            radius={[6, 6, 0, 0]}
            fill="url(#colorAmount)"
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
