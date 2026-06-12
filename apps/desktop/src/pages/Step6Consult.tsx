import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Send, Bot, User, RefreshCw, Sparkles, Loader2, Box } from "lucide-react";
import { useProjectStore } from "../store/projectStore";

// ── Types ─────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: string;
}

// ── Suggested questions (contextual) ─────────────────────────────────────

const SUGGESTED: Record<string, string[]> = {
  composite: [
    "What roof insulation should I use?",
    "How do I achieve RETV ≤ 12 W/m²?",
    "Which wall material is best for my zone?",
    "How can I improve my ENS score?",
  ],
  hot_dry: [
    "How do I keep the house cool without AC?",
    "Best window orientation for hot & dry climate?",
    "Which roof coating reduces heat the most?",
    "Should I add a courtyard for ventilation?",
  ],
  warm_humid: [
    "How do I maximise cross-ventilation?",
    "Best materials for humid conditions?",
    "How to prevent mould in walls?",
    "What window size ensures good airflow?",
  ],
  temperate: [
    "How do I balance heating and cooling?",
    "Best insulation for temperate climate?",
    "How to use solar gain in winter?",
    "What ENS score should I target?",
  ],
  cold: [
    "How do I insulate walls to ENS U-value limits?",
    "Best glazing for a cold climate?",
    "How to prevent cold bridges in the structure?",
    "Should I install solar hot water?",
  ],
  default: [
    "What is RETV and how do I reduce it?",
    "How do I make my home ENS compliant?",
    "What materials reduce electricity bills?",
    "How much can I save with ENS design?",
  ],
};

function getSuggestions(zone?: string): string[] {
  if (!zone) return SUGGESTED.default;
  return SUGGESTED[zone] ?? SUGGESTED.default;
}

// ── API call ──────────────────────────────────────────────────────────────

// Use VITE_API_URL env var in production; fallback to localhost in dev
const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function sendMessage(
  message: string,
  history: Message[],
  ctx: object
): Promise<{ reply: string; source: string }> {
  const res = await fetch(`${BACKEND}/api/consult/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: history.map((m) => ({ role: m.role, content: m.content })),
      context: ctx,
    }),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function Step6Consult() {
  const navigate = useNavigate();
  const store = useProjectStore();
  const {
    climateData, location, requirements, ensScore,
    materialRecommendations, layoutSuggestions,
    predictedIndoorTemp, style, budget,
  } = store;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Build project context object sent to backend
  const projectCtx = {
    climate_zone: climateData?.zone,
    location_city: location?.city,
    location_state: location?.state,
    plot_area_sqm: requirements.plotAreaSqm,
    floors: requirements.floors,
    bedrooms: requirements.bedrooms,
    building_type: requirements.buildingType,
    ens_score: ensScore,
    ens_grade: ensScore
      ? ensScore >= 160 ? "Excellent"
      : ensScore >= 100 ? "Good"
      : ensScore >= 47  ? "Compliant"
      : "Non-Compliant"
      : undefined,
    ens_compliant: ensScore ? ensScore >= 47 : undefined,
    predicted_indoor_temp: predictedIndoorTemp,
    peak_sun_hours: climateData?.peakSunHours,
    prevailing_wind: climateData?.prevailingWind,
    style,
    budget,
    material_recommendations: materialRecommendations as Record<string, string>,
    layout_suggestions: layoutSuggestions,
  };

  // Check backend health on mount, then send welcome message
  useEffect(() => {
    fetch(`${BACKEND}/health`)
      .then((r) => r.json())
      .then(() => {
        setBackendOnline(true);
        sendWelcome(true);
      })
      .catch(() => {
        setBackendOnline(false);
        sendWelcome(false);
      });
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function addMessage(role: "user" | "assistant", content: string, source?: string) {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role, content, source },
    ]);
  }

  async function sendWelcome(online: boolean) {
    const zone = climateData?.zone?.replace(/_/g, " ") || "your";
    const score = ensScore ? ` Your current ENS score is **${ensScore}/220 pts**.` : "";
    const city = location?.city ? ` in ${location.city}` : "";

    if (online) {
      try {
        const welcomePrompt = `Greet the user warmly. They are planning a home${city} in the ${zone} climate zone.${score} Give them a 2-sentence welcome and mention 2-3 specific things you can help them with based on their project.`;
        const { reply, source } = await sendMessage(welcomePrompt, [], projectCtx);
        addMessage("assistant", reply, source);
        return;
      } catch (_) { /* fall through to static */ }
    }

    // Static welcome
    const intro = online
      ? `Hi! I'm EcoConsult, your ENS home design advisor.`
      : `Hi! I'm EcoConsult. The backend isn't running right now, but I can still answer many ENS questions from my built-in knowledge base.`;

    addMessage(
      "assistant",
      `${intro} You're building a home${city} in the **${zone}** climate zone.${score}\n\nAsk me anything about materials, ENS compliance, ventilation, insulation, or energy savings. What would you like to know?`,
      online ? undefined : "offline"
    );
  }

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    addMessage("user", msg);
    setLoading(true);

    try {
      const { reply, source } = await sendMessage(msg, messages, projectCtx);
      addMessage("assistant", reply, source);
    } catch (_) {
      addMessage(
        "assistant",
        "Sorry, I couldn't reach the server. Make sure the backend is running (`python -m uvicorn api.main:app` in the backend folder). Try asking again.",
        "error"
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const suggestions = getSuggestions(climateData?.zone);

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles size={22} className="text-forest-500" />
            AI Consultation
          </h2>
          <p className="text-gray-500 mt-0.5 text-sm">
            ENS-aware advisor · {climateData?.zone?.replace(/_/g, " ")} zone ·{" "}
            {ensScore ? `${ensScore}/220 pts` : "score pending"}
            {backendOnline === false && (
              <span className="ml-2 text-amber-600 font-medium">· offline mode</span>
            )}
            {backendOnline === true && (
              <span className="ml-2 text-forest-600 font-medium">· AI powered</span>
            )}
          </p>
        </div>
        <button
          onClick={() => { setMessages([]); sendWelcome(backendOnline ?? false); }}
          className="btn-secondary flex items-center gap-1.5 text-sm"
          title="Start a new conversation"
        >
          <RefreshCw size={13} /> New chat
        </button>
      </div>

      {/* Suggestion chips — only when conversation is empty */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="px-3 py-1.5 text-sm rounded-full border border-forest-200 text-forest-700
                         hover:bg-forest-50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
              ${m.role === "assistant" ? "bg-forest-100" : "bg-earth-100"}`}>
              {m.role === "assistant"
                ? <Bot size={16} className="text-forest-600" />
                : <User size={16} className="text-earth-600" />}
            </div>
            {/* Bubble */}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${m.role === "assistant"
                ? "bg-white border border-earth-100 text-gray-800 rounded-tl-sm"
                : "bg-forest-600 text-white rounded-tr-sm"}`}>
              <FormattedMessage content={m.content} />
              {m.source && m.source !== "error" && m.role === "assistant" && (
                <div className="mt-1.5 text-[10px] text-gray-400 capitalize">
                  {m.source === "fallback" ? "rule-based · no API key"
                   : m.source === "offline" ? "offline mode"
                   : `via ${m.source}`}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-forest-600" />
            </div>
            <div className="bg-white border border-earth-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 size={16} className="animate-spin text-forest-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 flex-shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about materials, ventilation, ENS score, insulation…"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-earth-200 px-4 py-3 text-sm
                     focus:outline-none focus:ring-2 focus:ring-forest-300 focus:border-forest-400
                     leading-relaxed"
          style={{ minHeight: "48px", maxHeight: "120px" }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="btn-primary px-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Nav */}
      <div className="flex justify-between pt-3 flex-shrink-0">
        <button onClick={() => navigate("/wizard/step5")} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={() => navigate("/wizard/step7")} className="btn-primary flex items-center gap-2">
          <Box size={16} /> 3D Preview <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Markdown-lite renderer ─────────────────────────────────────────────────

function FormattedMessage({ content }: { content: string }) {
  // Very lightweight: render **bold**, newlines, and bullet lists
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        const html = line
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/`(.+?)`/g, '<code class="bg-black/10 px-1 rounded text-xs">$1</code>');
        if (line.trimStart().startsWith("- ") || line.trimStart().startsWith("• ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-0.5 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: html.replace(/^[-•]\s*/, "") }} />
            </div>
          );
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}
