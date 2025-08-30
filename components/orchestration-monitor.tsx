"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Play, CheckCircle, XCircle, Clock, Zap, AlertTriangle } from "lucide-react"
import type { OrchestrationPlan, OrchestrationStep } from "@/lib/agentic-orchestrator"
import { useMobile } from "@/hooks/use-mobile"

interface OrchestrationMonitorProps {
  plans: OrchestrationPlan[]
  onExecutePlan?: (planId: string) => void
}

export function OrchestrationMonitor({ plans, onExecutePlan }: OrchestrationMonitorProps) {
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set())
  const isMobile = useMobile()

  const toggleExpanded = (planId: string) => {
    setExpandedPlans((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(planId)) {
        newSet.delete(planId)
      } else {
        newSet.add(planId)
      }
      return newSet
    })
  }

  const getStatusIcon = (status: OrchestrationStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
      case "running":
        return (
          <div className="h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
        )
      case "failed":
        return <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
      default:
        return <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
    }
  }

  const getStatusBadge = (status: OrchestrationPlan["status"]) => {
    const variants = {
      planning: "secondary",
      executing: "default",
      completed: "default",
      failed: "destructive",
    } as const

    const colors = {
      planning: "text-blue-600",
      executing: "text-orange-600",
      completed: "text-green-600",
      failed: "text-red-600",
    }

    return (
      <Badge variant={variants[status]} className={`${colors[status]} text-xs`}>
        {status}
      </Badge>
    )
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 text-center">
          <Zap className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No orchestration plans active</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Orchestration Plans</h3>
      {plans.map((plan) => (
        <Card key={plan.id}>
          <Collapsible open={expandedPlans.has(plan.id)} onOpenChange={() => toggleExpanded(plan.id)}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3 p-3 sm:p-6 sm:pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {expandedPlans.has(plan.id) ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">{plan.description}</CardTitle>
                      <CardDescription className="text-xs">
                        {plan.steps.length} steps • {plan.progress}% complete
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(plan.status)}
                    {plan.status === "planning" && onExecutePlan && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          onExecutePlan(plan.id)
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        {isMobile ? "Run" : "Execute"}
                      </Button>
                    )}
                  </div>
                </div>
                <Progress value={plan.progress} className="h-1" />
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="pt-0 p-3 sm:p-6 sm:pt-0">
                <div className="space-y-2">
                  {plan.steps.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-2 sm:gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs text-muted-foreground w-4 sm:w-6 flex-shrink-0">{index + 1}.</span>
                        {getStatusIcon(step.status)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium">{step.service}</span>
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {step.tool}
                            </Badge>
                          </div>
                          {step.error && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                              <span className="text-xs text-red-600 break-words">{step.error}</span>
                            </div>
                          )}
                          {step.dependencies && step.dependencies.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Depends on: {step.dependencies.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Started: {plan.startTime.toLocaleTimeString()}</span>
                    {plan.endTime && <span>Ended: {plan.endTime.toLocaleTimeString()}</span>}
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  )
}
