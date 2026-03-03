import "server-only";
 
import { Resend } from "resend";
import { FatalError, RetryableError } from "workflow";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";
import type { ResendCredentials } from "../credentials";
 
type SendEmailResult =
  | { success: true; id: string }
  | { success: false; error: string };
 
export type SendEmailCoreInput = {
  emailTo: string;
  emailSubject: string;
  emailBody: string;
};
 
export type SendEmailInput = StepInput &
  SendEmailCoreInput & {
    integrationId?: string;
  };
 
async function stepHandler(
  input: SendEmailCoreInput,
  credentials: ResendCredentials
): Promise<SendEmailResult> {
  const apiKey = credentials.RESEND_API_KEY;

  if (!apiKey) {
    throw new FatalError("RESEND_API_KEY is not configured");
  }
 
  const resend = new Resend(apiKey);
 
  const result = await resend.emails.send({
    from: "onboarding@resend.dev", // Resend's test sender
    to: input.emailTo,
    subject: input.emailSubject,
    text: input.emailBody,
  });
 
  if (result.error) {
    const msg = result.error.message;

    // Transient errors - retry with backoff
    if (msg.includes("rate limit") || msg.includes("503")) {
      throw new RetryableError(`Temporary failure: ${msg}`);
    }

     // Auth errors are permanent - don't retry
    if (result.error.message.includes("API key")) {
      throw new FatalError(`Auth failed: ${result.error.message}`);
    }
    // Other errors might be transient - return failure for now
    return { success: false, error: result.error.message };
  }
 
  return { success: true, id: result.data?.id || "" };
}
 
export async function sendEmailStep(
  input: SendEmailInput
): Promise<SendEmailResult> {
  "use step";
  
  console.log('sendEmailStep input', input)
  // Fetch from integration, or fall back to env var for local dev
  let credentials: ResendCredentials;
  if (input.integrationId) {
    credentials = await fetchCredentials(input.integrationId) as ResendCredentials;
  } else {
    credentials = {
      RESEND_API_KEY: process.env.RESEND_API_KEY || "",
    };
  }
 
  return withStepLogging(input, () =>
    stepHandler(
      {
        emailTo: input.emailTo,
        emailSubject: input.emailSubject,
        emailBody: input.emailBody,
      },
      credentials
    )
  );
}
 
export const _integrationType = "resend";