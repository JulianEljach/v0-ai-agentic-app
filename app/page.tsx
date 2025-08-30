"use client"

import { useState } from "react"
import { ChatInterface } from "@/components/chat-interface"
import { MCPServiceManager } from "@/components/mcp-service-manager"
import { GatewayStatus } from "@/components/gateway-status"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Settings, MessageSquare, Menu, X } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

export default function HomePage() {
  const [showSettings, setShowSettings] = useState(false)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const isMobile = useMobile()

  const toggleSettings = () => {
    if (isMobile) {
      setMobileSheetOpen(!mobileSheetOpen)
    } else {
      setShowSettings(!showSettings)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">AI MCP Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            {isMobile ? (
              <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Menu className="h-4 w-4" />
                    <span className="hidden xs:inline">Services</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:w-80 p-0">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">MCP Services</h2>
                    <Button variant="ghost" size="sm" onClick={() => setMobileSheetOpen(false)} className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="h-[calc(100vh-4rem)] overflow-hidden">
                    <div className="p-4 space-y-4">
                      <GatewayStatus />
                      <MCPServiceManager />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Button variant="ghost" size="sm" onClick={toggleSettings} className="gap-2">
                <Settings className="h-4 w-4" />
                MCP Services
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Desktop Sidebar */}
        {!isMobile && showSettings && (
          <div className="w-80 border-r border-border bg-card/30 backdrop-blur">
            <div className="p-4 space-y-4">
              <GatewayStatus />
              <MCPServiceManager />
            </div>
          </div>
        )}

        {/* Main Chat Interface */}
        <div className="flex-1">
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}
