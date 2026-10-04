/**
 * FlowPulse Variable Interpolator & Expression Evaluator
 * Supports:
 * - Direct paths: {{trigger.email}}, {{nodes.node_1.user.name}}
 * - Array indexing: {{api_response.items[0].id}}
 * - Built-in macros: {{$now}}, {{$uuid}}, {{$randomInt}}, {{$timestamp}}, {{$isoDate}}
 * - Fallbacks & Safe Traversal
 * - Recursive object & string resolution
 */

export function getNestedValue(obj: any, path: string): any {
  if (obj === null || obj === undefined || !path) return undefined;

  // Clean path: handle brackets like [0] -> .0
  const normalizedPath = path
    .replace(/\[(\w+)\]/g, '.$1')
    .replace(/^\./, '')
    .trim();

  const parts = normalizedPath.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function resolveBuiltinMacros(macro: string): any {
  const trimmed = macro.trim();
  switch (trimmed) {
    case '$now':
      return new Date().toLocaleTimeString();
    case '$isoDate':
      return new Date().toISOString();
    case '$timestamp':
      return Date.now();
    case '$uuid':
      return generateUUID();
    case '$randomInt':
      return Math.floor(Math.random() * 10000);
    default:
      return null;
  }
}

/**
 * Resolves a single expression template string using context.
 * e.g. "Hello {{trigger.name}}, your order id is {{$uuid}}"
 */
export function interpolateString(template: string, context: Record<string, any>): any {
  if (typeof template !== 'string') return template;

  // Check if string is EXACTLY a single expression like "{{trigger.data}}" (to preserve types: objects, arrays, booleans, numbers)
  const exactMatch = template.match(/^\{\{\s*([^}]+)\s*\}\}$/);
  if (exactMatch) {
    const expr = exactMatch[1].trim();
    
    // Check built-in macros
    if (expr.startsWith('$')) {
      const macroVal = resolveBuiltinMacros(expr);
      if (macroVal !== null) return macroVal;
    }

    // Direct context evaluation
    const directVal = evaluateExpression(expr, context);
    if (directVal !== undefined) return directVal;

    return '';
  }

  // Multi-expression string replacement e.g. "Order {{trigger.id}} for {{trigger.customer.name}}"
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expr) => {
    const trimmed = expr.trim();
    if (trimmed.startsWith('$')) {
      const macroVal = resolveBuiltinMacros(trimmed);
      if (macroVal !== null) return String(macroVal);
    }
    const val = evaluateExpression(trimmed, context);
    if (val === undefined || val === null) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  });
}

/**
 * Evaluates an expression against the context object.
 * Searches:
 * 1. Direct path in context (e.g., context['trigger.email'] or context.trigger.email)
 * 2. Nodes map (e.g. context.nodes[nodeId].output)
 * 3. Short aliases (e.g. context[alias])
 */
export function evaluateExpression(expr: string, context: Record<string, any>): any {
  if (!expr || !context) return undefined;

  // 1. Direct key check
  if (context[expr] !== undefined) {
    return context[expr];
  }

  // 2. Nested traversal
  const val = getNestedValue(context, expr);
  if (val !== undefined) {
    return val;
  }

  // 3. Fallback: check if expression starts with a node label or id
  if (context.nodes) {
    // Check nodes by id
    for (const [nodeId, nodeData] of Object.entries<any>(context.nodes)) {
      if (expr.startsWith(nodeId + '.')) {
        const subPath = expr.substring(nodeId.length + 1);
        return getNestedValue(nodeData, subPath);
      }
      // Check node by label slug
      if (nodeData.label) {
        const slug = nodeData.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (expr.toLowerCase().startsWith(slug + '.')) {
          const subPath = expr.substring(slug.length + 1);
          return getNestedValue(nodeData.output || nodeData, subPath);
        }
      }
    }
  }

  // 4. Safe JS expression evaluation (for simple calculations e.g. "trigger.price * 1.2" or strings)
  try {
    const keys = Object.keys(context);
    const values = Object.values(context);
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, `try { return (${expr}); } catch(e) { return undefined; }`);
    const evalResult = fn(...values);
    if (evalResult !== undefined) {
      return evalResult;
    }
  } catch {
    // Ignore evaluation error and return undefined
  }

  return undefined;
}

/**
 * Deeply resolves all strings in an object or array with interpolated values.
 */
export function resolveDataStructure(data: any, context: Record<string, any>): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    return interpolateString(data, context);
  }
  if (Array.isArray(data)) {
    return data.map((item) => resolveDataStructure(item, context));
  }
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = resolveDataStructure(value, context);
    }
    return result;
  }
  return data;
}
