"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Cpu, Zap } from "lucide-react"
import { modelCapabilities, type AIModelKey } from "@/lib/ai-gateway"
import { useMobile } from "@/hooks/use-mobile"

interface ModelSelectorProps {
  selectedModel: AIModelKey
  onModelChange: (model: AIModelKey) => void
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isMobile = useMobile()

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 flex-shrink-0" />
                <CardTitle className="text-sm">AI Model</CardTitle>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
            </div>
            <CardDescription className="text-left text-xs">
              Current: {selectedModel}
              {!isMobile && <> • {modelCapabilities[selectedModel].description}</>}
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 p-3 sm:p-6 sm:pt-0">
            <RadioGroup value={selectedModel} onValueChange={(value) => onModelChange(value as AIModelKey)}>
              <div className="space-y-3">
                {Object.entries(modelCapabilities).map(([modelKey, capabilities]) => (
                  <div key={modelKey} className="flex items-start space-x-2">
                    <RadioGroupItem value={modelKey} id={modelKey} className="mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={modelKey} className="text-sm font-medium cursor-pointer">
                        {modelKey}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1 break-words">{capabilities.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {capabilities.functionCalling && (
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="h-2 w-2 mr-1" />
                            Function Calling
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {capabilities.maxTokens.toLocaleString()} tokens
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
