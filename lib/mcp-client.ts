export interface MCPTool {
  name: string
  description: string
  inputSchema: any
}

export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface MCPServiceInfo {
  id: string
  name: string
  url: string
  enabled: boolean
  description?: string
  tools: MCPTool[]
  resources: MCPResource[]
  status: "connected" | "disconnected" | "error" | "connecting"
  lastError?: string
}

class MCPClientManager {
  private clients: Map<string, any> = new Map()
  private services: Map<string, MCPServiceInfo> = new Map()

  async connectToService(serviceInfo: Omit<MCPServiceInfo, "tools" | "resources" | "status">): Promise<MCPServiceInfo> {
    try {
      // Update status to connecting
      const updatedService: MCPServiceInfo = {
        ...serviceInfo,
        tools: [],
        resources: [],
        status: "connecting",
      }
      this.services.set(serviceInfo.id, updatedService)

      // For demo purposes, simulate MCP connection
      // In a real implementation, you would connect to the actual MCP server
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Simulate discovering tools and resources
      const mockTools: MCPTool[] = this.getMockToolsForService(serviceInfo.name)
      const mockResources: MCPResource[] = this.getMockResourcesForService(serviceInfo.name)

      const connectedService: MCPServiceInfo = {
        ...updatedService,
        tools: mockTools,
        resources: mockResources,
        status: "connected",
      }

      this.services.set(serviceInfo.id, connectedService)
      return connectedService
    } catch (error) {
      const errorService: MCPServiceInfo = {
        ...serviceInfo,
        tools: [],
        resources: [],
        status: "error",
        lastError: error instanceof Error ? error.message : "Unknown error",
      }
      this.services.set(serviceInfo.id, errorService)
      return errorService
    }
  }

  async disconnectService(serviceId: string): Promise<void> {
    const client = this.clients.get(serviceId)
    if (client) {
      await client.close()
      this.clients.delete(serviceId)
    }

    const service = this.services.get(serviceId)
    if (service) {
      this.services.set(serviceId, { ...service, status: "disconnected" })
    }
  }

  async callTool(serviceId: string, toolName: string, args: any): Promise<any> {
    const service = this.services.get(serviceId)
    if (!service || service.status !== "connected") {
      throw new Error(`Service ${serviceId} is not connected`)
    }

    // Simulate tool call
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      success: true,
      result: `Tool ${toolName} executed successfully with args: ${JSON.stringify(args)}`,
      timestamp: new Date().toISOString(),
    }
  }

  getService(serviceId: string): MCPServiceInfo | undefined {
    return this.services.get(serviceId)
  }

  getAllServices(): MCPServiceInfo[] {
    return Array.from(this.services.values())
  }

  private getMockToolsForService(serviceName: string): MCPTool[] {
    const toolMap: Record<string, MCPTool[]> = {
      "File System": [
        {
          name: "read_file",
          description: "Read contents of a file",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "File path to read" },
            },
            required: ["path"],
          },
        },
        {
          name: "write_file",
          description: "Write content to a file",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "File path to write" },
              content: { type: "string", description: "Content to write" },
            },
            required: ["path", "content"],
          },
        },
        {
          name: "list_directory",
          description: "List files in a directory",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "Directory path to list" },
            },
            required: ["path"],
          },
        },
      ],
      "Web Search": [
        {
          name: "web_search",
          description: "Search the web for information",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              limit: { type: "number", description: "Number of results", default: 10 },
            },
            required: ["query"],
          },
        },
        {
          name: "fetch_url",
          description: "Fetch content from a URL",
          inputSchema: {
            type: "object",
            properties: {
              url: { type: "string", description: "URL to fetch" },
            },
            required: ["url"],
          },
        },
      ],
      Database: [
        {
          name: "execute_query",
          description: "Execute a SQL query",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "SQL query to execute" },
              params: { type: "array", description: "Query parameters" },
            },
            required: ["query"],
          },
        },
      ],
    }

    return toolMap[serviceName] || []
  }

  private getMockResourcesForService(serviceName: string): MCPResource[] {
    const resourceMap: Record<string, MCPResource[]> = {
      "File System": [
        {
          uri: "file:///home/user/documents",
          name: "Documents",
          description: "User documents directory",
          mimeType: "inode/directory",
        },
      ],
      "Web Search": [
        {
          uri: "https://api.search.com",
          name: "Search API",
          description: "Web search API endpoint",
        },
      ],
    }

    return resourceMap[serviceName] || []
  }
}

export const mcpClientManager = new MCPClientManager()
