import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Image } from "@react-pdf/renderer";
import { formatDate } from "../utils";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
    position: "relative",
  },
  watermark: {
    position: "absolute",
    top: "25%",
    left: "15%",
    transform: "rotate(-30deg)",
    opacity: 0.03,
    width: "70%",
  },
  headerBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#4f46e5",
    paddingBottom: 15,
    marginBottom: 25,
  },
  logoContainer: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  companyInfo: {
    flex: 1,
    flexDirection: "column",
  },
  companyName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    letterSpacing: 0.5,
  },
  companySubtext: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 3,
    letterSpacing: 0.2,
  },
  titleBox: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  slipTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  slipDateBox: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  slipDateText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#4338ca",
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 25,
  },
  metaColumn: {
    width: "48%",
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  metaLabel: {
    width: "40%",
    fontSize: 9,
    color: "#64748b",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  metaValue: {
    width: "60%",
    fontSize: 10,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginBottom: 10,
    marginTop: 15,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  tableCellDesc: {
    fontSize: 10,
    color: "#0f172a",
  },
  tableCellAmount: {
    fontSize: 10,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
  },
  colDesc: { width: "40%" },
  colDetails: { width: "30%", textAlign: "right" },
  colAmount: { width: "30%", textAlign: "right" },
  
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#eef2ff",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderTopWidth: 2,
    borderTopColor: "#818cf8",
  },
  totalLabel: {
    width: "70%",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#3730a3",
    textAlign: "right",
    paddingRight: 15,
  },
  totalAmount: {
    width: "30%",
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#312e81",
    textAlign: "right",
  },
  netPendingRow: {
    flexDirection: "row",
    backgroundColor: "#ecfdf5",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: "#10b981",
    borderRadius: 6,
    marginTop: 15,
  },
  netPendingLabel: {
    width: "70%",
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#065f46",
  },
  netPendingAmount: {
    width: "30%",
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: "#065f46",
    textAlign: "right",
  },
  noteText: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 8,
    fontStyle: "italic",
  },
  footer: {
    marginTop: 40,
    paddingHorizontal: 40,
  },
  signaturesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  signatureBox: {
    width: 150,
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 8,
    alignItems: "center",
  },
  signatureImage: {
    width: 120,
    height: 50,
    objectFit: "contain",
    marginBottom: -15, // Negative margin to pull the line up into the stamp
    zIndex: 10,
  },
  signatureText: {
    fontSize: 9,
    color: "#64748b",
    fontFamily: "Helvetica-Bold",
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
});

export interface HajariSlipData {
  companyName: string;
  companyAddress?: string;
  entityName: string;
  entityRole: string; // Category
  entityId: string; // LAB-XXX
  entityPhone?: string;
  entitySite?: string;
  dateOfJoining?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  
  period: {
    from: string;
    to: string;
  };
  
  wageRate: number;
  totalHajari: number;
  earnedAmount: number;
  advancePaid: number;
  previousBalance: number;
  netPayable: number;
  
  logoStr?: string | null;
  stampStr?: string | null;
  attendanceDetails?: Array<{
    date: Date | string;
    hajari: number;
    rate: number;
    earned: number;
  }>;
}

const getFormattedDate = (val: Date | string) => {
  if (!val) return "";
  if (typeof val === "string") return formatDate(new Date(val));
  return formatDate(val);
};

const formatCurrency = (amount: number) => {
  return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const HajariSlipDocument: React.FC<{ data: HajariSlipData }> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark Logo if available */}
        {data.logoStr && (
          <Image src={data.logoStr} style={styles.watermark} />
        )}

        {/* Header */}
        <View style={styles.headerBanner}>
          <View style={{ flexDirection: "row", alignItems: "center", width: "60%" }}>
            {data.logoStr && (
              <Image src={data.logoStr} style={styles.logoContainer} />
            )}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{data.companyName}</Text>
              {data.companyAddress && (
                <Text style={styles.companySubtext}>{data.companyAddress}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.titleBox}>
            <Text style={styles.slipTitle}>HAJARI STATEMENT</Text>
            <View style={styles.slipDateBox}>
              <Text style={styles.slipDateText}>
                Date: {formatDate(new Date())}
              </Text>
            </View>
          </View>
        </View>

        {/* Meta Info */}
        <View style={styles.metaContainer}>
          <View style={styles.metaColumn}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Labour Name:</Text>
              <Text style={styles.metaValue}>{data.entityName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Labour ID:</Text>
              <Text style={styles.metaValue}>{data.entityId}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Category:</Text>
              <Text style={styles.metaValue}>{data.entityRole}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Assigned Site:</Text>
              <Text style={styles.metaValue}>{data.entitySite}</Text>
            </View>
            {data.entityPhone && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Phone:</Text>
                <Text style={styles.metaValue}>{data.entityPhone}</Text>
              </View>
            )}
          </View>
          <View style={styles.metaColumn}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Period:</Text>
              <Text style={styles.metaValue}>
                {getFormattedDate(data.period.from)} - {getFormattedDate(data.period.to)}
              </Text>
            </View>
            {data.dateOfJoining && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Joining Date:</Text>
                <Text style={styles.metaValue}>{data.dateOfJoining}</Text>
              </View>
            )}
            {data.bankName && data.bankName !== "N/A" && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Bank Name:</Text>
                <Text style={styles.metaValue}>{data.bankName}</Text>
              </View>
            )}
            {data.accountNumber && data.accountNumber !== "N/A" && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Account No:</Text>
                <Text style={styles.metaValue}>{data.accountNumber}</Text>
              </View>
            )}
            {data.ifscCode && data.ifscCode !== "N/A" && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>IFSC Code:</Text>
                <Text style={styles.metaValue}>{data.ifscCode}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Hajari & Earnings Details */}
        <Text style={styles.sectionTitle}>Hajari & Earnings Details</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colDetails]}>Details</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount (Rs.)</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={[styles.tableCellDesc, styles.colDesc]}>Current Wage Rate</Text>
            <Text style={[styles.tableCellDesc, styles.colDetails, { color: "#64748b" }]}>-</Text>
            <Text style={[styles.tableCellAmount, styles.colAmount]}>{formatCurrency(data.wageRate)}</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={[styles.tableCellDesc, styles.colDesc]}>Total Hajari Logged</Text>
            <Text style={[styles.tableCellDesc, styles.colDetails, { fontFamily: "Helvetica-Bold" }]}>
              {data.totalHajari} hajari
            </Text>
            <Text style={[styles.tableCellAmount, styles.colAmount, { color: "#64748b" }]}>-</Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Gross Earned Amount</Text>
            <Text style={styles.totalAmount}>Rs. {formatCurrency(data.earnedAmount)}</Text>
          </View>
        </View>

        {/* Daily Attendance Breakdown */}
        {data.attendanceDetails && data.attendanceDetails.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Daily Attendance Breakdown</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "25%" }]}>Date</Text>
                <Text style={[styles.tableHeaderCell, { width: "25%", textAlign: "right" }]}>Hajari</Text>
                <Text style={[styles.tableHeaderCell, { width: "25%", textAlign: "right" }]}>Rate</Text>
                <Text style={[styles.tableHeaderCell, { width: "25%", textAlign: "right" }]}>Earned</Text>
              </View>
              {data.attendanceDetails.map((a, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCellDesc, { width: "25%" }]}>{getFormattedDate(a.date)}</Text>
                  <Text style={[styles.tableCellAmount, { width: "25%", textAlign: "right" }]}>{a.hajari}</Text>
                  <Text style={[styles.tableCellAmount, { width: "25%", textAlign: "right" }]}>{formatCurrency(a.rate)}</Text>
                  <Text style={[styles.tableCellAmount, { width: "25%", textAlign: "right" }]}>{formatCurrency(a.earned)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Payments & Settlement */}
        <Text style={styles.sectionTitle}>Payments & Settlement</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc, { width: "70%" }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount (Rs.)</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={[styles.tableCellDesc, styles.colDesc, { width: "70%" }]}>Previous Balance (Arrears / Pending)</Text>
            <Text style={[styles.tableCellAmount, styles.colAmount]}>{formatCurrency(data.previousBalance)}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCellDesc, styles.colDesc, { width: "70%" }]}>Gross Earned (Current Period)</Text>
            <Text style={[styles.tableCellAmount, styles.colAmount]}>{formatCurrency(data.earnedAmount)}</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={[styles.tableCellDesc, styles.colDesc, { width: "70%" }]}>Total Advance / Payments (Current Period)</Text>
            <Text style={[styles.tableCellAmount, styles.colAmount]}>- {formatCurrency(data.advancePaid)}</Text>
          </View>
        </View>

        <View style={styles.netPendingRow}>
          <Text style={styles.netPendingLabel}>Total Pending Balance (Overall)</Text>
          <Text style={styles.netPendingAmount}>Rs. {formatCurrency(data.netPayable)}</Text>
        </View>
        
        <Text style={styles.noteText}>
          * Note: Total Pending Balance = (Previous Balance + Gross Earned - Total Advance Issued).
        </Text>

        {/* Footer Area with Signatures */}
        <View style={styles.footer} wrap={false}>
          <View style={styles.signaturesContainer}>
            <View style={styles.signatureBox}>
              <View style={{ height: 50 }} /> {/* Spacer for alignment */}
              <View style={styles.signatureLine}>
                <Text style={styles.signatureText}>Employer Signature</Text>
              </View>
            </View>
            <View style={styles.signatureBox}>
              {data.stampStr ? (
                <Image src={data.stampStr} style={styles.signatureImage} />
              ) : (
                <View style={{ height: 50 }} />
              )}
              <View style={styles.signatureLine}>
                <Text style={styles.signatureText}>Labour Signature</Text>
              </View>
            </View>
          </View>

          <View style={styles.footerBottom}>
            <Text style={styles.footerText}>Generated securely by RCR Infrastructure ERP</Text>
            <Text style={styles.footerText}>
              Page <Text render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} />
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export async function generateHajariSlipPdfBuffer(data: HajariSlipData): Promise<Uint8Array> {
  return renderToBuffer(<HajariSlipDocument data={data} />);
}
