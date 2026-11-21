import { Request, Response, NextFunction } from 'express';

type FieldType = 'string' | 'email' | 'enum' | 'stringArray' | 'number' | 'boolean' | 'chatHistory';

export interface FieldSpec {
  type: FieldType;
  required?: boolean;
  /** Minimum string length. For stringArray this applies to each item. */
  min?: number;
  /** Maximum string length. For stringArray this applies to each item. */
  max?: number;
  /** Allowed values for type 'enum'. */
  values?: readonly string[];
  /** Maximum array length for type 'stringArray'. */
  maxItems?: number;
}

export type BodySchema = Record<string, FieldSpec>;

interface FieldError {
  field: string;
  message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Whitelist validator: only declared fields survive, so unexpected keys can
 * never reach a controller or a model.
 */
const parseBody = (
  schema: BodySchema,
  input: unknown
): { ok: true; value: Record<string, unknown> } | { ok: false; errors: FieldError[] } => {
  const source = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const errors: FieldError[] = [];
  const value: Record<string, unknown> = {};

  for (const [field, spec] of Object.entries(schema)) {
    const raw = source[field];
    const isBlank = raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '');

    if (isBlank) {
      if (spec.required) errors.push({ field, message: `${field} is required.` });
      continue;
    }

    switch (spec.type) {
      case 'string':
      case 'email': {
        if (typeof raw !== 'string') {
          errors.push({ field, message: `${field} must be a string.` });
          break;
        }
        const trimmed = raw.trim();
        if (spec.min !== undefined && trimmed.length < spec.min) {
          errors.push({ field, message: `${field} must be at least ${spec.min} characters.` });
          break;
        }
        if (spec.max !== undefined && trimmed.length > spec.max) {
          errors.push({ field, message: `${field} must be at most ${spec.max} characters.` });
          break;
        }
        if (spec.type === 'email') {
          if (trimmed.length > 254 || !EMAIL_PATTERN.test(trimmed)) {
            errors.push({ field, message: `${field} must be a valid email address.` });
            break;
          }
          value[field] = trimmed.toLowerCase();
          break;
        }
        value[field] = trimmed;
        break;
      }

      case 'enum': {
        if (typeof raw !== 'string' || !spec.values?.includes(raw)) {
          errors.push({ field, message: `${field} must be one of: ${spec.values?.join(', ')}.` });
          break;
        }
        value[field] = raw;
        break;
      }

      case 'stringArray': {
        if (!Array.isArray(raw)) {
          errors.push({ field, message: `${field} must be an array of strings.` });
          break;
        }
        const maxItems = spec.maxItems ?? 20;
        if (raw.length > maxItems) {
          errors.push({ field, message: `${field} may contain at most ${maxItems} items.` });
          break;
        }
        const perItemMax = spec.max ?? 80;
        const cleaned = raw
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

        if (cleaned.length !== raw.length) {
          errors.push({ field, message: `${field} must contain only non-empty strings.` });
          break;
        }
        if (cleaned.some((item) => item.length > perItemMax)) {
          errors.push({ field, message: `${field} entries must be at most ${perItemMax} characters.` });
          break;
        }
        value[field] = cleaned;
        break;
      }

      case 'number': {
        if (typeof raw !== 'number' || !Number.isFinite(raw)) {
          errors.push({ field, message: `${field} must be a number.` });
          break;
        }
        value[field] = raw;
        break;
      }

      case 'boolean': {
        if (typeof raw !== 'boolean') {
          errors.push({ field, message: `${field} must be a boolean.` });
          break;
        }
        value[field] = raw;
        break;
      }

      case 'chatHistory': {
        if (!Array.isArray(raw)) {
          errors.push({ field, message: `${field} must be an array of messages.` });
          break;
        }
        const maxItems = spec.maxItems ?? 20;
        if (raw.length > maxItems) {
          errors.push({ field, message: `${field} may contain at most ${maxItems} messages.` });
          break;
        }
        const perMessageMax = spec.max ?? 4000;
        let invalidEntry = false;
        const history = raw.map((entry) => {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            invalidEntry = true;
            return null;
          }
          const candidate = entry as { role?: unknown; content?: unknown };
          const role = candidate.role === 'user' || candidate.role === 'mentor' ? candidate.role : null;
          const content = typeof candidate.content === 'string' ? candidate.content.trim() : '';
          if (!role || content.length === 0 || content.length > perMessageMax) {
            invalidEntry = true;
            return null;
          }
          return { role, content };
        });

        if (invalidEntry) {
          errors.push({
            field,
            message: `${field} must contain only { role: 'user' | 'mentor', content } entries.`,
          });
          break;
        }
        value[field] = history;
        break;
      }

      default:
        errors.push({ field, message: `${field} has an unsupported type.` });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value };
};

/** Replaces req.body with the validated, whitelisted payload. */
export const validateBody = (schema: BodySchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = parseBody(schema, req.body);

    if (!result.ok) {
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The submitted data is invalid.',
          details: result.errors,
        },
        requestId: req.id,
      });
      return;
    }

    req.body = result.value;
    next();
  };
};

/** Exposed for direct use where middleware ordering is not appropriate. */
export { parseBody };
