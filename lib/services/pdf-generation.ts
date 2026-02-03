// PDF Generation Service for Election Forms
import "server-only";
import crypto from "crypto";
import puppeteer from "puppeteer";
import { db } from "@/lib/db";
import { uploadDocument } from "./document-storage";
import { DocumentType } from "@prisma/client";

// PDF Types based on Election Commission Forms
export const PDFType = {
  FORM_2A: "Form-2A", // Nomination Paper - Municipal Councillor
  FORM_2B: "Form-2B", // Nomination Paper - Reserved Ward
  FORM_4: "Form-4", // List of Validly Nominated Candidates
  FORM_7: "Form-7", // Final List after Withdrawal
} as const;

export type PDFType = (typeof PDFType)[keyof typeof PDFType];

// PDF Status
export const PDFStatus = {
  GENERATED: "GENERATED",
  FAILED: "FAILED",
} as const;

export type PDFStatus = (typeof PDFStatus)[keyof typeof PDFStatus];

interface NominationData {
  applicationNo: string;
  candidateName: string;
  fatherHusbandName: string;
  dateOfBirth: Date;
  age: number;
  gender: string;
  address: string;
  epicNo?: string;
  category: string;
  qualification?: string;
  occupation?: string;
  wardName: string;
  wardNo: number;
  ulbName: string;
  districtName?: string;
  stateName?: string;
  partyName?: string;
  symbolName?: string;
  proposers: Array<{
    name: string;
    epicNo?: string;
    address?: string;
    serialNo: number;
  }>;
  paymentDetails?: {
    transactionId?: string;
    amount: number;
    paymentDate: Date;
  };
  receivedDate?: Date;
  receivedBy?: string;
}

// Form 2A - Nomination Paper Template (Municipal Councillor)
function generateForm2AHtml(data: NominationData): string {
  const proposersHtml = data.proposers
    .map(
      (p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.name}</td>
        <td>${p.epicNo || "N/A"}</td>
        <td>${p.address || "N/A"}</td>
      </tr>
    `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .form-title {
      font-size: 14pt;
      font-weight: bold;
      text-decoration: underline;
      margin: 10px 0;
    }
    .section {
      margin: 15px 0;
    }
    .section-title {
      font-weight: bold;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
    }
    .field {
      margin: 5px 0;
    }
    .field-label {
      font-weight: bold;
    }
    .signature-section {
      margin-top: 30px;
    }
    .signature-box {
      display: inline-block;
      width: 200px;
      text-align: center;
      margin: 20px;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 40px;
      padding-top: 5px;
    }
    .footer {
      position: absolute;
      bottom: 2cm;
      width: 100%;
      text-align: center;
      font-size: 10pt;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80pt;
      color: rgba(200, 200, 200, 0.3);
      z-index: -1;
    }
  </style>
</head>
<body>
  <div class="watermark">OFFICIAL</div>
  
  <div class="header">
    <h2>FORM 2A</h2>
    <p class="form-title">NOMINATION PAPER</p>
    <p>[See Rule 4(1)]</p>
    <p>Election to the ${data.ulbName}</p>
    <p>Ward No. ${data.wardNo} - ${data.wardName}</p>
  </div>

  <div class="section">
    <p class="section-title">PART I - CANDIDATE DETAILS</p>
    <table>
      <tr>
        <td width="40%"><strong>Application Number</strong></td>
        <td>${data.applicationNo}</td>
      </tr>
      <tr>
        <td><strong>Name of Candidate</strong></td>
        <td>${data.candidateName}</td>
      </tr>
      <tr>
        <td><strong>Father's/Husband's Name</strong></td>
        <td>${data.fatherHusbandName}</td>
      </tr>
      <tr>
        <td><strong>Date of Birth</strong></td>
        <td>${data.dateOfBirth.toLocaleDateString("en-IN")}</td>
      </tr>
      <tr>
        <td><strong>Age (Years)</strong></td>
        <td>${data.age}</td>
      </tr>
      <tr>
        <td><strong>Gender</strong></td>
        <td>${data.gender}</td>
      </tr>
      <tr>
        <td><strong>Category</strong></td>
        <td>${data.category}</td>
      </tr>
      <tr>
        <td><strong>Voter ID / EPIC Number</strong></td>
        <td>${data.epicNo || data.epicNo || "N/A"}</td>
      </tr>
      <tr>
        <td><strong>Address</strong></td>
        <td>${data.address}</td>
      </tr>
      <tr>
        <td><strong>Educational Qualification</strong></td>
        <td>${data.qualification || "N/A"}</td>
      </tr>
      <tr>
        <td><strong>Occupation</strong></td>
        <td>${data.occupation || "N/A"}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <p class="section-title">PART II - ELECTION SYMBOL</p>
    <table>
      <tr>
        <td width="40%"><strong>Political Party</strong></td>
        <td>${data.partyName || "Independent"}</td>
      </tr>
      <tr>
        <td><strong>Election Symbol</strong></td>
        <td>${data.symbolName || "To be allotted"}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <p class="section-title">PART III - PROPOSERS</p>
    <p>We, the undersigned, being electors of Ward No. ${data.wardNo} - ${data.wardName}, 
    do hereby propose the name of ${data.candidateName} as a candidate for election.</p>
    <table>
      <thead>
        <tr>
          <th width="10%">Sl. No.</th>
          <th width="30%">Name of Proposer</th>
          <th width="25%">Voter ID Number</th>
          <th width="35%">Address</th>
        </tr>
      </thead>
      <tbody>
        ${proposersHtml}
      </tbody>
    </table>
  </div>

  <div class="section">
    <p class="section-title">DECLARATION BY CANDIDATE</p>
    <p>I, ${data.candidateName}, the above-mentioned candidate, do hereby declare that:</p>
    <ol>
      <li>I am an elector in Ward No. ${data.wardNo} of ${data.ulbName}.</li>
      <li>I have not been convicted of any offence and sentenced to imprisonment.</li>
      <li>I am not disqualified for being chosen as a member under any law for the time being in force.</li>
      <li>The particulars given above are true to the best of my knowledge and belief.</li>
    </ol>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">Signature of Candidate</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Date</div>
    </div>
  </div>

  <div class="footer">
    <p>Generated on: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
    <p>This is a computer-generated document.</p>
  </div>
</body>
</html>
  `;
}

// Form 2B - Receipt for Nomination
function generateForm2BHtml(data: NominationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .form-title {
      font-size: 14pt;
      font-weight: bold;
      text-decoration: underline;
    }
    .receipt-box {
      border: 2px solid #000;
      padding: 20px;
      margin: 20px 0;
    }
    .field {
      margin: 10px 0;
    }
    .signature-section {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 40px;
      padding-top: 5px;
    }
    .stamp-area {
      border: 1px dashed #000;
      width: 100px;
      height: 100px;
      text-align: center;
      line-height: 100px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>FORM 2B</h2>
    <p class="form-title">RECEIPT FOR NOMINATION PAPER</p>
    <p>[See Rule 4(3)]</p>
  </div>

  <div class="receipt-box">
    <p><strong>Receipt No:</strong> ${data.applicationNo}</p>
    <p><strong>Date of Receipt:</strong> ${data.receivedDate?.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) || "N/A"}</p>
    <p><strong>Time of Receipt:</strong> ${data.receivedDate?.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }) || "N/A"}</p>
    
    <hr style="margin: 20px 0;"/>
    
    <p>Received from <strong>${data.candidateName}</strong>, a nomination paper for election 
    to Ward No. <strong>${data.wardNo}</strong> - <strong>${data.wardName}</strong> of 
    <strong>${data.ulbName}</strong>.</p>
    
    <div class="field">
      <strong>Candidate Details:</strong>
      <ul>
        <li>Name: ${data.candidateName}</li>
        <li>Father's/Husband's Name: ${data.fatherHusbandName}</li>
        <li>Address: ${data.address}</li>
      </ul>
    </div>
    
    <div class="field">
      <strong>Security Deposit:</strong>
      <ul>
        <li>Amount: ₹${data.paymentDetails?.amount || 0}</li>
        <li>Transaction ID: ${data.paymentDetails?.transactionId || "N/A"}</li>
        <li>Payment Date: ${data.paymentDetails?.paymentDate?.toLocaleDateString("en-IN") || "N/A"}</li>
      </ul>
    </div>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <div class="stamp-area">Official Seal</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Returning Officer</div>
      <p>${data.receivedBy || ""}</p>
    </div>
  </div>

  <div style="margin-top: 30px; font-size: 10pt;">
    <p><strong>Note:</strong> This receipt acknowledges the receipt of the nomination paper. 
    The validity of the nomination will be determined after scrutiny.</p>
    <p>Scrutiny Date: To be notified</p>
  </div>
</body>
</html>
  `;
}

// Form 4 - List of Validly Nominated Candidates
function generateForm4Html(
  candidates: NominationData[],
  wardInfo: { wardNo: number; wardName: string; ulbName: string },
): string {
  const candidatesHtml = candidates
    .map(
      (c, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${c.candidateName}</td>
        <td>${c.fatherHusbandName}</td>
        <td>${c.address}</td>
        <td>${c.partyName || "Independent"}</td>
        <td>${c.symbolName || "To be allotted"}</td>
      </tr>
    `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4 landscape;
      margin: 1.5cm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .form-title {
      font-size: 14pt;
      font-weight: bold;
      text-decoration: underline;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
    }
    .signature-section {
      margin-top: 40px;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>FORM 4</h2>
    <p class="form-title">LIST OF VALIDLY NOMINATED CANDIDATES</p>
    <p>[See Rule 9]</p>
    <p>Ward No. ${wardInfo.wardNo} - ${wardInfo.wardName}, ${wardInfo.ulbName}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th width="5%">Sl. No.</th>
        <th width="20%">Name of Candidate</th>
        <th width="20%">Father's/Husband's Name</th>
        <th width="25%">Address</th>
        <th width="15%">Party Affiliation</th>
        <th width="15%">Symbol</th>
      </tr>
    </thead>
    <tbody>
      ${candidatesHtml}
    </tbody>
  </table>

  <p style="margin-top: 20px;">Total number of validly nominated candidates: <strong>${candidates.length}</strong></p>

  <div class="signature-section">
    <p>Returning Officer</p>
    <p>${wardInfo.ulbName}</p>
    <p>Date: ${new Date().toLocaleDateString("en-IN")}</p>
  </div>
</body>
</html>
  `;
}

// Form 7 - List of Contesting Candidates
function generateForm7Html(
  candidates: NominationData[],
  wardInfo: { wardNo: number; wardName: string; ulbName: string },
): string {
  const candidatesHtml = candidates
    .map(
      (c, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${c.candidateName}</td>
        <td>${c.fatherHusbandName}</td>
        <td>${c.address}</td>
        <td>${c.partyName || "Independent"}</td>
        <td style="text-align: center;">
          <img src="/election-symbols/${c.symbolName?.toLowerCase().replace(/\s+/g, "-")}.png" 
               alt="${c.symbolName}" style="width: 50px; height: 50px;" />
          <br/>${c.symbolName || "N/A"}
        </td>
      </tr>
    `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4 landscape;
      margin: 1.5cm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .form-title {
      font-size: 16pt;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #000;
      padding: 10px;
      text-align: left;
      vertical-align: middle;
    }
    th {
      background-color: #333;
      color: #fff;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .signature-section {
      margin-top: 40px;
      text-align: right;
    }
    .notice {
      margin-top: 20px;
      padding: 10px;
      border: 1px solid #000;
      background-color: #fff3cd;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>FORM 7</h2>
    <p class="form-title">LIST OF CONTESTING CANDIDATES</p>
    <p>[See Rule 12]</p>
    <p><strong>Ward No. ${wardInfo.wardNo} - ${wardInfo.wardName}</strong></p>
    <p>${wardInfo.ulbName}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th width="5%">Sl. No.</th>
        <th width="18%">Name of Candidate</th>
        <th width="18%">Father's/Husband's Name</th>
        <th width="24%">Address</th>
        <th width="15%">Party Affiliation</th>
        <th width="20%">Election Symbol</th>
      </tr>
    </thead>
    <tbody>
      ${candidatesHtml}
    </tbody>
  </table>

  <p style="margin-top: 20px;"><strong>Total number of contesting candidates: ${candidates.length}</strong></p>

  <div class="notice">
    <strong>Notice:</strong> The polling will be held on the date and time notified by the State Election Commission.
    All voters are requested to exercise their franchise.
  </div>

  <div class="signature-section">
    <p>Returning Officer</p>
    <p>${wardInfo.ulbName}</p>
    <p>Date: ${new Date().toLocaleDateString("en-IN")}</p>
  </div>
</body>
</html>
  `;
}

// Generate PDF from HTML
async function generatePDFFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// Main function to generate nomination PDF
export async function generateNominationPDF(
  nominationId: string,
  pdfType: PDFType,
  generatedBy: string,
): Promise<{ success: boolean; pdf?: any; error?: string }> {
  try {
    // Get nomination data
    const nomination = await db.nominationApplication.findUnique({
      where: { id: nominationId },
      include: {
        applicantProfile: {
          include: {
            voterRecord: true,
          },
        },
        ward: true,
        ulb: true,
        politicalParty: true,
        symbolPreferences: {
          include: { symbol: true },
          orderBy: { preferenceOrder: "asc" },
        },
        proposers: {
          orderBy: { createdAt: "asc" },
        },
        payments: true,
      },
    });

    if (!nomination) {
      return { success: false, error: "Nomination not found" };
    }

    // Prepare data
    const profile = nomination.applicantProfile!;
    const voterRecord = profile.voterRecord;
    const data: NominationData = {
      applicationNo: nomination.applicationNo,
      candidateName: voterRecord?.name ?? nomination.candidateName,
      fatherHusbandName:
        voterRecord?.fatherHusbandName ?? nomination.fatherHusbandName,
      dateOfBirth: voterRecord?.dateOfBirth ?? nomination.dateOfBirth,
      age: voterRecord?.age ?? nomination.age,
      gender: nomination.gender,
      address: voterRecord?.address ?? nomination.address,
      epicNo: voterRecord?.epicNo ?? profile.epicNo,
      category: profile.category,
      qualification: profile.educationLevel ?? undefined,
      occupation: profile.occupation ?? undefined,
      wardName: nomination.ward.wardName,
      wardNo: nomination.ward.wardNo,
      ulbName: nomination.ulb.name,
      partyName: nomination.politicalParty?.name,
      symbolName: nomination.symbolPreferences[0]?.symbol?.name,
      proposers: nomination.proposers.map((p, idx) => ({
        name: p.name,
        epicNo: p.epicNo ?? undefined,
        address: p.address ?? undefined,
        serialNo: idx + 1,
      })),
      paymentDetails: nomination.payments?.[0]
        ? {
            transactionId: nomination.payments[0].transactionId ?? undefined,
            amount: Number(nomination.payments[0].amount),
            paymentDate: nomination.payments[0].completedAt!,
          }
        : undefined,
      receivedDate: nomination.receivedAt ?? undefined,
      receivedBy: undefined, // TODO: Get RO name
    };

    // Generate HTML based on PDF type
    let html: string;
    let fileName: string;

    switch (pdfType) {
      case PDFType.FORM_2A:
        html = generateForm2AHtml(data);
        fileName = `Form2A_${nomination.applicationNo}.pdf`;
        break;
      case PDFType.FORM_2B:
        html = generateForm2BHtml(data);
        fileName = `Form2B_${nomination.applicationNo}.pdf`;
        break;
      default:
        return {
          success: false,
          error: "Unsupported PDF type for single nomination",
        };
    }

    // Generate PDF
    const pdfBuffer = await generatePDFFromHtml(html);

    // Determine document type based on PDF type
    const documentType =
      pdfType === PDFType.FORM_2A
        ? DocumentType.FORM_2A
        : pdfType === PDFType.FORM_2B
          ? DocumentType.FORM_2B
          : DocumentType.OTHER;

    // Upload to storage
    const uploadResult = await uploadDocument({
      nominationId,
      type: documentType,
      file: pdfBuffer,
      originalName: fileName,
      mimeType: "application/pdf",
    });

    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error };
    }

    // Calculate checksum
    const crypto = await import("crypto");
    const checksum = crypto
      .createHash("sha256")
      .update(pdfBuffer)
      .digest("hex");

    // Save PDF record
    const pdf = await db.generatedPDF.create({
      data: {
        nominationId,
        formType: pdfType,
        fileName,
        storagePath: uploadResult.document!.storagePath,
        fileSize: pdfBuffer.length,
        checksum,
        generatedBy,
      },
    });

    return { success: true, pdf };
  } catch (error) {
    console.error("Generate nomination PDF error:", error);
    return { success: false, error: "Failed to generate PDF" };
  }
}

// Generate ward-level PDF (Form 4, Form 7)
export async function generateWardPDF(
  wardId: string,
  pdfType: typeof PDFType.FORM_4 | typeof PDFType.FORM_7,
  generatedBy: string,
): Promise<{ success: boolean; pdf?: any; error?: string }> {
  try {
    // Get ward info
    const ward = await db.ward.findUnique({
      where: { id: wardId },
      include: {
        ulb: true,
      },
    });

    if (!ward) {
      return { success: false, error: "Ward not found" };
    }

    // Get nominations based on PDF type
    const statusFilter =
      pdfType === PDFType.FORM_4
        ? ["ACCEPTED"] // Validly nominated
        : ["CONTESTING"]; // Contesting candidates

    const nominations = await db.nominationApplication.findMany({
      where: {
        wardId,
        status: { in: statusFilter as any },
      },
      include: {
        applicantProfile: {
          include: {
            voterRecord: true,
          },
        },
        ward: true,
        ulb: {
          include: {
            district: {
              include: {
                state: true,
              },
            },
          },
        },
        politicalParty: true,
        symbolPreferences: {
          include: { symbol: true },
          orderBy: { preferenceOrder: "asc" },
        },
        proposers: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { candidateName: "asc" },
    });

    // Prepare data
    const candidatesData: NominationData[] = nominations.map((nom) => {
      const profile = nom.applicantProfile!;
      return {
        applicationNo: nom.applicationNo,
        candidateName: nom.candidateName,
        fatherHusbandName: nom.fatherHusbandName,
        dateOfBirth: nom.dateOfBirth,
        age: nom.age,
        gender: nom.gender,
        address: nom.address,
        epicNo: profile.voterRecord?.epicNo,
        category: nom.category,
        wardName: nom.ward.wardName,
        wardNo: nom.ward.wardNo,
        ulbName: nom.ulb.name,
        districtName: nom.ulb.district.name,
        stateName: nom.ulb.district.state.name,
        partyName: nom.politicalParty?.name,
        symbolName: nom.symbolPreferences[0]?.symbol?.name,
        proposers: nom.proposers.map((p, index) => ({
          name: p.name,
          epicNo: p.epicNo ?? undefined,
          address: p.address ?? undefined,
          serialNo: index + 1,
        })),
      };
    });

    const wardInfo = {
      wardNo: ward.wardNo,
      wardName: ward.wardName,
      ulbName: ward.ulb.name,
    };

    // Generate HTML
    let html: string;
    let fileName: string;

    if (pdfType === PDFType.FORM_4) {
      html = generateForm4Html(candidatesData, wardInfo);
      fileName = `Form4_Ward${ward.wardNo}_${ward.ulb.name}.pdf`;
    } else {
      html = generateForm7Html(candidatesData, wardInfo);
      fileName = `Form7_Ward${ward.wardNo}_${ward.ulb.name}.pdf`;
    }

    // Generate PDF
    const pdfBuffer = await generatePDFFromHtml(html);

    // For ward-level PDFs, we don't associate with a single nomination
    // Store in a general location
    const timestamp = Date.now();
    const storagePath = `ward-reports/${wardId}/${timestamp}_${fileName}`;

    // Calculate checksum
    const checksum = crypto
      .createHash("sha256")
      .update(pdfBuffer)
      .digest("hex");

    // Save PDF record with ward association
    const pdf = await db.generatedPDF.create({
      data: {
        formType: pdfType,
        wardId,
        fileName,
        storagePath,
        fileSize: pdfBuffer.length,
        checksum,
        generatedBy,
      },
    });

    return { success: true, pdf };
  } catch (error) {
    console.error("Generate ward PDF error:", error);
    return { success: false, error: "Failed to generate PDF" };
  }
}

// Get all PDFs for a nomination
export async function getNominationPDFs(nominationId: string) {
  return db.generatedPDF.findMany({
    where: { nominationId },
    orderBy: { generatedAt: "desc" },
  });
}
