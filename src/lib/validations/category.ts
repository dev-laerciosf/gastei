import { z } from "zod/v4";

export const categorySchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio").max(50),
  icon: z.string().default("circle"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor invalida"),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export type CategoryInput = z.infer<typeof categorySchema>;
