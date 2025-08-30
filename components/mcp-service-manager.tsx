"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Trash2,
  Plus,
  Server,
  ChevronDown,
  ChevronRight,
  Zap,
  Database,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { mcpClientManager, type MCPServiceInfo } from "@/lib/mcp-client"
import { OrchestrationMonitor } from "./orchestration-monitor"
import { agenticOrchestrator } from "@/lib/agentic-orchestrator"

export function MCPServiceManager() {
  const [services, setServices] = useState<MCPServiceInfo[]>([])
  const [newService, setNewService] = useState({ name: "", url: "", description: "" })
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set())
  const [orchestrationPlans, setOrchestrationPlans] = useState(agenticOrchestrator.getAllPlans())

  useEffect(() => {
    // Initialize with some default services
    const defaultServices = [
      {
        id: "1",
        name: "File System",
        url: "http://localhost:3001/mcp",
        enabled: false,
        description: "Read and write files",
      },
      {
        id: "2",
        name: "Web Search",
        url: "http://localhost:3002/mcp",
        enabled: false,
        description: "Search the web for information",
      },
      {
        id: "3",
        name: "Database",
        url: "http://localhost:3003/mcp",
        enabled: false,
        description: "Execute database queries",
      },
    ]

    // Convert to MCPServiceInfo format
    const mcpServices: MCPServiceInfo[] = defaultServices.map((service) => ({
      ...service,
      tools: [],
      resources: [],
      status: "disconnected" as const,
    }))

    setServices(mcpServices)

    // Update orchestration plans periodically
    const interval = setInterval(() => {
      setOrchestrationPlans(agenticOrchestrator.getAllPlans())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const toggleService = async (id: string) => {
    const service = services.find((s) => s.id === id)
    if (!service) return

    if (service.enabled && service.status === "connected") {
      // Disconnect service
      await mcpClientManager.disconnectService(id)
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: false, status: "disconnected" } : s)))
    } else {
      // Connect service
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: true, status: "connecting" } : s)))

      try {
        const connectedService = await mcpClientManager.connectToService({
          id: service.id,
          name: service.name,
          url: service.url,
          enabled: true,
          description: service.description,
        })

        setServices((prev) => prev.map((s) => (s.id === id ? connectedService : s)))
      } catch (error) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  enabled: false,
                  status: "error",
                  lastError: error instanceof Error ? error.message : "Connection failed",
                }
              : s,
          ),
        )
      }
    }
  }

  const addService = () => {
    if (newService.name && newService.url) {
      const service: MCPServiceInfo = {
        id: Date.now().toString(),
        name: newService.name,
        url: newService.url,
        description: newService.description,
        enabled: false,
        tools: [],
        resources: [],
        status: "disconnected",
      }
      setServices((prev) => [...prev, service])
      setNewService({ name: "", url: "", description: "" })
    }
  }

  const removeService = async (id: string) => {
    await mcpClientManager.disconnectService(id)
    setServices((prev) => prev.filter((service) => service.id !== id))
  }

  const toggleExpanded = (serviceId: string) => {
    setExpandedServices((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId)
      } else {
        newSet.add(serviceId)
      }
      return newSet
    })
  }

  const handleExecutePlan = async (planId: string) => {
    await agenticOrchestrator.executePlan(planId, (updatedPlan) => {
      setOrchestrationPlans(agenticOrchestrator.getAllPlans())
    })
  }

  const getStatusIcon = (status: MCPServiceInfo["status"]) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "connecting":
        return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
      case "error":
        return <AlertCircle className="h-3 w-3 text-red-500" />
      default:
        return <Server className="h-3 w-3 text-muted-foreground" />
    }
  }

  const enabledServices = services.filter((s) => s.enabled && s.status === "connected")

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      <div className="px-4 pt-4">
        <h2 className="text-lg font-semibold mb-2">MCP Services</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your Model Context Protocol services. Active services: {enabledServices.length}
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* Orchestration Monitor */}
        <OrchestrationMonitor plans={orchestrationPlans} onExecutePlan={handleExecutePlan} />

        {/* Active Services Summary */}
        {enabledServices.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Active Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {enabledServices.map((service) => (
                <div key={service.id} className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <span className="text-sm font-medium">{service.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {service.tools.length} tools
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {service.resources.length} resources
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Add New Service */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add MCP Service</CardTitle>
            <CardDescription>Connect a new MCP server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="service-name" className="text-xs">
                Service Name
              </Label>
              <Input
                id="service-name"
                placeholder="e.g., File System"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="service-url" className="text-xs">
                MCP Server URL
              </Label>
              <Input
                id="service-url"
                placeholder="http://localhost:3001/mcp"
                value={newService.url}
                onChange={(e) => setNewService({ ...newService, url: e.target.value })}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="service-description" className="text-xs">
                Description (optional)
              </Label>
              <Input
                id="service-description"
                placeholder="What this service does"
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                className="h-8"
              />
            </div>
            <Button onClick={addService} size="sm" className="w-full gap-2">
              <Plus className="h-3 w-3" />
              Add Service
            </Button>
          </CardContent>
        </Card>

        {/* Service List */}
        <div className="space-y-2 pb-4">
          <h3 className="text-sm font-medium">All Services</h3>
          {services.map((service) => (
            <Card key={service.id} className="p-3">
              <div className="space-y-3">
                {/* Service Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Collapsible>
                        <CollapsibleTrigger
                          onClick={() => toggleExpanded(service.id)}
                          className="flex items-center gap-1 hover:bg-muted/50 rounded p-1 -m-1"
                        >
                          {expandedServices.has(service.id) ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </CollapsibleTrigger>
                      </Collapsible>
                      {getStatusIcon(service.status)}
                      <h4 className="text-sm font-medium truncate">{service.name}</h4>
                      <Switch
                        checked={service.enabled}
                        onCheckedChange={() => toggleService(service.id)}
                        size="sm"
                        disabled={service.status === "connecting"}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground truncate ml-8">{service.url}</p>
                    {service.description && (
                      <p className="text-xs text-muted-foreground mt-1 ml-8">{service.description}</p>
                    )}
                    {service.lastError && <p className="text-xs text-red-500 mt-1 ml-8">Error: {service.lastError}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeService(service.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Expanded Service Details */}
                <Collapsible open={expandedServices.has(service.id)}>
                  <CollapsibleContent className="space-y-3">
                    {/* Tools */}
                    {service.tools.length > 0 && (
                      <div className="ml-8">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-3 w-3" />
                          <span className="text-xs font-medium">Available Tools</span>
                        </div>
                        <div className="space-y-1">
                          {service.tools.map((tool) => (
                            <div key={tool.name} className="bg-muted/30 rounded p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  {tool.name}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{tool.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resources */}
                    {service.resources.length > 0 && (
                      <div className="ml-8">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-3 w-3" />
                          <span className="text-xs font-medium">Available Resources</span>
                        </div>
                        <div className="space-y-1">
                          {service.resources.map((resource) => (
                            <div key={resource.uri} className="bg-muted/30 rounded p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">{resource.name}</span>
                                {resource.mimeType && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    {resource.mimeType}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{resource.uri}</p>
                              {resource.description && (
                                <p className="text-xs text-muted-foreground mt-1">{resource.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
