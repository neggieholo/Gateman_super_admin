import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const revenueData = [
  { month: "Jan", estate_plan: 400000, security_plan: 150000 },
  { month: "Feb", estate_plan: 600000, security_plan: 200000 },
  { month: "Mar", estate_plan: 900000, security_plan: 350000 },
  { month: "Apr", estate_plan: 1200000, security_plan: 500000 },
];

const planDistribution = [
  { name: "Estate Management", value: 9, color: "#6366f1" },
  { name: "Security Gate Plus", value: 4, color: "#10b981" },
];

export default function AnalyticsView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Area Chart: Revenue Trend */}
      <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <h3 className="text-base font-semibold mb-1">
          Subscription Revenue Trend
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Breakdown of earnings per subscription tier (NGN)
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                }}
              />
              <Area
                type="monotone"
                dataKey="estate_plan"
                stackId="1"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.4}
              />
              <Area
                type="monotone"
                dataKey="security_plan"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.4}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut Chart: Plan Distribution */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold mb-1">Plan Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Active estates per tier</p>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={planDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
              >
                {planDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 mt-2">
          {planDistribution.map((item) => (
            <div key={item.name} className="flex justify-between text-xs">
              <span className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></span>
                {item.name}
              </span>
              <span className="font-bold">{item.value} Estates</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
