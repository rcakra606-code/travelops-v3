import { z } from 'zod';

const emailRecipientSchema = z
  .string()
  .trim()
  .min(3, 'Recipient email is required.')
  .refine(
    (val) =>
      val
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .every((addr) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)),
    'Invalid recipient email format.'
  );

export const createUserSchema = z.object({
  email: z.string().trim().email('Valid email address is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  name: z.string().trim().min(1, 'Name is required.').max(255),
  role: z.enum(['Admin', 'Manager', 'Staff']).default('Staff'),
  status: z.enum(['Active', 'Inactive', 'Locked']).default('Active'),
  mustChangePassword: z.boolean().optional().default(true)
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'New password must be at least 6 characters.')
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    email: z.string().trim().email('Invalid email format.').optional(),
    role: z.enum(['Admin', 'Manager', 'Staff']).optional(),
    status: z.enum(['Active', 'Inactive', 'Locked']).optional(),
    is_locked: z.boolean().optional(),
    isLocked: z.boolean().optional(),
    must_change_password: z.boolean().optional(),
    mustChangePassword: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'No valid update fields provided.'
  });

export const sendEmailSchema = z.object({
  to: emailRecipientSchema,
  subject: z.string().trim().max(300).optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  category: z.string().trim().max(100).optional(),
  smtpConfig: z
    .object({
      host: z.string().trim().optional(),
      port: z.union([z.number(), z.string()]).optional(),
      user: z.string().trim().optional(),
      pass: z.string().optional(),
      senderName: z.string().trim().optional()
    })
    .optional()
    .nullable()
});

export const copilotChatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty.')
    .max(8000, 'Message exceeds maximum length (8000 characters).'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'model']),
        content: z.string()
      })
    )
    .max(20)
    .optional(),
  userContext: z
    .object({
      name: z.string().optional(),
      role: z.string().optional()
    })
    .passthrough()
    .optional(),
  currentPath: z.string().max(300).optional()
});

export const generateDestinationSchema = z.object({
  query: z.string().trim().min(1, 'query is required.').max(250),
  type: z.enum(['country', 'city', 'object'], {
    error: 'type must be one of: country, city, object.'
  }),
  context: z.string().max(2000).optional()
});

export const auditEntitySchema = z.object({
  prompt: z.string().trim().min(1, 'prompt is required.').max(20000),
  entity: z.any().optional(),
  type: z.string().optional()
});

export const parseItineraryPdfSchema = z.object({
  pdfBase64: z.string().min(10, 'pdfBase64 is required in request body.'),
  fileName: z.string().max(255).optional(),
  prompt: z.string().max(20000).optional()
});

export const parseFormFileSchema = z.object({
  fileBase64: z.string().min(10, 'File payload (fileBase64) is required.'),
  mimeType: z.string().max(100).optional(),
  fileName: z.string().max(255).optional(),
  staffList: z.array(z.any()).optional()
});

export const biInsightsSchema = z.object({
  snapshot: z.record(z.string(), z.any(), {
    error: 'BI snapshot payload is required.'
  })
});

export const parseCorporateExcelSchema = z.object({
  fileName: z.string().max(255).optional(),
  sheetName: z.string().max(120).optional(),
  totalRows: z.number().int().min(1).max(50000).optional(),
  previewRows: z
    .array(z.array(z.any()))
    .min(1, 'File Excel kosong atau tidak memiliki baris data.')
    .max(60, 'Preview rows melebihi batas maksimal 60 baris.')
});

export const parseFlightReservationSchema = z
  .object({
    textInput: z.string().max(25000).optional(),
    fileBase64: z.string().optional(),
    mimeType: z.string().max(100).optional(),
    fileName: z.string().max(255).optional()
  })
  .refine(
    (data) =>
      Boolean(data.textInput && data.textInput.trim().length > 0) ||
      Boolean(data.fileBase64 && data.fileBase64.trim().length > 10),
    { message: 'Masukkan teks reservasi atau unggah screenshot/PDF terlebih dahulu.' }
  );

export function formatZodError(error) {
  if (!error?.issues?.length) return 'Invalid request payload.';
  return error.issues
    .map((issue) => {
      const pathStr = issue.path?.length ? `${issue.path.join('.')}: ` : '';
      return `${pathStr}${issue.message}`;
    })
    .join('; ');
}

export function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: formatZodError(parsed.error),
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message
        }))
      });
    }
    req.body = parsed.data;
    return next();
  };
}
