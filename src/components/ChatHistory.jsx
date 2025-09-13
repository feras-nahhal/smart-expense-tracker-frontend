"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function ChatHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Get logged-in userId
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (!userId) return;

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/chat/history/${userId}`);
        setHistory(res.data);
      } catch (err) {
        console.error("❌ Failed to load chat history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  if (!userId) {
    return (
      <div className="bg-white p-4 rounded-xl shadow text-gray-500">
        ⚠️ Please log in to see chat history
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-xl shadow text-gray-500">
        🔄 Loading chat history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl shadow text-gray-500">
        📭 No chat history yet.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 space-y-3">
      <h2 className="text-lg font-bold mb-2">💬 Chat History</h2>
      <div className="max-h-96 overflow-y-auto space-y-3">
        {history.map((h, i) => (
          <div key={i} className="space-y-1 border-b pb-2">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">You:</span> {h.message}
            </p>
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Bot:</span> {h.response}
            </p>
            <p className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}