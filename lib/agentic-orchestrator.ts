import { mcpClientManager, type MCPServiceInfo } from "./mcp-client"

export interface OrchestrationStep {
  id: string
  service: string
  tool: string
  args: any
  status: "pending" | "running" | "completed" | "failed"
  result?: any
  error?: string
  dependencies?: string[]
  timestamp: Date
}

export interface OrchestrationPlan {
  id: string
  description: string
  steps: OrchestrationStep[]
  status: "planning" | "executing" | "completed" | "failed"
  progress: number
  startTime: Date
  endTime?: Date
}

export class AgenticOrchestrator {
  private activePlans: Map<string, OrchestrationPlan> = new Map()
  private progressCallbacks: Map<string, (plan: OrchestrationPlan) => void> = new Map()

  async createOrchestrationPlan(userRequest: string, availableServices: MCPServiceInfo[]): Promise<OrchestrationPlan> {
    const planId = `plan_${Date.now()}`

    // Analyze the request and create a plan
    const steps = await this.analyzeRequestAndCreateSteps(userRequest, availableServices)

    const plan: OrchestrationPlan = {
      id: planId,
      description: `Orchestration plan for: ${userRequest}`,
      steps,
      status: "planning",
      progress: 0,
      startTime: new Date(),
    }

    this.activePlans.set(planId, plan)
    return plan
  }

  async executePlan(planId: string, progressCallback?: (plan: OrchestrationPlan) => void): Promise<OrchestrationPlan> {
    const plan = this.activePlans.get(planId)
    if (!plan) {
      throw new Error(`Plan ${planId} not found`)
    }

    if (progressCallback) {
      this.progressCallbacks.set(planId, progressCallback)
    }

    plan.status = "executing"
    this.updateProgress(plan)

    try {
      await this.executeStepsInOrder(plan)
      plan.status = "completed"
      plan.endTime = new Date()
    } catch (error) {
      plan.status = "failed"
      plan.endTime = new Date()
      console.error("Plan execution failed:", error)
    }

    this.updateProgress(plan)
    return plan
  }

  private async analyzeRequestAndCreateSteps(
    userRequest: string,
    availableServices: MCPServiceInfo[],
  ): Promise<OrchestrationStep[]> {
    const steps: OrchestrationStep[] = []
    const requestLower = userRequest.toLowerCase()

    // Simple heuristic-based analysis (in a real implementation, this would use LLM analysis)
    let stepCounter = 0

    // File operations
    if (requestLower.includes("read") && requestLower.includes("file")) {
      const fileService = availableServices.find((s) => s.name === "File System")
      if (fileService) {
        steps.push({
          id: `step_${stepCounter++}`,
          service: fileService.name,
          tool: "read_file",
          args: { path: this.extractFilePathFromRequest(userRequest) },
          status: "pending",
          timestamp: new Date(),
        })
      }
    }

    if (requestLower.includes("write") && requestLower.includes("file")) {
      const fileService = availableServices.find((s) => s.name === "File System")
      if (fileService) {
        steps.push({
          id: `step_${stepCounter++}`,
          service: fileService.name,
          tool: "write_file",
          args: {
            path: this.extractFilePathFromRequest(userRequest),
            content: this.extractContentFromRequest(userRequest),
          },
          status: "pending",
          timestamp: new Date(),
        })
      }
    }

    // Web search operations
    if (requestLower.includes("search") || requestLower.includes("find information")) {
      const searchService = availableServices.find((s) => s.name === "Web Search")
      if (searchService) {
        steps.push({
          id: `step_${stepCounter++}`,
          service: searchService.name,
          tool: "web_search",
          args: { query: this.extractSearchQueryFromRequest(userRequest) },
          status: "pending",
          timestamp: new Date(),
        })
      }
    }

    // Complex workflows
    if (requestLower.includes("research") && requestLower.includes("save")) {
      // Multi-step: search -> save to file
      const searchService = availableServices.find((s) => s.name === "Web Search")
      const fileService = availableServices.find((s) => s.name === "File System")

      if (searchService && fileService) {
        const searchStepId = `step_${stepCounter++}`
        const saveStepId = `step_${stepCounter++}`

        steps.push({
          id: searchStepId,
          service: searchService.name,
          tool: "web_search",
          args: { query: this.extractSearchQueryFromRequest(userRequest) },
          status: "pending",
          timestamp: new Date(),
        })

        steps.push({
          id: saveStepId,
          service: fileService.name,
          tool: "write_file",
          args: {
            path: "research_results.txt",
            content: "{{PREVIOUS_RESULT}}", // Will be replaced with actual result
          },
          status: "pending",
          dependencies: [searchStepId],
          timestamp: new Date(),
        })
      }
    }

    // If no specific steps identified, create a general analysis step
    if (steps.length === 0 && availableServices.length > 0) {
      const firstService = availableServices[0]
      if (firstService.tools.length > 0) {
        steps.push({
          id: `step_${stepCounter++}`,
          service: firstService.name,
          tool: firstService.tools[0].name,
          args: this.createGenericArgsForTool(firstService.tools[0], userRequest),
          status: "pending",
          timestamp: new Date(),
        })
      }
    }

    return steps
  }

  private async executeStepsInOrder(plan: OrchestrationPlan): Promise<void> {
    const completedSteps = new Set<string>()

    while (completedSteps.size < plan.steps.length) {
      const readySteps = plan.steps.filter(
        (step) =>
          step.status === "pending" &&
          (!step.dependencies || step.dependencies.every((dep) => completedSteps.has(dep))),
      )

      if (readySteps.length === 0) {
        // Check if there are any failed steps that are blocking progress
        const failedSteps = plan.steps.filter((step) => step.status === "failed")
        if (failedSteps.length > 0) {
          throw new Error(`Execution blocked by failed steps: ${failedSteps.map((s) => s.id).join(", ")}`)
        }
        break
      }

      // Execute ready steps in parallel
      await Promise.all(readySteps.map((step) => this.executeStep(step, plan, completedSteps)))
    }
  }

  private async executeStep(
    step: OrchestrationStep,
    plan: OrchestrationPlan,
    completedSteps: Set<string>,
  ): Promise<void> {
    step.status = "running"
    this.updateProgress(plan)

    try {
      // Replace template variables in args
      const processedArgs = this.processStepArgs(step.args, plan, completedSteps)

      // Find the service
      const service = mcpClientManager
        .getAllServices()
        .find((s) => s.name === step.service && s.enabled && s.status === "connected")

      if (!service) {
        throw new Error(`Service ${step.service} is not available`)
      }

      // Execute the tool
      const result = await mcpClientManager.callTool(service.id, step.tool, processedArgs)

      step.result = result
      step.status = "completed"
      completedSteps.add(step.id)
    } catch (error) {
      step.error = error instanceof Error ? error.message : "Unknown error"
      step.status = "failed"

      // Try to recover or provide alternatives
      await this.attemptStepRecovery(step, plan)
    }

    this.updateProgress(plan)
  }

  private processStepArgs(args: any, plan: OrchestrationPlan, completedSteps: Set<string>): any {
    if (typeof args !== "object" || args === null) {
      return args
    }

    const processed = { ...args }

    for (const [key, value] of Object.entries(processed)) {
      if (typeof value === "string" && value === "{{PREVIOUS_RESULT}}") {
        // Find the most recent completed step result
        const completedStepsList = plan.steps.filter((s) => completedSteps.has(s.id))
        const lastCompleted = completedStepsList[completedStepsList.length - 1]

        if (lastCompleted?.result) {
          processed[key] =
            typeof lastCompleted.result.result === "string"
              ? lastCompleted.result.result
              : JSON.stringify(lastCompleted.result.result)
        }
      }
    }

    return processed
  }

  private async attemptStepRecovery(step: OrchestrationStep, plan: OrchestrationPlan): Promise<void> {
    // Simple recovery strategies
    if (step.tool === "read_file" && step.error?.includes("not found")) {
      // Try to list directory instead
      step.tool = "list_directory"
      step.args = { path: step.args.path.split("/").slice(0, -1).join("/") || "/" }

      try {
        const service = mcpClientManager
          .getAllServices()
          .find((s) => s.name === step.service && s.enabled && s.status === "connected")

        if (service) {
          const result = await mcpClientManager.callTool(service.id, step.tool, step.args)
          step.result = result
          step.status = "completed"
          step.error = undefined
        }
      } catch (recoveryError) {
        // Recovery failed, keep original error
      }
    }
  }

  private updateProgress(plan: OrchestrationPlan): void {
    const completedSteps = plan.steps.filter((s) => s.status === "completed").length
    plan.progress = Math.round((completedSteps / plan.steps.length) * 100)

    const callback = this.progressCallbacks.get(plan.id)
    if (callback) {
      callback(plan)
    }
  }

  private extractFilePathFromRequest(request: string): string {
    // Simple extraction - in reality, this would be more sophisticated
    const pathMatch = request.match(/["']([^"']+)["']/)
    return pathMatch ? pathMatch[1] : "example.txt"
  }

  private extractContentFromRequest(request: string): string {
    // Extract content to write
    const contentMatch = request.match(/write\s+["']([^"']+)["']/i)
    return contentMatch ? contentMatch[1] : "Generated content"
  }

  private extractSearchQueryFromRequest(request: string): string {
    // Extract search query
    const queryMatch = request.match(/search\s+(?:for\s+)?["']?([^"']+)["']?/i)
    return queryMatch ? queryMatch[1] : request
  }

  private createGenericArgsForTool(tool: any, request: string): any {
    // Create generic arguments based on tool schema
    const args: any = {}

    if (tool.inputSchema?.properties) {
      for (const [key, prop] of Object.entries(tool.inputSchema.properties as Record<string, any>)) {
        if (prop.type === "string") {
          args[key] = key.includes("path") ? "example.txt" : request
        } else if (prop.type === "number") {
          args[key] = 10
        } else if (prop.type === "boolean") {
          args[key] = true
        }
      }
    }

    return args
  }

  getPlan(planId: string): OrchestrationPlan | undefined {
    return this.activePlans.get(planId)
  }

  getAllPlans(): OrchestrationPlan[] {
    return Array.from(this.activePlans.values())
  }
}

export const agenticOrchestrator = new AgenticOrchestrator()
