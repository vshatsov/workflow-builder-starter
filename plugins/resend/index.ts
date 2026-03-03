/**
 * PLUGIN INDEX TEMPLATE
 *
 * This is the main plugin definition file. It registers your integration
 * and defines all actions, configuration fields, and metadata.
 *
 * Instructions:
 * 1. Replace all [PLACEHOLDERS] with your integration's values
 * 2. Run `pnpm discover-plugins` after creating your plugin
 */

import type { IntegrationPlugin } from "../registry";
import { registerIntegration } from "../registry";
import { ResendIcon } from "./icon";

const resendPlugin: IntegrationPlugin = {
  // Must be unique and match your folder name (e.g., "my-integration")
  type: "resend",

  // Display name shown in the UI
  label: "Resend",

  // Brief description of what this integration does
  description: "Send emails via Resend",

  // Icon component - imported from ./icon.tsx
  // Can be a custom SVG component or use a Lucide icon directly
  icon: ResendIcon,

  // Form fields for the integration settings dialog
  // These define what credentials/config users need to provide
  formFields: [
    {
      id: "apiKey",
      label: "API Key",
      type: "password", // "password" | "text" | "url"
      placeholder: "[api-key-prefix]...",
      configKey: "apiKey", // Key stored in database
      envVar: "RESEND_API_KEY", // Environment variable name
      helpText: "Get your API key from ",
      helpLink: {
        text: "resend.com/api-keys",
        url: "https://resend.com/api-keys",
      },
    },
    // Add more fields as needed (e.g., workspace ID, region, etc.)
  ],

  // Test function for validating credentials
  // Lazy-loaded to avoid bundling server code in client
  testConfig: {
    getTestFunction: async () => {
      const { testResend } = await import("./test");
      return testResend;
    },
  },

  // NPM dependencies required by this plugin
  // These are included when exporting workflows
  dependencies: {
    "[package-name]": "^[version]",
  },

  // Actions provided by this integration
  actions: [
    {
      // Unique slug for this action (used in URLs and IDs)
      // Full action ID will be: "resend/[slug]"
      slug: "send-email",

      // Display name and description
      label: "Send Email",
      description: "Send an email",

      // Category for grouping in the action picker (usually integration name)
      category: "Resend",

      // Step function name and import path
      // The function must be exported from plugins/[integration]/steps/[stepImportPath].ts
      stepFunction: "sendEmailStep",
      stepImportPath: "send-email",

      // Declarative config fields for the action
      // Supported types: "template-input", "template-textarea", "text", "number", "select", "schema-builder"
      configFields: [
      // {
      //   emailTo: input.emailTo,
      //   emailSubject: input.emailSubject,
      //   emailBody: input.emailBody,
      // },
        {
          key: "emailTo",
          label: "Email To",
          type: "text", // Supports {{NodeName.field}} syntax
          placeholder: "subject",
          defaultValue: "",
          example: "example value", // Used in AI prompt generation
          required: true,
        },
        {
          key: "emailSubject",
          label: "Email Subject",
          type: "text", // Supports {{NodeName.field}} syntax
          placeholder: "subject",
          example: "example value", // Used in AI prompt generation
          required: true,
        },
        {
          key: "emailBody",
          label: "emailBody",
          type: "text",
          placeholder: "body",
          rows: 5,
        },
        // For select fields:
        // {
        //   key: "option",
        //   label: "Option",
        //   type: "select",
        //   options: [
        //     { value: "a", label: "Option A" },
        //     { value: "b", label: "Option B" },
        //   ],
        //   defaultValue: "a",
        // },
        // For conditional fields:
        // {
        //   key: "conditionalField",
        //   label: "Conditional Field",
        //   type: "text",
        //   showWhen: { field: "option", equals: "b" },
        // },
      ],
    },
    // Add more actions as needed
  ],
};

// Auto-register on import
registerIntegration(resendPlugin);

export default resendPlugin;
