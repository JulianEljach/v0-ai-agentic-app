"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import type { Message as AIMessage } from "ai"

interface MessageProps {
  message: AIMessage
  className?: string
  children?: React.ReactNode
}

export function Message({ message, className, children }: MessageProps) {
  return <div className={cn("message", className)}>{children}</div>
}

interface MessageContentProps {
  message: AIMessage
  className?: string
}

export function MessageContent({ message, className }: MessageContentProps) {
  return <div className={cn("message-content", className)}>{message.content}</div>
}

interface MessageListProps {
  className?: string
  children?: React.ReactNode
}

export function MessageList({ className, children }: MessageListProps) {
  return <div className={cn("message-list", className)}>{children}</div>
}
