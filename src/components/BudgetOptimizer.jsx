"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function BudgetOptimizer({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  // Fetch optimizer results
  const runOptimizer = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    setApplied(false);
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/budget/optimize/${userId}`
      );
      setData(res.data);
    } catch (err) {
      console.error("Optimizer failed:", err);
      setError("❌ Failed to fetch optimizer results.");
    } finally {
      setLoading(false);
    }
  };

  // Apply suggested budgets (new backend endpoint)
  const applyBudgets = async () => {
    if (!data?.suggested_budgets) return;
    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/budget/optimize/apply/${userId}`
      );
      setApplied(true);
      alert(res.data.message || "✅ Suggested budgets applied!");
    } catch (err) {
      console.error("Failed to apply budgets:", err);
      alert("❌ Failed to apply suggested budgets.");
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 shadow-inner space-y-4">
      <h3 className="text-md font-semibold mb-2 text-gray-700">
        🤖 Smart Budget Optimizer
      </h3>

      <button
        onClick={runOptimizer}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        disabled={loading}
      >
        {loading ? "🔄 Optimizing..." : "Run Optimizer"}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {data && (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">{data.summary}</p>

          {/* Chart */}
          <div className="h-[250px] bg-white rounded-lg p-2 border">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.keys(data.original_budgets || {}).map((cat) => ({
                  category: cat,
                  original: data.original_budgets[cat],
                  suggested: data.suggested_budgets[cat],
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="original" fill="#2563eb" name="Original" />
                <Bar dataKey="suggested" fill="#f59e0b" name="Suggested" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Apply Button */}
          {!applied && (
            <button
              onClick={applyBudgets}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              ✅ Apply Suggested Budgets
            </button>
          )}
          {applied && (
            <p className="text-green-600 text-sm">
              ✅ Budgets applied successfully!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
