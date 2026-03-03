import "server-only";
 
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";
 
type ShoutInput = StepInput & {
  message: string;
};
 
type ShoutResult = 
  | { success: true; shouted: string }
  | { success: false; error: string };
 
async function stepHandler(input: ShoutInput): Promise<ShoutResult> {
  if (typeof input.message !== 'string' || !input.message.trim()) {
    return { success: false, error: 'Message must be a non-empty string' };
  }
  
  const shouted = input.message.toUpperCase();
  console.log(shouted);
  return { success: true, shouted };
}
 
export async function shoutStep(input: ShoutInput): Promise<ShoutResult> {
  "use step";
  return withStepLogging(input, () => stepHandler(input));
}
 
export const _integrationType = "shout";