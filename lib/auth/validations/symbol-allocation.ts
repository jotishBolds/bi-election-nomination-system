import { z } from "zod";

export const allocateSymbolSchema = z.object({
  symbolId: z.string().uuid("Invalid symbol ID"),
});
