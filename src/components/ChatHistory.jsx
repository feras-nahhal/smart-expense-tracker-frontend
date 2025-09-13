"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "@/lib/config";

export default function ChatHistory({ userId }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/chat/history/${userId}`);
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    fetchHistory();
  }, [userId]);

  return (
    <div className="p-4 bg-white rounded-2xl shadow">
      <h2 className="text-lg font-semibold mb-2">💬 Chat History</h2>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {history.map((h, i) => (
          <div key={i} className="border-b pb-2">
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
    </div>
  );
}
