"use client";
import { useState } from "react";
import axios from "axios";
import { API_BASE } from "@/lib/config";

export default function AuthPanel({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      let payload = { email, password };
      let url = `${API_BASE}/${mode}`;

      if (mode === "register") {
        payload.name = name;
        payload.monthly_budget = Number(budget) || 0; // ✅ correct key
      }

      const res = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" }, // ✅ ensure JSON
      });

      if (res.data?.user_id) {
        localStorage.setItem("userId", res.data.user_id);
        localStorage.setItem("email", res.data.email);
        if (res.data.monthly_budget !== undefined) {
          localStorage.setItem("monthly_budget", res.data.monthly_budget);
        }
        onAuth(res.data.user_id);
      } else {
        setError("❌ Failed to authenticate user");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.response?.data?.detail || "❌ Login/Register failed");
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow max-w-md w-full">
      <h2 className="text-xl font-semibold mb-4 text-center">
        {mode === "login" ? "🔑 Login" : "📝 Register"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <>
            <input
              type="text"
              placeholder="Name"
              className="w-full border rounded-lg px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Monthly Budget"
              className="w-full border rounded-lg px-3 py-2"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
          </>
        )}
        <input
          type="email"
          placeholder="Email"
          className="w-full border rounded-lg px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded-lg px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          {mode === "login" ? "Login" : "Register"}
        </button>
      </form>
      <p
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-4 text-blue-600 text-center cursor-pointer"
      >
        {mode === "login"
          ? "New here? Create an account"
          : "Already have an account? Login"}
      </p>
    </div>
  );
}
