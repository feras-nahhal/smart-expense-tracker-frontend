"use client";
import BudgetOptimizer from "./BudgetOptimizer";
import { useEffect, useState } from "react";
import { getTrends, getGoals, uploadCSV } from "@/lib/api";
import axios from "axios";
import { API_BASE } from "@/lib/config";   // ✅ use config.js
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export default function Dashboard() {
  const [userId, setUserId] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [weeklyExpenses, setWeeklyExpenses] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [forecast, setForecast] = useState({ history: [], forecast: [] });
  const [forecastMonths, setForecastMonths] = useState(3);
  const [loading, setLoading] = useState(true);

  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [keyword, setKeyword] = useState("");

  const [form, setForm] = useState({
    amount: "",
    category: "",
    description: "",
    merchant: "",
  });

  const [goalForm, setGoalForm] = useState({
    category: "",
    target_amount: "",
    period: "monthly",
  });

  const [csvStatus, setCsvStatus] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("userId");
      if (storedId) setUserId(parseInt(storedId, 10));
    }
  }, []);

  // ✅ Fetch dashboard data
  const fetchData = async (uid, months = forecastMonths) => {
    if (!uid) return;
    setLoading(true);
    try {
      const { data } = await getTrends(uid);

      const catTotals = {};
      const dailyTotals = {};

      Object.entries(data || {}).forEach(([cat, records]) => {
        let total = 0;
        records.forEach((r) => {
          total += r.amount;
          dailyTotals[r.date] = (dailyTotals[r.date] || 0) + r.amount;
        });
        catTotals[cat] = (catTotals[cat] || 0) + total;
      });

      setByCategory(
        Object.entries(catTotals).map(([category, total]) => ({
          name: category,
          value: total,
        }))
      );

      setMonthlyTrend(
        Object.entries(dailyTotals).map(([date, total]) => ({
          date,
          total,
        }))
      );

      const weekly = {};
      Object.entries(dailyTotals).forEach(([date, total]) => {
        const d = new Date(date);
        const week = `Week ${Math.ceil(d.getDate() / 7)}`;
        weekly[week] = (weekly[week] || 0) + total;
      });
      setWeeklyExpenses(
        Object.entries(weekly).map(([week, total]) => ({
          week,
          total,
        }))
      );

      const goalsResp = await getGoals(uid);
      const catLowerMap = {};
      Object.entries(catTotals).forEach(([k, v]) => {
        catLowerMap[k.toLowerCase()] = v;
      });

      setBudgetData(
        goalsResp.data.map((g) => {
          const actual =
            catTotals[g.category] ??
            catLowerMap[g.category.toLowerCase()] ??
            0;
          return {
            category: g.category,
            budget: Number(g.target_amount || 0),
            actual: Number(actual || 0),
          };
        })
      );

      // ✅ Forecast request with API_BASE
      const forecastResp = await axios.get(
        `${API_BASE}/forecast/${uid}?months=${months}`
      );
      setForecast(forecastResp.data || { history: [], forecast: [] });
    } catch (e) {
      console.error("Failed to load dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch chat history
  const fetchChatHistory = async (uid) => {
    if (!uid) return;
    setChatLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/chat/history/${uid}`);
      setChatHistory(res.data || []);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData(userId, forecastMonths);
      fetchChatHistory(userId);

      const handler = () => {
        fetchData(userId, forecastMonths);
        fetchChatHistory(userId);
      };
      window.addEventListener("expenses:changed", handler);

      const interval = setInterval(() => fetchChatHistory(userId), 30000);

      return () => {
        window.removeEventListener("expenses:changed", handler);
        clearInterval(interval);
      };
    }
  }, [userId, forecastMonths]);

  // ✅ Quick expense
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/expense/quick`, {
        user_id: userId,
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description || "",
        merchant: form.merchant || "",
      });
      setForm({ amount: "", category: "", description: "", merchant: "" });
      fetchData(userId, forecastMonths);
    } catch (err) {
      console.error("Failed to save expense:", err);
      alert("❌ Failed to save expense");
    }
  };

  // ✅ Save goal
  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    if (!goalForm.category || !goalForm.target_amount) {
      alert("⚠️ Please fill category and target amount.");
      return;
    }

    try {
      await axios.post(`${API_BASE}/goals`, {
        user_id: userId,
        category: goalForm.category,
        target_amount: Number(goalForm.target_amount),
        period: goalForm.period || "monthly",
      });
      setGoalForm({ category: "", target_amount: "", period: "monthly" });
      fetchData(userId, forecastMonths);
    } catch (err) {
      console.error("Failed to save goal:", err.response?.data || err);
      alert(
        "❌ Failed to save goal: " +
          (err.response?.data?.detail || "Unknown error")
      );
    }
  };

  // ✅ CSV Upload
  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setCsvStatus("Uploading...");
      await uploadCSV(userId, file);
      setCsvStatus("✅ CSV imported successfully!");
      fetchData(userId, forecastMonths);
    } catch (err) {
      console.error("Failed to import CSV:", err);
      setCsvStatus("❌ Failed to import CSV");
    }
  };

  // ✅ Apply chat filters
  const filteredChats = chatHistory.filter((h) => {
    const ts = new Date(h.timestamp);
    if (startDate && ts < new Date(startDate)) return false;
    if (endDate && ts > new Date(endDate)) return false;
    if (
      keyword &&
      !(
        h.message.toLowerCase().includes(keyword.toLowerCase()) ||
        h.response.toLowerCase().includes(keyword.toLowerCase())
      )
    )
      return false;
    return true;
  });

  if (loading) {
    return (
      <div className="bg-white p-6 shadow-lg rounded-2xl border text-center text-gray-500">
        🔄 Loading Dashboard...
      </div>
    );
  }

  const COLORS = [
    "#2563eb",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];

  return (
    <div className="bg-white p-4 md:p-6 shadow-lg rounded-2xl border border-gray-100 space-y-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        📊 Dashboard
      </h2>

      {/* CSV Import */}
      <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
        <h3 className="text-md font-semibold mb-3 text-gray-700">📂 Import CSV</h3>
        <input
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          className="block w-full text-sm text-gray-700"
        />
        {csvStatus && <p className="mt-2 text-sm">{csvStatus}</p>}
      </div>

      {/* Expense Forecast */}
      <div className="h-[280px] sm:h-[320px] lg:h-[350px] bg-gray-50 rounded-xl p-3 sm:p-4 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-md font-semibold text-gray-700">📈 Expense Forecast</h3>
          <select
            value={forecastMonths}
            onChange={(e) => setForecastMonths(Number(e.target.value))}
            className="border rounded-lg px-2 py-1 text-sm"
          >
            <option value={3}>Next 3 months</option>
            <option value={6}>Next 6 months</option>
            <option value={12}>Next 12 months</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={[...forecast.history, ...forecast.forecast]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#2563eb"
              strokeWidth={2}
              name="History"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#22c55e"
              strokeWidth={2}
              name="Forecast"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Spending by Category */}
      <div className="h-[250px] sm:h-[300px] lg:h-[320px] bg-gray-50 rounded-xl p-3 sm:p-4 shadow-inner">
        <h3 className="text-md font-semibold mb-2 text-gray-700">Spending by Category</h3>
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={byCategory}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {byCategory.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Spending Trend */}
      <div className="h-[250px] sm:h-[300px] lg:h-[320px] bg-gray-50 rounded-xl p-3 sm:p-4 shadow-inner">
        <h3 className="text-md font-semibold mb-2 text-gray-700">Daily Spending Trend</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Expenses */}
      <div className="h-[250px] sm:h-[300px] lg:h-[320px] bg-gray-50 rounded-xl p-3 sm:p-4 shadow-inner">
        <h3 className="text-md font-semibold mb-2 text-gray-700">Weekly Expenses</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={weeklyExpenses}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="week" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Budget vs Actual */}
      <div className="h-[250px] sm:h-[300px] lg:h-[320px] bg-gray-50 rounded-xl p-3 sm:p-4 shadow-inner">
        <h3 className="text-md font-semibold mb-2 text-gray-700">Budget vs Actual</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={budgetData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="category" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="budget" fill="#2563eb" />
            <Bar dataKey="actual" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Expense Entry */}
      <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
        <h3 className="text-md font-semibold mb-3 text-gray-700">➕ Quick Expense Entry</h3>
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="border rounded-lg px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border rounded-lg px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Merchant (optional)"
            value={form.merchant}
            onChange={(e) => setForm({ ...form, merchant: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border rounded-lg px-3 py-2 col-span-1 sm:col-span-3"
          />
          <button
            type="submit"
            className="col-span-1 sm:col-span-3 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Save Expense
          </button>
        </form>
      </div>

      {/* Set Budget Goal */}
      <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
        <h3 className="text-md font-semibold mb-3 text-gray-700">🎯 Set Budget Goal</h3>
        <form onSubmit={handleGoalSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Category"
            value={goalForm.category}
            onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
            className="border rounded-lg px-3 py-2"
            required
          />
          <input
            type="number"
            placeholder="Target Amount"
            value={goalForm.target_amount}
            onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
            className="border rounded-lg px-3 py-2"
            required
          />
          <select
            value={goalForm.period}
            onChange={(e) => setGoalForm({ ...goalForm, period: e.target.value })}
            className="border rounded-lg px-3 py-2"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
          <button
            type="submit"
            className="col-span-1 sm:grid-cols-3 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            Save Goal
          </button>
        </form>
      </div>

      {/* Chat History */}
      <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
        <h3
          className="text-md font-semibold mb-3 text-gray-700 flex items-center justify-between cursor-pointer"
          onClick={() => setShowHistory((prev) => !prev)}
        >
          💬 Chat History
          <span className="text-sm text-blue-600">
            {showHistory ? "▲ Hide" : "▼ Show"}
          </span>
        </h3>
        {showHistory && (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
              <input
                type="text"
                placeholder="Search keyword..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="border rounded px-2 py-1 text-sm flex-1"
              />
            </div>

            {chatLoading ? (
              <p className="text-gray-500">🔄 Loading chat history...</p>
            ) : filteredChats.length === 0 ? (
              <p className="text-gray-500">📭 No chat history matches filters.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-3">
                {filteredChats.map((h, i) => (
                  <div key={i} className="space-y-1 border-b pb-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">You:</span> {h.message}
                    </p>
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Bot:</span> {h.response}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(h.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Smart Budget Optimizer */}
      <BudgetOptimizer userId={userId} />
    </div>
  );
}
