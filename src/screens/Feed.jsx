import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Heart, MessageCircle, Volume2, VolumeX } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, bodyFont } from "../theme";
import CommentsModal from "./CommentsModal";

export default function Feed({ session, onBack, onViewProfile }) {
  const [videos, setVideos] = useState([]);
  const [likes, setLikes] = useState({});
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [commentsOpenFor, setCommentsOpenFor] = useState(null);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef(null);
  const videoRefs = useRef({});

  useEffect(() => {
    const loadData = async () => {
      const { data: videoData, error: videoError } = await supabase
        .from("videos")
        .select("id, video_url, caption, user_id, created_at")
        .order("created_at", { ascending: false });

      if (videoError || !videoData) {
        setLoading(false);
        return;
      }

      setVideos(videoData);

      const userIds = [...new Set(videoData.map((v) => v.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profileMap = {};
      (profilesData || []).forEach((p) => {
        profileMap[p.id] = p;
      });
      setProfiles(profileMap);

      const { data: likesData } = await supabase
        .from("likes")
        .select("video_id, user_id");

      const likeMap = {};
      videoData.forEach((v) => {
        likeMap[v.id] = { count: 0, likedByMe: false };
      });

      if (likesData) {
        likesData.forEach((l) => {
          if (!likeMap[l.video_id]) return;
          likeMap[l.video_id].count += 1;
          if (session?.user?.id && l.user_id === session.user.id) {
            likeMap[l.video_id].likedByMe = true;
          }
        });
      }

      setLikes(likeMap);
      setLoading(false);
    };

    loadData();
  }, [session]);

  const pauseAllExcept = (playingId) => {
    Object.entries(videoRefs.current).forEach(([id, vid]) => {
      if (!vid) return;
      if (id !== playingId && !vid.paused) {
        vid.pause();
        vid.currentTime = 0;
      }
    });
  };

  useEffect(() => {
    if (!videos.length || !containerRef.current) return;

    const setupTimeout = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const id = entry.target.dataset.id;
            const vid = videoRefs.current[id];
            if (!vid) return;

            if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
              vid.play().catch(() => {});
              pauseAllExcept(id);
            } else if (!entry.isIntersecting) {
              vid.pause();
            }
          });
        },
        {
          root: containerRef.current,
          threshold: [0, 0.25, 0.5, 0.6, 0.75, 1],
        }
      );

      Object.values(videoRefs.current).forEach((vid) => {
        if (vid) observer.observe(vid);
      });

      containerRef.current.__observer = observer;
    }, 100);

    return () => {
      clearTimeout(setupTimeout);
      if (containerRef.current?.__observer) {
        containerRef.current.__observer.disconnect();
      }
    };
  }, [videos]);

  useEffect(() => {
    Object.values(videoRefs.current).forEach((vid) => {
      if (vid) vid.muted = muted;
    });
  }, [muted, videos]);

  const toggleLike = async (videoId) => {
    if (!session?.user?.id) return;
    const current = likes[videoId] || { count: 0, likedByMe: false };

    if (current.likedByMe) {
      setLikes((prev) => ({
        ...prev,
        [videoId]: { count: prev[videoId].count - 1, likedByMe: false },
      }));

      await supabase
        .from("likes")
        .delete()
        .eq("video_id", videoId)
        .eq("user_id", session.user.id);
    } else {
      setLikes((prev) => ({
        ...prev,
        [videoId]: { count: prev[videoId].count + 1, likedByMe: true },
      }));

      await supabase.from("likes").insert({
        video_id: videoId,
        user_id: session.user.id,
      });
    }
  };

  const handleVideoTap = (id) => (e) => {
    const vid = e.target;
    if (vid.paused) {
      vid.play();
      pauseAllExcept(String(id));
    } else {
      vid.pause();
    }
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#000", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 10,
          color: "#fff",
          cursor: "pointer",
        }}
        onClick={onBack}
      >
        <ArrowLeft size={22} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 10,
          color: "#fff",
          cursor: "pointer",
        }}
        onClick={() => setMuted((m) => !m)}
      >
        {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
      </div>

      {loading ? (
        <div className="w-full h-full flex items-center justify-center">
          <p style={{ ...bodyFont, color: COLORS.muted }}>Loading feed...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center px-8">
          <p style={{ ...bodyFont, color: COLORS.muted }} className="text-center">
            Abhi tak koi video upload nahi hui. Sabse pehle aap upload karein!
          </p>
        </div>
      ) : (
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            overflowY: "scroll",
            scrollSnapType: "y mandatory",
          }}
        >
          {videos.map((v) => {
            const likeInfo = likes[v.id] || { count: 0, likedByMe: false };
            return (
              <div
                key={v.id}
                style={{
                  width: "100%",
                  height: "100%",
                  scrollSnapAlign: "start",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <video
                  data-id={v.id}
                  ref={(el) => (videoRefs.current[v.id] = el)}
                  src={v.video_url}
                  loop
                  muted={muted}
                  playsInline
                  controls={false}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onClick={handleVideoTap(v.id)}
                />

                <div
                  style={{
                    position: "absolute",
                    bottom: 24,
                    left: 16,
                    right: 70,
                    color: "#fff",
                  }}
                >
                  <div
                    style={{ cursor: "pointer" }}
                    onClick={() => onViewProfile && onViewProfile(v.user_id)}
                  >
                    <p style={{ ...bodyFont, fontWeight: 700 }} className="mb-1">
                      @{profiles[v.user_id]?.username || "user"}
                    </p>
                  </div>
                  {v.caption && (
                    <p style={{ ...bodyFont }} className="text-sm">
                      {v.caption}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: 24,
                    right: 12,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 20,
                    color: "#fff",
                  }}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}
                    onClick={() => toggleLike(v.id)}
                  >
                    <Heart
                      size={28}
                      fill={likeInfo.likedByMe ? "#ff2d55" : "none"}
                      color={likeInfo.likedByMe ? "#ff2d55" : "#fff"}
                    />
                    <span style={{ ...bodyFont }} className="text-xs mt-1">
                      {likeInfo.count}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}
                    onClick={() => setCommentsOpenFor(v.id)}
                  >
                    <MessageCircle size={28} />
                    <span style={{ ...bodyFont }} className="text-xs mt-1">Comment</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {commentsOpenFor && (
        <CommentsModal
          videoId={commentsOpenFor}
          session={session}
          onClose={() => setCommentsOpenFor(null)}
        />
      )}
    </div>
  );
              }
