import React, { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, displayFont, bodyFont } from "../theme";

export default function Home({ session }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, username")
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
      <p style={{ ...displayFont, color: COLORS.text, fontWeight: 700 }} className="text-2xl mb-2">
        VYRO
      </p>

      {loading ? (
        <p style={{ ...bodyFont, color: COLORS.muted }} className="text-sm">Loading your profile…</p>
      ) : (
        <>
          <p style={{ ...bodyFont, color: COLORS.text }} className="text-sm mb-1">
            Logged in as <span style={{ color: COLORS.violet }}>{profile?.full_name || session.user.email}</span>
          </p>
          {profile?.username && (
            <p style={{ ...bodyFont, color: COLORS.muted }} className="text-xs mb-6">@{profile.username}</p>
          )}
        </>
      )}

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full mt-6"
        style={{ ...bodyFont, background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
      >
        <LogOut size={16} />
        Log out
      </button>

      <p style={{ ...bodyFont, color: COLORS.muted }} className="text-xs mt-8 text-center">
        This confirms auth + session persistence work.
        Next step: the real video feed, upload, and profile screens.
      </p>
    </div>
  );
}
