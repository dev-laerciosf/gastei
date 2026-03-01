import { z } from "zod/v4";

export const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Formato invalido (YYYY-MM)"),
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Valor deve ser maior que zero"),
  categoryId: z.string().min(1, "Categoria e obrigatoria"),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
