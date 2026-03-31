import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { eventBus, type AppEvent } from "@/lib/event-bus";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection heartbeat
      controller.enqueue(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`);

      // Define the listener
      const handleEvent = (event: AppEvent) => {
        // Filter events: Only send if it's meant for everyone, or specifically for this user
        if (!event.userId || event.userId === userId) {
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        }
      };

      eventBus.on("vault_event", handleEvent);

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        eventBus.off("vault_event", handleEvent);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}