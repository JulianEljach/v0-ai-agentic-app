import { mcpClientManager, type MCPServiceInfo } from "./mcp-client"
import { tool } from "ai"
import { z } from "zod"

export function createMCPTools(enabledServices: MCPServiceInfo[]) {
  const tools: Record<string, any> = {}

  for (const service of enabledServices) {
    for (const mcpTool of service.tools) {
      const toolName = `${service.name.toLowerCase().replace(/\s+/g, "_")}_${mcpTool.name}`

      // Convert MCP tool schema to Zod schema
      const zodSchema = convertMCPSchemaToZod(mcpTool.inputSchema)

      tools[toolName] = tool({
        description: `${service.name}: ${mcpTool.description}`,
        parameters: zodSchema,
        execute: async (args) => {
          try {
            const result = await mcpClientManager.callTool(service.id, mcpTool.name, args)
            return {
              success: true,
              service: service.name,
              tool: mcpTool.name,
              result: result.result,
              timestamp: result.timestamp,
            }
          } catch (error) {
            return {
              success: false,
              service: service.name,
              tool: mcpTool.name,
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date().toISOString(),
            }
          }
        },
      })
    }
  }

  return tools
}

function convertMCPSchemaToZod(schema: any): z.ZodSchema {
  if (!schema || typeof schema !== "object") {
    return z.any()
  }

  if (schema.type === "object" && schema.properties) {
    const shape: Record<string, z.ZodSchema> = {}

    for (const [key, prop] of Object.entries(schema.properties as Record<string, any>)) {
      shape[key] = convertMCPSchemaToZod(prop)
    }

    let zodObject = z.object(shape)

    if (schema.required && Array.isArray(schema.required)) {
      // Zod objects are required by default, so we need to make non-required fields optional
      const requiredFields = new Set(schema.required)
      const newShape: Record<string, z.ZodSchema> = {}

      for (const [key, zodSchema] of Object.entries(shape)) {
        newShape[key] = requiredFields.has(key) ? zodSchema : zodSchema.optional()
      }

      zodObject = z.object(newShape)
    }

    return zodObject
  }

  switch (schema.type) {
    case "string":
      let stringSchema = z.string()
      if (schema.description) {
        stringSchema = stringSchema.describe(schema.description)
      }
      return stringSchema

    case "number":
      let numberSchema = z.number()
      if (schema.description) {
        numberSchema = numberSchema.describe(schema.description)
      }
      return numberSchema

    case "integer":
      let intSchema = z.number().int()
      if (schema.description) {
        intSchema = intSchema.describe(schema.description)
      }
      return intSchema

    case "boolean":
      let boolSchema = z.boolean()
      if (schema.description) {
        boolSchema = boolSchema.describe(schema.description)
      }
      return boolSchema

    case "array":
      if (schema.items) {
        return z.array(convertMCPSchemaToZod(schema.items))
      }
      return z.array(z.any())

    default:
      return z.any()
  }
}
