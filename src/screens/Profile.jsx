import React, { useEffect, useState } from "react";
import { Camera, ArrowLeft } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, displayFont, bodyFont } from "../theme";

export default function Profile({ session, onBack }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, username, bio, avatar_url")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!error && data) {
        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || null);
      }

      setLoading(false);
    };

    loadProfile();
  }, [session]);

  const handleAvatarUpload = async (e) => {
    setError("");
    setInfo("");

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${session.user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const freshUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(freshUrl);

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({ id: session.user.id, avatar_url: freshUrl });

      if (updateError) throw updateError;

      setInfo("Profile picture updated.");
    } catch (err) {
      setError(err.message || "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setInfo("");

    if (!fullName.trim()) {
      setError("Full name can't be empty.");
      return;
    }

    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) {
      setError("Username must be 3-20 characters (letters, numbers, . or _).");
      return;
    }

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .neq("id", session.user.id)
        .maybeSingle();

      if (existing) {
        setError("That username is already taken.");
        setSaving(false);
        return;
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: session.user.id,
          full_name: fullName,
          username: username.toLowerCase(),
          bio,
        });

      if (upsertError) throw upsertError;

      setInfo("Profile saved.");
    } catch (err) {
      setError(err.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: COLORS.bg }}>
        <p style={{ ...bodyFont, color: COLORS.muted }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto px-6 pt-5 pb-10" style={{ background: COLORS.bg }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack}>
          <ArrowLeft size={20} color={COLORS.text} />
        </button>
        <p style={{ ...displayFont, color: COLORS.text, fontWeight: 700 }} className="text-lg">
          Edit profile
        </p>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <div
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: COLORS.surface2 }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <p style={{ ...displayFont, color: COLORS.muted }} className="text-2xl">
                {fullName ? fullName[0].toUpperCase() : "?"}
              </p>
            )}
          </div>
          <label
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: COLORS.violet }}
          >
            <Camera size={14} color="#fff" />
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
        </div>
        {uploading && (
          <p style={{ ...bodyFont, color: COLORS.muted }} className="text-xs mt-2">
            Uploading...
          </p>
        )}
      </div>

      <div className="mb-3">
        <p style={{ ...bodyFont, color: COLORS.muted }} className="text-xs mb-1">Full name</p>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={{ ...bodyFont, background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
          className="w-full rounded-xl px-3 py-3 text-sm outline-none"
        />
      </div>

      <div className="mb-3">
        <p style={{ ...bodyFont, color: COLORS.muted }} className="text-xs mb-1">Username</p>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
          autoCapitalize="none"
          style={{ ...bodyFont, background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
          className="w-full rounded-xl px-3 py-3 text-sm outline-none"
        />
      </div>

      <div className="mb-5">
        <p style={{ ...bodyFont, color: COLORS.muted }} className="text-xs mb-1">Bio</p>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 150))}
          rows={3}
          style={{ ...bodyFont, background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
          className="w-full rounded-xl px-3 py-3 text-sm outline-none resize-none"
        />
        <p style={{ ...bodyFont, color: COLORS.muted }} className="text-xs mt-1 text-right">
          {bio.length}/150
        </p>
      </div>

      {error && (
        <p style={{ ...bodyFont, color: COLORS.danger }} className="text-xs mb-3">{error}</p>
      )}
      {info && (
        <p style={{ ...bodyFont, color: "#7CFFB2" }} className="text-xs mb-3">{info}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ ...bodyFont, background: COLORS.violet, color: "#fff", opacity: saving ? 0.6 : 1 }}
        className="w-full py-3 rounded-full font-semibold text-sm"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}
