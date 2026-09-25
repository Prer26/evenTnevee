import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SYSTEM_PROMPT = `You are Eva, the intelligent assistant for evenTneve — India's premium event management platform. You are an expert event planner and consultant who helps with ALL aspects of event management:

**Your expertise covers:**
1. Vendor Discovery & Management — photographers, decorators, caterers, venues, DJs, florists, planners across India. Recommend types, what to look for, price ranges, negotiation tips.
2. Financial Planning — budget breakdowns, expense tracking, payment scheduling, cost optimization, revenue forecasting, GST/tax considerations. Use ₹ (Indian Rupees).
3. Event Planning — full timelines, task lists, milestone tracking, team coordination, contingency planning for weddings, corporate events, birthdays, anniversaries, conferences.
4. Client CRM — managing client expectations, communication templates, follow-up strategies, handling difficult clients.
5. Operations & Logistics — vendor coordination, setup/teardown schedules, guest management, seating, catering logistics, transport.
6. Creative & Design — themes, color palettes, decor concepts, floral arrangements, lighting design.
7. Marketing — event promotion, social media strategy, invitation design.

**Guidelines:**
- Be conversational, warm, and genuinely helpful — like a trusted advisor.
- Provide specific, actionable, detailed advice — not generic platitudes.
- When discussing budgets, use ₹ and give realistic Indian market price ranges.
- Break complex answers into clear sections with bullet points.
- Ask clarifying questions when needed to give better advice.
- If the user asks about something outside event management, gently steer back or help if you can.
- Keep responses focused — thorough but not rambling. Use formatting (bold, lists) for readability.`;

const SUGGESTED_PROMPTS = [
  { icon: "💰", label: "Plan a budget", prompt: "Help me plan a detailed budget for a 300-guest luxury wedding in Mumbai. Break it down by category with realistic Indian prices." },
  { icon: "📸", label: "Find vendors", prompt: "I'm organizing a corporate product launch in Bangalore. What vendors do I need and what should I look for in each?" },
  { icon: "📅", label: "Event timeline", prompt: "Create a 3-month planning timeline for a destination wedding in Goa. What should I do each month?" },
  { icon: "💡", label: "Cost savings", prompt: "How can I reduce costs for a premium wedding without compromising on quality? Give me 5 specific strategies." },
];

const QUICK_REPLIES = [
  "Tell me about your vendor categories",
  "Help me plan a corporate event",
  "What's a realistic wedding budget?",
  "Tips for managing event finances",
];

function formatMessage(text) {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-2" />;
    if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
      return <div key={i} className="pl-3 text-[13px] leading-relaxed">• {line.trim().slice(1).trim()}</div>;
    }
    if (/^\d+\./.test(line.trim())) {
      return <div key={i} className="pl-3 text-[13px] leading-relaxed">{line.trim()}</div>;
    }
    const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <div key={i} className="text-[13px] leading-relaxed">
        {boldParts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </div>
    );
  });
}

export default function EvaChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [evaState, setEvaState] = useState("idle");
  // So a button anywhere on the site can trigger the chatbot open without
  // needing a shared context — e.g. the "Ask Eva" CTA on the homepage,
  // which used to just link to /marketplace by mistake instead of actually
  // opening this.
  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener("open-nova-chat", open);
    return () => window.removeEventListener("open-nova-chat", open);
  }, []);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm **Eva** — your intelligent event management assistant. I can help you with vendor discovery, budget planning, event timelines, financial tracking, and much more. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      setIsOpen(true);
      if (e.detail?.prompt) {
        setTimeout(() => sendMessage(e.detail.prompt), 400);
      }
    };
    window.addEventListener("nova-open", handler);
    return () => window.removeEventListener("nova-open", handler);
  }, []);

  const openEva = () => {
    setIsOpen(true);
    setEvaState("wave");
    window.setTimeout(() => setEvaState("idle"), 1800);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    if (!loading) {
      setEvaState(value.trim() ? "listening" : "idle");
    }
  };

  const sendMessage = async (text) => {
    const userMessage = text.trim();
    if (!userMessage || loading) return;

    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setEvaState("thinking");
    setShowSuggestions(false);

    try {
      const conversationContext = newMessages
        .map((m) => `${m.role === "user" ? "User" : "Eva"}: ${m.content}`)
        .join("\n\n");

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\n--- Conversation so far ---\n${conversationContext}\n\nEva:`,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" },
          },
        },
      });

      const reply =
        typeof res === "string"
          ? res
          : res?.response || res?.summary || "I'm here to help! Could you rephrase that?";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
      setEvaState("idle");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating Eva Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            onClick={openEva}
            aria-label="Open Eva AI chat"
            className="fixed bottom-5 right-5 z-[200]"
          >
            <span className="relative flex h-[58px] w-[178px] items-center overflow-visible rounded-full border border-[#D4A45B] bg-[#7A2348] shadow-[0_10px_25px_rgba(80,25,45,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(80,25,45,0.32)] active:scale-95">
              <span className="flex h-[58px] w-[72px] shrink-0 items-center justify-center overflow-visible">
                <motion.img
                  src="/eva-mascot.png"
                  alt="Eva"
                  className="h-[58px] w-[58px] object-contain drop-shadow-[0_5px_7px_rgba(40,15,20,0.3)]"
                  animate={evaState === "wave" ? { rotate: [0, -5, 5, -4, 3, 0], y: [0, -2, 0, -2, 0] } : { rotate: 0, y: 0 }}
                  transition={{ duration: 1.1, ease: "easeInOut" }}
                />
              </span>
              <span className="flex-1 pr-4 text-center font-display text-[16px] font-semibold text-white">
                Ask Eva
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[190] bg-[#292525]/20 backdrop-blur-[2px] md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed bottom-0 right-0 z-[200] flex h-[100dvh] w-full flex-col rounded-none border border-[#E8C7CF]/70 bg-[#FFFDF8] shadow-float md:bottom-5 md:right-5 md:h-[620px] md:w-[400px] md:rounded-[28px] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#E8C7CF] bg-[#FFFDF8] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[#F3E7D3] shadow-[0_10px_25px_-14px_rgba(122,35,72,0.65)]">
                    <motion.img
                      src="/eva-mascot.png"
                      alt="Eva"
                      className="h-full w-full object-cover"
                      animate={
                        evaState === "wave"
                          ? { rotate: [0, -7, 7, -5, 4, 0], y: [0, -1, 0, -1, 0] }
                          : evaState === "listening"
                            ? { x: [-1, 1, -1, 1, 0], rotate: [-1, 1, -1, 1, 0] }
                            : evaState === "thinking"
                              ? { y: [0, -2, 0], rotate: [0, 2, -2, 0] }
                              : { x: 0, y: 0, rotate: 0 }
                      }
                      transition={{ duration: evaState === "thinking" ? 1.2 : 0.8, repeat: evaState === "idle" ? 0 : Infinity, ease: "easeInOut" }}
                    />
                  </span>
                  <div>
                    <p className="font-display text-[15px] font-semibold text-[#292525]">Eva</p>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      <p className="text-[11px] text-[#6F6265]">
                        {evaState === "listening" ? "Listening…" : evaState === "thinking" ? "Thinking…" : "Online · Ready to help"}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-[#F3E7D3]/60 text-[#292525] transition-colors hover:bg-[#E8C7CF]/60"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {showSuggestions && messages.length <= 1 && (
                  <div className="mb-4">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6F6265]">
                      ✨ Try these
                    </p>
                    <div className="grid gap-2">
                      {SUGGESTED_PROMPTS.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => sendMessage(s.prompt)}
                          className="flex items-center gap-3 rounded-2xl border border-[#E8C7CF] bg-[#FFFDF8] px-4 py-3 text-left transition-all hover:border-[#7A2348] hover:shadow-[0_10px_30px_-18px_rgba(122,35,72,0.35)]"
                        >
                          <span className="text-lg">{s.icon}</span>
                          <div>
                            <p className="text-[13px] font-semibold text-[#292525]">{s.label}</p>
                            <p className="text-[11px] text-[#6F6265] line-clamp-1">{s.prompt}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <motion.span
                          className="mr-2 mt-0.5 h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#F3E7D3]"
                          animate={evaState === "listening" ? { x: [-1, 1, -1, 1, 0] } : { x: 0 }}
                          transition={{ duration: 0.7, repeat: evaState === "listening" ? Infinity : 0 }}
                        >
                          <img src="/eva-mascot.png" alt="Eva" className="h-full w-full object-cover" />
                        </motion.span>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "rounded-tr-sm bg-[#7A2348] text-[#FFFDF8]"
                            : "rounded-tl-sm border border-[#E8C7CF] bg-[#FFFDF8] text-[#292525]"
                        }`}
                      >
                        <div className="space-y-1">{formatMessage(msg.content)}</div>
                      </div>
                    </motion.div>
                  ))}

                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <motion.span
                        className="mr-2 mt-0.5 h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#F3E7D3]"
                        animate={{ y: [0, -2, 0], rotate: [0, 2, -2, 0] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <img src="/eva-mascot.png" alt="Eva" className="h-full w-full object-cover" />
                      </motion.span>
                      <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-[#E8C7CF] bg-[#FFFDF8] px-4 py-3.5">
                        <Loader2 className="h-4 w-4 animate-spin text-[#7A2348]" />
                        <span className="flex items-center gap-1 text-[12px] text-[#6F6265]">
                          Eva is thinking
                          <span className="flex gap-0.5">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7A2348] [animation-delay:-0.2s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7A2348] [animation-delay:-0.1s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7A2348]" />
                          </span>
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              {messages.length > 1 && !loading && (
                <div className="flex gap-1.5 overflow-x-auto border-t border-[#E8C7CF] bg-[#FFFDF8] px-4 py-2">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="shrink-0 rounded-full border border-[#E8C7CF] bg-[#F3E7D3]/50 px-3 py-1.5 text-[11px] font-medium text-[#292525] transition-colors hover:border-[#7A2348] hover:bg-[#E8C7CF]/30"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="border-t border-[#E8C7CF] bg-[#FFFDF8] p-3">
                {evaState === "listening" && input.trim() && (
                  <div className="mb-2 flex items-center gap-2 px-2 text-[10px] font-medium text-[#7A2348]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7A2348]" />
                    Eva is watching your message…
                  </div>
                )}
                <div className="flex items-end gap-2 rounded-2xl border border-[#E8C7CF] bg-[#F3E7D3]/40 px-4 py-2.5 focus-within:border-[#7A2348]">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Eva anything about events…"
                    rows={1}
                    className="max-h-24 flex-1 resize-none bg-transparent text-[13px] text-[#292525] placeholder:text-[#6F6265] focus:outline-none"
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#7A2348] text-[#FFFDF8] transition-all hover:scale-105 hover:bg-[#641B3B] disabled:opacity-40 disabled:hover:scale-100"
                    aria-label="Send message"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-center text-[10px] text-[#6F6265]">
                  Eva · Powered by evenTneve
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}