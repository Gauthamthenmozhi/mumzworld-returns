import { useState } from "react";
import axios from "axios";

const DECISION_LABELS = {
  refund:       { en: "Refund",       ar: "استرداد المبلغ", color: "#dc2626", bg: "#fef2f2", icon: "↩" },
  exchange:     { en: "Exchange",     ar: "استبدال",        color: "#d97706", bg: "#fffbeb", icon: "⇄" },
  store_credit: { en: "Store Credit", ar: "رصيد المتجر",   color: "#2563eb", bg: "#eff6ff", icon: "◈" },
  escalate:     { en: "Escalate",     ar: "تصعيد للدعم",   color: "#7c3aed", bg: "#f5f3ff", icon: "⚑" },
  null:         { en: "Out of Scope", ar: "خارج النطاق",   color: "#6b7280", bg: "#f9fafb", icon: "✕" },
};

// Floating baby icons scattered in background
const FLOATERS = [
  { icon: "🍼", top: "6%",  left: "4%",  size: 28, opacity: 0.18, rotate: -15 },
  { icon: "🧸", top: "12%", left: "88%", size: 32, opacity: 0.15, rotate: 10  },
  { icon: "👶", top: "28%", left: "92%", size: 26, opacity: 0.13, rotate: 5   },
  { icon: "🌸", top: "45%", left: "2%",  size: 30, opacity: 0.16, rotate: 0   },
  { icon: "🛒", top: "60%", left: "90%", size: 28, opacity: 0.14, rotate: -8  },
  { icon: "🧷", top: "72%", left: "5%",  size: 24, opacity: 0.15, rotate: 20  },
  { icon: "🌙", top: "82%", left: "88%", size: 26, opacity: 0.13, rotate: -5  },
  { icon: "⭐", top: "90%", left: "10%", size: 22, opacity: 0.14, rotate: 15  },
  { icon: "🎀", top: "18%", left: "6%",  size: 26, opacity: 0.13, rotate: -10 },
  { icon: "🍭", top: "50%", left: "95%", size: 24, opacity: 0.12, rotate: 8   },
  { icon: "🌈", top: "3%",  left: "50%", size: 30, opacity: 0.10, rotate: 0   },
  { icon: "🐣", top: "95%", left: "50%", size: 26, opacity: 0.12, rotate: -5  },
];

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState("en");
  const [focused, setFocused] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await axios.post("http://localhost:8000/classify", { text });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isRTL = lang === "ar";
  const decisionKey = result?.decision ?? "null";
  const label = result ? DECISION_LABELS[decisionKey] : null;
  const confPct = result ? Math.round(result.confidence * 100) : 0;
  const barColor = result
    ? result.confidence >= 0.75 ? "#16a34a" : result.confidence >= 0.5 ? "#d97706" : "#dc2626"
    : "#16a34a";

  return (
    <div style={{
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(160deg, #fdf2f8 0%, #fce7f3 30%, #ede9fe 65%, #dbeafe 100%)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "40px 16px 60px",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>

      {/* Decorative blobs */}
      <div style={{
        position: "fixed", top: -120, left: -120, width: 400, height: 400,
        borderRadius: "50%", background: "rgba(236,72,153,0.08)", pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: -100, right: -100, width: 350, height: 350,
        borderRadius: "50%", background: "rgba(139,92,246,0.08)", pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", top: "40%", right: -80, width: 250, height: 250,
        borderRadius: "50%", background: "rgba(59,130,246,0.06)", pointerEvents: "none",
      }} />

      {/* Floating baby icons */}
      {FLOATERS.map((f, i) => (
        <div key={i} style={{
          position: "fixed", top: f.top, left: f.left,
          fontSize: f.size, opacity: f.opacity,
          transform: `rotate(${f.rotate}deg)`,
          pointerEvents: "none", userSelect: "none",
          filter: "grayscale(20%)",
        }}>
          {f.icon}
        </div>
      ))}

      {/* Main card */}
      <div style={{
        width: "100%", maxWidth: 620, position: "relative", zIndex: 1,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 24,
        boxShadow: "0 24px 64px rgba(190,24,93,0.10), 0 4px 20px rgba(0,0,0,0.06)",
        border: "1px solid rgba(255,255,255,0.9)",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #be185d 0%, #9333ea 100%)",
          padding: "22px 28px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "relative", overflow: "hidden",
        }}>
          {/* Header shimmer */}
          <div style={{
            position: "absolute", top: -40, right: -40, width: 160, height: 160,
            borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: -30, left: "40%", width: 100, height: 100,
            borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
            <div style={{
              width: 46, height: 46, background: "rgba(255,255,255,0.2)",
              borderRadius: 14, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 22,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}>
              🛍️
            </div>
            <div>
              <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                Mumzworld
              </div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2, fontWeight: 500 }}>
                {isRTL ? "مصنف أسباب الإرجاع بالذكاء الاصطناعي" : "AI Return Reason Classifier"}
              </div>
            </div>
          </div>

          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            style={{
              padding: "7px 18px", borderRadius: 20,
              border: "1.5px solid rgba(255,255,255,0.35)",
              cursor: "pointer", background: "rgba(255,255,255,0.15)",
              color: "#fff", fontSize: 13, fontWeight: 700,
              backdropFilter: "blur(4px)", position: "relative",
            }}
          >
            {lang === "en" ? "🌐 عربي" : "🌐 English"}
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "28px" }} dir={isRTL ? "rtl" : "ltr"}>

          {/* Tagline */}
          <div style={{
            marginBottom: 20, padding: "10px 14px",
            background: "linear-gradient(135deg, #fdf2f8, #f5f3ff)",
            borderRadius: 10, border: "1px solid #fce7f3",
            fontSize: 13, color: "#9d174d", fontWeight: 500,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>✨</span>
            {isRTL
              ? "اكتب سبب الإرجاع وسيقوم الذكاء الاصطناعي بتصنيفه فوراً"
              : "Type a return reason and AI will instantly classify it into the right action"}
          </div>

          <form onSubmit={handleSubmit}>
            <label style={{
              display: "block", fontSize: 12, fontWeight: 700,
              color: "#6b7280", marginBottom: 8,
              textTransform: "uppercase", letterSpacing: "0.6px",
            }}>
              {isRTL ? "سبب الإرجاع" : "Return Reason"}
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={isRTL
                ? "مثال: وصل المنتج مكسوراً، أريد استرداد أموالي..."
                : "e.g. The stroller arrived with a broken wheel, I want a refund..."}
              dir={isRTL ? "rtl" : "ltr"}
              rows={4}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 12,
                border: `1.5px solid ${focused ? "#be185d" : "#e5e7eb"}`,
                fontSize: 15, resize: "vertical", boxSizing: "border-box",
                outline: "none", color: "#111827", lineHeight: 1.6,
                background: focused ? "#fff" : "#fafafa",
                boxShadow: focused ? "0 0 0 3px rgba(190,24,93,0.08)" : "none",
                transition: "all 0.2s",
              }}
            />

            <button
              type="submit"
              disabled={loading || !text.trim()}
              style={{
                marginTop: 12, width: "100%", padding: "13px 0",
                borderRadius: 12, border: "none", fontSize: 15, fontWeight: 700,
                cursor: loading || !text.trim() ? "not-allowed" : "pointer",
                background: loading || !text.trim()
                  ? "#f3f4f6"
                  : "linear-gradient(135deg, #be185d 0%, #9333ea 100%)",
                color: loading || !text.trim() ? "#9ca3af" : "#fff",
                boxShadow: loading || !text.trim() ? "none" : "0 4px 16px rgba(190,24,93,0.35)",
                transition: "all 0.2s",
                letterSpacing: "0.3px",
              }}
            >
              {loading
                ? (isRTL ? "⏳ جارٍ التحليل..." : "⏳ Classifying...")
                : (isRTL ? "🔍 تصنيف السبب" : "🔍 Classify Return Reason")}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 14, padding: "12px 16px",
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 10, color: "#dc2626", fontSize: 14,
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Result */}
          {result && label && (
            <div style={{ marginTop: 20 }}>
              <div style={{
                borderRadius: 16, overflow: "hidden",
                border: `1.5px solid ${label.color}22`,
                boxShadow: `0 4px 20px ${label.color}12`,
              }}>
                {/* Result header */}
                <div style={{
                  padding: "16px 20px",
                  background: `linear-gradient(135deg, ${label.bg}, #fff)`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderBottom: `1px solid ${label.color}18`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: label.color + "18",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, color: label.color, fontWeight: 700,
                    }}>
                      {label.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: label.color }}>
                        {isRTL ? label.ar : label.en}
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                        {isRTL ? "القرار المقترح" : "Suggested action"}
                      </div>
                    </div>
                  </div>
                  {result.escalate_flag && (
                    <div style={{
                      padding: "5px 12px", borderRadius: 20,
                      background: "#f5f3ff", color: "#7c3aed",
                      fontSize: 12, fontWeight: 700,
                      border: "1px solid #ddd6fe",
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      ⚑ {isRTL ? "مراجعة بشرية" : "Human review"}
                    </div>
                  )}
                </div>

                <div style={{ padding: "18px 20px", background: "#fff" }}>
                  {/* Confidence bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: 12, fontWeight: 600, color: "#6b7280",
                      marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.4px",
                    }}>
                      <span>{isRTL ? "مستوى الثقة" : "Confidence"}</span>
                      <span style={{ color: barColor, fontSize: 14 }}>{confPct}%</span>
                    </div>
                    <div style={{ height: 8, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${confPct}%`,
                        background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
                        borderRadius: 99, transition: "width 0.7s ease",
                      }} />
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div style={{
                    padding: "14px 16px", background: "#f9fafb",
                    borderRadius: 10, border: "1px solid #f3f4f6",
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 800, color: "#9ca3af",
                      textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 7,
                    }}>
                      {isRTL ? "التفسير" : "Reasoning"}
                    </div>
                    <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.65, margin: 0 }}>
                      {isRTL ? result.reasoning_ar : result.reasoning_en}
                    </p>
                  </div>

                  {/* Language tag */}
                  <div style={{
                    marginTop: 12, display: "flex", alignItems: "center",
                    gap: 6, fontSize: 12, color: "#9ca3af",
                  }}>
                    <span>🌐</span>
                    {isRTL ? "اللغة المكتشفة:" : "Language detected:"}
                    <span style={{
                      fontWeight: 700, color: "#6b7280",
                      background: "#f3f4f6", padding: "1px 8px", borderRadius: 6,
                    }}>
                      {result.language_detected.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 28px",
          borderTop: "1px solid #f3f4f6",
          background: "#fafafa",
          display: "flex", justifyContent: "center", alignItems: "center", gap: 6,
          fontSize: 11, color: "#d1d5db",
        }}>
          <span>🤖</span>
          <span>Powered by Llama 3.3 70B · Mumzworld Returns AI</span>
        </div>
      </div>
    </div>
  );
}
