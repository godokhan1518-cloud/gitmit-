import React, { useEffect, useState } from "react";
import { X, Send } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, bodyFont } from "../theme";

export default function CommentsModal({ videoId, session, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, user_id, created_at")
        .eq("video_id", videoId)
        .order("created_at", { ascending: true });

      if (!error && data) setComments(data);
      setLoading(false);
    };
    loadComments();
  }, [videoId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !session?.user?.id) return;

    setSending(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({
        video_id: videoId,
        user_id: session.user.id,
        content: trimmed,
      })
      .select("id, content, user_id, created_at")
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data]);
      setText("");
    }
    setSending(false);
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxHeight: "70%",
          background: COLORS.bg,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
            borderBottom: `1px solid ${COLORS.line}`,
          }}
        >
          <p style={{ ...bodyFont, color: COLORS.text, fontWeight: 700 }}>Comments</p>
          <X size={20} color={COLORS.text} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", minHeight: 120 }}>
          {loading ? (
            <p style={{ ...bodyFont, color: COLORS.muted }} className="text-sm">Loading...</p>
          ) : comments.length === 0 ? (
            <p style={{ ...bodyFont, color: COLORS.muted }} className="text-sm">
              Koi comment nahi. Sabse pehle aap comment karein!
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} style={{ marginBottom: 12 }}>
                <p style={{ ...bodyFont, color: COLORS.violet }} className="text-xs mb-1">
                  {c.user_id === session?.user?.id ? "Aap" : "User"}
                </p>
                <p style={{ ...bodyFont, color: COLORS.text }} className="text-sm">
                  {c.content}
                </p>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderTop: `1px solid ${COLORS.line}`,
          }}
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Comment likhein..."
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 20,
              border: `1px solid ${COLORS.line}`,
              background: COLORS.surface,
              color: COLORS.text,
              ...bodyFont,
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            style={{
              background: COLORS.violet,
              border: "none",
              borderRadius: "50%",
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Send size={16} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
              }
