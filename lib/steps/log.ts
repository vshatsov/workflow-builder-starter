/**
 * Log step - outputs a message to the console
 * The simplest possible action for debugging workflows
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

type LogInput = StepInput & {
  // Normalized format
  message?: string;
  level?: "info" | "warn" | "error";
  data?: unknown;
  // UI config format
  logMessage?: string;
  logLevel?: "info" | "warn" | "error";
};

type LogResult = {
  success: true;
  logged: string;
  timestamp: string;
};

async function stepHandler(input: LogInput): Promise<LogResult> {
  // Accept both UI config format (logMessage, logLevel) and normalized format (message, level)
  const message = input.message || input.logMessage || "Log step executed";
  const level = input.level || input.logLevel || "info";
  const timestamp = new Date().toISOString();

  // Log with appropriate level
  const logFn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;

  logFn(`[Workflow Log] ${message}`, input.data ? { data: input.data } : "");

  return {
    success: true,
    logged: message,
    timestamp,
  };
}

export async function logStep(input: LogInput): Promise<LogResult> {
  "use step";
  return withStepLogging(input, () => stepHandler(input));
}
