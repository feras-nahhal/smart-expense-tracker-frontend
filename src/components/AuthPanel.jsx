"use client";
import { useState } from "react";
import axios from "axios";
import { API_BASE } from "@/lib/config"; // ✅ use env-based config

export default function AuthPanel({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // only for register
  const [budget, setBudget] = useState(""); // only for register
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      let payload = { email, password };
      let url = `${API_BASE}/${mode}`; // ✅ use API_BASE

      if (mode === "register") {
        payload = {
          name,
          email,
          password,
          monthly_budget: Number(budget) || 0, // ✅ backend expects monthly_budget
        };
      }

      const { data } = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
      });

      // ✅ FastAPI returns { user_id, email, monthly_budget }
      if (data?.user_id) {
        localStorage.setItem("userId", data.user_id);
        localStorage.setItem("email", data.email);
        if (data.monthly_budget) {
          localStorage.setItem("monthly_budget", data.monthly_budget);
        }
        onAuth(data.user_id); // notify parent that auth succeeded
      }
    } catch (err) {
      setError("❌ " + (err.response?.data?.detail || "Something went wrong"));
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-4">
        {mode === "login" ? "🔑 Login" : "🆕 Register"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <>
            <input
              type="text"
              placeholder="Name"
              className="w-full px-4 py-2 border rounded-lg text-black placeholder-gray-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Monthly Budget"
              className="w-full px-4 py-2 border rounded-lg text-black placeholder-gray-400"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded-lg text-black placeholder-gray-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 border rounded-lg text-black placeholder-gray-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          {mode === "login" ? "Login" : "Register"}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      <p className="mt-4 text-sm text-gray-600 text-center">
        {mode === "login" ? "No account?" : "Already registered?"}{" "}
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="text-blue-600 hover:underline"
        >
          {mode === "login" ? "Register" : "Login"}
        </button>
      </p>
    </div>
  );
}
