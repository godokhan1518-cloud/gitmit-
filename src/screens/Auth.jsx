import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User as UserIcon, AtSign } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, displayFont, bodyFont } from "../theme";

const MODES = { LOGIN: "login", SIGNUP: "signup", FORGOT: "forgot" };

function Field({ Icon, ...props }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-3 mb-3"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}
    >
      <Icon size={16} color={COLORS.muted} />
      <input
        {...props}
        style={{ ...bodyFont, background: "transparent", color: COLORS.text, width: "100%", outline: "none" }}
      />
    </div>
  );
}

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState(MODES.LOGIN);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const resetMessages = () => {
    setError("");
    setInfo("");
  };

  const validate = () => {
    if (!email.includes("@") || !email.includes(".")) {
      setError("Enter a valid email address.");
      return false;
    }
    if (mode !== MODES.FORGOT && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (mode === MODES.SIGNUP) {
      if (!fullName.trim()) {
        setError("Enter your full name.");
        return false;
      }
      if (!/^[a-z0-9_.]{3,20}$/i.test(username)) {
        setError("Username must be 3-20 characters (letters, numbers, . or _).");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!validate()) return;
    setLoading(true);

    try {
      if (mode === MODES.SIGNUP) {
        const { data: existing, error: lookupErr } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", username.toLowerCase())
          .maybeSingle();

        if (lookupErr && lookupErr.code !== "PGRST116") {
          throw lookupErr;
        }
        if (existing) {
          setError("That username is already taken.");
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, username: username.toLowerCase() },
          },
        });
        if (signUpError) throw signUpError;

        if (data.user) {
          await supabase.from("profiles").insert({
            id: data.user.id,
            full_name: fullName,
            username: username.toLowerCase(),
          });
        }

        setInfo("Account created! Check your email to verify your address before logging in.");
        setMode(MODES.LOGIN);
      } else if (mode === MODES.LOGIN) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        onAuthed && onAuthed();
      } else if (mode === MODES.FORGOT) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (resetError) throw resetError;
        setInfo("Password reset link sent. Check your email.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col justify-center px-7"
      style={{ background: COLORS.bg }}
    >
      <div className="mb-8">
        <p style={{ ...displayFont, color: COLORS.text, fontWeight: 700 }} className="text-3xl mb-1">
          VYRO
        </p>
        <p style={{ ...bodyFont, color: COLORS.muted }} className="text-sm">
          {mode === MODES.LOGIN && "Welcome back. Log in to continue."}
          {mode === MODES.SIGNUP && "Create an account to start posting."}
          {mode === MODES.FORGOT && "We'll send you a link to reset your password."}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === MODES.SIGNUP && (
          <>
            <Field Icon={UserIcon} placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Field
              Icon={AtSign}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              autoCapitalize="none"
            />
          </>
        )}

        <Field
          Icon={Mail}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoCapitalize="none"
        />

        {mode !== MODES.FORGOT && (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-3 mb-1"
            style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}
          >
            <Lock size={16} color={COLORS.muted} />
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...bodyFont, background: "transparent", color: COLORS.text, width: "100%", outline: "none" }}
            />
            <button type="button" onClick={() => setShowPw((s) => !s)}>
              {showPw ? <EyeOff size={16} color={COLORS.muted} /> : <Eye size={16} color={COLORS.muted} />}
            </button>
          </div>
        )}

        {mode === MODES.LOGIN && (
          <button
            type="button"
            onClick={() => { resetMessages(); setMode(MODES.FORGOT); }}
            style={{ ...bodyFont, color: COLORS.violet }}
            className="text-xs mb-4 mt-1 block"
          >
            Forgot password?
          </button>
        )}

        {error && (
          <p style={{ ...bodyFont, color: COLORS.danger }} className="text-xs mb-3">
            {error}
          </p>
        )}
        {info && (
          <p style={{ ...bodyFont, color: "#7CFFB2" }} className="text-xs mb-3">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ ...displayFont, background: COLORS.violet, color: "#fff", opacity: loading ? 0.6 : 1 }}
          className="w-full py-3 rounded-full font-semibold text-sm mt-3"
        >
          {loading
            ? "Please wait…"
            : mode === MODES.LOGIN
            ? "Log in"
            : mode === MODES.SIGNUP
            ? "Sign up"
            : "Send reset link"}
        </button>
      </form>

      <div className="mt-6 text-center">
        {mode === MODES.LOGIN && (
          <p style={{ ...bodyFont, color: COLORS.muted }} className="text-sm">
            Don't have an account?{" "}
            <button onClick={() => { resetMessages(); setMode(MODES.SIGNUP); }} style={{ color: COLORS.violet }}>
              Sign up
            </button>
          </p>
        )}
        {(mode === MODES.SIGNUP || mode === MODES.FORGOT) && (
          <p style={{ ...bodyFont, color: COLORS.muted }} className="text-sm">
            Already have an account?{" "}
            <button onClick={() => { resetMessages(); setMode(MODES.LOGIN); }} style={{ color: COLORS.violet }}>
              Log in
            </button>
          </p>
        )}
      </div>
    </div>
  );
                   }
