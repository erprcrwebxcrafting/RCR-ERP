import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Image, Font } from "@react-pdf/renderer";
import fs from "fs";
import path from "path";

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#111827",
    paddingBottom: 110,
  },
  towerPage: {
    padding: 20,
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: "#111827",
    paddingBottom: 110,
  },
  landscapePage: {
    padding: 20,
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: "#111827",
    paddingBottom: 110,
  },
  headerBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#4f46e5",
    paddingBottom: 6,
    marginBottom: 6,
  },
  logoContainer: {
    width: 48,
    height: 48,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5",
  },
  companySubtext: {
    fontSize: 7,
    color: "#6b7280",
    marginTop: 1,
  },
  sheetTitleBox: {
    alignItems: "flex-end",
    justifyContent: "center",
    width: "35%",
  },
  sheetTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5",
    textTransform: "uppercase",
  },
  metaBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 3,
    borderLeftColor: "#4f46e5",
    borderRadius: 3,
    padding: 6,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaLeftCol: {
    width: "58%",
    paddingRight: 6,
  },
  metaRightCol: {
    width: "42%",
    paddingLeft: 6,
    borderLeftWidth: 1,
    borderLeftColor: "#e2e8f0",
    justifyContent: "space-between",
  },
  metaBadge: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  metaClientName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#0f172a",
    marginBottom: 1,
  },
  metaProjectName: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    marginBottom: 1,
  },
  metaAddress: {
    fontSize: 6.5,
    color: "#64748b",
    lineHeight: 1.2,
  },
  metaGst: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    marginTop: 1,
  },
  metaInvoiceBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    borderWidth: 0.5,
    borderColor: "#c7d2fe",
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    marginBottom: 2,
  },
  metaInvoiceLabel: {
    fontSize: 6.5,
    color: "#4338ca",
    fontFamily: "Helvetica-Bold",
  },
  metaInvoiceVal: {
    fontSize: 7.5,
    color: "#312e81",
    fontFamily: "Helvetica-Bold",
  },
  metaDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  metaDetailLabel: {
    fontSize: 6.5,
    color: "#64748b",
    fontFamily: "Helvetica",
  },
  metaDetailVal: {
    fontSize: 6.5,
    color: "#1e293b",
    fontFamily: "Helvetica-Bold",
  },
  table: { width: "100%", borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#cbd5e1" },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    minHeight: 18,
    alignItems: "center",
  },
  th: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f8fafc",
    color: "#1e293b",
    fontSize: 7.5,
    borderRightWidth: 1,
    borderColor: "#cbd5e1",
    justifyContent: "center",
  },
  td: {
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    fontSize: 7.5,
    borderRightWidth: 1,
    borderColor: "#cbd5e1",
    justifyContent: "center",
  },

  // Optimized compact styles for Tower Work Items (up to 20 rows on single page)
  towerTr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    minHeight: 13,
    alignItems: "center",
  },
  towerTh: {
    paddingVertical: 2,
    paddingHorizontal: 2.5,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    borderRightWidth: 1,
    borderColor: "#cbd5e1",
    justifyContent: "center",
  },
  towerTd: {
    paddingVertical: 1.5,
    paddingHorizontal: 2.5,
    fontSize: 6.5,
    borderRightWidth: 1,
    borderColor: "#cbd5e1",
    justifyContent: "center",
  },

  trTotal: {
    backgroundColor: "#f1f5f9",
    fontFamily: "Helvetica-Bold",
  },
});

function formatINR(num: number) {
  return "Rs. " + (num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNum(num: number) {
  return (num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PageHeader({ title, site, bill, logoStr, settings }: { title: string; site: any; bill: any; logoStr: string | null; settings?: any }) {
  const billDate = bill?.billDate ? new Date(bill.billDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN");
  return (
    <View style={{ marginBottom: 6 }} fixed>
      <View style={styles.headerBanner}>
        <View style={{ flexDirection: "row", alignItems: "center", width: "65%" }}>
          {logoStr && <Image src={logoStr} style={styles.logoContainer} />}
          <View style={styles.headerTextContainer}>
            <Text style={styles.companyName}>{settings?.companyName || "RCR ENTERPRISES"}</Text>
            <Text style={styles.companySubtext}>GST NO: {site?.gstNo || "27AAJFN6629D1Z5"} | CONCRETE & REINFORCEMENT WORK</Text>
            <Text style={{ fontSize: 6.5, color: "#4f46e5", marginTop: 1, fontFamily: "Helvetica-Bold" }}>
              {[
                settings?.phone && `Ph: ${settings.phone}`,
                settings?.email && `Email: ${settings.email}`,
                settings?.website && `Web: ${settings.website}`
              ].filter(Boolean).join("  |  ")}
            </Text>
          </View>
        </View>
        <View style={styles.sheetTitleBox}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Text style={styles.companySubtext}>Date: {billDate}</Text>
        </View>
      </View>
      
      <View style={styles.metaBox}>
        <View style={styles.metaLeftCol}>
          <Text style={styles.metaBadge}>BILLED TO / CLIENT</Text>
          <Text style={styles.metaClientName}>{site?.client?.name?.toUpperCase() || "CLIENT"}</Text>
          <Text style={styles.metaProjectName}>Project: {site?.projectName || "—"}</Text>
          {site?.address && <Text style={styles.metaAddress}>{site.address}</Text>}
          {site?.gstNo && <Text style={styles.metaGst}>Client GSTIN: {site.gstNo}</Text>}
        </View>

        <View style={styles.metaRightCol}>
          <View style={styles.metaInvoiceBadgeRow}>
            <Text style={styles.metaInvoiceLabel}>INVOICE NO:</Text>
            <Text style={styles.metaInvoiceVal}>{bill?.billNo || "001"}</Text>
          </View>
          
          <View style={styles.metaDetailRow}>
            <Text style={styles.metaDetailLabel}>W.O. No:</Text>
            <Text style={styles.metaDetailVal}>{site?.workOrderNo || "—"}</Text>
          </View>
          
          <View style={styles.metaDetailRow}>
            <Text style={styles.metaDetailLabel}>Ref No:</Text>
            <Text style={styles.metaDetailVal}>{bill?.refNo || "01"}</Text>
          </View>

          <View style={styles.metaDetailRow}>
            <Text style={styles.metaDetailLabel}>Bill Date:</Text>
            <Text style={styles.metaDetailVal}>{billDate}</Text>
          </View>
          {bill?.periodLabel && (
            <View style={styles.metaDetailRow}>
              <Text style={styles.metaDetailLabel}>Period:</Text>
              <Text style={styles.metaDetailVal}>{bill.periodLabel}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function PageFooter({ signStr, settings, hideSeal }: { signStr: string | null; settings?: any; hideSeal?: boolean }) {
  return (
    <>
      {!hideSeal && (
        <View fixed style={{ position: "absolute", bottom: 42, right: 24, width: 130, alignItems: "center" }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7, color: "#111827" }}>FOR {settings?.companyName?.toUpperCase() || "RCR ENTERPRISES"}</Text>
          {signStr ? <Image src={signStr} style={{ width: 75, height: 32, marginVertical: 2, objectFit: 'contain' }} /> : <View style={{ height: 32, marginVertical: 2 }} />}
          <Text style={{ fontSize: 6.5, color: "#374151", fontFamily: "Helvetica-Bold" }}>AUTHORISED SIGNATORY</Text>
        </View>
      )}

      <View fixed style={{ position: "absolute", bottom: 12, left: 24, right: 24, height: 20, backgroundColor: "#4f46e5", borderRadius: 3, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12 }}>
        <Text style={{ color: "#ffffff", fontSize: 6.5 }}>{settings?.address || "Office No- 04, Raipada, Nr. Anand Gaushalla, Chandansar Road, Virar (E) - 401305"}</Text>
        <Text style={{ color: "#ffffff", fontSize: 6.5, fontFamily: "Helvetica-Bold" }} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} />
      </View>
    </>
  );
}

type LegendItem = { short: string; full: string; colorDot?: string };

function LegendFooter({ items, isLandscape }: { items?: LegendItem[]; isLandscape?: boolean }) {
  if (!items || items.length === 0) return null;
  return (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 38,
        left: isLandscape ? 20 : 24,
        right: isLandscape ? 20 : 165,
        padding: 4,
        backgroundColor: "#f8fafc",
        borderRadius: 3,
        borderLeftWidth: 2.5,
        borderLeftColor: "#4f46e5",
        borderWidth: 0.5,
        borderColor: "#e2e8f0",
      }}
    >
      <Text style={{ fontSize: 5.8, color: "#475569", fontFamily: "Helvetica-Bold", marginBottom: 1 }}>* COLOR KEY & COLUMN LEGEND</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {items.map((item, idx) => (
          <Text key={idx} style={{ fontSize: 5.8, color: "#64748b", marginRight: 6, marginBottom: 0.5 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", color: item.colorDot || "#334155" }}>{item.short}</Text> = {item.full}
          </Text>
        ))}
      </View>
    </View>
  );
}

function getBuildingWorkAmounts(b: any, runningBill?: any) {
  const workItems = b.workItems || [];
  let prevA = workItems.reduce((s: number, i: any) => s + ((i.previousAmt !== undefined && i.previousAmt !== null) ? Number(i.previousAmt) : (Number(i.previousQty || 0) * Number(i.rate || 0))), 0);
  let currA = workItems.reduce((s: number, i: any) => s + ((i.currentAmt !== undefined && i.currentAmt !== null) ? Number(i.currentAmt) : (Number(i.currentQty || 0) * Number(i.rate || 0))), 0);

  if (prevA === 0 && currA === 0) {
    if (b.bLines && b.bLines.length > 0) {
      prevA = b.bLines.reduce((s: number, l: any) => s + Number(l.previousAmount || 0), 0);
      currA = b.bLines.reduce((s: number, l: any) => s + Number(l.currentAmount || 0), 0);
    } else if (b.billLineTotal && b.billLineTotal > 0) {
      currA = Number(b.billLineTotal);
    } else if (runningBill?.lines && runningBill.lines.length > 0) {
      const matched = runningBill.lines.filter((l: any) => l.buildingId === b.id);
      prevA = matched.reduce((s: number, l: any) => s + Number(l.previousAmount || 0), 0);
      currA = matched.reduce((s: number, l: any) => s + Number(l.currentAmount || 0), 0);
    }
  }

  return { prevA, currA, cumA: prevA + currA };
}

function TaxInvoice({ data, logoStr, signStr }: any) {
  const { site, runningBill, towers, supplyEntries } = data;
  let taxableTowerWork = 0;
  for (const b of towers) {
    const { currA } = getBuildingWorkAmounts(b, runningBill);
    taxableTowerWork += currA;
  }
  
  const currentSupplyEntries = (supplyEntries || []).filter((e: any) => 
    e.runningBillId === runningBill?.id || 
    (!runningBill && !e.runningBillId) || 
    (!e.runningBillId && (!runningBill || (supplyEntries.filter((x: any) => x.runningBillId === runningBill?.id).length === 0)))
  );
  const supplyTotal = currentSupplyEntries.reduce((s: number, e: any) => s + (e.totalAmount || 0), 0);
  const currentTotal = taxableTowerWork + supplyTotal;

  const cgstPct = runningBill?.cgstPct ?? site?.cgstPct ?? 9;
  const sgstPct = runningBill?.sgstPct ?? site?.sgstPct ?? 9;
  const cgstAmt = currentTotal * (cgstPct / 100);
  const sgstAmt = currentTotal * (sgstPct / 100);
  const netPayable = currentTotal + cgstAmt + sgstAmt;

  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="TAX INVOICE" site={site} bill={runningBill} logoStr={logoStr} settings={data.settings} />
      
      <View style={styles.table}>
        <View style={styles.tr}>
          <Text style={[styles.th, { width: "10%", backgroundColor: "#f1f5f9" }]}>Sr.</Text>
          <Text style={[styles.th, { width: "65%", backgroundColor: "#f1f5f9" }]}>Particulars / Work Description</Text>
          <Text style={[styles.th, { width: "25%", textAlign: "right", backgroundColor: "#f1f5f9" }]}>Amount (Rs.)</Text>
        </View>

        {towers.map((b: any, idx: number) => {
          const { currA } = getBuildingWorkAmounts(b, runningBill);
          return (
            <View style={styles.tr} key={b.id}>
              <Text style={[styles.td, { width: "10%" }]}>{idx + 1}</Text>
              <Text style={[styles.td, { width: "65%" }]}>{site?.projectName} - {b.name} Reinforcement & Civil Work Done</Text>
              <Text style={[styles.td, { width: "25%", textAlign: "right" }]}>{formatINR(currA)}</Text>
            </View>
          );
        })}

        <View style={styles.tr}>
          <Text style={[styles.td, { width: "10%" }]}>{towers.length + 1}</Text>
          <Text style={[styles.td, { width: "65%" }]}>Departmental Extra Labour Supply (Fitters & Helpers)</Text>
          <Text style={[styles.td, { width: "25%", textAlign: "right" }]}>{formatINR(supplyTotal)}</Text>
        </View>

        <View style={[styles.tr, { borderTopWidth: 1.5, borderTopColor: "#475569", backgroundColor: "#f8fafc" }]}>
          <Text style={[styles.td, { width: "10%" }]}></Text>
          <Text style={[styles.td, { width: "65%", fontFamily: "Helvetica-Bold" }]}>Taxable Work Done Amount</Text>
          <Text style={[styles.td, { width: "25%", textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{formatINR(currentTotal)}</Text>
        </View>

        <View style={[styles.tr, { backgroundColor: "#f0fdfa" }]}>
          <Text style={[styles.td, { width: "10%" }]}></Text>
          <Text style={[styles.td, { width: "65%", color: "#0f766e", fontFamily: "Helvetica-Bold" }]}>Add CGST @ {cgstPct}%</Text>
          <Text style={[styles.td, { width: "25%", textAlign: "right", color: "#0f766e", fontFamily: "Helvetica-Bold" }]}>{formatINR(cgstAmt)}</Text>
        </View>

        <View style={[styles.tr, { backgroundColor: "#f0fdfa" }]}>
          <Text style={[styles.td, { width: "10%" }]}></Text>
          <Text style={[styles.td, { width: "65%", color: "#0f766e", fontFamily: "Helvetica-Bold" }]}>Add SGST @ {sgstPct}%</Text>
          <Text style={[styles.td, { width: "25%", textAlign: "right", color: "#0f766e", fontFamily: "Helvetica-Bold" }]}>{formatINR(sgstAmt)}</Text>
        </View>

        <View style={[styles.tr, { backgroundColor: "#e0e7ff", borderBottomWidth: 0 }]}>
          <Text style={[styles.td, { width: "10%" }]}></Text>
          <Text style={[styles.td, { width: "65%", fontFamily: "Helvetica-Bold", color: "#3730a3" }]}>NET PAYABLE AMOUNT (WITH GST)</Text>
          <Text style={[styles.td, { width: "25%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#3730a3" }]}>{formatINR(netPayable)}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14 }}>
        <View style={{ padding: 10, borderWidth: 1, borderColor: "#4f46e5", borderRadius: 4, backgroundColor: "#f8fafc", width: "58%" }}>
          <Text style={{ fontFamily: "Helvetica-Bold", color: "#4f46e5", marginBottom: 4, fontSize: 8.5 }}>BANK DETAILS FOR PAYMENT (NEFT / RTGS)</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2, fontSize: 7.5 }}>ACCOUNT NAME: RCR ENTERPRISES</Text>
          <Text style={{ marginBottom: 1.5, fontSize: 7 }}>ACCOUNT NO: 088405500559</Text>
          <Text style={{ marginBottom: 1.5, fontSize: 7 }}>IFSC CODE: ICIC0000884</Text>
          <Text style={{ fontSize: 7 }}>BANK NAME: ICICI BANK LTD.</Text>
        </View>

        <View style={{ width: 120, alignItems: "center" }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7, color: "#111827" }}>FOR {data.settings?.companyName?.toUpperCase() || "RCR ENTERPRISES"}</Text>
          {signStr ? <Image src={signStr} style={{ width: 75, height: 35, marginVertical: 2, objectFit: 'contain' }} /> : <View style={{ height: 35, marginVertical: 2 }} />}
          <Text style={{ fontSize: 6.5, color: "#374151", fontFamily: "Helvetica-Bold" }}>AUTHORISED SIGNATORY</Text>
        </View>
      </View>
      <PageFooter signStr={signStr} settings={data.settings} hideSeal={true} />
    </Page>
  );
}

function AbstractSummary({ data, logoStr, signStr }: any) {
  const { site, runningBill, towers, supplyEntries } = data;
  let totPrevAmt = 0;
  let totCurrAmt = 0;
  let grossContractValue = 0;
  
  const currentSupplyEntries = (supplyEntries || []).filter((e: any) => 
    e.runningBillId === runningBill?.id || 
    (!runningBill && !e.runningBillId) || 
    (!e.runningBillId && (!runningBill || (supplyEntries.filter((x: any) => x.runningBillId === runningBill?.id).length === 0)))
  );
  const previousSupplyEntries = (supplyEntries || []).filter((e: any) => e.runningBillId && e.runningBillId !== runningBill?.id);
  const supplyTotal = currentSupplyEntries.reduce((s: number, e: any) => s + (e.totalAmount || 0), 0);
  const prevSupplyTotal = previousSupplyEntries.reduce((s: number, e: any) => s + (e.totalAmount || 0), 0);

  const cgstPct = runningBill?.cgstPct ?? site?.cgstPct ?? 9;
  const sgstPct = runningBill?.sgstPct ?? site?.sgstPct ?? 9;
  const retPct = runningBill?.retentionPct ?? site?.retentionPct ?? 2;
  const tdsPct = runningBill?.tdsPct ?? site?.tdsPct ?? 1;

  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="ABSTRACT SUMMARY" site={site} bill={runningBill} logoStr={logoStr} settings={data.settings} />
      
      <View style={styles.table}>
        <View style={styles.tr}>
          <Text style={[styles.th, { width: "6%", backgroundColor: "#f1f5f9" }]}>Sr.</Text>
          <Text style={[styles.th, { width: "24%", backgroundColor: "#f1f5f9" }]}>Description</Text>
          <Text style={[styles.th, { width: "10%", backgroundColor: "#f1f5f9" }]}>Unit</Text>
          <Text style={[styles.th, { width: "12%", textAlign: "right", backgroundColor: "#f1f5f9" }]}>W.O. Area</Text>
          <Text style={[styles.th, { width: "12%", textAlign: "right", backgroundColor: "#f1f5f9" }]}>Rate</Text>
          <Text style={[styles.th, { width: "12%", textAlign: "right", backgroundColor: "#dbeafe", color: "#1e40af" }]}>Prev. Amt</Text>
          <Text style={[styles.th, { width: "12%", textAlign: "right", backgroundColor: "#dcfce7", color: "#15803d" }]}>This Bill</Text>
          <Text style={[styles.th, { width: "12%", textAlign: "right", backgroundColor: "#ede9fe", color: "#6b21a8" }]}>Cum. Amt</Text>
        </View>

        {towers.map((b: any, idx: number) => {
          const approxArea = b.approxArea || 0;
          const contractRate = b.contractRate || 0;
          grossContractValue += (approxArea * contractRate);

          const { prevA, currA, cumA } = getBuildingWorkAmounts(b, runningBill);

          totPrevAmt += prevA;
          totCurrAmt += currA;

          return (
            <View style={styles.tr} key={b.id} wrap={false}>
              <Text style={[styles.td, { width: "6%" }]}>{idx + 1}</Text>
              <Text style={[styles.td, { width: "24%", fontFamily: "Helvetica-Bold" }]}>{b.name} Reinforcement Work</Text>
              <Text style={[styles.td, { width: "10%" }]}>Sft.</Text>
              <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>{approxArea > 0 ? approxArea.toLocaleString() : "—"}</Text>
              <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>{contractRate > 0 ? `Rs.${contractRate}` : "—"}</Text>
              <Text style={[styles.td, { width: "12%", textAlign: "right", backgroundColor: "#eff6ff", color: "#1e40af" }]}>{formatINR(prevA)}</Text>
              <Text style={[styles.td, { width: "12%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#15803d", backgroundColor: "#f0fdf4" }]}>{formatINR(currA)}</Text>
              <Text style={[styles.td, { width: "12%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#6b21a8", backgroundColor: "#faf5ff" }]}>{formatINR(cumA)}</Text>
            </View>
          );
        })}

        <View style={styles.tr} wrap={false}>
          <Text style={[styles.td, { width: "6%" }]}>{towers.length + 1}</Text>
          <Text style={[styles.td, { width: "24%", fontFamily: "Helvetica-Bold" }]}>Extra Labour Supply</Text>
          <Text style={[styles.td, { width: "10%" }]}>—</Text>
          <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>—</Text>
          <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>—</Text>
          <Text style={[styles.td, { width: "12%", textAlign: "right", backgroundColor: "#eff6ff", color: "#1e40af" }]}>{formatINR(prevSupplyTotal)}</Text>
          <Text style={[styles.td, { width: "12%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#15803d", backgroundColor: "#f0fdf4" }]}>{formatINR(supplyTotal)}</Text>
          <Text style={[styles.td, { width: "12%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#6b21a8", backgroundColor: "#faf5ff" }]}>{formatINR(prevSupplyTotal + supplyTotal)}</Text>
        </View>
      </View>

      {/* Abstract Calculations Box */}
      <View style={{ marginTop: 12 }} wrap={false}>
        <View style={styles.table}>
          {(() => {
            totPrevAmt += prevSupplyTotal;
            totCurrAmt += supplyTotal;
            const totCumAmt = totPrevAmt + totCurrAmt;
            const cgstAbstract = totCurrAmt * (cgstPct / 100);
            const sgstAbstract = totCurrAmt * (sgstPct / 100);
            const retAmt = totCurrAmt * (retPct / 100);
            const tdsAmt = totCurrAmt * (tdsPct / 100);
            const netBalAmt = totCurrAmt + cgstAbstract + sgstAbstract - retAmt - tdsAmt;

            return (
              <>
                <View style={[styles.tr, styles.trTotal]}>
                  <Text style={[styles.td, { width: "52%", textAlign: "right" }]}>TOTAL VALUE OF WORK DONE:</Text>
                  <Text style={[styles.td, { width: "12%", textAlign: "right", backgroundColor: "#eff6ff", color: "#1e40af" }]}>{formatINR(totPrevAmt)}</Text>
                  <Text style={[styles.td, { width: "12%", textAlign: "right", backgroundColor: "#f0fdf4", color: "#15803d", fontFamily: "Helvetica-Bold" }]}>{formatINR(totCurrAmt)}</Text>
                  <Text style={[styles.td, { width: "24%", textAlign: "right", backgroundColor: "#faf5ff", color: "#6b21a8", fontFamily: "Helvetica-Bold" }]}>{formatINR(totCumAmt)} (Cumulative)</Text>
                </View>
                <View style={[styles.tr, { backgroundColor: "#f0fdfa" }]}>
                  <Text style={[styles.td, { width: "64%", textAlign: "right", color: "#0f766e" }]}>Add CGST @ {cgstPct}%:</Text>
                  <Text style={[styles.td, { width: "36%", textAlign: "right", color: "#0f766e", fontFamily: "Helvetica-Bold" }]}>+ {formatINR(cgstAbstract)}</Text>
                </View>
                <View style={[styles.tr, { backgroundColor: "#f0fdfa" }]}>
                  <Text style={[styles.td, { width: "64%", textAlign: "right", color: "#0f766e" }]}>Add SGST @ {sgstPct}%:</Text>
                  <Text style={[styles.td, { width: "36%", textAlign: "right", color: "#0f766e", fontFamily: "Helvetica-Bold" }]}>+ {formatINR(sgstAbstract)}</Text>
                </View>
                <View style={[styles.tr, { backgroundColor: "#fff7ed" }]}>
                  <Text style={[styles.td, { width: "64%", textAlign: "right", color: "#c2410c" }]}>Less Retention @ {retPct}%:</Text>
                  <Text style={[styles.td, { width: "36%", textAlign: "right", color: "#c2410c", fontFamily: "Helvetica-Bold" }]}>- {formatINR(retAmt)}</Text>
                </View>
                <View style={[styles.tr, { backgroundColor: "#fef2f2" }]}>
                  <Text style={[styles.td, { width: "64%", textAlign: "right", color: "#b91c1c" }]}>Less TDS @ {tdsPct}%:</Text>
                  <Text style={[styles.td, { width: "36%", textAlign: "right", color: "#b91c1c", fontFamily: "Helvetica-Bold" }]}>- {formatINR(tdsAmt)}</Text>
                </View>
                <View style={[styles.tr, { backgroundColor: "#e0e7ff", borderBottomWidth: 0 }]}>
                  <Text style={[styles.td, { width: "64%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#3730a3" }]}>NET PAYABLE INVOICE BALANCE:</Text>
                  <Text style={[styles.td, { width: "36%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#3730a3" }]}>{formatINR(netBalAmt)}</Text>
                </View>
              </>
            );
          })()}
        </View>
        {grossContractValue > 0 && (
          <Text style={{ textAlign: "right", marginTop: 6, fontFamily: "Helvetica-Bold", color: "#6b7280", fontSize: 7 }}>
            GROSS CONTRACT VALUE (ALL TOWERS): {formatINR(grossContractValue)}
          </Text>
        )}
      </View>
      <LegendFooter
        items={[
          { short: "Prev. Amt", full: "Previous Billed Amount", colorDot: "#1e40af" },
          { short: "This Bill", full: "Current Bill Progress", colorDot: "#15803d" },
          { short: "Cum. Amt", full: "Cumulative Total Work", colorDot: "#6b21a8" },
          { short: "GST", full: "CGST/SGST Tax (Teal)", colorDot: "#0f766e" },
          { short: "Ret.", full: "Retention Deducted (Orange)", colorDot: "#c2410c" },
          { short: "TDS", full: "TDS Deducted (Red)", colorDot: "#b91c1c" },
        ]}
      />
      <PageFooter signStr={signStr} settings={data.settings} />
    </Page>
  );
}

function TowerPages({ data, logoStr, signStr }: any) {
  const { site, runningBill, towers } = data;
  
  return towers.map((tower: any) => {
    const approxArea = tower.approxArea || 0;
    const contractRate = tower.contractRate || 0;
    const totalTowerVal = approxArea * contractRate;
    const items = tower.workItems || [];
    const isQty = tower.calculationMethod === "QUANTITY";
    
    let tPrevTotal = 0, tCurrTotal = 0, tCumTotal = 0;
    let tPrevQ = 0, tCurrQ = 0, tCumQ = 0, tPartAmt = 0;
    
    return (
      <Page size="A4" style={styles.towerPage} key={tower.id}>
        <PageHeader title={`BUILDING - ${tower.name.toUpperCase()}`} site={site} bill={runningBill} logoStr={logoStr} settings={data.settings} />
        
        <View style={{ marginBottom: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 7.5, color: "#374151" }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Approx BUA:</Text> <Text style={{ color: "#4f46e5", fontFamily: "Helvetica-Bold" }}>{approxArea.toLocaleString()} Sft</Text>
            {"  "}@{"  "}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Rs. {contractRate}/Sft</Text>
            {"  "}={"  "}
            <Text style={{ color: "#16a34a", fontFamily: "Helvetica-Bold" }}>{formatINR(totalTowerVal)}</Text>
          </Text>
          <Text style={{ fontSize: 6.5, color: "#64748b", fontFamily: "Helvetica-Bold" }}>
            TOTAL WORK STAGES: {items.length}
          </Text>
        </View>
        
        <View style={styles.table}>
          {/* Header with Distinct Category Colors */}
          <View style={styles.towerTr} fixed>
            <Text style={[styles.towerTh, { width: "4%", backgroundColor: "#f1f5f9" }]}>Sr.</Text>
            <Text style={[styles.towerTh, { width: "22%", backgroundColor: "#f1f5f9" }]}>Particulars</Text>
            <Text style={[styles.towerTh, { width: "14%", textAlign: "right", backgroundColor: "#fef3c7", color: "#92400e" }]}>{isQty ? "Item Amt/Area" : "Item Amt(Rs)"}</Text>
            <Text style={[styles.towerTh, { width: "6%", textAlign: "center", backgroundColor: "#dbeafe", color: "#1e40af" }]}>{isQty ? "Prv Sft" : "Prv %"}</Text>
            <Text style={[styles.towerTh, { width: "6%", textAlign: "center", backgroundColor: "#dcfce7", color: "#15803d" }]}>{isQty ? "Cur Sft" : "Cur %"}</Text>
            <Text style={[styles.towerTh, { width: "6%", textAlign: "center", backgroundColor: "#ede9fe", color: "#6b21a8" }]}>{isQty ? "Cum Sft" : "Cum %"}</Text>
            <Text style={[styles.towerTh, { width: "14%", textAlign: "right", backgroundColor: "#dbeafe", color: "#1e40af" }]}>Prev Amt(Rs)</Text>
            <Text style={[styles.towerTh, { width: "14%", textAlign: "right", backgroundColor: "#dcfce7", color: "#15803d" }]}>This Bill(Rs)</Text>
            <Text style={[styles.towerTh, { width: "14%", textAlign: "right", backgroundColor: "#ede9fe", color: "#6b21a8" }]}>Cum Amt(Rs)</Text>
          </View>
          
          {items.map((item: any, i: number) => {
            const isQtyMode = isQty;
            const itemRate = item.rate || tower.contractRate || 0;

            const prevA = (item.previousAmt !== undefined && item.previousAmt !== null) ? item.previousAmt : 0;
            const currA = (item.currentAmt !== undefined && item.currentAmt !== null) ? item.currentAmt : 0;
            const cumA = item.cumulativeAmt ?? (prevA + currA);

            let prevQ = item.previousQty || 0;
            if (isQtyMode && prevQ === 0 && prevA > 0 && itemRate > 0) {
              prevQ = Math.round(prevA / itemRate);
            }

            let currQ = item.currentQty || 0;
            if (isQtyMode && currQ === 0 && currA > 0 && itemRate > 0) {
              currQ = Math.round(currA / itemRate);
            }

            const cumQ = isQtyMode ? (prevQ + currQ) : (item.cumulativeQty || (prevQ + currQ));

            tPrevTotal += prevA;
            tCurrTotal += currA;
            tCumTotal += cumA;
            tPrevQ += prevQ;
            tCurrQ += currQ;
            tCumQ += cumQ;
            tPartAmt += item.partAmount || 0;

            return (
              <View style={styles.towerTr} key={item.id} wrap={false}>
                <Text style={[styles.towerTd, { width: "4%" }]}>{i + 1}</Text>
                <Text style={[styles.towerTd, { width: "22%", textAlign: "left" }]}>{item.description || item.name}</Text>
                <Text style={[styles.towerTd, { width: "14%", textAlign: "right", color: "#92400e", backgroundColor: "#fffbeb" }]}>
                  {isQty && tower.contractRate ? (item.partAmount / tower.contractRate).toFixed(2) : formatINR(item.partAmount || 0)}
                </Text>
                <Text style={[styles.towerTd, { width: "6%", textAlign: "center", color: "#1e40af", backgroundColor: "#eff6ff" }]}>{isQty ? prevQ.toFixed(2) : prevQ + "%"}</Text>
                <Text style={[styles.towerTd, { width: "6%", textAlign: "center", color: "#15803d", backgroundColor: "#f0fdf4", fontFamily: "Helvetica-Bold" }]}>{isQty ? currQ.toFixed(2) : currQ + "%"}</Text>
                <Text style={[styles.towerTd, { width: "6%", textAlign: "center", color: "#6b21a8", backgroundColor: "#faf5ff", fontFamily: "Helvetica-Bold" }]}>{isQty ? cumQ.toFixed(2) : cumQ + "%"}</Text>
                <Text style={[styles.towerTd, { width: "14%", textAlign: "right", color: "#1e40af", backgroundColor: "#eff6ff" }]}>{formatINR(prevA)}</Text>
                <Text style={[styles.towerTd, { width: "14%", textAlign: "right", color: "#15803d", backgroundColor: "#f0fdf4", fontFamily: "Helvetica-Bold" }]}>{formatINR(currA)}</Text>
                <Text style={[styles.towerTd, { width: "14%", textAlign: "right", color: "#6b21a8", backgroundColor: "#faf5ff", fontFamily: "Helvetica-Bold" }]}>{formatINR(cumA)}</Text>
              </View>
            );
          })}
          
          <View style={[styles.towerTr, { backgroundColor: "#f8fafc" }]} wrap={false}>
            <Text style={[styles.towerTd, { width: "26%", textAlign: "right", fontFamily: "Helvetica-Bold" }]}>TOTAL AMOUNT</Text>
            <Text style={[styles.towerTd, { width: "14%", textAlign: "right", color: "#92400e", backgroundColor: "#fef3c7", fontFamily: "Helvetica-Bold" }]}>
              {isQty && tower.contractRate ? (tPartAmt / tower.contractRate).toFixed(2) : formatINR(tPartAmt)}
            </Text>
            <Text style={[styles.towerTd, { width: "6%", textAlign: "center", color: "#1e40af", backgroundColor: "#dbeafe", fontFamily: "Helvetica-Bold" }]}>{isQty ? tPrevQ.toFixed(2) : tPrevQ + "%"}</Text>
            <Text style={[styles.towerTd, { width: "6%", textAlign: "center", color: "#15803d", backgroundColor: "#dcfce7", fontFamily: "Helvetica-Bold" }]}>{isQty ? tCurrQ.toFixed(2) : tCurrQ + "%"}</Text>
            <Text style={[styles.towerTd, { width: "6%", textAlign: "center", color: "#6b21a8", backgroundColor: "#ede9fe", fontFamily: "Helvetica-Bold" }]}>{isQty ? tCumQ.toFixed(2) : tCumQ + "%"}</Text>
            <Text style={[styles.towerTd, { width: "14%", textAlign: "right", color: "#1e40af", backgroundColor: "#dbeafe", fontFamily: "Helvetica-Bold" }]}>{formatINR(tPrevTotal)}</Text>
            <Text style={[styles.towerTd, { width: "14%", textAlign: "right", color: "#15803d", backgroundColor: "#dcfce7", fontFamily: "Helvetica-Bold" }]}>{formatINR(tCurrTotal)}</Text>
            <Text style={[styles.towerTd, { width: "14%", textAlign: "right", color: "#6b21a8", backgroundColor: "#ede9fe", fontFamily: "Helvetica-Bold" }]}>{formatINR(tCumTotal)}</Text>
          </View>
          <View style={styles.towerTr} wrap={false}>
            <Text style={[styles.towerTd, { width: "86%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#475569" }]}>GROSS CONTRACT AMOUNT FOR {tower.name.toUpperCase()}</Text>
            <Text style={[styles.towerTd, { width: "14%", textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{formatINR(totalTowerVal)}</Text>
          </View>
          <View style={[styles.towerTr, { borderBottomWidth: 0 }]} wrap={false}>
            <Text style={[styles.towerTd, { width: "86%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#ef4444" }]}>BALANCE AMOUNT TO BE BILLED FOR {tower.name.toUpperCase()}</Text>
            <Text style={[styles.towerTd, { width: "14%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#ef4444" }]}>{formatINR(totalTowerVal - tCumTotal)}</Text>
          </View>
        </View>

        <LegendFooter
          items={[
            { short: "Amber", full: "Stage Work Order Amount (Item Amt)", colorDot: "#92400e" },
            { short: "Blue", full: "Previous Billed Progress (Prv % & Prev Amt)", colorDot: "#1e40af" },
            { short: "Green", full: "Current Bill Progress (Cur % & This Bill)", colorDot: "#15803d" },
            { short: "Purple", full: "Cumulative Total (Cum % & Cum Amt)", colorDot: "#6b21a8" },
          ]}
        />
        <PageFooter signStr={signStr} settings={data.settings} />
      </Page>
    );
  });
}

function SupplyPage({ data, logoStr, signStr }: any) {
  const { site, runningBill, supplyEntries } = data;

  const currentSupplyEntries = (supplyEntries || []).filter((e: any) => 
    e.runningBillId === runningBill?.id || 
    (!runningBill && !e.runningBillId) || 
    (!e.runningBillId && (!runningBill || (supplyEntries.filter((x: any) => x.runningBillId === runningBill?.id).length === 0)))
  );

  let totFitterHrs = 0;
  let totForemanHrs = 0;
  let totHelperHrs = 0;
  let totSupplyAmt = 0;

  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="EXTRA LABOUR SUPPLY" site={site} bill={runningBill} logoStr={logoStr} settings={data.settings} />
      
      <View style={styles.table}>
        <View style={styles.tr} fixed>
          <Text style={[styles.th, { width: "9%", backgroundColor: "#f1f5f9" }]}>Date</Text>
          <Text style={[styles.th, { width: "10%", backgroundColor: "#f1f5f9" }]}>Challan</Text>
          <Text style={[styles.th, { width: "22%", backgroundColor: "#f1f5f9" }]}>Description</Text>
          <Text style={[styles.th, { width: "4%", textAlign: "center", backgroundColor: "#dbeafe", color: "#1e40af", paddingLeft: 1, paddingRight: 1 }]}>F. Qty</Text>
          <Text style={[styles.th, { width: "5%", textAlign: "center", backgroundColor: "#dbeafe", color: "#1e40af", paddingLeft: 1, paddingRight: 1 }]}>F. Hrs</Text>
          <Text style={[styles.th, { width: "6%", textAlign: "center", backgroundColor: "#dbeafe", color: "#1e40af", paddingLeft: 1, paddingRight: 1 }]}>T. F.H</Text>
          <Text style={[styles.th, { width: "4%", textAlign: "center", backgroundColor: "#ffedd5", color: "#c2410c", paddingLeft: 1, paddingRight: 1 }]}>FM Qty</Text>
          <Text style={[styles.th, { width: "5%", textAlign: "center", backgroundColor: "#ffedd5", color: "#c2410c", paddingLeft: 1, paddingRight: 1 }]}>FM Hrs</Text>
          <Text style={[styles.th, { width: "6%", textAlign: "center", backgroundColor: "#ffedd5", color: "#c2410c", paddingLeft: 1, paddingRight: 1 }]}>T. FM.H</Text>
          <Text style={[styles.th, { width: "4%", textAlign: "center", backgroundColor: "#ede9fe", color: "#6b21a8", paddingLeft: 1, paddingRight: 1 }]}>H. Qty</Text>
          <Text style={[styles.th, { width: "5%", textAlign: "center", backgroundColor: "#ede9fe", color: "#6b21a8", paddingLeft: 1, paddingRight: 1 }]}>H. Hrs</Text>
          <Text style={[styles.th, { width: "6%", textAlign: "center", backgroundColor: "#ede9fe", color: "#6b21a8", paddingLeft: 1, paddingRight: 1 }]}>T. H.H</Text>
          <Text style={[styles.th, { width: "14%", textAlign: "right", backgroundColor: "#dcfce7", color: "#15803d" }]}>Amount</Text>
        </View>


        {currentSupplyEntries.map((se: any, idx: number) => {
          const fHrs = (se.fitterQty || 0) * (se.fitterHours || 8);
          const fmHrs = (se.fitterForemanQty || 0) * (se.fitterForemanHours || 8);
          const hHrs = (se.helperQty || 0) * (se.helperHours || 8);
          totFitterHrs += fHrs;
          totForemanHrs += fmHrs;
          totHelperHrs += hHrs;
          totSupplyAmt += se.totalAmount || 0;
          const dateStr = se.date ? new Date(se.date).toLocaleDateString("en-IN") : "-";
          
          // Fix long continuous words in description by inserting newlines
          let desc = se.description || "";
          desc = desc.replace(/(\S{15})/g, "$1\n");

          return (
            <View style={styles.tr} key={idx} wrap={false}>
              <Text style={[styles.td, { width: "9%" }]}>{dateStr}</Text>
              <Text style={[styles.td, { width: "10%" }]}>{se.challanNo || "-"}</Text>
              <Text style={[styles.td, { width: "22%" }]}>{desc}</Text>
              <Text style={[styles.td, { width: "4%", textAlign: "center", backgroundColor: "#f0f7ff", color: "#1e40af", paddingLeft: 1, paddingRight: 1 }]}>{se.fitterQty || 0}</Text>
              <Text style={[styles.td, { width: "5%", textAlign: "center", backgroundColor: "#f0f7ff", color: "#1e40af", paddingLeft: 1, paddingRight: 1 }]}>{se.fitterHours || 8}h</Text>
              <Text style={[styles.td, { width: "6%", textAlign: "center", backgroundColor: "#f0f7ff", color: "#1e40af", fontFamily: "Helvetica-Bold", paddingLeft: 1, paddingRight: 1 }]}>{fHrs}h</Text>
              <Text style={[styles.td, { width: "4%", textAlign: "center", backgroundColor: "#fff7ed", color: "#c2410c", paddingLeft: 1, paddingRight: 1 }]}>{se.fitterForemanQty || 0}</Text>
              <Text style={[styles.td, { width: "5%", textAlign: "center", backgroundColor: "#fff7ed", color: "#c2410c", paddingLeft: 1, paddingRight: 1 }]}>{se.fitterForemanHours || 8}h</Text>
              <Text style={[styles.td, { width: "6%", textAlign: "center", backgroundColor: "#fff7ed", color: "#c2410c", fontFamily: "Helvetica-Bold", paddingLeft: 1, paddingRight: 1 }]}>{fmHrs}h</Text>
              <Text style={[styles.td, { width: "4%", textAlign: "center", backgroundColor: "#fbf8ff", color: "#6b21a8", paddingLeft: 1, paddingRight: 1 }]}>{se.helperQty || 0}</Text>
              <Text style={[styles.td, { width: "5%", textAlign: "center", backgroundColor: "#fbf8ff", color: "#6b21a8", paddingLeft: 1, paddingRight: 1 }]}>{se.helperHours || 8}h</Text>
              <Text style={[styles.td, { width: "6%", textAlign: "center", backgroundColor: "#fbf8ff", color: "#6b21a8", fontFamily: "Helvetica-Bold", paddingLeft: 1, paddingRight: 1 }]}>{hHrs}h</Text>
              <Text style={[styles.td, { width: "14%", textAlign: "right", backgroundColor: "#f2fbf5", color: "#15803d", fontFamily: "Helvetica-Bold" }]}>{formatINR(se.totalAmount || 0)}</Text>
            </View>
          );
        })}

        <View style={[styles.tr, styles.trTotal]} wrap={false}>
          <Text style={[styles.td, { width: "41%", textAlign: "right" }]}>TOTAL HOURS</Text>
          <Text style={[styles.td, { width: "4%", backgroundColor: "#eff6ff", paddingLeft: 1, paddingRight: 1 }]}></Text>
          <Text style={[styles.td, { width: "5%", backgroundColor: "#eff6ff", paddingLeft: 1, paddingRight: 1 }]}></Text>
          <Text style={[styles.td, { width: "6%", textAlign: "center", backgroundColor: "#dbeafe", color: "#1e40af", fontFamily: "Helvetica-Bold", paddingLeft: 1, paddingRight: 1 }]}>{totFitterHrs}h</Text>
          <Text style={[styles.td, { width: "4%", backgroundColor: "#fff7ed", paddingLeft: 1, paddingRight: 1 }]}></Text>
          <Text style={[styles.td, { width: "5%", backgroundColor: "#fff7ed", paddingLeft: 1, paddingRight: 1 }]}></Text>
          <Text style={[styles.td, { width: "6%", textAlign: "center", backgroundColor: "#ffedd5", color: "#c2410c", fontFamily: "Helvetica-Bold", paddingLeft: 1, paddingRight: 1 }]}>{totForemanHrs}h</Text>
          <Text style={[styles.td, { width: "4%", backgroundColor: "#faf5ff", paddingLeft: 1, paddingRight: 1 }]}></Text>
          <Text style={[styles.td, { width: "5%", backgroundColor: "#faf5ff", paddingLeft: 1, paddingRight: 1 }]}></Text>
          <Text style={[styles.td, { width: "6%", textAlign: "center", backgroundColor: "#ede9fe", color: "#6b21a8", fontFamily: "Helvetica-Bold", paddingLeft: 1, paddingRight: 1 }]}>{totHelperHrs}h</Text>
          <Text style={[styles.td, { width: "14%", textAlign: "right", backgroundColor: "#dcfce7", color: "#15803d", fontFamily: "Helvetica-Bold" }]}>{formatINR(totSupplyAmt)}</Text>
        </View>
      </View>
      
      {(() => {
        const fDays = Math.round((totFitterHrs / 8) * 100) / 100;
        const fmDays = Math.round((totForemanHrs / 8) * 100) / 100;
        const hDays = Math.round((totHelperHrs / 8) * 100) / 100;
        return (
          <View style={{ marginTop: 14, alignItems: "flex-end" }} wrap={false}>
            <Text style={{ fontSize: 7.5, marginBottom: 2 }}>Total Shifts: {fDays} Days (Fitter)  |  {fmDays} Days (Foreman)  |  {hDays} Days (Helper)</Text>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#111827" }}>TOTAL EXTRA LABOUR SUPPLY: <Text style={{ color: "#15803d" }}>{formatINR(totSupplyAmt)}</Text></Text>
          </View>
        );
      })()}
      <LegendFooter
        items={[
          { short: "Blue (F)", full: "Fitter Manpower Supply", colorDot: "#1e40af" },
          { short: "Purple (H)", full: "Helper Manpower Supply", colorDot: "#6b21a8" },
          { short: "Green", full: "Billed Challan Amount", colorDot: "#15803d" },
        ]}
      />
      <PageFooter signStr={signStr} settings={data.settings} />
    </Page>
  );
}

function LedgerPage({ data, logoStr, signStr }: any) {
  const { site, runningBill, payments } = data;
  const ledger: any[] = [];
  
  const retPct = runningBill?.retentionPct ?? site?.retentionPct ?? 2;
  const tdsPct = runningBill?.tdsPct ?? site?.tdsPct ?? 1;
  const cgstPct = runningBill?.cgstPct ?? site?.cgstPct ?? 9;
  const sgstPct = runningBill?.sgstPct ?? site?.sgstPct ?? 9;

  (site?.bills || []).forEach((b: any) => {
    const gross = (b.lines || []).reduce((s: number, l: any) => s + (l.currentAmount || 0), 0);
    const bRetAmt = gross * ((b.retentionPct ?? retPct) / 100);
    const bNetAmt = gross - bRetAmt;
    const bTdsAmt = gross * ((b.tdsPct ?? tdsPct) / 100);
    const bGstAmt = gross * (((b.cgstPct ?? cgstPct) + (b.sgstPct ?? sgstPct)) / 100);
    ledger.push({
      type: "BILL",
      date: new Date(b.billDate || b.createdAt),
      refName: `BILL NO. ${b.billNo || "01"}`,
      grossAmount: gross,
      retentionAmt: bRetAmt,
      netBilledAmt: bNetAmt,
      paymentRecd: 0,
      tdsAmt: bTdsAmt,
      gstAmt: bGstAmt,
    });
  });

  (payments || []).forEach((p: any) => {
    ledger.push({
      type: "PAYMENT",
      date: new Date(p.date || p.createdAt),
      refName: p.remarks ? `PAYMENT: ${p.remarks}` : `PAYMENT RECEIVED (${p.mode})`,
      grossAmount: 0,
      retentionAmt: 0,
      netBilledAmt: 0,
      paymentRecd: p.amount || 0,
      tdsAmt: 0,
      gstAmt: 0,
      paymentMode: p.mode,
      paymentRef: p.reference,
    });
  });

  ledger.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runCumNet = 0;
  let runCumRecd = 0;
  let runCumTds = 0;
  let runCumGst = 0;
  let totGross = 0;
  let totRet = 0;

  return (
    <Page size="A4" orientation="landscape" style={styles.landscapePage}>
      <PageHeader title="CLIENT LEDGER & BALANCE SHEET" site={site} bill={runningBill} logoStr={logoStr} settings={data.settings} />
      
      <View style={styles.table}>
        <View style={styles.towerTr} fixed>
          <Text style={[styles.towerTh, { width: "3%", backgroundColor: "#f1f5f9" }]}>Sr.</Text>
          <Text style={[styles.towerTh, { width: "8%", backgroundColor: "#f1f5f9" }]}>Date</Text>
          <Text style={[styles.towerTh, { width: "18%", backgroundColor: "#f1f5f9" }]}>Particulars</Text>
          <Text style={[styles.towerTh, { width: "8%", textAlign: "right", backgroundColor: "#f8fafc" }]}>Bill Gross</Text>
          <Text style={[styles.towerTh, { width: "6%", textAlign: "right", backgroundColor: "#ffedd5", color: "#c2410c" }]}>Ret.</Text>
          <Text style={[styles.towerTh, { width: "8%", textAlign: "right", backgroundColor: "#e0e7ff", color: "#3730a3" }]}>Net Bill</Text>
          <Text style={[styles.towerTh, { width: "14%", textAlign: "right", backgroundColor: "#dcfce7", color: "#15803d" }]}>A/c Credited</Text>
          <Text style={[styles.towerTh, { width: "5%", textAlign: "right", backgroundColor: "#fee2e2", color: "#b91c1c" }]}>1% TDS</Text>
          <Text style={[styles.towerTh, { width: "8%", textAlign: "right", backgroundColor: "#dcfce7", color: "#15803d" }]}>Advance</Text>
          <Text style={[styles.towerTh, { width: "8%", textAlign: "right", backgroundColor: "#fee2e2", color: "#b91c1c" }]}>Balance</Text>
          <Text style={[styles.towerTh, { width: "6%", textAlign: "right", backgroundColor: "#ccfbf1", color: "#0f766e" }]}>GST</Text>
          <Text style={[styles.towerTh, { width: "8%", textAlign: "right", backgroundColor: "#fee2e2", color: "#b91c1c" }]}>Bal+GST</Text>
        </View>

        {ledger.map((item: any, idx: number) => {
          if (item.type === "BILL") {
            runCumNet += item.netBilledAmt;
            runCumTds += item.tdsAmt;
            runCumGst += item.gstAmt;
            totGross += item.grossAmount;
            totRet += item.retentionAmt;
          } else {
            runCumRecd += item.paymentRecd;
          }

          const cumAdv = runCumRecd + runCumTds;
          const runBal = runCumNet - cumAdv;
          const balWithGst = runBal + runCumGst;

          return (
            <View style={styles.towerTr} key={idx} wrap={false}>
              <Text style={[styles.towerTd, { width: "3%" }]}>{idx + 1}</Text>
              <Text style={[styles.towerTd, { width: "8%" }]}>{item.date.toLocaleDateString("en-IN")}</Text>
              <Text style={[styles.towerTd, { width: "18%", fontFamily: "Helvetica-Bold" }]}>{item.refName.slice(0, 30)}</Text>
              <Text style={[styles.towerTd, { width: "8%", textAlign: "right", color: "#475569" }]}>{item.type === "BILL" ? formatINR(item.grossAmount) : "-"}</Text>
              <Text style={[styles.towerTd, { width: "6%", textAlign: "right", backgroundColor: "#fff7ed", color: "#c2410c" }]}>{item.type === "BILL" ? formatINR(item.retentionAmt) : "-"}</Text>
              <Text style={[styles.towerTd, { width: "8%", textAlign: "right", backgroundColor: "#eef2ff", color: "#3730a3", fontFamily: "Helvetica-Bold" }]}>{item.type === "BILL" ? formatINR(item.netBilledAmt) : "-"}</Text>
              <View style={[styles.towerTd, { width: "14%", alignItems: "flex-end", justifyContent: "center", backgroundColor: "#f0fdf4" }]}>
                <Text style={{ color: "#15803d", fontFamily: "Helvetica-Bold" }}>{item.type === "PAYMENT" ? formatINR(item.paymentRecd) : "-"}</Text>
                {item.type === "PAYMENT" && <Text style={{ color: "#6b7280", fontSize: 5.5, marginTop: 1 }}>{[item.paymentMode, item.paymentRef].filter(Boolean).join(" | ").slice(0, 35)}</Text>}
              </View>
              <Text style={[styles.towerTd, { width: "5%", textAlign: "right", backgroundColor: "#fef2f2", color: "#b91c1c" }]}>{item.type === "BILL" ? formatINR(item.tdsAmt) : "-"}</Text>
              <Text style={[styles.towerTd, { width: "8%", textAlign: "right", backgroundColor: "#f0fdf4", color: "#15803d" }]}>{formatINR(cumAdv)}</Text>
              <Text style={[styles.towerTd, { width: "8%", textAlign: "right", fontFamily: "Helvetica-Bold", backgroundColor: runBal > 0 ? "#fef2f2" : "#f0fdf4", color: runBal > 0 ? "#dc2626" : "#16a34a" }]}>{formatINR(runBal)}</Text>
              <Text style={[styles.towerTd, { width: "6%", textAlign: "right", backgroundColor: "#f0fdfa", color: "#0f766e" }]}>{item.type === "BILL" ? formatINR(item.gstAmt) : "-"}</Text>
              <Text style={[styles.towerTd, { width: "8%", textAlign: "right", fontFamily: "Helvetica-Bold", backgroundColor: balWithGst > 0 ? "#fef2f2" : "#f0fdf4", color: balWithGst > 0 ? "#dc2626" : "#16a34a" }]}>{formatINR(balWithGst)}</Text>
            </View>
          );
        })}
        <View style={[styles.towerTr, styles.trTotal, { borderBottomWidth: 0 }]} wrap={false}>
          {(() => {
            const finalCumAdv = runCumRecd + runCumTds;
            const finalRunBal = runCumNet - finalCumAdv;
            const finalBalWithGst = finalRunBal + runCumGst;
            return (
              <>
                <Text style={[styles.towerTd, { width: "29%", textAlign: "right", fontFamily: "Helvetica-Bold" }]}>TOTALS</Text>
                <Text style={[styles.towerTd, { width: "8%", textAlign: "right" }]}>{formatINR(totGross)}</Text>
                <Text style={[styles.towerTd, { width: "6%", textAlign: "right", backgroundColor: "#ffedd5", color: "#c2410c", fontFamily: "Helvetica-Bold" }]}>{formatINR(totRet)}</Text>
                <Text style={[styles.towerTd, { width: "8%", textAlign: "right", backgroundColor: "#e0e7ff", color: "#3730a3", fontFamily: "Helvetica-Bold" }]}>{formatINR(runCumNet)}</Text>
                <Text style={[styles.towerTd, { width: "14%", textAlign: "right", backgroundColor: "#dcfce7", color: "#15803d", fontFamily: "Helvetica-Bold" }]}>{formatINR(runCumRecd)}</Text>
                <Text style={[styles.towerTd, { width: "5%", textAlign: "right", backgroundColor: "#fee2e2", color: "#b91c1c", fontFamily: "Helvetica-Bold" }]}>{formatINR(runCumTds)}</Text>
                <Text style={[styles.towerTd, { width: "8%", textAlign: "right", backgroundColor: "#dcfce7", color: "#15803d", fontFamily: "Helvetica-Bold" }]}>{formatINR(finalCumAdv)}</Text>
                <Text style={[styles.towerTd, { width: "8%", textAlign: "right", fontFamily: "Helvetica-Bold", backgroundColor: finalRunBal > 0 ? "#fef2f2" : "#f0fdf4", color: finalRunBal > 0 ? "#dc2626" : "#16a34a" }]}>{formatINR(finalRunBal)}</Text>
                <Text style={[styles.towerTd, { width: "6%", textAlign: "right", backgroundColor: "#ccfbf1", color: "#0f766e", fontFamily: "Helvetica-Bold" }]}>{formatINR(runCumGst)}</Text>
                <Text style={[styles.towerTd, { width: "8%", textAlign: "right", fontFamily: "Helvetica-Bold", backgroundColor: finalBalWithGst > 0 ? "#fef2f2" : "#f0fdf4", color: finalBalWithGst > 0 ? "#dc2626" : "#16a34a" }]}>{formatINR(finalBalWithGst)}</Text>
              </>
            );
          })()}
        </View>
      </View>
      <LegendFooter
        isLandscape={true}
        items={[
          { short: "Orange (Ret)", full: "Retention Money Deducted", colorDot: "#c2410c" },
          { short: "Indigo (Net)", full: "Net Billed Amount", colorDot: "#3730a3" },
          { short: "Green (Credited)", full: "Received Payments / Advance", colorDot: "#15803d" },
          { short: "Red (TDS / Bal)", full: "TDS & Outstanding Dues", colorDot: "#dc2626" },
          { short: "Teal (GST)", full: "Applicable GST Tax", colorDot: "#0f766e" },
        ]}
      />
      <PageFooter signStr={signStr} settings={data.settings} />
    </Page>
  );
}

// -------------------------------------------------------------
// MAIN RENDER FUNCTION
// -------------------------------------------------------------

function BillDocument({ data, logoStr, signStr }: any) {
  return (
    <Document>
      <TaxInvoice data={data} logoStr={logoStr} signStr={signStr} />
      <AbstractSummary data={data} logoStr={logoStr} signStr={signStr} />
      <TowerPages data={data} logoStr={logoStr} signStr={signStr} />
      <SupplyPage data={data} logoStr={logoStr} signStr={signStr} />
      <LedgerPage data={data} logoStr={logoStr} signStr={signStr} />
    </Document>
  );
}

function getBase64Image(filePath: string): string | null {
  try {
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).substring(1);
      const base64 = fs.readFileSync(filePath, "base64");
      return `data:image/${ext};base64,${base64}`;
    }
  } catch (e) {
    console.error("Failed to load image", filePath, e);
  }
  return null;
}

export async function generateBillPdfPackage(data: {
  site: any;
  runningBill: any;
  towers: any[];
  supplyEntries: any[];
  payments: any[];
  settings?: any;
}): Promise<Uint8Array> {
  const logoPath = path.join(process.cwd(), "public", "rcr-logo.png");
  const signPath = path.join(process.cwd(), "public", "sign&logo.png");
  
  const logoStr = getBase64Image(logoPath);
  const signStr = getBase64Image(signPath);

  const buffer = await renderToBuffer(<BillDocument data={data} logoStr={logoStr} signStr={signStr} />);
  return new Uint8Array(buffer);
}

export async function generateBillPdfs(bill: any): Promise<{ filename: string; buffer: Uint8Array }[]> {
  const lines = bill.lines || [];
  const site = bill.site;
  const reconstructedTowers = (site?.buildings || []).map((b: any) => {
    const bLines = lines.filter((l: any) => l.buildingId === b.id);
    return {
      ...b,
      workItems: (b.workItems && b.workItems.length > 0)
        ? b.workItems.map((item: any) => {
            const l = bLines.find((x: any) => (x.workItemId && x.workItemId === item.id) || (x.description && x.description.includes(item.name)));
            const isQtyMode = b.calculationMethod === "QUANTITY" || item.unit === "Sft";
            const rate = l?.rate || item.rate || b.contractRate || 0;

            const prevA = l?.previousAmount ?? 0;
            const currA = l?.currentAmount ?? 0;
            const cumA = l?.cumulativeAmount ?? (prevA + currA);

            let prevQ = l?.previousQty ?? 0;
            if (isQtyMode && prevQ === 0 && prevA > 0 && rate > 0) {
              prevQ = Math.round(prevA / rate);
            }

            let currQ = l?.currentQty ?? 0;
            if (isQtyMode && currQ === 0 && currA > 0 && rate > 0) {
              currQ = Math.round(currA / rate);
            }

            const cumQ = isQtyMode ? (prevQ + currQ) : (l?.cumulativeQty ?? (prevQ + currQ));

            let partAmt = item.partAmount || l?.workItem?.partAmount || 0;
            const unit = item.unit || l?.unit || "%";
            if (!partAmt) {
              if (unit === "%") {
                partAmt = 100 * rate;
              } else if (l?.woQty && rate) {
                partAmt = l.woQty * rate;
              } else {
                partAmt = rate;
              }
            }
            return {
              id: item.id,
              name: item.name || l?.description || "Work Item",
              unit,
              previousAmt: prevA,
              currentAmt: currA,
              cumulativeAmt: cumA,
              previousQty: prevQ,
              currentQty: currQ,
              cumulativeQty: cumQ,
              rate,
              partAmount: partAmt,
            };
          })
        : bLines.map((l: any) => {
            let partAmt = l.workItem?.partAmount || 0;
            const unit = l.workItem?.unit || l.unit || "%";
            const isQtyMode = b.calculationMethod === "QUANTITY" || unit === "Sft";
            const rate = l.rate || b.contractRate || 0;

            const prevA = l.previousAmount || 0;
            const currA = l.currentAmount || 0;
            const cumA = l.cumulativeAmount || (prevA + currA);

            let prevQ = l.previousQty || 0;
            if (isQtyMode && prevQ === 0 && prevA > 0 && rate > 0) {
              prevQ = Math.round(prevA / rate);
            }

            let currQ = l.currentQty || 0;
            if (isQtyMode && currQ === 0 && currA > 0 && rate > 0) {
              currQ = Math.round(currA / rate);
            }

            const cumQ = isQtyMode ? (prevQ + currQ) : (l.cumulativeQty || (prevQ + currQ));

            if (!partAmt) {
              if (unit === "%") {
                partAmt = 100 * rate;
              } else if (l.woQty && rate) {
                partAmt = l.woQty * rate;
              } else {
                partAmt = rate;
              }
            }
            return {
              id: l.workItemId || l.id,
              name: l.workItem?.name || l.description?.replace(`${b.name} - `, "") || l.description || "Work Item",
              unit,
              previousAmt: prevA,
              currentAmt: currA,
              cumulativeAmt: cumA,
              previousQty: prevQ,
              currentQty: currQ,
              cumulativeQty: cumQ,
              rate,
              partAmount: partAmt,
            };
          }),
    };
  });

  const pdfBytes = await generateBillPdfPackage({
    site: bill.site,
    runningBill: bill,
    towers: reconstructedTowers,
    supplyEntries: bill.supplyLabourEntries || bill.site?.supplyLabourEntries || [],
    payments: bill.site?.payments || [],
  });

  return [
    {
      filename: `Running_Bill_${(bill.billNo || "007").replace(/\//g, "-")}_Package.pdf`,
      buffer: pdfBytes,
    },
  ];
}
