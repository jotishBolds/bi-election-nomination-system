import { z } from "zod";

// Schema for POST /api/ro/applications/[id]/send-otp
export const sendROOTPSchema = z.object({
    action: z
        .enum(["RECEIPT_CONFIRMATION", "SCRUTINY", "WITHDRAWAL", "DATA_CORRECTION"])
        .default("RECEIPT_CONFIRMATION"),
});

// Enhanced schema for POST /api/ro/applications/[id]/scrutiny with 4 actions
export const roScrutinySchema = z.discriminatedUnion("action", [
    // START - Initialize scrutiny
    z.object({
        action: z.literal("START"),
    }),
    
    // SAVE_CHECKLIST - Save progress (partial completion allowed)
    // z.object({
    //     action: z.literal("SAVE_CHECKLIST"),
    //     responses: z.array(z.object({
    //         itemId: z.string().uuid("Invalid item ID"),
    //         isFulfilled: z.boolean(),
    //         notes: z.string().max(1000, "Notes too long").optional(),
    //     })),
    // }),
    
    // // VIEW_DOCUMENT - Track viewing
    // z.object({
    //     action: z.literal("VIEW_DOCUMENT"),
    //     documentId: z.string().uuid("Invalid document ID"),
    // }),
    
    // COMPLETE - Final decision
    z.object({
        action: z.literal("COMPLETE"),
        decision: z.enum(["ACCEPTED", "REJECTED"], {
            message: "Decision must be ACCEPTED or REJECTED",
        }),
        symbolId: z.string().uuid("Invalid symbol ID").optional(),
        otp: z
            .string()
            .length(6, "OTP must be exactly 6 digits")
            .regex(/^[0-9]+$/, "OTP must contain only numbers"),
    }),
]);

// Schema for POST /api/ro/applications/[id]/withdraw
export const roWithdrawalSchema = z.object({
    reason: z.string().min(5, "Please provide a valid reason for withdrawal"),
    otp: z
        .string()
        .length(6, "OTP must be exactly 6 digits")
        .regex(/^[0-9]+$/, "OTP must contain only numbers"),
});

export type SendROOTPInput = z.infer<typeof sendROOTPSchema>;
export type ROScrutinyInput = z.infer<typeof roScrutinySchema>;
export type ROWithdrawalInput = z.infer<typeof roWithdrawalSchema>;
