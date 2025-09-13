"use client";
import { useEffect, useState, useRef } from "react";
import { WS_BASE } from "@/lib/config";

export default function ChatPanel({ userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const wsUrl = `${WS_BASE}/ws/chat/${userId}`;
    const ws = new WebSocket(wsUrl);

    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected:", wsUrl);
      setConnected(true);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        setMessages((prev) => [...prev, msg]);
      } catch (err) {
        console.error("❌ Error parsing message:", err);
      }
    };

    ws.onclose = () => {
      console.log("❌ WebSocket closed");
      setConnected(false);
    };

    return () => ws.close();
  }, [userId]);

  const sendMessage = () => {
    if (wsRef.current && input.trim()) {
      wsRef.current.send(JSON.stringify({ message: input }));
      setMessages((prev) => [...prev, { sender: "You", message: input }]);
      setInput("");
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow flex flex-col h-80">
      <h2 className="text-lg font-semibold mb-2">💬 Chat with AI</h2>
      <div className="flex-1 overflow-y-auto space-y-2 border p-2 rounded-lg">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              m.sender === "You"
                ? "bg-blue-100 text-right"
                : "bg-gray-100 text-left"
            }`}
          >
            <span className="font-semibold">{m.sender}: </span>
            {m.message}
          </div>
        ))}
      </div>
      <div className="flex mt-2">
        <input
          className="flex-1 border rounded-l-lg px-2 py-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={connected ? "Type your message..." : "Connecting..."}
          disabled={!connected}
        />
        <button
          onClick={sendMessage}
          disabled={!connected}
          className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

  );
}
