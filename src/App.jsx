import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./screens/Auth";
import Home from "./screens/Home";
import Profile from "./screens/Profile";
import { COLORS, bodyFont } from "./theme";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState("home"); // "home" | "profile"

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <div className="w-full h-screen flex items-center justify-center" style={{ background: "#000" }}>
      <div className="relative w-full h-full max-w-[420px] overflow-hidden" style={{ background: COLORS.bg }}>
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <p style={{ ...bodyFont, color: COLORS.muted }}>Loading…</p>
          </div>
        ) : session ? (
          screen === "profile" ? (
            <Profile session={session} onBack={() => setScreen("home")} />
          ) : (
            <Home session={session} onEditProfile={() => setScreen("profile")} />
          )
        ) : (
          <Auth onAuthed={() => {}} />
        )}
      </div>
    </div>
  );
}
