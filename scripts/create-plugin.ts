#!/usr/bin/env tsx
/**
 * Plugin Scaffolding Script
 *
 * Creates a new plugin from templates. Supports both interactive prompts
 * and non-interactive CLI arguments.
 *
 * Usage:
 *   pnpm create-plugin                           # Interactive mode
 *   pnpm create-plugin --name resend \           # Non-interactive mode
 *     --description "Send emails via Resend" \
 *     --action send-email \
 *     --action-description "Send an email"
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { input } from "@inquirer/prompts";

const PLUGINS_DIR = join(process.cwd(), "plugins");
const TEMPLATE_DIR = join(PLUGINS_DIR, "_template");

// Regex patterns used for case conversions (hoisted for performance)
const LEADING_UPPERCASE_REGEX = /^[A-Z]/;
const VALID_IDENTIFIER_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
const UNSAFE_PATH_REGEX = /[/\\]|\.\./;

/**
 * Convert a string to various case formats
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(LEADING_UPPERCASE_REGEX, (c) => c.toLowerCase());
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toUpperSnake(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toUpperCase();
}

function toTitleCase(str: string): string {
  return str
    .replace(/[-_]+/g, " ")
    .replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
    );
}

/**
 * Escape special characters for use in string literals.
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\0/g, "\\0");
}

/**
 * Check if a string is a valid JavaScript identifier
 */
function isValidIdentifier(str: string): boolean {
  return VALID_IDENTIFIER_REGEX.test(str);
}

type PluginConfig = {
  integrationName: string;
  integrationDescription: string;
  actionName: string;
  actionDescription: string;
};

/**
 * Replace all placeholders in content
 */
function replacePlaceholders(content: string, config: PluginConfig): string {
  const {
    integrationName,
    integrationDescription,
    actionName,
    actionDescription,
  } = config;

  // Integration placeholders
  const intKebab = toKebabCase(integrationName);
  const intCamel = toCamelCase(integrationName);
  const intPascal = toPascalCase(integrationName);
  const intUpperSnake = toUpperSnake(integrationName);
  const intTitle = toTitleCase(integrationName);

  // Action placeholders
  const actKebab = toKebabCase(actionName);
  const actCamel = toCamelCase(actionName);
  const actPascal = toPascalCase(actionName);
  const actUpperSnake = toUpperSnake(actionName);
  const actTitle = toTitleCase(actionName);

  return (
    content
      // Integration placeholders
      .replace(/\[integration-type\]/g, intKebab)
      .replace(/\[integration-name\]/g, intKebab)
      .replace(/\[integrationName\]/g, intCamel)
      .replace(/\[IntegrationName\]/g, intPascal)
      .replace(/\[INTEGRATION_NAME\]/g, intUpperSnake)
      .replace(/\[Integration Name\]/g, intTitle)
      .replace(
        /\[Integration Description\]/g,
        escapeString(integrationDescription)
      )
      // Action placeholders
      .replace(/\[action-slug\]/g, actKebab)
      .replace(/\[actionName\]/g, actCamel)
      .replace(/\[ActionName\]/g, actPascal)
      .replace(/\[ACTION_NAME\]/g, actUpperSnake)
      .replace(/\[Action Name\]/g, actTitle)
      .replace(/\[Action Label\]/g, actTitle)
      .replace(/\[Action Description\]/g, escapeString(actionDescription))
  );
}

/**
 * Get dynamic template files based on action name
 */
function getTemplateFiles(actionSlug: string) {
  return [
    { src: "index.ts.txt", dest: "index.ts" },
    { src: "icon.tsx.txt", dest: "icon.tsx" },
    { src: "test.ts.txt", dest: "test.ts" },
    { src: "credentials.ts.txt", dest: "credentials.ts" },
    { src: "steps/action.ts.txt", dest: `steps/${actionSlug}.ts` },
  ];
}

/**
 * Parse CLI arguments for non-interactive mode
 */
function parseCliArgs(): PluginConfig | null {
  try {
    const { values } = parseArgs({
      options: {
        name: { type: "string", short: "n" },
        description: { type: "string", short: "d" },
        action: { type: "string", short: "a" },
        "action-description": { type: "string" },
        help: { type: "boolean", short: "h" },
      },
      allowPositionals: false,
    });

    if (values.help) {
      console.log(`
Usage: pnpm create-plugin [options]

Options:
  -n, --name <name>                Integration name (e.g., "resend")
  -d, --description <desc>         Integration description
  -a, --action <action>            Action name (e.g., "send-email")
      --action-description <desc>  Action description
  -h, --help                       Show this help message

Examples:
  pnpm create-plugin                           # Interactive mode
  pnpm create-plugin --name resend \\
    --description "Send emails via Resend" \\
    --action send-email \\
    --action-description "Send an email"
`);
      process.exit(0);
    }

    // If any args provided, require all of them
    if (values.name || values.description || values.action || values["action-description"]) {
      if (!values.name || !values.description || !values.action || !values["action-description"]) {
        console.error("Error: When using CLI arguments, all options are required:");
        console.error("  --name, --description, --action, --action-description");
        console.error("\nRun with --help for usage information.\n");
        process.exit(1);
      }
      return {
        integrationName: values.name,
        integrationDescription: values.description,
        actionName: values.action,
        actionDescription: values["action-description"],
      };
    }

    return null; // No args provided, use interactive mode
  } catch {
    return null; // Parse error, fall back to interactive
  }
}

/**
 * Validate plugin config (used for both CLI and interactive modes)
 */
function validateConfig(config: PluginConfig): string | null {
  const { integrationName, integrationDescription, actionName, actionDescription } = config;

  if (!integrationName.trim()) return "Integration name is required";
  if (UNSAFE_PATH_REGEX.test(integrationName)) {
    return "Integration name cannot contain path separators (/, \\) or '..'";
  }
  const intCamel = toCamelCase(integrationName);
  const intPascal = toPascalCase(integrationName);
  if (!(isValidIdentifier(intCamel) && isValidIdentifier(intPascal))) {
    return `Integration name must produce valid JS identifiers. "${integrationName}" -> "${intCamel}"`;
  }
  const kebab = toKebabCase(integrationName);
  const dir = join(PLUGINS_DIR, kebab);
  if (existsSync(dir)) {
    return `Plugin already exists at plugins/${kebab}/`;
  }

  if (!integrationDescription.trim()) return "Integration description is required";

  if (!actionName.trim()) return "Action name is required";
  if (UNSAFE_PATH_REGEX.test(actionName)) {
    return "Action name cannot contain path separators (/, \\) or '..'";
  }
  const actCamel = toCamelCase(actionName);
  const actPascal = toPascalCase(actionName);
  if (!(isValidIdentifier(actCamel) && isValidIdentifier(actPascal))) {
    return `Action name must produce valid JS identifiers. "${actionName}" -> "${actCamel}"`;
  }

  if (!actionDescription.trim()) return "Action description is required";

  return null;
}

/**
 * Prompt for plugin details interactively
 */
async function promptForConfig(): Promise<PluginConfig> {
  const integrationName = await input({
    message: "Integration Name:",
    validate: (value) => {
      if (!value.trim()) return "Integration name is required";
      if (UNSAFE_PATH_REGEX.test(value)) {
        return "Name cannot contain path separators (/, \\) or '..'";
      }
      const camel = toCamelCase(value);
      const pascal = toPascalCase(value);
      if (!(isValidIdentifier(camel) && isValidIdentifier(pascal))) {
        return `Must produce valid JS identifiers. "${value}" -> "${camel}" (camelCase)`;
      }
      const kebab = toKebabCase(value);
      const dir = join(PLUGINS_DIR, kebab);
      if (existsSync(dir)) return `Plugin already exists at plugins/${kebab}/`;
      return true;
    },
  });

  const integrationDescription = await input({
    message: "Integration Description (<10 words):",
    validate: (value) => (value.trim() ? true : "Integration description is required"),
  });

  const actionName = await input({
    message: "Action Name:",
    validate: (value) => {
      if (!value.trim()) return "Action name is required";
      if (UNSAFE_PATH_REGEX.test(value)) {
        return "Name cannot contain path separators (/, \\) or '..'";
      }
      const camel = toCamelCase(value);
      const pascal = toPascalCase(value);
      if (!(isValidIdentifier(camel) && isValidIdentifier(pascal))) {
        return `Must produce valid JS identifiers. "${value}" -> "${camel}" (camelCase)`;
      }
      return true;
    },
  });

  const actionDescription = await input({
    message: "Action Description (<10 words):",
    validate: (value) => (value.trim() ? true : "Action description is required"),
  });

  return { integrationName, integrationDescription, actionName, actionDescription };
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log("\nCreate New Plugin for Workflow Builder\n");

  // Check if template directory exists
  if (!existsSync(TEMPLATE_DIR)) {
    console.error("Error: Template directory not found at plugins/_template/");
    console.error("   Make sure the template files are present.\n");
    process.exit(1);
  }

  // Try CLI args first, fall back to interactive prompts
  let answers = parseCliArgs();
  
  if (answers) {
    // Validate CLI-provided config
    const error = validateConfig(answers);
    if (error) {
      console.error(`Error: ${error}\n`);
      process.exit(1);
    }
    console.log("Using CLI arguments (non-interactive mode)\n");
  } else {
    // Interactive mode
    answers = await promptForConfig();
  }

  const pluginName = toKebabCase(answers.integrationName);
  const actionSlug = toKebabCase(answers.actionName);
  const pluginDir = join(PLUGINS_DIR, pluginName);

  console.log(`\nGenerating plugin: ${pluginName}`);

  // Create directories
  mkdirSync(join(pluginDir, "steps"), { recursive: true });

  // Copy and process template files
  const createdFiles: string[] = [];
  const templateFiles = getTemplateFiles(actionSlug);

  for (const { src, dest } of templateFiles) {
    const srcPath = join(TEMPLATE_DIR, src);
    const destPath = join(pluginDir, dest);

    if (!existsSync(srcPath)) {
      console.error(`\nError: Template file not found: ${src}`);
      console.error("   The template directory may be corrupted.\n");
      process.exit(1);
    }

    let content = readFileSync(srcPath, "utf-8");
    content = replacePlaceholders(content, answers);

    writeFileSync(destPath, content, "utf-8");
    createdFiles.push(`plugins/${pluginName}/${dest}`);
  }

  // Print created files
  console.log(`\nCreated plugin at plugins/${pluginName}/\n`);
  console.log("Files created:");
  for (const file of createdFiles) {
    console.log(`  - ${file}`);
  }

  // Run discover-plugins to register the new plugin
  console.log("\nAdding plugin to registry...");
  execFileSync("pnpm", ["discover-plugins"], { stdio: "inherit" });

  console.log(
    `\nPlugin "${answers.integrationName}" has been added to the registry!\n`
  );
  console.log("Next steps:");
  console.log(`  1. Review and customize the files in plugins/${pluginName}/`);
  console.log("  2. Update the icon in icon.tsx with your integration's SVG");
  console.log(
    "  3. Implement the API logic in steps/ (codegen is auto-generated)"
  );
  console.log("  4. Test: pnpm dev\n");
}

main().catch((error: unknown) => {
  if (error instanceof Error && error.name === "ExitPromptError") {
    console.log("\nCome back anytime to create your plugin.\n");
    process.exit(0);
  }
  const message = error instanceof Error ? error.message : String(error);
  console.error("Error:", message);
  process.exit(1);
});
