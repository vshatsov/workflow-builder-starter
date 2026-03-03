/**
 * Code generation utilities for workflow step functions
 * Built-in templates only. Plugin templates are loaded dynamically.
 */

import conditionTemplate from "@/lib/codegen-templates/condition";
import httpRequestTemplate from "@/lib/codegen-templates/http-request";

// Generate code snippet for a single node
export const generateNodeCode = (node: {
  id: string;
  data: {
    type: string;
    label: string;
    description?: string;
    config?: Record<string, unknown>;
  };
}): string => {
  if (node.data.type === "trigger") {
    const triggerType = (node.data.config?.triggerType as string) || "Manual";

    if (triggerType === "Schedule") {
      const cron = (node.data.config?.scheduleCron as string) || "0 9 * * *";
      const timezone =
        (node.data.config?.scheduleTimezone as string) || "America/New_York";
      return `{
  "crons": [
    {
      "path": "/api/workflow",
      "schedule": "${cron}",
      "timezone": "${timezone}"
    }
  ]
}`;
    }

    if (triggerType === "Webhook") {
      return `import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Call your workflow function here
  await executeWorkflow(body);
  
  return Response.json({ success: true });
}`;
    }

    // Manual trigger - no code
    return "";
  }

  if (node.data.type === "action") {
    const actionType = node.data.config?.actionType as string;

    // Built-in templates only. Plugin steps are added via the plugin system.
    // TODO: Add your plugin templates here in Lesson 3
    switch (actionType) {
      case "HTTP Request":
        return httpRequestTemplate;
      case "Condition":
        return conditionTemplate;
      default:
        return `async function actionStep(input: Record<string, unknown>) {
  "use step";

  console.log('Executing action');
  return { success: true };
}`;
    }
  }

  return `async function unknownStep(input: Record<string, unknown>) {
  "use step";

  return input;
}`;
};
