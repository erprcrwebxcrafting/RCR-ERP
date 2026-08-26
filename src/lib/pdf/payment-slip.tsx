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
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 10,
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
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  tableCellDate: {
    fontSize: 10,
    color: "#334155",
  },
  tableCellDesc: {
    fontSize: 10,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
  },
  tableCellTx: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 3,
  },
  tableCellAmount: {
    fontSize: 10,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
  },
  colDate: { width: "22%" },
  colRef: { width: "48%" },
  colAmount: { width: "30%", textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#eef2ff",
    paddingVertical: 15,
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
  stamp: {
    alignSelf: "flex-end",
    marginTop: 20,
    marginRight: 40,
    width: 140,
    height: 60,
    borderWidth: 3,
    borderColor: "#22c55e",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    transform: "rotate(-10deg)",
    opacity: 0.85,
  },
  stampText: {
    color: "#22c55e",
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 4,
  },
  stampDate: {
    color: "#22c55e",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
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
    marginBottom: -15,
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

export interface PaymentSlipData {
  companyName: string;
  companyAddress?: string;
  entityName: string;
  entityRole: string; // "Labour" or "Supervisor"
  entityPhone?: string;
  entitySite?: string;
  payments: Array<{
    id: string;
    date: Date | string;
    amount: number;
    reason?: string | null;
    transactionId?: string | null;
  }>;
  statementPeriod?: {
    from: Date | string;
    to: Date | string;
  };
  logoStr?: string | null;
  stampStr?: string | null;
}

// Convert string back to Date for formatting
const getFormattedDate = (val: Date | string) => {
  if (typeof val === "string") return formatDate(new Date(val));
  return formatDate(val);
};

const PaymentSlipDocument: React.FC<{ data: PaymentSlipData }> = ({ data }) => {
  const isStatement = data.payments.length > 1 || !!data.statementPeriod;
  const totalAmount = data.payments.reduce((sum, p) => sum + p.amount, 0);

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
            <Text style={styles.slipTitle}>
              {isStatement ? "Payment Statement" : "Payment Receipt"}
            </Text>
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
              <Text style={styles.metaLabel}>Name:</Text>
              <Text style={styles.metaValue}>{data.entityName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Role:</Text>
              <Text style={styles.metaValue}>{data.entityRole}</Text>
            </View>
            {data.entityPhone && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Phone:</Text>
                <Text style={styles.metaValue}>{data.entityPhone}</Text>
              </View>
            )}
          </View>
          <View style={styles.metaColumn}>
            {data.entitySite && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Site:</Text>
                <Text style={styles.metaValue}>{data.entitySite}</Text>
              </View>
            )}
            {data.statementPeriod && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Period:</Text>
                <Text style={styles.metaValue}>
                  {getFormattedDate(data.statementPeriod.from)} to {getFormattedDate(data.statementPeriod.to)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
            <Text style={[styles.tableHeaderCell, styles.colRef]}>Details / Ref</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount Paid (Rs.)</Text>
          </View>
          
          {data.payments.map((p, i) => (
            <View key={p.id || i} style={styles.tableRow}>
              <Text style={[styles.tableCellDate, styles.colDate]}>{getFormattedDate(p.date)}</Text>
              <View style={[styles.colRef]}>
                <Text style={styles.tableCellDesc}>{p.reason || "Advance Payout"}</Text>
                {p.transactionId && (
                  <Text style={styles.tableCellTx}>
                    Tx ID: {p.transactionId}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCellAmount, styles.colAmount]}>
                {p.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          ))}

          {/* Total Row */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL PAID:</Text>
            <Text style={styles.totalAmount}>
              Rs. {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* PAID Stamp (Only for Single Receipts) */}
        {!isStatement && (
          <View style={styles.stamp}>
            <Text style={styles.stampText}>PAID</Text>
            <Text style={styles.stampDate}>{getFormattedDate(data.payments[0]?.date || new Date())}</Text>
          </View>
        )}

        {/* Footer Area with Signatures */}
        <View style={styles.footer} wrap={false}>
          <View style={styles.signaturesContainer}>
            <View style={styles.signatureBox}>
              <View style={{ height: 50 }} />
              <View style={styles.signatureLine}>
                <Text style={styles.signatureText}>Receiver's Signature</Text>
              </View>
            </View>
            <View style={styles.signatureBox}>
              {data.stampStr ? (
                <Image src={data.stampStr} style={styles.signatureImage} />
              ) : (
                <View style={{ height: 50 }} />
              )}
              <View style={styles.signatureLine}>
                <Text style={styles.signatureText}>Authorized Signatory</Text>
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

export async function generatePaymentSlipPdfBuffer(data: PaymentSlipData): Promise<Uint8Array> {
  return renderToBuffer(<PaymentSlipDocument data={data} />);
}
