"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function GatewayStatus() {
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")

  const testConnection = async () => {
    setStatus("testing")
    try {
      const response = await fetch("/api/test-gateway")
      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage(data.message)
      } else {
        setStatus("error")
        setMessage(data.error)
      }
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Connection failed")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI Gateway Status
          {status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
          {status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
          {status === "testing" && <Loader2 className="h-5 w-5 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={status === "success" ? "default" : status === "error" ? "destructive" : "secondary"}>
            {status === "idle"
              ? "Not Tested"
              : status === "testing"
                ? "Testing..."
                : status === "success"
                  ? "Connected"
                  : "Error"}
          </Badge>
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        <Button onClick={testConnection} disabled={status === "testing"} size="sm">
          {status === "testing" ? "Testing..." : "Test Connection"}
        </Button>
      </CardContent>
    </Card>
  )
}
