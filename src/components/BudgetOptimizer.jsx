"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "@/lib/config";

export default function BudgetOptimizer({ userId }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  const runOptimizer = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    setApplied(false);
    try {
      const res = await axios.get(`${API_BASE}/budget/optimize/${userId}`);
      setData(res.data);
    } catch (err) {
      console.error("Optimizer failed:", err);
      setError("❌ Failed to optimize budget");
    } finally {
      setLoading(false);
    }
  };

  const applyBudgets = async () => {
    if (!data?.suggested_budgets) return;
    try {
      const res = await axios.post(`${API_BASE}/budget/optimize/apply/${userId}`);
      setApplied(true);
      alert(res.data.message || "✅ Suggested budgets applied!");
    } catch (err) {
      console.error("Apply failed:", err);
      setError("❌ Failed to apply budgets");
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
      <h3 className="text-md font-semibold mb-3 text-gray-700">
        🤖 Smart Budget Optimizer
      </h3>
      <button
        onClick={runOptimizer}
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? "Optimizing..." : "Run Optimizer"}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      {data && (
        <div className="mt-3 bg-white p-3 rounded-lg shadow">
          <h4 className="font-semibold">Suggested Budgets:</h4>
          <ul className="list-disc pl-6">
            {Object.entries(data.suggested_budgets).map(([cat, val]) => (
              <li key={cat}>
                {cat}: ${val.toFixed(2)}
              </li>
            ))}
          </ul>
          {!applied && (
            <button
              onClick={applyBudgets}
              className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Apply Budgets
            </button>
          )}
        </div>
      )}
    </div>
  );
}
