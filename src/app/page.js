"use client";
import { useEffect, useState } from "react";
import ChatPanel from "@/components/ChatPanel";
import Dashboard from "@/components/Dashboard";
import ReceiptUploader from "@/components/ReceiptUploader";
import AuthPanel from "@/components/AuthPanel";

export default function Home() {
  const [activeTab, setActiveTab] = useState("chat");
  const [userId, setUserId] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    if (storedId) {
      setUserId(storedId);
    }
  }, []);

  // ✅ Listen for alerts from ChatPanel
  useEffect(() => {
    const handler = (e) => {
      setAlerts((prev) => [...prev, e.detail]);
      setTimeout(() => {
        setAlerts((prev) => prev.slice(1));
      }, 5000);
    };

    window.addEventListener("alert:new", handler);
    return () => window.removeEventListener("alert:new", handler);
  }, []);

  if (!userId) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <AuthPanel onAuth={(id) => setUserId(id)} />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row">
      {/* Chat */}
      <div
        className={`flex flex-col flex-1 border-r bg-white pb-16 lg:pb-0 ${
          activeTab === "chat" ? "block" : "hidden lg:flex"
        }`}
      >
        <div className="flex-1 overflow-y-auto p-6">
          <ChatPanel />
        </div>
      </div>

      {/* Dashboard + Receipt */}
      <div
        className={`flex flex-col w-full lg:w-[400px] bg-gray-50 p-4 gap-4 overflow-y-auto pb-16 lg:pb-0 ${
          activeTab === "dashboard" ? "block" : "hidden lg:flex"
        }`}
      >
        <Dashboard />
        <ReceiptUploader />
      </div>

      {/* Floating Mobile nav */}
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 flex bg-white border shadow-lg rounded-full overflow-hidden">
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-6 py-2 ${
            activeTab === "chat" ? "bg-blue-600 text-white" : "text-gray-600"
          } rounded-l-full transition`}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-6 py-2 ${
            activeTab === "dashboard"
              ? "bg-blue-600 text-white"
              : "text-gray-600"
          } rounded-r-full transition`}
        >
          📊 Dashboard
        </button>
      </div>

      {/* ✅ Floating Alerts */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {alerts.map((msg, i) => (
          <div
            key={i}
            className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce"
          >
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
