"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Zap, Settings, Smartphone } from "lucide-react"

export function WelcomeMessage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">AI MCP Chat</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Your intelligent assistant with Model Context Protocol integration
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Agentic AI
              </CardTitle>
              <CardDescription>Powered by advanced AI models with function calling capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">GPT-4o</Badge>
                <Badge variant="secondary">Claude Sonnet</Badge>
                <Badge variant="secondary">Gemini 2.0</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                MCP Services
              </CardTitle>
              <CardDescription>Connect external tools and data sources via MCP protocol</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">File System</Badge>
                <Badge variant="outline">Web Search</Badge>
                <Badge variant="outline">Database</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                1
              </div>
              <div>
                <p className="text-sm font-medium">Test AI Gateway Connection</p>
                <p className="text-xs text-muted-foreground">
                  Click the MCP Services button and test your AI Gateway connection
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                2
              </div>
              <div>
                <p className="text-sm font-medium">Configure MCP Services</p>
                <p className="text-xs text-muted-foreground">Add and enable MCP services to extend AI capabilities</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                3
              </div>
              <div>
                <p className="text-sm font-medium">Start Chatting</p>
                <p className="text-xs text-muted-foreground">
                  Ask questions and let the AI use connected services automatically
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Smartphone className="h-4 w-4" />
            Optimized for mobile and desktop
          </p>
        </div>
      </div>
    </div>
  )
}
