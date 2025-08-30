"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { Message, MessageContent, MessageList } from "@/components/ui/message"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Zap, AlertCircle, Settings, ChevronDown, ChevronUp } from "lucide-react"
import { useMCP } from "@/lib/mcp-context"
import { ModelSelector } from "./model-selector"
import { useState } from "react"
import { defaultModel, type AIModelKey } from "@/lib/ai-gateway"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { useMobile } from "@/hooks/use-mobile"

export function ChatInterface() {
  const { getEnabledServices } = useMCP()
  const [selectedModel, setSelectedModel] = useState<AIModelKey>(defaultModel)
  const [showSettings, setShowSettings] = useState(false)
  const isMobile = useMobile()

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      console.log("Message finished:", message)
    },
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })

  const enabledServices = getEnabledServices()

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add MCP context and model selection to the message
    const mcpContext = {
      availableServices: enabledServices.map((service) => ({
        name: service.name,
        tools: service.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
        })),
      })),
    }

    handleSubmit(e, {
      data: { mcpContext, model: selectedModel },
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleFormSubmit(e as any)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* MCP Services Status Bar */}
      <div className="border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 flex-1">
            <Zap className="h-3 w-3 flex-shrink-0" />
            <span className="flex-shrink-0">Active MCP Services:</span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {enabledServices.length > 0 ? (
                enabledServices.map((service) => (
                  <Badge key={service.id} variant="secondary" className="text-xs whitespace-nowrap">
                    {isMobile ? service.name : `${service.name} (${service.tools.length} tools)`}
                  </Badge>
                ))
              ) : (
                <span className="text-amber-600">None active</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="h-6 px-2 text-xs flex-shrink-0 ml-2"
          >
            <Settings className="h-3 w-3 mr-1" />
            {isMobile ? selectedModel.split("-")[0] : `Model: ${selectedModel}`}
            {showSettings ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
        </div>

        {/* Model Settings */}
        <Collapsible open={showSettings} onOpenChange={setShowSettings}>
          <CollapsibleContent className="mt-2">
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4">
        <MessageList className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 px-4">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Welcome to AI MCP Chat</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base max-w-md mx-auto">
                I'm your AI assistant with MCP service integration and function calling capabilities. I can help you
                with various tasks using connected services.
              </p>
              {enabledServices.length === 0 && (
                <div className="bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
                  <AlertCircle className="h-4 w-4 mx-auto mb-2 text-amber-500" />
                  <p className="text-sm text-muted-foreground">
                    No MCP services are currently active. {isMobile ? "Tap the menu" : "Enable services in the sidebar"}{" "}
                    to unlock function calling capabilities.
                  </p>
                </div>
              )}
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </div>

                <div className="space-y-2 min-w-0 flex-1">
                  <Message
                    message={message}
                    className={`${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}
                  >
                    <MessageContent
                      message={message}
                      className={`p-2 sm:p-3 rounded-lg text-sm sm:text-base ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50"
                      }`}
                    />
                  </Message>

                  {/* Tool Calls Display */}
                  {message.toolInvocations && message.toolInvocations.length > 0 && (
                    <div className="space-y-1">
                      {message.toolInvocations.map((toolCall, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Zap className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Called {toolCall.toolName}</span>
                          <Badge
                            variant={toolCall.state === "result" ? "default" : "secondary"}
                            className="text-xs px-1 py-0 flex-shrink-0"
                          >
                            {toolCall.state}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2 sm:gap-3 justify-start">
              <div className="flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-[80%]">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-muted">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                <Card className="p-2 sm:p-3 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-foreground"></div>
                    <span className="text-sm">Thinking...</span>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </MessageList>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border-t border-border p-2 sm:p-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Error</span>
            </div>
            <p className="text-sm text-destructive/80 mt-1 break-words">{error.message}</p>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-2 sm:p-4">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={
              enabledServices.length > 0
                ? isMobile
                  ? "Ask me anything..."
                  : "Ask me anything... I can use MCP services and function calling to help you."
                : isMobile
                  ? "Ask me anything..."
                  : "Ask me anything... (Enable MCP services for function calling capabilities)"
            }
            className="min-h-[60px] resize-none text-base" // text-base prevents zoom on iOS
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="sm" className="px-3 h-[60px]">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          {isMobile ? "Tap to send" : "Press Enter to send, Shift+Enter for new line"} • Model: {selectedModel}
          {enabledServices.length > 0 && !isMobile && (
            <span className="ml-2">• {enabledServices.length} MCP service(s) with function calling</span>
          )}
        </p>
      </div>
    </div>
  )
}
