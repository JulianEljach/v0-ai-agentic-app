"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { mcpClientManager, type MCPServiceInfo } from "./mcp-client"

interface MCPContextType {
  services: MCPServiceInfo[]
  updateServices: () => void
  callTool: (serviceId: string, toolName: string, args: any) => Promise<any>
  getEnabledServices: () => MCPServiceInfo[]
}

const MCPContext = createContext<MCPContextType | undefined>(undefined)

export function MCPProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<MCPServiceInfo[]>([])

  const updateServices = useCallback(() => {
    setServices(mcpClientManager.getAllServices())
  }, [])

  const callTool = useCallback(async (serviceId: string, toolName: string, args: any) => {
    return await mcpClientManager.callTool(serviceId, toolName, args)
  }, [])

  const getEnabledServices = useCallback(() => {
    return services.filter((s) => s.enabled && s.status === "connected")
  }, [services])

  return (
    <MCPContext.Provider value={{ services, updateServices, callTool, getEnabledServices }}>
      {children}
    </MCPContext.Provider>
  )
}

export function useMCP() {
  const context = useContext(MCPContext)
  if (context === undefined) {
    throw new Error("useMCP must be used within an MCPProvider")
  }
  return context
}
