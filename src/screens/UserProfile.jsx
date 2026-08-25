import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, displayFont, bodyFont } from "../theme";

export default function UserProfile({ userId, session, onBack }) {
  const [profile, setProfile] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, username, bio, avatar_url")
        .eq("id", userId)
        .single();

      setProfile(profileData || null);

      const { count: followers } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      const { count: following } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      setFollowerCount(followers || 0);
      setFollowingCount(following || 0);

      if (session?.user?.id && session.user.id !== userId) {
        const { data: existing } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", session.user.id)
          .eq("following_id", userId)
          .maybeSingle();

        setIsFollowing(!!existing);
      }

      setLoading(false);
    };

    if (userId) load();
  }, [userId, session]);

  const toggleFollow = async () => {
    if (!session?.user?.id || isOwnProfile || busy) return;
    setBusy(true);

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", session.user.id)
        .eq("following_id", userId);

      setIsFollowing(false);
      setFollowerCount((c) => c - 1);
    } else {
      await supabase.from("follows").insert({
        follower_id: session.user.id,
        following_id: userId,
      });

      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
    }

    setBusy(false);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: COLORS.bg }}>
        <p style={{ ...bodyFont, color: COLORS.muted }}>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-6" style={{ background: COLORS.bg }}>
        <button onClick={onBack} style={{ position: "absolute", top: 16, left: 16 }}>
          <ArrowLeft size={22} color={COLORS.text} />
        </button>
        <p style={{ ...bodyFont, color: COLORS.muted }}>Profile nahi mila.</p>
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
          {profile.username || "Profile"}
        </p>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div
          className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center mb-3"
          style={{ background: COLORS.surface2 }}
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <p style={{ ...displayFont, color: COLORS.muted }} className="text-2xl">
              {profile.full_name ? profile.full_name[0].toUpperCase() : "?"}
            </p>
          )}
        </div>

        <p style={{ ...bodyFont, color: COLORS.text, fontWeight: 700 }} className="text-lg">
          {profile.full_name || profile.username}
        </p>
        <p style={{ ...bodyFont, color: COLORS.muted }} className="text-sm">
          @{profile.username}
        </p>

        {profile.bio && (
          <p style={{ ...bodyFont, color: COLORS.text }} className="text-sm text-center mt-3">
            {profile.bio}
          </p>
        )}

        <div className="flex gap-6 mt-4">
          <div className="flex flex-col items-center">
            <p style={{ ...bodyFont, color: COLORS.text, fontWeight: 700 }}>{followerCount}</p>
            <p style={{ ...bodyFont, color: COLORS.muted }} className="text-xs">Followers</p>
          </div>
          <div className="flex flex-col items-center">
            <p style={{ ...bodyFont, color: COLORS.text, fontWeight: 700 }}>{followingCount}</p>
            <p style={{ ...bodyFont, color: COLORS.muted }} className="text-xs">Following</p>
          </div>
        </div>

        {!isOwnProfile && (
          <button
            onClick={toggleFollow}
            disabled={busy}
            style={{
              ...bodyFont,
              marginTop: 16,
              padding: "10px 32px",
              borderRadius: 999,
              border: isFollowing ? `1px solid ${COLORS.line}` : "none",
              background: isFollowing ? "transparent" : COLORS.violet,
              color: isFollowing ? COLORS.text : "#fff",
              fontWeight: 700,
              opacity: busy ? 0.6 : 1,
            }}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>
    </div>
  );
  }
