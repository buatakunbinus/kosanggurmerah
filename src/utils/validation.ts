import { z, ZodIssue } from "zod";

export const paymentRecordSchema = z.object({
  amount_paid: z.number().min(0, "Amount must be >= 0"),
  payment_date: z
    .string()
    .refine((v: string) => /\d{4}-\d{2}-\d{2}/.test(v), "Invalid date"),
  method: z.enum(["cash", "transfer", "other"]),
});
export type PaymentRecordInput = z.infer<typeof paymentRecordSchema>;

export const expenseCreateSchema = z.object({
  date: z
    .string()
    .refine((v: string) => /\d{4}-\d{2}-\d{2}/.test(v), "Invalid date"),
  category: z.enum([
    "electricity", // Listrik
    "water", // Air
    "cleaning_fee", // Iuran Kebersihan
    "security_fee", // Iuran Keamanan
    "property_tax", // PBB
    "salary", // Gaji
    "mother_deposit", // Setoran Mak
    "dividend_expense", // Kebutuhan Lain (Dividen)
  ]),
  amount: z.number().min(0, "Amount must be >= 0"),
  notes: z.string().max(300, "Max 300 chars").optional().or(z.literal("")),
});
export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;

export const roomCreateSchema = z.object({
  number: z.string().min(1, "Room number required").max(10, "Max 10 chars"),
  rent_price: z.number().min(0, "Rent must be >= 0"),
  status: z.enum(["occupied", "vacant"]),
  tenant_name: z.string().max(100, "Max 100 chars").nullable(),
  due_day: z.number().int().min(1, "Due day 1-31").max(31, "Due day 1-31"),
});
export type RoomCreateInput = z.infer<typeof roomCreateSchema>;

export const penaltyCreateSchema = z
  .object({
    room_id: z.string().min(1, "Room required"),
    type: z.enum(["overnight_guest", "late_payment", "custom"]),
    custom_description: z
      .string()
      .max(120, "Max 120 chars")
      .optional()
      .or(z.literal("")),
    amount: z.number().positive("Amount > 0"),
    incident_date: z
      .string()
      .refine((v: string) => /\d{4}-\d{2}-\d{2}/.test(v), "Invalid date"),
    notes: z.string().max(300, "Max 300 chars").optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.type === "custom" && !data.custom_description) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Description required for custom penalty",
        path: ["custom_description"],
      });
    }
  });
export type PenaltyCreateInput = z.infer<typeof penaltyCreateSchema>;

export function safeParse<T extends z.ZodTypeAny>(schema: T, data: unknown) {
  const res = schema.safeParse(data);
  if (!res.success) {
    const message = res.error.issues.map((i: ZodIssue) => i.message).join("; ");
    return { success: false as const, message };
  }
  return { success: true as const, data: res.data as z.infer<T> };
}
