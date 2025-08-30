import { streamText, convertToCoreMessages } from "ai"
import type { NextRequest } from "next/server"
import { aiModels, defaultModel, type AIModelKey } from "@/lib/ai-gateway"
import { createMCPTools } from "@/lib/mcp-tools"
import { mcpClientManager } from "@/lib/mcp-client"
import { agenticOrchestrator } from "@/lib/agentic-orchestrator"

export async function POST(req: NextRequest) {
  try {
    const { messages, data } = await req.json()

    // Get MCP context and model selection from the request
    const mcpContext = data?.mcpContext
    const selectedModel: AIModelKey = data?.model || defaultModel

    // Get enabled MCP services
    const enabledServices = mcpClientManager
      .getAllServices()
      .filter((service) => service.enabled && service.status === "connected")

    // Create tools from enabled MCP services
    const tools = createMCPTools(enabledServices)

    let systemPrompt = `You are an intelligent AI assistant with access to Model Context Protocol (MCP) services and advanced orchestration capabilities. You can help users with various tasks by utilizing connected external tools and services.

You have access to function calling capabilities and can execute tools to help users with their requests. When a user asks for something that requires external tools, use the appropriate functions to complete the task.

ORCHESTRATION CAPABILITIES:
- You can analyze complex requests and break them down into multiple steps
- You can chain multiple MCP service calls together intelligently
- You can handle dependencies between different service calls
- You can provide real-time progress updates during multi-step operations
- You can recover from errors and suggest alternatives

Current capabilities:
- General conversation and assistance
- Code generation and explanation
- Data analysis and processing
- Function calling with MCP services
- Multi-step orchestration and workflow management`

    if (enabledServices.length > 0) {
      systemPrompt += `

Available MCP Services and Tools:
${enabledServices
  .map(
    (service) => `
- ${service.name} (${service.tools.length} tools):
${service.tools.map((tool) => `  • ${tool.name}: ${tool.description}`).join("\n")}`,
  )
  .join("\n")}

ORCHESTRATION GUIDELINES:
1. For complex requests, explain your orchestration plan before executing
2. Break down multi-step tasks into logical sequences
3. Use appropriate tools with correct parameters
4. Handle dependencies between steps intelligently
5. Provide progress updates during execution
6. Interpret and explain results to the user
7. Handle errors gracefully and suggest alternatives
8. Consider creating orchestration plans for complex workflows

EXAMPLE ORCHESTRATION SCENARIOS:
- "Research X and save to file" → Search web, then write file with results
- "Read file and analyze data" → Read file, then process/analyze content
- "Find information and create report" → Multiple searches, then compile results`
    } else {
      systemPrompt += `

Note: No MCP services are currently connected. You can still help with general questions and tasks, but external tool capabilities and orchestration are not available.`
    }

    const lastMessage = messages[messages.length - 1]
    if (lastMessage && enabledServices.length > 0) {
      const requestText = lastMessage.content.toLowerCase()
      const isComplexRequest =
        (requestText.includes("and") &&
          (requestText.includes("then") || requestText.includes("save") || requestText.includes("create"))) ||
        requestText.includes("research") ||
        requestText.includes("analyze") ||
        requestText.includes("workflow")

      if (isComplexRequest) {
        // Create an orchestration plan for complex requests
        try {
          const plan = await agenticOrchestrator.createOrchestrationPlan(lastMessage.content, enabledServices)
          systemPrompt += `

ORCHESTRATION PLAN CREATED:
A multi-step orchestration plan has been created for this request with ${plan.steps.length} steps. You can reference this plan and execute the steps as needed.`
        } catch (error) {
          console.error("Failed to create orchestration plan:", error)
        }
      }
    }

    const result = await streamText({
      model: aiModels[selectedModel],
      system: systemPrompt,
      messages: convertToCoreMessages(messages),
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      maxTokens: 2000,
      temperature: 0.7,
      toolChoice: "auto",
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
