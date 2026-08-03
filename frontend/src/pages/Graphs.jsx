import { useMemo } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useData } from "../context/DataContext";

const metricColors = {
  Total: "#2563EB",
  Paid: "#22C55E",
  Pending: "#EF4444",
  Balance: "#F59E0B",
};

function SummaryRow({ total, paid, pending, balance, percent }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.08)] p-4 border-none mx-4 grid grid-cols-5 items-center text-center">
      <div>
        <p className="text-gray-400 text-xs">Total</p>
        <p className="font-semibold">{total}</p>
      </div>
      <div>
        <p className="text-gray-400 text-xs">Paid</p>
        <p className="font-semibold">{paid}</p>
      </div>
      <div>
        <p className="text-gray-400 text-xs">Pending</p>
        <p className="font-semibold">{pending}</p>
      </div>
      <div>
        <p className="text-gray-400 text-xs">Balance</p>
        <p className="font-semibold">{balance}</p>
      </div>
      <div className="flex justify-center">
        <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-semibold">
          {percent}%
        </div>
      </div>
    </div>
  );
}

function ChartSection({ color, label, data }) {
  const hasData = data.some((d) => d.value > 0);
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }} />
        <span className="font-semibold">{label}</span>
      </div>
      <div className="h-56 px-2">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={metricColors[entry.name] || color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center border-l border-b border-gray-200 text-gray-700">
            No chart data available
          </div>
        )}
      </div>
    </div>
  );
}

export default function Graphs() {
  const { loans, loanStats } = useData();

  const byType = useMemo(() => {
    const groups = { Daily: [], Weekly: [], Monthly: [] };
    loans.forEach((l) => groups[l.collectionType]?.push(l));
    return groups;
  }, [loans]);

  function summaryFor(loanList) {
    const totals = loanList.reduce(
      (acc, l) => {
        const s = loanStats(l);
        acc.total += s.total;
        acc.paid += s.paid;
        acc.pending += s.pending;
        acc.balance += s.balance;
        return acc;
      },
      { total: 0, paid: 0, pending: 0, balance: 0 }
    );
    const percent = totals.total > 0 ? Math.round((totals.paid / totals.total) * 100) : 0;
    return { ...totals, percent };
  }

  function chartData(loanList) {
    const summary = summaryFor(loanList);
    return [
      { name: "Total", value: summary.total },
      { name: "Paid", value: summary.paid },
      { name: "Pending", value: summary.pending },
      { name: "Balance", value: summary.balance },
    ];
  }

  const dailySummary = summaryFor(byType.Daily);
  const weeklySummary = summaryFor(byType.Weekly);
  const monthlySummary = summaryFor(byType.Monthly);

  const overallData = [
    { name: "Daily", value: dailySummary.paid },
    { name: "Weekly", value: weeklySummary.paid },
    { name: "Monthly", value: monthlySummary.paid },
  ];

  return (
    <div className="app-shell">
      <Header title="Graphs" />

      <main className="flex-1 overflow-y-auto hide-scrollbar pb-4 bg-gray-50">
        <ChartSection color="#7C4DFF" label="Daily Collections" data={chartData(byType.Daily)} />
        <SummaryRow {...dailySummary} />

        <ChartSection color="#C6D82E" label="Weekly Collections" data={chartData(byType.Weekly)} />
        <SummaryRow {...weeklySummary} />

        <ChartSection color="#FF9800" label="Monthly Collections" data={chartData(byType.Monthly)} />
        <SummaryRow {...monthlySummary} />

        <h3 className="text-center font-semibold mt-6 mb-2">Over All Total</h3>
        <div className="h-56 px-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overallData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#283593" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
