"use client";
import { useEffect, useRef, useState } from "react";
import { WS_BASE } from "@/lib/config";
import { Send } from "lucide-react";

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "👋 Hi! Try: I spent $7 on coffee" },
  ]);
  const [input, setInput] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ✅ Get logged-in userId
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(`${WS_BASE}/ws/chat/${userId}`);
    socketRef.current = ws;

    ws.onopen = () =>
      setMessages((m) => [...m, { sender: "sys", text: "✅ Connected" }]);

    ws.onmessage = (event) => {
      const text = event.data;
      setMessages((m) => [...m, { sender: "bot", text }]);

      if (text.startsWith("✅ Added") || text.startsWith("📊")) {
        window.dispatchEvent(new CustomEvent("expenses:changed"));
      }

      if (text.startsWith("🚨") || text.startsWith("🎯")) {
        window.dispatchEvent(new CustomEvent("alert:new", { detail: text }));
      }
    };

    ws.onclose = () =>
      setMessages((m) => [...m, { sender: "sys", text: "⚠️ Disconnected" }]);

    ws.onerror = () =>
      setMessages((m) => [
        ...m,
        { sender: "sys", text: "❌ WebSocket error (check backend URL/port)" },
      ]);

    return () => ws.close();
  }, [userId]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !socketRef.current || socketRef.current.readyState !== 1)
      return;
    setMessages((m) => [...m, { sender: "you", text }]);
    socketRef.current.send(text);
    setInput("");
  };

  const onKey = (e) => e.key === "Enter" && sendMessage();

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    localStorage.removeItem("monthly_budget");
    window.location.reload();
  };

  return (
    <div className="flex flex-col w-full h-full max-w-md mx-auto rounded-2xl shadow-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">💬 Smart Expense Chat</h1>
          <p className="text-sm text-blue-100">
            Track your spending in real time
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="ml-4 px-3 py-1 bg-red-500 hover:bg-red-600 rounded-full text-sm font-medium shadow"
        >
          🚪 Logout
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.sender === "you" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-[75%] text-sm shadow ${
                m.sender === "you"
                  ? "bg-blue-600 text-white rounded-br-md"
                  : m.sender === "bot"
                  ? "bg-white text-gray-900 border rounded-bl-md"
                  : "bg-yellow-100 text-yellow-800 border border-yellow-300"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t flex items-center gap-2">
        <input
          className="flex-1 px-4 py-2 text-sm border rounded-full 
                     focus:outline-none focus:ring-2 focus:ring-blue-400 
                     text-black placeholder-gray-400"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
        />
        <button
          onClick={sendMessage}
          className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
