import { useEffect, useRef, useState } from "react";

import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

import VendorLayout from "@/components/VendorLayout";
import AdminLayout from "@/components/AdminLayout";

import {
  Send,
  Loader2,
} from "lucide-react";

function timeAgo(dateStr) {
  if (!dateStr) return "";

  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "just now";

  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hours = Math.floor(mins / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function Messages() {
  const { user } = useAuth();

  /*
   * IMPORTANT:
   * account_type decides whether this is a vendor.
   *
   * A vendor MUST use VendorLayout even if their
   * role value happens to be "admin".
   */
  const isVendor = user?.account_type === "vendor";

  /*
   * Only non-vendor admin accounts use AdminLayout.
   */
  const isAdmin = !isVendor && user?.role === "admin";

  /*
   * Admins and vendors are both on the vendor side
   * of a conversation.
   */
  const isVendorSide = isVendor || isAdmin;

  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);

  const [draft, setDraft] = useState("");

  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  // ==========================================
  // LOAD CONVERSATION THREADS
  // ==========================================
  const loadThreads = async () => {
    setLoadingThreads(true);

    try {
      const data = await base44.messages.threads();

      const threadList = Array.isArray(data) ? data : [];

      setThreads(threadList);

      if (!selected && threadList.length > 0) {
        setSelected(threadList[0]);
      }
    } catch (error) {
      console.error("Failed to load message threads:", error);
      setThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  };

  // ==========================================
  // LOAD SELECTED THREAD
  // ==========================================
  const loadThread = async (thread) => {
    if (!thread) {
      setMessages([]);
      return;
    }

    setLoadingThread(true);

    try {
      const data = await base44.messages.thread(
        thread.vendor_id,
        thread.user_id
      );

      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load conversation:", error);
      setMessages([]);
    } finally {
      setLoadingThread(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  useEffect(() => {
    loadThreads();
  }, []);

  // ==========================================
  // LOAD SELECTED CONVERSATION
  // ==========================================
  useEffect(() => {
    loadThread(selected);
  }, [selected?.vendor_id, selected?.user_id]);

  // ==========================================
  // AUTO SCROLL TO BOTTOM
  // ==========================================
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ==========================================
  // SEND MESSAGE
  // ==========================================
  const handleSend = async () => {
    if (!draft.trim() || !selected || sending) {
      return;
    }

    setSending(true);

    try {
      if (isVendorSide) {
        await base44.messages.reply({
          vendor_id: selected.vendor_id,
          vendor_name: selected.vendor_name,
          user_id: selected.user_id,
          body: draft.trim(),
        });
      } else {
        await base44.messages.send({
          vendor_id: selected.vendor_id,
          vendor_name: selected.vendor_name,
          body: draft.trim(),
        });
      }

      setDraft("");

      await loadThread(selected);
      await loadThreads();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  // ==========================================
  // EMPTY STATE
  // ==========================================
  const emptyStateText = isVendor
    ? "They'll show up here once a planner messages you."
    : isAdmin
      ? "They'll show up here once clients message a vendor."
      : "Message a vendor from the Marketplace to start one.";

  // ==========================================
  // PAGE CONTENT
  // ==========================================
  const content = (
    <>
      {/* PAGE HEADER */}
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-taupe">
          {isVendor
            ? "Messages from planners"
            : isAdmin
              ? "All conversations"
              : "Your conversations"}
        </p>

        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-espresso">
          Messages
        </h1>
      </div>

      {/* MESSAGES AREA */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">

        {/* ======================================
            THREAD LIST
        ======================================= */}
        <div className="rounded-[24px] border border-border bg-card p-3 shadow-soft">

          {loadingThreads ? (
            <div className="flex items-center justify-center py-10 text-taupe">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : threads.length === 0 ? (
            <div className="p-4">
              <p className="text-[13px] text-taupe">
                No conversations yet.
              </p>

              <p className="mt-1 text-[12px] leading-5 text-taupe/80">
                {emptyStateText}
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {threads.map((thread) => {
                const isSelected =
                  selected?.vendor_id === thread.vendor_id &&
                  selected?.user_id === thread.user_id;

                return (
                  <li
                    key={`${thread.vendor_id}::${thread.user_id}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(thread)}
                      className={`w-full rounded-2xl px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "bg-espresso text-ivory"
                          : "hover:bg-beige/60"
                      }`}
                    >
                      {/* PERSON NAME */}
                      <p
                        className={`text-[13px] font-semibold ${
                          isSelected
                            ? "text-ivory"
                            : "text-espresso"
                        }`}
                      >
                        {isVendorSide
                          ? thread.user_name || "Client"
                          : thread.vendor_name}
                      </p>

                      {/* VENDOR NAME FOR ADMIN */}
                      {isAdmin && (
                        <p
                          className={`text-[11px] ${
                            isSelected
                              ? "text-ivory/70"
                              : "text-taupe"
                          }`}
                        >
                          {thread.vendor_name}
                        </p>
                      )}

                      {/* LAST MESSAGE */}
                      <p
                        className={`mt-0.5 truncate text-[11.5px] ${
                          isSelected
                            ? "text-ivory/70"
                            : "text-taupe"
                        }`}
                      >
                        {thread.last_message?.body || ""}
                      </p>

                      {/* TIME */}
                      <p
                        className={`mt-0.5 text-[10px] ${
                          isSelected
                            ? "text-ivory/50"
                            : "text-taupe/70"
                        }`}
                      >
                        {timeAgo(
                          thread.last_message?.created_date
                        )}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ======================================
            CHAT VIEW
        ======================================= */}
        <div className="flex min-h-[480px] flex-col rounded-[24px] border border-border bg-card shadow-soft">

          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-10 text-center text-[13px] text-taupe">
              <div>
                <p className="font-medium">
                  Select a conversation
                </p>

                <p className="mt-1">
                  Your messages will appear here.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* CHAT HEADER */}
              <div className="border-b border-border px-5 py-4">
                <p className="font-display text-[15px] font-semibold text-espresso">
                  {isAdmin
                    ? `${selected.user_name || "Client"} ↔ ${
                        selected.vendor_name
                      }`
                    : isVendor
                      ? selected.user_name || "Client"
                      : selected.vendor_name}
                </p>

                {isVendor && (
                  <p className="mt-0.5 text-[11px] text-taupe">
                    Customer / Event Planner
                  </p>
                )}
              </div>

              {/* CHAT MESSAGES */}
              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">

                {loadingThread ? (
                  <div className="flex items-center justify-center py-10 text-taupe">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-10 text-center text-[13px] text-taupe">
                    No messages in this conversation yet.
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine = isVendorSide
                      ? message.sender === "vendor"
                      : message.sender === "client";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          mine
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[13px] ${
                            mine
                              ? "bg-espresso text-ivory"
                              : "bg-beige/70 text-espresso"
                          }`}
                        >
                          <p>{message.body}</p>

                          <p
                            className={`mt-1 text-[10px] ${
                              mine
                                ? "text-ivory/60"
                                : "text-taupe"
                            }`}
                          >
                            {timeAgo(message.created_date)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={bottomRef} />
              </div>

              {/* MESSAGE INPUT */}
              <div className="flex items-center gap-2 border-t border-border p-3">

                <input
                  value={draft}
                  onChange={(event) =>
                    setDraft(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !sending
                    ) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    isVendor
                      ? "Reply to this client…"
                      : isAdmin
                        ? "Reply as the vendor…"
                        : "Type a message…"
                  }
                  className="flex-1 rounded-full border border-border bg-cream/60 px-4 py-2.5 text-[13px] text-espresso placeholder:text-taupe focus:border-champagne focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !draft.trim()}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-espresso text-ivory transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>

              </div>
            </>
          )}
        </div>
      </div>
    </>
  );

  // ==========================================
  // VENDOR LAYOUT
  // ==========================================
  // IMPORTANT:
  // Vendor account_type always gets VendorLayout.
  //
  // Even if:
  // user.role === "admin"
  //
  // Financial Tracker will therefore NOT appear
  // in the vendor sidebar.
  // ==========================================
  if (isVendor) {
    return <VendorLayout>{content}</VendorLayout>;
  }

  // ==========================================
  // ADMIN LAYOUT
  // ==========================================
  return <AdminLayout>{content}</AdminLayout>;
}