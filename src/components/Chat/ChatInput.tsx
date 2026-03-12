import { cn } from "@/lib/utils";
import { Send, Square } from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

const MIN_LINES = 2;
const MAX_LINES = 8;

export interface ChatInputRef {
  focus: () => void;
}

interface ChatInputProps {
  onSubmit: (text: string) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  isAgentWorking?: boolean;
  onInterrupt?: () => void;
  placeholder?: string;
  children: React.ReactNode;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(function ChatInput({
  onSubmit,
  value: externalValue,
  onValueChange,
  disabled = false,
  isAgentWorking = false,
  onInterrupt,
  children,
  placeholder = "Type a message...",

}, ref) {
  const isControlled = externalValue !== undefined;
  const [internalValue, setInternalValue] = useState("");
  const value = isControlled ? externalValue : internalValue;
  const initialValueRef = useRef(externalValue);

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const [metrics, setMetrics] = useState({ lineHeight: 20, padding: 8 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      const computed = window.getComputedStyle(textareaRef.current);
      const lh = parseFloat(computed.lineHeight) || 20;
      const pt = parseFloat(computed.paddingTop) || 0;
      const pb = parseFloat(computed.paddingBottom) || 0;
      setMetrics({ lineHeight: lh, padding: pt + pb });
    }
  }, []);

  useImperativeHandle(ref, () => ({
    focus: () => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      requestAnimationFrame(() => {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      });
    },
  }));

  const minHeight = MIN_LINES * metrics.lineHeight + metrics.padding;
  const maxHeight = MAX_LINES * metrics.lineHeight + metrics.padding;

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isAgentWorking) return;

    onSubmit(trimmed);
    setValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, isAgentWorking, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [maxHeight]);

  const canSend = (() => {
    if (disabled) {
      return false
    }

    if (isAgentWorking) {
      return false
    }

    if (!value.trim().length) {
      return false
    }

    if (isControlled && value.trim() === initialValueRef.current?.trim()) {
      return false;
    }

    return true
  })()

  const canInterrupt = isAgentWorking && onInterrupt;

  const effectivePlaceholder = placeholder;

  return (
    <div className="mb-3 mx-3 relative">
      <div className="flex flex-col border border-input-border bg-secondary rounded-lg focus-within:border-input-border-focus transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={effectivePlaceholder}
          style={{ minHeight }}
          disabled={disabled}
          className={cn(
            "w-full resize-none bg-transparent px-2 pt-2 pb-2",
            "text-sm placeholder:text-muted-foreground leading-5 text-foreground",
            "focus:outline-none",
          )}
        />
        <div className="flex items-center justify-end px-2 pb-2 gap-2">
          {children}
          {canInterrupt ? (
            <button
              onClick={onInterrupt}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm",
                "bg-red-500/20 text-red-400 hover:bg-red-500/30",
                "transition-colors",
              )}
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop
            </button>
          ) : (
            /**
             * INTENTIONAL BUG: No hover state on send button.
             * This is a known issue for candidates to identify.
             */
            <button
              onClick={handleSubmit}
              disabled={!canSend}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm",
                "bg-primary text-primary-foreground",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors",
              )}
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
