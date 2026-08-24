import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, bodyFont } from "../theme";

export default function Upload({ session, onBack }) {
  const [videoFile, setVideoFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Sirf video file select karein.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("Video 100MB se chhoti honi chahiye.");
      return;
    }

    setError("");
    setVideoFile(file);
  };

  const handleUpload = async () => {
    if (!videoFile) {
      setError("Pehle video select karein.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      setProgress("User check ho raha hai...");
      const user = session?.user;
      if (!user) {
        setError("Aap login nahi hain.");
        setUploading(false);
        return;
      }

      setProgress("Video upload ho rahi hai...");
      const fileExt = videoFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, videoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setError("Upload fail: " + uploadError.message);
        setUploading(false);
        return;
      }

      setProgress("Video ka link banaya ja raha hai...");
      const { data: urlData } = supabase.storage
        .from("videos")
        .getPublicUrl(fileName);

      setProgress("Database mein save ho raha hai...");
      const { error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        video_url: urlData.publicUrl,
        caption: caption,
      });

      if (dbError) {
        setError("Database save fail: " + dbError.message);
        setUploading(false);
        return;
      }

      setProgress("Ho gaya!");
      setUploading(false);
      onBack();
    } catch (err) {
      setError("Kuch masla ho gaya: " + err.message);
      setUploading(false);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: COLORS.bg, padding: "20px", overflow: "auto" }}
    >
      <p style={{ ...bodyFont, color: COLORS.muted, marginBottom: "12px" }}>
        <span onClick={onBack} style={{ cursor: "pointer" }}>← Wapas</span>
      </p>

      <h2 style={{ ...bodyFont, color: "#fff", marginBottom: "16px" }}>
        Video Upload Karein
      </h2>

      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ marginBottom: "16px" }}
      />

      {videoFile && (
        <video
          src={URL.createObjectURL(videoFile)}
          controls
          style={{ width: "100%", borderRadius: "8px", marginBottom: "16px" }}
        />
      )}

      <textarea
        placeholder="Caption likhein..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        disabled={uploading}
        rows={3}
        style={{ width: "100%", marginBottom: "16px", padding: "8px", borderRadius: "6px" }}
      />

      {error && <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>}
      {uploading && <p style={{ color: COLORS.muted, marginBottom: "12px" }}>{progress}</p>}

      <button
        onClick={handleUpload}
        disabled={uploading || !videoFile}
        style={{
          width: "100%",
          padding: "14px",
          background: uploading ? "#555" : "#000",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
        }}
      >
        {uploading ? "Upload ho raha hai..." : "Upload Karein"}
      </button>
    </div>
  );
                  }
