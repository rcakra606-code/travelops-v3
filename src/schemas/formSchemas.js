import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi.')
    .email('Format alamat email tidak valid.'),
  password: z
    .string()
    .min(1, 'Password wajib diisi.')
});

export const overtimeFormSchema = z.object({
  staff: z.string().trim().min(1, 'Nama staff wajib dipilih.'),
  eventName: z.string().trim().min(2, 'Nama kegiatan/event minimal 2 karakter.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid (YYYY-MM-DD).'),
  hours: z.coerce
    .number({ error: 'Jam lembur harus berupa angka.' })
    .positive('Jam lembur harus lebih dari 0.')
    .max(24, 'Jam lembur maksimal 24 jam per entri.'),
  status: z.enum(['Pending', 'Approved', 'Rejected']).default('Pending'),
  remarks: z.string().max(1000).optional().default('')
});

export const trackingLookupSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Masukkan kode booking, nomor invoice, atau nomor resi.')
    .max(100, 'Kode tracking terlalu panjang.')
    .regex(/^[a-zA-Z0-9_\-. ]+$/, 'Kode tracking mengandung karakter tidak valid.')
});
