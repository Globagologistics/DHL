import React, { useEffect, useMemo, useState } from "react";
import { Menu, MessageSquare } from "lucide-react";
import { ChatThread } from "../components/chat/ChatThread";
import { cn } from "../components/ui/utils";
import { markThreadRead, useChatThreads } from "../../hooks/useChat";

export default function AdminChat() {
  const { threads, loading } = useChatThreads();

  const sortedThreads = useMemo(() => {
    return [...threads].sort(
      (a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
    );
  }, [threads]);

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    sortedThreads[0]?.id ?? null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (selectedThreadId) return;
    if (sortedThreads[0]) {
      setSelectedThreadId(sortedThreads[0].id);
    }
  }, [sortedThreads, selectedThreadId]);

  const handleSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    markThreadRead(threadId, "admin");
    setSidebarOpen(false);
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0B0F1A] text-white">
      <div className="absolute inset-0 bg-[url('https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg')] bg-cover bg-center opacity-15" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(3,7,18,0.95)_0%,rgba(3,7,18,0.9)_45%,rgba(3,7,18,0.6)_70%,rgba(3,7,18,0.3)_100%)]" />
      <div className="relative z-10 flex h-full">
        {/* Desktop Sidebar */}
        <aside className="hidden h-full w-[30%] max-w-sm border-r border-white/10 bg-black/40 backdrop-blur-xl md:flex md:flex-col">
          <div className="px-6 py-5">
            <div className="text-xl font-black tracking-tighter">
              Active Tracking IDs
            </div>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/50">
              Command Center
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
                Loading chats...
              </div>
            ) : sortedThreads.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
                No active chats yet.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedThreads.map((thread) => {
                  const snippet =
                    thread.lastMessagePreview || "No messages yet";
                  const isActive = thread.id === selectedThreadId;

                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => handleSelect(thread.id)}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-left transition",
                        isActive
                          ? "border-white/30 bg-white/15"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">
                          {thread.trackingId}
                        </span>
                        {thread.unreadForAdmin > 0 && (
                          <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-white/60">
                        {snippet}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="relative flex h-full min-h-0 flex-1 flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-5 py-4 backdrop-blur-xl md:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70"
              aria-label="Open chats"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
              Admin
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <MessageSquare className="h-4 w-4 text-white/50" />
            </div>
          </div>

          {selectedThreadId ? (
            <ChatThread
              trackingId={sortedThreads.find((thread) => thread.id === selectedThreadId)?.trackingId || ''}
              threadId={selectedThreadId}
              role="admin"
              title="Admin Command Center"
              subtitle="Live shipment support"
              headerAction={
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 md:hidden"
                  aria-label="Open tracking list"
                >
                  <Menu className="h-5 w-5" />
                </button>
              }
              accentClassName="bg-[#2563EB]"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
                <h2 className="text-2xl font-black tracking-tighter">
                  No Active Chat
                </h2>
                <p className="mt-3 text-sm text-white/60">
                  Waiting for a tracking ID to start a conversation.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[85%] max-w-xs border-r border-white/10 bg-[#0B0F1A]/95 p-5 transition-transform md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-6">
          <div className="text-lg font-black tracking-tighter">
            Active Tracking IDs
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/50">
            Command Center
          </p>
        </div>
        <div className="space-y-3 overflow-y-auto">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Loading chats...
            </div>
          ) : sortedThreads.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              No active chats yet.
            </div>
          ) : (
            sortedThreads.map((thread) => {
              const snippet =
                thread.lastMessagePreview || "No messages yet";

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => handleSelect(thread.id)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">
                      {thread.trackingId}
                    </span>
                    {thread.unreadForAdmin > 0 && (
                      <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-white/60">
                    {snippet}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}
