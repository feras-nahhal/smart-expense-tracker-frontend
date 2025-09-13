"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { API_BASE } from "@/lib/config";

export default function ReceiptUploader() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const inputRef = useRef(null);

  // ✅ Get logged-in userId from localStorage
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file || !userId) {
      setStatus("❌ Missing file or user not logged in");
      return;
    }

    setStatus("⏳ Uploading...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        `${API_BASE}/upload/receipt?user_id=${userId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const data = res.data;
      setStatus(
        `✅ Parsed $${data.amount?.toFixed(2) || 0} • ${
          data.category || "Unknown"
        }`
      );

      // refresh dashboard + charts
      window.dispatchEvent(new CustomEvent("expenses:changed"));
      setFile(null); // reset after upload
    } catch (e) {
      console.error("Upload failed:", e);
      setStatus(
        `❌ Upload failed: ${e.response?.data?.detail || e.message || "Unknown error"}`
      );
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 shadow-lg rounded-2xl border border-gray-100">
      <h2 className="text-xl font-semibold mb-4">🧾 Receipt Upload</h2>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed rounded-xl p-4 sm:p-6 bg-gray-50 text-center cursor-pointer transition hover:border-blue-400 hover:bg-blue-50"
        onClick={() => inputRef.current?.click()}
      >
        {file ? (
          <div className="flex flex-col items-center space-y-2">
            {file.type.startsWith("image/") && (
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg shadow"
              />
            )}
            <p className="font-medium text-sm sm:text-base">📄 {file.name}</p>
            <p className="text-xs sm:text-sm text-gray-600">Ready to upload</p>
          </div>
        ) : (
          <p className="text-sm sm:text-base text-gray-500">
            📷 Drag & Drop or click to choose a file
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      {/* Upload button + status */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          disabled={!file}
          onClick={handleUpload}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm sm:text-base font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          Upload & Parse
        </button>
        {status && (
          <span
            className={`text-sm sm:text-base font-medium ${
              status.startsWith("✅")
                ? "text-emerald-600"
                : status.startsWith("❌")
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
