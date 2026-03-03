import type { IntegrationPlugin } from "../registry";
import { registerIntegration } from "../registry";
import { ReverseIcon } from "./icon";
 
const reversePlugin: IntegrationPlugin = {
  type: "reverse",
  label: "Reverse",
  description: "Log messages in ALL CAPS",
  icon: ReverseIcon,
  formFields: [], // No credentials needed
  actions: [
    {
      slug: "Reverse",
      label: "Reverse Message",
      description: "Log a message in uppercase",
      category: "Reverse",
      stepFunction: "reverseStep",
      stepImportPath: "reverse",
      configFields: [
        {
          key: "message",
          label: "Message",
          type: "template-input",
          placeholder: "Enter message to Reverse",
          required: true,
        },
      ],
    },
  ],
};
 
registerIntegration(reversePlugin);
export default reversePlugin;