/**
 * Code generation from workflow JSON to TypeScript
 * Built-in actions only. Plugin generators are added via the plugin system.
 */

import {
  analyzeNodeUsage,
  buildAccessPath,
  removeInvisibleChars,
  TEMPLATE_PATTERN,
  toFriendlyVarName,
} from "./workflow-codegen-shared";
import type { WorkflowEdge, WorkflowNode } from "./workflow-store";

type CodeGenOptions = {
  functionName?: string;
  parameters?: Array<{ name: string; type: string }>;
  returnType?: string;
};

type GeneratedCode = {
  code: string;
  functionName: string;
  imports: string[];
};

const CONST_ASSIGNMENT_PATTERN = /^(\s*)(const\s+\w+\s*=\s*)(.*)$/;

/**
 * Generate TypeScript code from workflow JSON with "use workflow" directive
 */
export function generateWorkflowCode(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  options: CodeGenOptions = {}
): GeneratedCode {
  const { functionName = "executeWorkflow" } = options;
  const usedNodeOutputs = analyzeNodeUsage(nodes);
  const imports = new Set<string>();

  // Build node and edge maps
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const edgesBySource = new Map<string, string[]>();
  for (const edge of edges) {
    const targets = edgesBySource.get(edge.source) || [];
    targets.push(edge.target);
    edgesBySource.set(edge.source, targets);
  }

  // Find trigger nodes
  const nodesWithIncoming = new Set(edges.map((e) => e.target));
  const triggerNodes = nodes.filter(
    (node) => node.data.type === "trigger" && !nodesWithIncoming.has(node.id)
  );

  const codeLines: string[] = [];
  const visited = new Set<string>();

  codeLines.push(`export async function ${functionName}() {`);
  codeLines.push(`  "use workflow";`);
  codeLines.push("");

  // Build nodeId to varName map
  const nodeIdToVarName = new Map<string, string>();
  const usedVarNames = new Set<string>();

  for (const node of nodes) {
    let varName: string;
    if (node.data.type === "action") {
      const actionType = node.data.config?.actionType as string | undefined;
      const label = node.data.label || "";
      const baseVarName = toFriendlyVarName(label, actionType);
      varName = baseVarName;
      let counter = 1;
      while (usedVarNames.has(varName)) {
        varName = `${baseVarName}${counter}`;
        counter += 1;
      }
      usedVarNames.add(varName);
    } else {
      varName = `${node.data.type}_${node.id.replace(/-/g, "_")}`;
    }
    nodeIdToVarName.set(node.id, varName);
  }

  // Template processing helpers
  function processAtFormat(trimmed: string, match: string): string {
    const withoutAt = trimmed.substring(1);
    const colonIndex = withoutAt.indexOf(":");
    if (colonIndex === -1) return match;

    const nodeId = withoutAt.substring(0, colonIndex);
    const rest = withoutAt.substring(colonIndex + 1);
    const dotIndex = rest.indexOf(".");
    const fieldPath = dotIndex !== -1 ? rest.substring(dotIndex + 1) : "";

    const varName = nodeIdToVarName.get(nodeId);
    if (!varName) return match;
    if (!fieldPath) return `\${${varName}}`;

    const accessPath = buildAccessPath(fieldPath);
    return `\${${varName}${accessPath}}`;
  }

  function processDollarFormat(trimmed: string, match: string): string {
    const withoutDollar = trimmed.substring(1);
    const parts = withoutDollar.split(".");
    const nodeId = parts[0];
    const fieldPath = parts.slice(1).join(".");

    const varName = nodeIdToVarName.get(nodeId);
    if (!varName) return match;
    if (!fieldPath) return `\${${varName}}`;

    const accessPath = buildAccessPath(fieldPath);
    return `\${${varName}${accessPath}}`;
  }

  function processAtFormatForExpression(trimmed: string, match: string): string {
    const withoutAt = trimmed.substring(1);
    const colonIndex = withoutAt.indexOf(":");
    if (colonIndex === -1) return match;

    const nodeId = withoutAt.substring(0, colonIndex);
    const rest = withoutAt.substring(colonIndex + 1);
    const dotIndex = rest.indexOf(".");
    const fieldPath = dotIndex !== -1 ? rest.substring(dotIndex + 1) : "";

    const varName = nodeIdToVarName.get(nodeId);
    if (!varName) return match;
    if (!fieldPath) return varName;

    const accessPath = buildAccessPath(fieldPath);
    return `${varName}${accessPath}`;
  }

  function processDollarFormatForExpression(trimmed: string, match: string): string {
    const withoutDollar = trimmed.substring(1);
    const parts = withoutDollar.split(".");
    const nodeId = parts[0];
    const fieldPath = parts.slice(1).join(".");

    const varName = nodeIdToVarName.get(nodeId);
    if (!varName) return match;
    if (!fieldPath) return varName;

    const accessPath = buildAccessPath(fieldPath);
    return `${varName}${accessPath}`;
  }

  function convertTemplateToJS(template: string): string {
    if (!template || typeof template !== "string") return template;

    return template.replace(TEMPLATE_PATTERN, (match, expression) => {
      const trimmed = expression.trim();
      if (trimmed.startsWith("@")) return processAtFormat(trimmed, match);
      if (trimmed.startsWith("$")) return processDollarFormat(trimmed, match);
      return match;
    });
  }

  function convertConditionToJS(condition: string): string {
    if (!condition || typeof condition !== "string") return condition;

    const cleaned = removeInvisibleChars(condition);
    const converted = cleaned.replace(TEMPLATE_PATTERN, (match, expression) => {
      const trimmed = expression.trim();
      if (trimmed.startsWith("@")) return processAtFormatForExpression(trimmed, match);
      if (trimmed.startsWith("$")) return processDollarFormatForExpression(trimmed, match);
      return match;
    });

    return removeInvisibleChars(converted);
  }

  // ┌────────────────────────────────────────────────────────────────────────┐
  // │ LESSON 3: Add your Resend plugin generator here                        │
  // │                                                                        │
  // │ function generateEmailActionCode(                                      │
  // │   node: WorkflowNode,                                                  │
  // │   indent: string,                                                      │
  // │   varName: string                                                      │
  // │ ): string[] { ... }                                                    │
  // └────────────────────────────────────────────────────────────────────────┘

  // ┌────────────────────────────────────────────────────────────────────────┐
  // │ LESSON 6: Add your custom plugin generator here                        │
  // │                                                                        │
  // │ function generateSlackActionCode(...): string[] { ... }                │
  // │ function generateStripeActionCode(...): string[] { ... }               │
  // └────────────────────────────────────────────────────────────────────────┘

  /**
   * Generate code for Log action
   */
  function generateLogActionCode(
    node: WorkflowNode,
    indent: string,
    varName: string
  ): string[] {
    const config = node.data.config || {};
    const message = (config.logMessage as string) || "Log executed";
    const level = (config.logLevel as string) || "info";

    const convertedMessage = convertTemplateToJS(message);
    const hasTemplateRefs = convertedMessage.includes("${");
    const escapeForOuter = (str: string) => str.replace(/\$\{/g, "$${");

    const messageValue = hasTemplateRefs
      ? `\`${escapeForOuter(convertedMessage).replace(/`/g, "\\`")}\``
      : `'${message.replace(/'/g, "\\'")}'`;

    return [
      `${indent}const ${varName} = await logStep({`,
      `${indent}  message: ${messageValue},`,
      `${indent}  level: '${level}',`,
      `${indent}});`,
    ];
  }

  /**
   * Generate code for HTTP Request action
   */
  function generateHTTPActionCode(
    node: WorkflowNode,
    indent: string,
    varName: string
  ): string[] {
    const config = node.data.config || {};
    const endpoint = (config.endpoint as string) || "https://api.example.com/endpoint";
    const method = (config.httpMethod as string) || "POST";

    imports.add("import { httpRequestStep } from './steps/http-request';");

    return [
      `${indent}const ${varName} = await httpRequestStep({`,
      `${indent}  url: '${endpoint}',`,
      `${indent}  method: '${method}',`,
      `${indent}});`,
    ];
  }

  /**
   * Generate code for action nodes
   */
  function generateActionNodeCode(
    node: WorkflowNode,
    nodeId: string,
    indent: string,
    varName: string
  ): string[] {
    const actionType = node.data.config?.actionType as string;
    const actionLabel = node.data.label || actionType || "Unknown Action";
    const lines: string[] = [`${indent}// Action: ${actionLabel}`];

    if (node.data.description) {
      lines.push(`${indent}// ${node.data.description}`);
    }

    const outputIsUsed = usedNodeOutputs.has(nodeId);

    function removeVariableAssignment(actionLines: string[]): string[] {
      return actionLines.map((line) => {
        const match = CONST_ASSIGNMENT_PATTERN.exec(line);
        if (match && line.includes("await")) {
          const [, lineIndent, , rest] = match;
          return `${lineIndent}${rest}`;
        }
        if (match && line.trim().startsWith("const") && line.includes("{")) {
          const [, lineIndent, , rest] = match;
          return `${lineIndent}void ${rest}`;
        }
        return line;
      });
    }

    const wrapActionCall = (actionLines: string[]): string[] => {
      return outputIsUsed ? actionLines : removeVariableAssignment(actionLines);
    };

    // Built-in action types
    // ┌──────────────────────────────────────────────────────────────────────┐
    // │ LESSON 3: Add case "Send Email" here                                 │
    // │ LESSON 6: Add your custom action case here                           │
    // └──────────────────────────────────────────────────────────────────────┘
    switch (actionType) {
      case "Log":
        imports.add("import { logStep } from './steps/log';");
        lines.push(...wrapActionCall(generateLogActionCode(node, indent, varName)));
        break;

      case "HTTP Request":
        lines.push(...wrapActionCall(generateHTTPActionCode(node, indent, varName)));
        break;

      default:
        if (outputIsUsed) {
          lines.push(`${indent}const ${varName} = { status: 'success' };`);
        } else {
          lines.push(`${indent}void ({ status: 'success' });`);
        }
    }

    return lines;
  }

  /**
   * Generate code for condition nodes
   */
  function generateConditionNodeCode(
    node: WorkflowNode,
    nodeId: string,
    indent: string
  ): string[] {
    const lines: string[] = [`${indent}// Condition: ${node.data.label}`];

    if (node.data.description) {
      lines.push(`${indent}// ${node.data.description}`);
    }

    const condition = node.data.config?.condition as string;
    const nextNodes = edgesBySource.get(nodeId) || [];

    if (nextNodes.length > 0) {
      const trueNode = nextNodes[0];
      const falseNode = nextNodes[1];
      const convertedCondition = condition ? convertConditionToJS(condition) : "true";

      lines.push(`${indent}if (${convertedCondition}) {`);
      if (trueNode) {
        const trueNodeCode = generateNodeCode(trueNode, `${indent}  `);
        lines.push(...trueNodeCode);
      }

      if (falseNode) {
        lines.push(`${indent}} else {`);
        const falseNodeCode = generateNodeCode(falseNode, `${indent}  `);
        lines.push(...falseNodeCode);
      }

      lines.push(`${indent}}`);
    }

    return lines;
  }

  /**
   * Generate code for trigger nodes
   */
  function generateTriggerCode(
    node: WorkflowNode,
    nodeId: string,
    varName: string,
    indent: string
  ): string[] {
    if (!usedNodeOutputs.has(nodeId)) return [];

    const lines: string[] = [];
    lines.push(`${indent}// Trigger: ${node.data.label}`);
    if (node.data.description) {
      lines.push(`${indent}// ${node.data.description}`);
    }
    lines.push(`${indent}const ${varName} = { triggered: true };`);
    return lines;
  }

  /**
   * Process next nodes recursively
   */
  function processNextNodes(
    nodeId: string,
    currentLines: string[],
    indent: string
  ): string[] {
    const nextNodes = edgesBySource.get(nodeId) || [];
    const result = [...currentLines];

    if (currentLines.length > 0 && nextNodes.length > 0) {
      result.push("");
    }

    for (const nextNodeId of nextNodes) {
      const nextCode = generateNodeCode(nextNodeId, indent);
      result.push(...nextCode);
    }

    return result;
  }

  /**
   * Generate code for a single node
   */
  function generateNodeCode(nodeId: string, indent = "  "): string[] {
    if (visited.has(nodeId)) {
      return [`${indent}// Already processed: ${nodeId}`];
    }

    visited.add(nodeId);
    const node = nodeMap.get(nodeId);
    if (!node) return [];

    const varName =
      nodeIdToVarName.get(nodeId) ||
      `${node.data.type}_${nodeId.replace(/-/g, "_")}`;

    switch (node.data.type) {
      case "trigger": {
        const triggerCode = generateTriggerCode(node, nodeId, varName, indent);
        if (triggerCode.length === 0) {
          const lines: string[] = [];
          const nextNodes = edgesBySource.get(nodeId) || [];
          for (const nextNodeId of nextNodes) {
            lines.push(...generateNodeCode(nextNodeId, indent));
          }
          return lines;
        }
        return processNextNodes(nodeId, triggerCode, indent);
      }

      case "action": {
        const actionType = node.data.config?.actionType as string;
        if (actionType === "Condition") {
          return generateConditionNodeCode(node, nodeId, indent);
        }
        const actionLines = generateActionNodeCode(node, nodeId, indent, varName);
        return processNextNodes(nodeId, actionLines, indent);
      }

      default:
        return processNextNodes(
          nodeId,
          [`${indent}// Unknown node type: ${node.data.type}`],
          indent
        );
    }
  }

  // Generate code starting from triggers
  if (triggerNodes.length === 0) {
    codeLines.push("  // No trigger nodes found");
  } else {
    for (const trigger of triggerNodes) {
      codeLines.push(...generateNodeCode(trigger.id, "  "));
    }
  }

  codeLines.push("}");

  const importStatements = Array.from(imports).join("\n");
  const code = `${importStatements}\n\n${codeLines.join("\n")}\n`;

  return { code, functionName, imports: Array.from(imports) };
}

/**
 * Generate a complete workflow module file
 */
export function generateWorkflowModule(
  workflowName: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  options: CodeGenOptions = {}
): string {
  const { code } = generateWorkflowCode(nodes, edges, options);

  return `/**
 * Generated Workflow: ${workflowName}
 *
 * This file was automatically generated from a workflow definition.
 * DO NOT EDIT MANUALLY - regenerate from the workflow editor instead.
 */

${code}
`;
}
