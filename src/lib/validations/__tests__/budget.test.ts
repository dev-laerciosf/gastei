import { describe, it, expect } from "vitest";
import { budgetSchema } from "@/lib/validations/budget";

describe("budgetSchema", () => {
  it("accepts valid budget", () => {
    const result = budgetSchema.safeParse({
      month: "2026-03",
      amount: "500.00",
      categoryId: "cat-123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid month format", () => {
    const result = budgetSchema.safeParse({
      month: "March 2026",
      amount: "500.00",
      categoryId: "cat-123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = budgetSchema.safeParse({
      month: "2026-03",
      amount: "0",
      categoryId: "cat-123",
    });
    expect(result.success).toBe(false);
  });
});
