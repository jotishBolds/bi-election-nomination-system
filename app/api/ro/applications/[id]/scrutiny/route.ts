import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { requireRoles } from "@/lib/auth/auth-guard";
import { getClientIP } from "@/lib/auth/server-utils";
import { scrutinizeNominationWithROOTP } from "@/lib/services/ro";
import { roScrutinySchema } from "@/lib/auth/validations/ro";

// POST /api/ro/applications/[id]/scrutiny - Enhanced scrutiny actions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRoles([Role.RO, Role.SES, Role.SUPER_ADMIN]);
    const { id: nominationId } = await params;

    const body = await request.json().catch(() => ({}));
    const validation = roScrutinySchema.safeParse(body);

    if (!validation.success) {
      const issue = validation.error.issues[0];
      const field = issue.path.join(".");
      return NextResponse.json(
        { success: false, error: `${field}: ${issue.message}` },
        { status: 400 },
      );
    }

    const data = validation.data;
    const ip = getClientIP(request);

    // Handle START action (No OTP needed)
    if (data.action === "START") {
      const application = await db.nominationApplication.findUnique({
        where: { id: nominationId },
      });

      if (!application) {
        return NextResponse.json(
          { success: false, error: "Application not found" },
          { status: 404 },
        );
      }

      if (
        application.status === "SUBMITTED" ||
        application.status === "RECEIVED"
      ) {
        await db.nominationApplication.update({
          where: { id: nominationId },
          data: { status: "UNDER_SCRUTINY" },
        });

        // COMMENTED: Checklist response creation - DISABLED
        // Create checklist responses for all active items
        // const activeElection = await db.electionConfig.findFirst({
        //   where: { isActive: true },
        //   include: {
        //     checklistItems: {
        //       where: { isActive: true },
        //       orderBy: { displayOrder: 'asc' }
        //     }
        //   }
        // });

        // if (activeElection && activeElection.checklistItems && activeElection.checklistItems.length > 0) {
        //   await db.checklistResponse.createMany({
        //     data: activeElection.checklistItems.map(item => ({
        //       nominationId,
        //       itemId: item.id,
        //       isFulfilled: false,
        //       createdBy: session.user.id
        //     })),
        //     skipDuplicates: true
        //   });
        // }
      }

      return NextResponse.json({
        success: true,
        message: "Scrutiny started",
      });
    }

    // COMMENTED: SAVE_CHECKLIST action - DISABLED
    // if (data.action === "SAVE_CHECKLIST") {
    //   const { responses } = data;

    //   // Update each response (partial completion allowed)
    //   for (const response of responses) {
    //     try {
    //       await db.checklistResponse.upsert({
    //         where: {
    //           nominationId_itemId: {
    //             nominationId,
    //             itemId: response.itemId
    //           }
    //         },
    //         update: {
    //           isFulfilled: response.isFulfilled,
    //           notes: response.notes,
    //           fulfilledAt: response.isFulfilled ? new Date() : null,
    //         },
    //         create: {
    //           nominationId,
    //           itemId: response.itemId,
    //           isFulfilled: response.isFulfilled,
    //           notes: response.notes,
    //           fulfilledAt: response.isFulfilled ? new Date() : null,
    //           createdBy: session.user.id
    //         }
    //       });
    //     } catch (upsertError: unknown) {
    //       console.error(`Failed to save response for item ${response.itemId}:`, upsertError);
          
    //       // Check if it's a foreign key error
    //       if (upsertError instanceof Error && 'code' in upsertError && (upsertError as { code: string }).code === 'P2003') {
    //         return NextResponse.json({
    //           success: false,
    //           error: `Invalid checklist item ID: ${response.itemId}. Please ensure scrutiny has been started and item exists.`
    //         }, { status: 400 });
    //       }
          
    //       throw upsertError; // Re-throw other errors
    //     }
    //   }

    //   return NextResponse.json({
    //     success: true,
    //     message: "Checklist saved successfully",
    //   });
    // }

    // COMMENTED: VIEW_DOCUMENT action - DISABLED
    // if (data.action === "VIEW_DOCUMENT") {
    //   const { documentId } = data;

    //   try {
    //     // Check if document exists for this nomination
    //     const document = await db.document.findFirst({
    //       where: {
    //         id: documentId,
    //         nominationId: nominationId
    //       }
    //     });

    //     if (!document) {
    //       return NextResponse.json({
    //         success: false,
    //         error: `Document ID: ${documentId} not found for this nomination.`
    //       }, { status: 404 });
    //     }

    //     // Check if already viewed
    //     const existingView = await db.documentViewTracking.findFirst({
    //       where: {
    //         documentId,
    //         nominationId,
    //         viewedBy: session.user.id
    //       }
    //     });

    //     if (existingView) {
    //       return NextResponse.json({
    //         success: true,
    //         message: "Document already viewed",
    //         data: {
    //           viewedAt: existingView.viewedAt,
    //           ipAddress: existingView.ipAddress
    //         }
    //       });
    //     }

    //     // Record document viewing
    //     await db.documentViewTracking.create({
    //       data: {
    //         documentId,
    //         nominationId,
    //         viewedBy: session.user.id,
    //         viewedAt: new Date(),
    //         ipAddress: ip
    //       }
    //     });

    //     return NextResponse.json({
    //       success: true,
    //       message: "Document viewing recorded",
    //     });
    //   } catch (docError: unknown) {
    //     console.error(`Failed to record document viewing for ${documentId}:`, docError);
        
    //     // Check if it's a foreign key error
    //     if (docError instanceof Error && 'code' in docError && (docError as { code: string }).code === 'P2003') {
    //       return NextResponse.json({
    //         success: false,
    //         error: `Invalid document ID: ${documentId}. Please ensure the document exists for this nomination.`
    //       }, { status: 400 });
    //     }
        
    //     throw docError; // Re-throw other errors
    //   }
    // }

    // Handle COMPLETE action
    if (data.action === "COMPLETE") {
      const { decision, otp } = data;

      // Call the service with OTP verification if RO
      let result;
      if (session.user.role === Role.RO) {
        result = await scrutinizeNominationWithROOTP({
          nominationId,
          roUserId: session.user.id,
          decision,
          ipAddress: ip,
          otp,
        });
      } else {
        return NextResponse.json(
          { success: false, error: "Currently only RO can perform scrutiny via this flow" },
          { status: 403 },
        );
      }

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 },
        );
      }

      // Store remarks appropriately
      // if (decision === "REJECTED") {
      //   await db.nominationApplication.update({
      //     where: { id: nominationId },
      //     data: {
      //       rejectionReasons: remarks, // Specific rejection reasons
      //       scrutinyRemarks: remarks    // General remarks
      //     }
      //   });
      // } else {
      //   await db.nominationApplication.update({
      //     where: { id: nominationId },
      //     data: {
      //       scrutinyRemarks: remarks    // General remarks only
      //     }
      //   });
      // }

      return NextResponse.json({
        success: true,
        data: result.nomination,
        message: `Application ${decision.toLowerCase()} successfully`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error: unknown) {
    console.error("Error processing scrutiny:", error);
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to process scrutiny" },
      { status: 500 },
    );
  }
}

// GET /api/ro/applications/[id]/scrutiny - Get enhanced scrutiny details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRoles([Role.RO, Role.SES, Role.SUPER_ADMIN]);
    const { id } = await params;

    // Get application with basic data
    const application = await db.nominationApplication.findUnique({
      where: { id },
      include: {
        applicantProfile: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, email: true },
            },
          },
        },
        ward: {
          select: { id: true, wardNo: true, wardName: true, reservationType: true },
        },
        politicalParty: {
          select: { name: true, abbreviation: true },
        },
        documents: true,
        scrutinizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 },
      );
    }

    // COMMENTED: Get active election checklist items - DISABLED
    // const activeElection = await db.electionConfig.findFirst({
    //   where: { isActive: true },
    //   include: {
    //     checklistItems: {
    //       where: { isActive: true },
    //       orderBy: { displayOrder: 'asc' },
    //       select: {
    //         id: true,
    //         title: true,
    //         description: true,
    //         category: true,
    //         displayOrder: true,
    //         isRequired: true,
    //       }
    //     }
    //   }
    // });

    // const checklistItems = activeElection?.checklistItems || [];

    return NextResponse.json({
      success: true,
      data: {
        application: {
          id: application.id,
          applicationNo: application.applicationNo,
          status: application.status,
          candidateName: application.candidateName,
          scrutinyDate: application.scrutinyDate,
          scrutinizedBy: application.scrutinizedBy,
          applicantProfile: application.applicantProfile,
          ward: application.ward,
          politicalParty: application.politicalParty,
          documents: application.documents,
          scrutinizer: application.scrutinizer,
        },
        // checklistItems,
        // checklistResponses: application.checklistResponses,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    console.error("Error processing scrutiny request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 },
    );
  }
}
