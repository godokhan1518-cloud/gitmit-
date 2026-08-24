import React, { useEffect, useState } from "react";
import { LogOut, Settings, Upload, PlaySquare } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, displayFont, bodyFont } from "../theme";

export default function Home({ session, onEditProfile, onUpload, onFeed }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, username, bio, avatar_url")
        .eq("id", session.user.id)
        .single();
      if (!error) setProfile(data);
      setLoading(false);
    };
    loadProfile();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-8" style={{ background: COLORS.bg }}>
      <p style={{ ...displayFont, color: COLORS.text, fontWeight: 700 }} className="text-2xl mb-4">
        VYRO
      </p>

      {loading ? (
        <p style={{ ...bodyFont, color: COLORS.muted }} className="text-sm">Loading your profile...</p>
      ) : (
        <>
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center mb-3"
            style={{ background: COLORS.surface2 }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <p style={{ ...displayFont, color: COLORS.muted }} className="text-2xl">
                {profile?.full_name || session.user.email[0].toUpperCase()}
              </p>
            )}
          </div>

          <p style={{ ...bodyFont, color: COLORS.text }} className="text-sm mb-1">
            <span style={{ color: COLORS.violet }}>{profile?.full_name || session.user.email}</span>
          </p>
          {profile?.username && (
            <p style={{ ...bodyFont, color: COLORS.muted }} className="text-xs mb-1">@{profile.username}</p>
          )}
          {profile?.bio && (
            <p style={{ ...bodyFont, color: COLORS.muted }} className="text-xs mb-4 text-center px-6">{profile.bio}</p>
          )}
        </>
      )}

      <button
        onClick={onFeed}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full mt-4"
        style={{ ...bodyFont, background: COLORS.violet, color: "#fff" }}
      >
        <PlaySquare size={16} />
        Feed Dekhein
      </button>

      <button
        onClick={onUpload}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full mt-3"
        style={{ ...bodyFont, background: COLORS.text, color: "#fff" }}
      >
        <Upload size={16} />
        Video Upload
      </button>

      <button
        onClick={onEditProfile}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full mt-3"
        style={{ ...bodyFont, background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
      >
        <Settings size={16} />
        Edit profile
      </button>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full mt-3"
        style={{ ...bodyFont, background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
      >
        <LogOut size={16} />
        Log out
      </button>
    </div>
  );
}
