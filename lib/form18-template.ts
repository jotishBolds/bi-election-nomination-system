// lib/form18-template.ts
// Shared FORM-18 HTML template for PDF generation across all dashboard panels
// This template matches the form-preview.tsx layout used during nomination flow

export interface Form18Data {
  applicationNo?: string;
  candidateName: string;
  fatherHusbandName: string;
  address: string;
  dateOfBirth?: string | Date;
  age?: number;
  gender?: string;
  category: string;
  casteTribeName?: string;
  voterSerialNo?: string;
  voterPartNo?: string;
  wardName?: string;
  wardNo?: number;
  ulbName?: string;
  districtName?: string;
  politicalPartyName?: string;
  partySymbolUrl?: string;
  symbolName?: string;
  proposerName?: string;
  proposerSerialNo?: string;
  proposerPartNo?: string;
  submittedAt?: string | Date;
  status?: string;
}

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    GENERAL: "General",
    general: "General",
    SC: "Scheduled Caste",
    sc: "Scheduled Caste",
    ST_BL: "Scheduled Tribe (BL)",
    st_bl: "Scheduled Tribe (BL)",
    ST_LT: "Scheduled Tribe (LT)",
    st_lt: "Scheduled Tribe (LT)",
    OBC_CENTRAL: "OBC (Central List)",
    obc_central: "OBC (Central List)",
    OBC_STATE: "OBC (State List)",
    obc_state: "OBC (State List)",
  };
  return labels[category] || category;
};

/**
 * Generate FORM-18 HTML content for PDF generation.
 * This matches the form-preview.tsx layout used during the nomination flow.
 */
export function generateForm18HTML(data: Form18Data): string {
  const currentDate = data.submittedAt
    ? new Date(data.submittedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  const ulbName = data.ulbName || "";
  const wardName = data.wardName
    ? `Ward ${data.wardNo || ""} - ${data.wardName}`
    : "";
  const partyName = data.politicalPartyName || "Independent";
  const symbolSection = data.partySymbolUrl
    ? `<img src="${data.partySymbolUrl}" alt="${data.symbolName || partyName}" style="width:50px;height:50px;object-fit:contain;border:1px solid #ddd;background:white;padding:4px;border-radius:4px;margin-right:12px;vertical-align:middle;" />`
    : "";

  const categoryLabel = getCategoryLabel(data.category);
  const isReserved =
    data.category &&
    !["GENERAL", "general"].includes(data.category) &&
    data.casteTribeName;

  return `
    <div style="font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.6;color:#000;padding:40px;max-width:100%;background:#fff;">
      <!-- Header -->
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-size:18pt;font-weight:bold;margin:0 0 8px 0;">FORM-18</h1>
        <p style="font-size:10pt;color:#666;margin:0 0 8px 0;">[See sub-rule (3) of rule 25]</p>
        <h2 style="font-size:14pt;font-weight:bold;text-decoration:underline;margin:0 0 8px 0;">NOMINATION PAPER</h2>
        <p style="font-size:11pt;color:#666;margin:0;">Municipality Election 2026</p>
        ${data.applicationNo ? `<p style="font-size:10pt;color:#333;margin:8px 0 0 0;">Application No: <strong>${data.applicationNo}</strong></p>` : ""}
      </div>

      <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;" />

      <!-- Proposer Section -->
      <div style="margin-bottom:24px;">
        <p style="margin:12px 0;">
          * I nominate as a candidate for election to the
          <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:200px;">${ulbName}</span>
          Municipality from the
          <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:150px;">${wardName}</span>
          Municipal ward.
        </p>
        <p style="margin:12px 0;">
          Candidate's name:
          <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:280px;">${data.candidateName}</span>
        </p>
        <p style="margin:12px 0;">
          Father's / Husband's name:
          <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:230px;">${data.fatherHusbandName}</span>
        </p>
        <p style="margin:12px 0;">
          Full postal address:
          <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:300px;">${data.address}</span>
        </p>
        <p style="margin:16px 0;">
          His name is entered at Serial No.
          <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:60px;">${data.voterSerialNo || "___"}</span>
          in Part No.
          <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:60px;">${data.voterPartNo || "___"}</span>
          of electoral roll of the Municipality.
        </p>
        <p style="margin:16px 0;">
          My name is
          <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:120px;">${data.proposerName || "___"}</span>
          and it is entered at Serial No.
          <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:60px;">${data.proposerSerialNo || "___"}</span>
          in Part No.
          <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:60px;">${data.proposerPartNo || "___"}</span>
          of the electoral roll of the Municipality.
        </p>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px;">
          <p style="margin:0;">Date: <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:140px;">${currentDate}</span></p>
          <div style="text-align:center;"><div style="border-top:1px solid #000;width:200px;padding-top:5px;margin-top:30px;"><span style="font-size:10pt;">(Signature of the proposer)</span></div></div>
        </div>
        <p style="font-style:italic;font-size:10pt;margin-top:12px;">* Appropriate particulars of the election to be inserted here.</p>
      </div>

      <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;" />

      <!-- Candidate Declaration -->
      <div style="margin-bottom:24px;">
        <p style="font-weight:500;margin-bottom:16px;">I, the above-mentioned candidate, assent to this nomination and hereby declare:-</p>
        <div style="margin-left:20px;">
          <p style="margin:10px 0;">(a) that I have completed <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:40px;">${data.age || "18"}</span> years of age.</p>
          <p style="margin:10px 0;">(b) that I am set up at this election by <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:180px;">${partyName}</span> Political Party.</p>
          <p style="margin:10px 0;">(c) that the symbols I have chosen are, in order of preference:</p>
          <div style="margin-left:30px;">
            <div style="display:flex;align-items:center;gap:16px;margin:12px 0;padding:12px;background:#f5f5f5;border-radius:6px;">
              ${symbolSection}
              <div>
                <p style="margin:2px 0;">(i) <span style="font-weight:600;">${data.symbolName || partyName}</span></p>
              </div>
            </div>
          </div>
          <p style="margin:10px 0;">(d) that my name and my *father's / husband's name have been correctly spelt out above;</p>
          <p style="margin:10px 0;">(e) that to the best of my knowledge and belief, I am qualified and not also disqualified for being chosen to fill the seat in the <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:200px;">${ulbName}</span> Municipality.</p>
          ${
            isReserved
              ? `<p style="margin:10px 0;">* I further declare that I am a member of the <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:150px;">${data.casteTribeName}</span> caste/tribe, which is a <strong>${categoryLabel}</strong> of the State of Sikkim.</p>`
              : ""
          }
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px;">
          <p style="margin:0;">Date: <span style="border-bottom:1px solid #000;padding:0 8px;font-weight:500;display:inline-block;min-width:140px;">${currentDate}</span></p>
          <div style="text-align:center;"><div style="border-top:1px solid #000;width:200px;padding-top:5px;margin-top:30px;"><span style="font-size:10pt;">(Signature of candidate)</span></div></div>
        </div>
      </div>

      <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;" />

      <!-- Official Use Section -->
      <div style="padding:16px;border:1px solid #ddd;border-radius:6px;background:#fafafa;">
        <p style="font-weight:500;text-align:center;margin-bottom:16px;">(To be filled by the Municipality Returning Officer)</p>
        <p style="margin:12px 0;">Serial No. of the nomination paper: <span style="border-bottom:1px solid #000;display:inline-block;min-width:150px;">&nbsp;</span></p>
        <p style="margin:12px 0;">This nomination was delivered to me at my office at: <span style="border-bottom:1px solid #000;display:inline-block;min-width:150px;">&nbsp;</span></p>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px;">
          <p style="margin:0;">Date: <span style="border-bottom:1px solid #000;display:inline-block;min-width:120px;">&nbsp;</span></p>
          <p style="font-weight:500;margin:0;">Municipal Returning Officer</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Map API nomination response to Form18Data
 */
export function mapNominationToForm18(nom: any): Form18Data {
  return {
    applicationNo: nom.applicationNo,
    candidateName: nom.candidateName || "",
    fatherHusbandName: nom.fatherHusbandName || "",
    address: nom.address || "",
    dateOfBirth: nom.dateOfBirth,
    age: nom.age,
    gender: nom.gender,
    category: nom.category || "GENERAL",
    casteTribeName: nom.casteTribeName,
    voterSerialNo: nom.voterSerialNo,
    voterPartNo: nom.voterPartNo,
    wardName: nom.ward?.wardName,
    wardNo: nom.ward?.wardNo,
    ulbName: nom.ward?.ulb?.name || nom.ulb?.name,
    districtName: nom.ward?.ulb?.district?.name,
    politicalPartyName:
      nom.politicalParty?.name ||
      (nom.isIndependent ? "Independent" : undefined),
    partySymbolUrl: nom.politicalParty?.symbol?.imagePath
      ? `/election-symbols/${nom.politicalParty.symbol.imagePath}`
      : undefined,
    symbolName: nom.politicalParty?.symbol?.name,
    proposerName: nom.proposers?.[0]?.name,
    proposerSerialNo: nom.proposers?.[0]?.voterSerialNo,
    proposerPartNo: nom.proposers?.[0]?.voterPartNo,
    submittedAt: nom.submittedAt,
    status: nom.status,
  };
}

/**
 * Download FORM-18 PDF for a nomination.
 * Fetches data from API, generates HTML, renders to PDF.
 */
export async function downloadForm18PDF(nominationId: string): Promise<void> {
  const response = await fetch(`/api/nominations/${nominationId}`);
  const result = await response.json();

  if (!result.success || !result.nomination) {
    throw new Error("Failed to fetch nomination data");
  }

  const nom = result.nomination;
  const formData = mapNominationToForm18(nom);
  const html = generateForm18HTML(formData);

  const { default: html2PDF } = await import("jspdf-html2canvas");

  const container = document.createElement("div");
  container.style.width = "794px";
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    await html2PDF(container, {
      jsPDF: {
        unit: "pt",
        format: "a4",
        orientation: "portrait",
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        logging: false,
      },
      imageType: "image/jpeg",
      imageQuality: 0.98,
      margin: {
        top: 40,
        right: 40,
        bottom: 40,
        left: 40,
      },
      autoResize: true,
      output: `FORM-18_${nom.applicationNo || "Nomination"}.pdf`,
    });
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Get FORM-18 HTML content for preview.
 * Fetches data from API and generates HTML without PDF conversion.
 */
export async function getForm18PreviewHTML(
  nominationId: string,
): Promise<string> {
  const response = await fetch(`/api/nominations/${nominationId}`);
  const result = await response.json();

  if (!result.success || !result.nomination) {
    throw new Error("Failed to fetch nomination data");
  }

  const nom = result.nomination;
  const formData = mapNominationToForm18(nom);
  return generateForm18HTML(formData);
}
