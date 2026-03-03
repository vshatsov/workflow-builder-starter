import type { IntegrationPlugin } from "../registry";
import { registerIntegration } from "../registry";
import { ShoutIcon } from "./icon";
 
const shoutPlugin: IntegrationPlugin = {
  type: "shout",
  label: "Shout",
  description: "Log messages in ALL CAPS",
  icon: ShoutIcon,
  formFields: [], // No credentials needed
  actions: [
    {
      slug: "shout",
      label: "Shout Message",
      description: "Log a message in uppercase",
      category: "Shout",
      stepFunction: "shoutStep",
      stepImportPath: "shout",
      configFields: [
        {
          key: "message",
          label: "Message",
          type: "template-input",
          placeholder: "Enter message to shout",
          required: true,
        },
      ],
    },
  ],
};
 
registerIntegration(shoutPlugin);
export default shoutPlugin;