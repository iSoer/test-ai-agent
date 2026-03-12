import { memo, useEffect, useRef, useState } from "react";
import type { UserMessage as UserMessageType } from "@/types/chat";
import { cn } from "@/lib/utils";
import {ChatInput, ChatInputRef} from "@/components/Chat/ChatInput";
import { useChatStore } from "@/stores/chat-store";

interface UserMessageProps {
  message: UserMessageType;
  onRollbackAndResubmit?: (messageId: string, newContent: string) => void;
  onDiscardChanges?: (messageId: string) => void;
}

export const UserMessage = memo(function UserMessage({ message, onRollbackAndResubmit, onDiscardChanges }: UserMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messageContent, setMessageContent] = useState<string>(message.content)

  const isShowQuestionsHistory = useChatStore((s) => s.isShowQuestionsHistory);
  const toggleIsShowQuestionsHistory = useChatStore((s) => s.toggleIsShowQuestionsHistory);

  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ChatInputRef>(null);

  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMessageContent(message.content)
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  return (
    <div ref={containerRef}>
      {
        isExpanded ?
          (
            <div className="flex flex-col gap-1">
              <ChatInput
                ref={inputRef}
                isAgentWorking={false}
                value={messageContent}
                onSubmit={(newContent) => {
                  onRollbackAndResubmit?.(message.id, newContent);
                  setIsExpanded(false);
                }}
                onValueChange={(value) => {
                  setMessageContent(value)
                }}
                onInterrupt={() => setIsExpanded(false)}
              >
                {onDiscardChanges && (
                  <button
                    className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm",
                      "bg-primary text-destructive",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-colors",
                    )}
                    onClick={() => {
                      onDiscardChanges(message.id);
                      setIsExpanded(false);
                    }}
                  >
                    Discard changes
                  </button>
                )}
              </ChatInput>

            </div>
          ) : (
            <div
              className={cn(
                "border border-input-border bg-sidebar-accent rounded-lg py-1.5 cursor-pointer mx-3",
                "hover:border-input-border-focus"
              )}
              onClick={() => {
                if (isShowQuestionsHistory) {
                  toggleIsShowQuestionsHistory();
                  setTimeout(() => {
                    containerRef.current?.scrollIntoView({ block: "start" });
                  }, 0)

                  return;
                }
                setIsExpanded((v) => !v);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            >
              <span
                ref={textRef}
                className={
                  cn(
                    "text-sm text-sidebar-foreground block px-2",
                    "whitespace-nowrap overflow-hidden text-ellipsis"
                  )
                }
              >
                {message.content}
              </span>
            </div>
          )
      }
    </div>
  );
})
