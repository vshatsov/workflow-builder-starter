import "server-only";
 
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";
 
type ReverseInput = StepInput & {
  message: string;
};
 
type ReverseResult = 
  | { success: true; reversed: string }
  | { success: false; error: string };
 
async function stepHandler(input: ReverseInput): Promise<ReverseResult> {
  if (typeof input.message !== 'string' || !input.message.trim()) {
    return { success: false, error: 'Message must be a non-empty string' };
  }
  
  const reversed = Array.from(input.message).reverse().join('');
  console.log(reversed);
  return { success: true, reversed };
}
 
export async function reverseStep(input: ReverseInput): Promise<ReverseResult> {
  "use step";
  return withStepLogging(input, () => stepHandler(input));
}
 
export const _integrationType = "reverse";