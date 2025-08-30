import { generateText } from "ai"
import { aiModels } from "@/lib/ai-gateway"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { text } = await generateText({
      model: aiModels["gpt-4o-mini"],
      prompt: "Say 'Hello from Vercel AI Gateway!' to confirm the connection is working.",
      maxTokens: 50,
    })

    return Response.json({
      success: true,
      message: text,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("AI Gateway test error:", error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
