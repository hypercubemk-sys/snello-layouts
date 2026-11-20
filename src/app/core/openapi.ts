/* Minimal OpenAPI 3 reader: just enough to list operations and show how to call them. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

export interface ApiParam {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  type: string;
  description: string;
}

export interface ApiOperation {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  tag: string;
  summary: string;
  description: string;
  parameters: ApiParam[];
  bodyType: string;
  bodyExample: string;
  responses: { code: string; description: string }[];
}

export interface ApiSpec {
  title: string;
  version: string;
  description: string;
  operations: ApiOperation[];
}

const METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;

export function parseSpec(spec: Json): ApiSpec {
  const operations: ApiOperation[] = [];
  for (const [path, item] of Object.entries<Json>(spec?.paths ?? {})) {
    const shared: Json[] = item.parameters ?? [];
    for (const method of METHODS) {
      const op = item[method];
      if (!op) continue;
      const params = [...shared, ...(op.parameters ?? [])].map((raw) => resolve(spec, raw));
      const content = resolve(spec, op.requestBody)?.content ?? {};
      const bodyType = Object.keys(content)[0] ?? '';
      const bodySchema = bodyType ? content[bodyType]?.schema : undefined;
      operations.push({
        id: `${method} ${path}`,
        method: method.toUpperCase() as ApiOperation['method'],
        path,
        tag: tidyTag((op.tags ?? [])[0] ?? 'Other'),
        summary: op.summary ?? op.operationId ?? '',
        description: op.description ?? '',
        parameters: params.map((param) => ({
          name: param.name,
          in: param.in,
          required: !!param.required || param.in === 'path',
          type: typeOf(spec, param.schema),
          description: param.description ?? '',
        })),
        bodyType,
        bodyExample: bodySchema ? JSON.stringify(example(spec, bodySchema, 0), null, 2) : '',
        responses: Object.entries<Json>(op.responses ?? {}).map(([code, response]) => ({
          code,
          description: resolve(spec, response)?.description ?? '',
        })),
      });
    }
  }
  operations.sort((a, b) => a.tag.localeCompare(b.tag) || a.path.localeCompare(b.path));
  return {
    title: spec?.info?.title ?? 'API',
    version: spec?.info?.version ?? '',
    description: spec?.info?.description ?? '',
    operations,
  };
}

function tidyTag(tag: string): string {
  return tag.replace(/\s+(Service\s+)?Rs$/i, '').trim() || 'Other';
}

function resolve(spec: Json, node: Json): Json {
  if (node && typeof node === 'object' && typeof node.$ref === 'string') {
    const parts = node.$ref.replace(/^#\//, '').split('/');
    let current: Json = spec;
    for (const part of parts) current = current?.[part];
    return current ?? {};
  }
  return node;
}

function typeOf(spec: Json, schema: Json): string {
  const node = resolve(spec, schema) ?? {};
  if (node.type === 'array') return `${typeOf(spec, node.items)}[]`;
  if (node.enum) return node.enum.join(' | ');
  return node.format ? `${node.type ?? 'string'} (${node.format})` : (node.type ?? 'object');
}

/** A small sample value for a schema, so a request body is not a blank page. */
function example(spec: Json, schema: Json, depth: number): Json {
  const node = resolve(spec, schema) ?? {};
  if (depth > 4) return null;
  if (node.example !== undefined) return node.example;
  if (node.enum?.length) return node.enum[0];
  if (node.type === 'array') return [example(spec, node.items, depth + 1)];
  if (node.type === 'object' || node.properties) {
    const result: Record<string, Json> = {};
    for (const [key, value] of Object.entries<Json>(node.properties ?? {})) result[key] = example(spec, value, depth + 1);
    return result;
  }
  switch (node.type) {
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return false;
    default:
      return node.format === 'date-time' ? '2026-01-01T00:00:00Z' : 'string';
  }
}
