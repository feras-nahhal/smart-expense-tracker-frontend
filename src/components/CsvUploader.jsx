"use client";
import { useState } from "react";

export default function CsvUploader({ userId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("⚠️ Please select a CSV file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`http://127.0.0.1:8000/upload/csv?user_id=${userId}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ CSV imported successfully!");
        if (onUploaded) onUploaded();
      } else {
        setMessage(`❌ Error: ${data.detail || "Failed to upload"}`);
      }
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow flex flex-col gap-3">
      <h2 className="text-lg font-semibold">📂 Import CSV</h2>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload CSV"}
      </button>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
