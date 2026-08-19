"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/actions/bookings";
import { format } from "date-fns";

type Message = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
};

export default function ChatBox({
  bookingId,
  currentUserId,
  initialMessages,
}: {
  bookingId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Subscribe to new messages on this booking's chat in real time.
  // RLS on the `messages` table still applies to what Postgres broadcasts,
  // so a user who isn't a participant on this booking never receives these
  // events even if they guessed the booking id.
  useEffect(() => {
    const channel = supabase
      .channel(`booking-chat-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(formData: FormData) {
    const body = (formData.get("body") as string)?.trim();
    if (!body) return;
    setDraft("");
    startTransition(async () => {
      await sendMessage({}, formData);
    });
  }

  return (
    <div className="card flex h-[28rem] flex-col p-0 overflow-hidden">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate text-center mt-8">
            No messages yet — say hello to coordinate details.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  mine ? "bg-moss text-paper" : "bg-sand text-ink"
                }`}
              >
                <p>{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-paper/70" : "text-ink/50"}`}>
                  {format(new Date(m.created_at), "h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        action={handleSend}
        className="flex items-center gap-2 border-t border-ink/10 p-3"
      >
        <input type="hidden" name="bookingId" value={bookingId} />
        <input
          name="body"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="input-field flex-1"
          maxLength={2000}
          autoComplete="off"
        />
        <button type="submit" className="btn-primary" disabled={isPending || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
