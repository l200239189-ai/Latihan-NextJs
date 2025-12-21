'use server';

import { z } from 'zod';
// 1. Import fungsi sql dari postgres untuk akses database
import { sql } from '@vercel/postgres';
// 2. Import revalidatePath dan redirect untuk update cache & navigasi
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // 3. Masukkan data ke Database
  // Kita menggunakan try/catch (opsional di tahap ini tapi praktik yang baik)
  // untuk menangkap error jika database gagal.
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  // 4. Revalidate Path
  // Ini memberitahu Next.js untuk menghapus cache halaman invoices
  // agar data baru (yang barusan di-insert) langsung muncul.
  revalidatePath('/dashboard/invoices');

  // 5. Redirect
  // Kembalikan user ke halaman daftar invoice
  redirect('/dashboard/invoices');
}