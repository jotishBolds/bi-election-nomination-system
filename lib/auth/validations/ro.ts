import { z } from "zod";

// Schema for POST /api/ro/applications/[id]/send-otp
export const sendROOTPSchema = z.object({
    action: z
        .enum(["RECEIPT_CONFIRMATION", "SCRUTINY", "WITHDRAWAL", "DATA_CORRECTION"])
        .default("RECEIPT_CONFIRMATION"),
});

// Discriminated union for RO Scrutiny action
// Workflow 1: action="START" -> No OTP needed, just transitions status
// Workflow 2: decision present -> Requires OTP and decision (ACCEPTED/REJECTED)
export const roScrutinySchema = z.preprocess((body: any) => {
    if (body && body.action === "START") {
        return { ...body, _flow: "START" };
    }
    return { ...body, _flow: "DECISION" };
}, z.discriminatedUnion("_flow", [
    z.object({
        _flow: z.literal("START"),
        action: z.literal("START"),
    }),
    z.object({
        _flow: z.literal("DECISION"),
        decision: z.enum(["ACCEPTED", "REJECTED"], {
            required_error: "Decision must be ACCEPTED or REJECTED",
        }),
        remarks: z.string().max(500, "Remarks too long").optional(),
        rejectionReasons: z.string().max(1000, "Rejection reasons too long").optional(),
        otp: z
            .string()
            .length(6, "OTP must be exactly 6 digits")
            .regex(/^[0-9]+$/, "OTP must contain only numbers"),
    }),
]));

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
