import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * Reusable React Hook Form wrapper pre-configured with Zod schema validation.
 * Reduces form re-renders compared to controlled per-field useState hooks.
 */
export function useZodForm(schema, options = {}) {
  return useForm({
    mode: 'onTouched',
    ...options,
    resolver: zodResolver(schema)
  });
}
