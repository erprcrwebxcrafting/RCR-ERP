import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Image, Font } from "@react-pdf/renderer";
import fs from "fs";
import path from "path";

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111827",
    paddingBottom: 120,
  },
  landscapePage: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#111827",
    paddingBottom: 120,
  },
  headerBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#4f46e5",
    paddingBottom: 10,
    marginBottom: 10,
  },
  logoContainer: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5",
  },
  companySubtext: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  sheetTitleBox: {
    alignItems: "flex-end",
    justifyContent: "center",
    width: "35%",
  },
  sheetTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5",
    textTransform: "uppercase",
  },
  metaBox: {
    backgroundColor: "#f3f4f6",
    padding: 10,
    borderRadius: 4,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  metaValue: {
    marginBottom: 4,
  },
  table: { width: "100%", borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#9ca3af" },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    minHeight: 24,
  },
  th: { padding: 6, fontFamily: "Helvetica-Bold", backgroundColor: "#f9fafb", color: "#111827", fontSize: 8, borderRightWidth: 1, borderColor: "#9ca3af", justifyContent: "center" },
  td: { padding: 6, fontSize: 8, borderRightWidth: 1, borderColor: "#9ca3af", justifyContent: "center" },
  trTotal: {
    backgroundColor: "#f3f4f6",
    fontFamily: "Helvetica-Bold",
  },
  footerText: {
    position: "absolute",
    bottom: -100,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#4b5563",
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 10,
  },
  pageNumber: {
    position: "absolute",
    bottom: -100,
    right: 0,
    fontSize: 8,
    color: "#4b5563",
    fontFamily: "Helvetica-Bold",
  },
  signBox: {
    position: "absolute",
    bottom: -80,
    right: 0,
    width: 120,
    alignItems: "center",
  },
  signLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#111827",
  },
  signImage: { width: 80, height: 40, marginVertical: 4 },
  footerContainer: { position: "absolute", bottom: 30, left: 30, right: 30, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderTopWidth: 1, borderTopColor: "#cbd5e1", paddingTop: 10 }
});

function formatINR(num: number) {
  return "Rs. " + (num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNum(num: number) {
  return (num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PageHeader({ title, site, bill, logoStr, settings }: { title: string, site: any, bill: any, logoStr: string | null, settings?: any }) {
  const billDate = bill?.billDate ? new Date(bill.billDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN");
  return (
    <View style={{ marginBottom: 15 }} fixed>
      <View style={styles.headerBanner}>
        <View style={{ flexDirection: "row", alignItems: "center", width: "65%" }}>
          {logoStr && <Image src={logoStr} style={styles.logoContainer} />}
          <View style={styles.headerTextContainer}>
            <Text style={styles.companyName}>{settings?.companyName || "RCR ENTERPRISES"}</Text>
            <Text style={styles.companySubtext}>GST NO: {site?.gstNo || "27AAJFN6629D1Z5"} | CONCRETE & REINFORCEMENT WORK</Text>
            <Text style={{ fontSize: 7, color: "#4f46e5", marginTop: 2, fontFamily: "Helvetica-Bold" }}>
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
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>To: {site?.client?.name?.toUpperCase()}</Text>
          <Text style={styles.metaValue}>Project: {site?.projectName}</Text>
          <Text style={styles.metaValue}>{site?.address}</Text>
        </View>
        <View style={[styles.metaCol, { alignItems: "flex-end" }]}>
          <Text style={styles.metaLabel}>Invoice No: {bill?.billNo || "001"}</Text>
          <Text style={styles.metaValue}>W.O. No: {site?.workOrderNo || "—"}</Text>
          <Text style={styles.metaValue}>Ref No: {bill?.refNo || "01"}</Text>
        </View>
      </View>
    </View>
  );
}

function PageFooter({ signStr, settings, hideSeal }: { signStr: string | null, settings?: any, hideSeal?: boolean }) {
  return (
    <>
      {!hideSeal && (
        <View fixed style={{ position: "absolute", bottom: 60, right: 30, width: 120, alignItems: "center" }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, color: "#111827" }}>FOR {settings?.companyName?.toUpperCase() || "RCR ENTERPRISES"}</Text>
          {signStr ? <Image src={signStr} style={{ width: 80, height: 40, marginVertical: 4, objectFit: 'contain' }} /> : <View style={{ height: 40, marginVertical: 4 }} />}
          <Text style={{ fontSize: 7, color: "#374151", fontFamily: "Helvetica-Bold" }}>AUTHORISED SIGNATORY</Text>
        </View>
      )}

      <View fixed style={{ position: "absolute", bottom: 15, left: 30, right: 30, height: 25, backgroundColor: "#4f46e5", borderRadius: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 15 }}>
        <Text style={{ color: "#ffffff", fontSize: 7 }}>{settings?.address || "Office No- 04, Raipada, Nr. Anand Gaushalla, Chandansar Road, Virar (E) - 401305"}</Text>
        <Text style={{ color: "#ffffff", fontSize: 7, fontFamily: "Helvetica-Bold" }} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} />
      </View>
    </>
  );
}

function LegendFooter() {
  return (
    <View style={{ marginTop: 15, padding: 8, backgroundColor: "#f8fafc", borderRadius: 4, borderLeftWidth: 3, borderLeftColor: "#4f46e5", marginBottom: 5 }} wrap={false}>
      <Text style={{ fontSize: 7, color: "#475569", fontFamily: "Helvetica-Bold", marginBottom: 3 }}>* ABBREVIATIONS & LEGEND</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <Text style={{ fontSize: 7, color: "#64748b", marginRight: 8, marginBottom: 2 }}><Text style={{ fontFamily: "Helvetica-Bold", color: "#475569" }}>Prv / Prev</Text> = Previous</Text>
        <Text style={{ fontSize: 7, color: "#64748b", marginRight: 8, marginBottom: 2 }}><Text style={{ fontFamily: "Helvetica-Bold", color: "#475569" }}>Cur / Curr</Text> = Current</Text>
        <Text style={{ fontSize: 7, color: "#64748b", marginRight: 8, marginBottom: 2 }}><Text style={{ fontFamily: "Helvetica-Bold", color: "#475569" }}>Cum</Text> = Cumulative</Text>
        <Text style={{ fontSize: 7, color: "#64748b", marginRight: 8, marginBottom: 2 }}><Text style={{ fontFamily: "Helvetica-Bold", color: "#475569" }}>Amt</Text> = Amount</Text>
        <Text style={{ fontSize: 7, color: "#64748b", marginRight: 8, marginBottom: 2 }}><Text style={{ fontFamily: "Helvetica-Bold", color: "#475569" }}>W.O.</Text> = Work Order</Text>
        <Text style={{ fontSize: 7, color: "#64748b", marginRight: 8, marginBottom: 2 }}><Text style={{ fontFamily: "Helvetica-Bold", color: "#475569" }}>Ret.</Text> = Retention</Text>
        <Text style={{ fontSize: 7, color: "#64748b", marginRight: 8, marginBottom: 2 }}><Text style={{ fontFamily: "Helvetica-Bold", color: "#475569" }}>Bal</Text> = Balance</Text>
        <Text style={{ fontSize: 7, color: "#64748b", marginRight: 8, marginBottom: 2 }}><Text style={{ fontFamily: "Helvetica-Bold", color: "#475569" }}>A/C Credited</Text> = Account Credited</Text>
        <Text style={{ fontSize: 7, color: "#64748b", marginRight: 8, marginBottom: 2 }}><Text style={{ fontFamily: "Helvetica-Bold", color: "#475569" }}>F. Qty</Text> = Fitter Qty</Text>
        <Text style={{ fontSize: 7, color: "#64748b", marginRight: 8, marginBottom: 2 }}><Text style={{ fontFamily: "Helvetica-Bold", color: "#475569" }}>H. Qty</Text> = Helper Qty</Text>
      </View>
    </View>
  );
}

function TaxInvoice({ data, logoStr, signStr }: any) {
  const { site, runningBill, towers, supplyEntries } = data;
  let taxableTowerWork = 0;
  for (const b of towers) {
    const towerWorkAmt = (b.workItems || []).reduce((s: number, i: any) => {
      return s + ((i.currentAmt !== undefined && i.currentAmt !== null) ? i.currentAmt : ((i.currentQty || 0) * (i.rate || 0)));
    }, 0);
    taxableTowerWork += towerWorkAmt;
  }
  
  const currentSupplyEntries = (supplyEntries || []).filter((e: any) => e.runningBillId === runningBill?.id || (!runningBill && !e.runningBillId));
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
          <Text style={[styles.th, { width: "10%" }]}>Sr.</Text>
          <Text style={[styles.th, { width: "65%" }]}>Particulars / Work Description</Text>
          <Text style={[styles.th, { width: "25%", textAlign: "right" }]}>Amount (Rs.)</Text>
        </View>

        {towers.map((b: any, idx: number) => {
          const towerWorkAmt = (b.workItems || []).reduce((s: number, i: any) => {
            return s + ((i.currentAmt !== undefined && i.currentAmt !== null) ? i.currentAmt : ((i.currentQty || 0) * (i.rate || 0)));
          }, 0);
          // Always render tower, even if amount is 0
          return (
            <View style={styles.tr} key={b.id}>
              <Text style={[styles.td, { width: "10%" }]}>{idx + 1}</Text>
              <Text style={[styles.td, { width: "65%" }]}>{site?.projectName} - {b.name} Reinforcement & Civil Work Done</Text>
              <Text style={[styles.td, { width: "25%", textAlign: "right" }]}>{formatINR(towerWorkAmt)}</Text>
            </View>
          );
        })}

        <View style={styles.tr}>
          <Text style={[styles.td, { width: "10%" }]}>{towers.length + 1}</Text>
          <Text style={[styles.td, { width: "65%" }]}>Departmental Extra Labour Supply (Fitters & Helpers)</Text>
          <Text style={[styles.td, { width: "25%", textAlign: "right" }]}>{formatINR(supplyTotal)}</Text>
        </View>

        <View style={[styles.tr, { borderTopWidth: 2, borderTopColor: "#9ca3af" }]}>
          <Text style={[styles.td, { width: "10%" }]}></Text>
          <Text style={[styles.td, { width: "65%", fontFamily: "Helvetica-Bold" }]}>Taxable Work Done Amount</Text>
          <Text style={[styles.td, { width: "25%", textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{formatINR(currentTotal)}</Text>
        </View>

        <View style={styles.tr}>
          <Text style={[styles.td, { width: "10%" }]}></Text>
          <Text style={[styles.td, { width: "65%", color: "#6b7280" }]}>Add CGST @ {cgstPct}%</Text>
          <Text style={[styles.td, { width: "25%", textAlign: "right", color: "#6b7280" }]}>{formatINR(cgstAmt)}</Text>
        </View>

        <View style={styles.tr}>
          <Text style={[styles.td, { width: "10%" }]}></Text>
          <Text style={[styles.td, { width: "65%", color: "#6b7280" }]}>Add SGST @ {sgstPct}%</Text>
          <Text style={[styles.td, { width: "25%", textAlign: "right", color: "#6b7280" }]}>{formatINR(sgstAmt)}</Text>
        </View>

        <View style={[styles.tr, { backgroundColor: "#e0e7ff", borderBottomWidth: 0 }]}>
          <Text style={[styles.td, { width: "10%" }]}></Text>
          <Text style={[styles.td, { width: "65%", fontFamily: "Helvetica-Bold", color: "#3730a3" }]}>NET PAYABLE AMOUNT (WITH GST)</Text>
          <Text style={[styles.td, { width: "25%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#3730a3" }]}>{formatINR(netPayable)}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 20 }}>
        <View style={{ padding: 15, borderWidth: 1, borderColor: "#4f46e5", borderRadius: 4, backgroundColor: "#f3f4f6", width: "60%" }}>
          <Text style={{ fontFamily: "Helvetica-Bold", color: "#4f46e5", marginBottom: 8, fontSize: 10 }}>BANK DETAILS FOR PAYMENT (NEFT / RTGS)</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>ACCOUNT NAME: RCR ENTERPRISES</Text>
          <Text style={{ marginBottom: 2 }}>ACCOUNT NO: 088405500559</Text>
          <Text style={{ marginBottom: 2 }}>IFSC CODE: ICIC0000884</Text>
          <Text>BANK NAME: ICICI BANK LTD.</Text>
        </View>

        <View style={{ width: 120, alignItems: "center" }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, color: "#111827" }}>FOR {data.settings?.companyName?.toUpperCase() || "RCR ENTERPRISES"}</Text>
          {signStr ? <Image src={signStr} style={{ width: 80, height: 40, marginVertical: 4, objectFit: 'contain' }} /> : <View style={{ height: 40, marginVertical: 4 }} />}
          <Text style={{ fontSize: 7, color: "#374151", fontFamily: "Helvetica-Bold" }}>AUTHORISED SIGNATORY</Text>
        </View>
      </View>
      <LegendFooter />
      <PageFooter signStr={signStr} settings={data.settings} hideSeal={true} />
    </Page>
  );
}

function AbstractSummary({ data, logoStr, signStr }: any) {
  const { site, runningBill, towers, supplyEntries } = data;
  let totPrevAmt = 0;
  let totCurrAmt = 0;
  let grossContractValue = 0;
  
  const currentSupplyEntries = (supplyEntries || []).filter((e: any) => e.runningBillId === runningBill?.id || (!runningBill && !e.runningBillId));
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
          <Text style={[styles.th, { width: "6%" }]}>Sr.</Text>
          <Text style={[styles.th, { width: "24%" }]}>Description</Text>
          <Text style={[styles.th, { width: "10%" }]}>Unit</Text>
          <Text style={[styles.th, { width: "12%", textAlign: "right" }]}>W.O. Area</Text>
          <Text style={[styles.th, { width: "12%", textAlign: "right" }]}>Rate</Text>
          <Text style={[styles.th, { width: "12%", textAlign: "right" }]}>Prev. Amt</Text>
          <Text style={[styles.th, { width: "12%", textAlign: "right", backgroundColor: "#e0e7ff" }]}>This Bill</Text>
          <Text style={[styles.th, { width: "12%", textAlign: "right" }]}>Cum. Amt</Text>
        </View>

        {towers.map((b: any, idx: number) => {
          const approxArea = b.approxArea || 0;
          const contractRate = b.contractRate || 0;
          grossContractValue += (approxArea * contractRate);

          const prevA = (b.workItems || []).reduce((s: number, i: any) => s + ((i.previousAmt !== undefined && i.previousAmt !== null) ? i.previousAmt : ((i.previousQty || 0) * (i.rate || 0))), 0);
          const currA = (b.workItems || []).reduce((s: number, i: any) => s + ((i.currentAmt !== undefined && i.currentAmt !== null) ? i.currentAmt : ((i.currentQty || 0) * (i.rate || 0))), 0);
          const cumA = prevA + currA;

          totPrevAmt += prevA;
          totCurrAmt += currA;

          return (
            <View style={styles.tr} key={b.id} wrap={false}>
              <Text style={[styles.td, { width: "6%" }]}>{idx + 1}</Text>
              <Text style={[styles.td, { width: "24%", fontFamily: "Helvetica-Bold" }]}>{b.name} Reinforcement Work</Text>
              <Text style={[styles.td, { width: "10%" }]}>Sft.</Text>
              <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>{approxArea > 0 ? approxArea.toLocaleString() : "—"}</Text>
              <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>{contractRate > 0 ? `Rs.${contractRate}` : "—"}</Text>
              <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>{formatINR(prevA)}</Text>
              <Text style={[styles.td, { width: "12%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#3730a3", backgroundColor: "#eef2ff" }]}>{formatINR(currA)}</Text>
              <Text style={[styles.td, { width: "12%", textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{formatINR(cumA)}</Text>
            </View>
          );
        })}

        <View style={styles.tr} wrap={false}>
          <Text style={[styles.td, { width: "6%" }]}>{towers.length + 1}</Text>
          <Text style={[styles.td, { width: "24%", fontFamily: "Helvetica-Bold" }]}>Extra Labour Supply</Text>
          <Text style={[styles.td, { width: "10%" }]}>—</Text>
          <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>—</Text>
          <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>—</Text>
          <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>{formatINR(prevSupplyTotal)}</Text>
          <Text style={[styles.td, { width: "12%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#3730a3", backgroundColor: "#eef2ff" }]}>{formatINR(supplyTotal)}</Text>
          <Text style={[styles.td, { width: "12%", textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{formatINR(prevSupplyTotal + supplyTotal)}</Text>
        </View>
      </View>

      {/* Abstract Calculations Box */}
      <View style={{ marginTop: 20 }} wrap={false}>
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
                  <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>{formatINR(totPrevAmt)}</Text>
                  <Text style={[styles.td, { width: "12%", textAlign: "right", color: "#4f46e5" }]}>{formatINR(totCurrAmt)}</Text>
                  <Text style={[styles.td, { width: "24%", textAlign: "right" }]}>{formatINR(totCumAmt)} (Cumulative)</Text>
                </View>
                <View style={styles.tr}>
                  <Text style={[styles.td, { width: "64%", textAlign: "right", color: "#6b7280" }]}>Add CGST @ {cgstPct}%:</Text>
                  <Text style={[styles.td, { width: "36%", textAlign: "right" }]}>+ {formatINR(cgstAbstract)}</Text>
                </View>
                <View style={styles.tr}>
                  <Text style={[styles.td, { width: "64%", textAlign: "right", color: "#6b7280" }]}>Add SGST @ {sgstPct}%:</Text>
                  <Text style={[styles.td, { width: "36%", textAlign: "right" }]}>+ {formatINR(sgstAbstract)}</Text>
                </View>
                <View style={styles.tr}>
                  <Text style={[styles.td, { width: "64%", textAlign: "right", color: "#ef4444" }]}>Less Retention @ {retPct}%:</Text>
                  <Text style={[styles.td, { width: "36%", textAlign: "right", color: "#ef4444" }]}>- {formatINR(retAmt)}</Text>
                </View>
                <View style={styles.tr}>
                  <Text style={[styles.td, { width: "64%", textAlign: "right", color: "#ef4444" }]}>Less TDS @ {tdsPct}%:</Text>
                  <Text style={[styles.td, { width: "36%", textAlign: "right", color: "#ef4444" }]}>- {formatINR(tdsAmt)}</Text>
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
          <Text style={{ textAlign: "right", marginTop: 10, fontFamily: "Helvetica-Bold", color: "#6b7280", fontSize: 8 }}>
            GROSS CONTRACT VALUE (ALL TOWERS): {formatINR(grossContractValue)}
          </Text>
        )}
      </View>
      <LegendFooter />
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
    
    let tPrevTotal = 0, tCurrTotal = 0, tCumTotal = 0;
    let tPrevQ = 0, tCurrQ = 0, tCumQ = 0, tPartAmt = 0;
    
    return (
      <Page size="A4" style={styles.page} key={tower.id}>
        <PageHeader title={`BUILDING - ${tower.name.toUpperCase()}`} site={site} bill={runningBill} logoStr={logoStr} settings={data.settings} />
        
        <Text style={{ marginBottom: 10, fontSize: 9, color: "#374151" }}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Approx BUA Area:</Text> <Text style={{ color: "#4f46e5", fontFamily: "Helvetica-Bold" }}>{approxArea.toLocaleString()} Sft</Text>
          {"  "}@{"  "}
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Rs. {contractRate}/Sft</Text>
          {"  "}={"  "}
          <Text style={{ color: "#16a34a", fontFamily: "Helvetica-Bold" }}>{formatINR(totalTowerVal)}</Text>
        </Text>
        
        <View style={styles.table}>
          <View style={styles.tr} fixed>
            <Text style={[styles.th, { width: "4%" }]}>Sr.</Text>
            <Text style={[styles.th, { width: "22%" }]}>Particulars</Text>
            <Text style={[styles.th, { width: "14%", textAlign: "right" }]}>Item Amt(Rs)</Text>
            <Text style={[styles.th, { width: "6%", textAlign: "center" }]}>Prv %</Text>
            <Text style={[styles.th, { width: "6%", textAlign: "center", backgroundColor: "#e0e7ff" }]}>Cur %</Text>
            <Text style={[styles.th, { width: "6%", textAlign: "center" }]}>Cum %</Text>
            <Text style={[styles.th, { width: "14%", textAlign: "right" }]}>Prev Amt(Rs)</Text>
            <Text style={[styles.th, { width: "14%", textAlign: "right", backgroundColor: "#e0e7ff" }]}>This Bill(Rs)</Text>
            <Text style={[styles.th, { width: "14%", textAlign: "right" }]}>Cum Amt(Rs)</Text>
          </View>
          
          {items.map((item: any, i: number) => {
            const prevQ = item.previousQty || 0;
            const currQ = item.currentQty || 0;
            const cumQ = item.cumulativeQty || (prevQ + currQ);

            const prevA = (item.previousAmt !== undefined && item.previousAmt !== null) ? item.previousAmt : 0;
            const currA = (item.currentAmt !== undefined && item.currentAmt !== null) ? item.currentAmt : 0;
            const cumA = item.cumulativeAmt ?? (prevA + currA);

            tPrevTotal += prevA;
            tCurrTotal += currA;
            tCumTotal += cumA;
            tPrevQ += prevQ;
            tCurrQ += currQ;
            tCumQ += cumQ;
            tPartAmt += item.partAmount || 0;

            return (
              <View style={styles.tr} key={item.id} wrap={false}>
                <Text style={[styles.td, { width: "4%" }]}>{i + 1}</Text>
                <Text style={[styles.td, { width: "22%" }]}>{item.name}</Text>
                <Text style={[styles.td, { width: "14%", textAlign: "right" }]}>{formatNum(item.partAmount)}</Text>
                <Text style={[styles.td, { width: "6%", textAlign: "center" }]}>{prevQ}%</Text>
                <Text style={[styles.td, { width: "6%", textAlign: "center", color: "#3730a3", fontFamily: "Helvetica-Bold", backgroundColor: "#eef2ff" }]}>{currQ}%</Text>
                <Text style={[styles.td, { width: "6%", textAlign: "center", fontFamily: "Helvetica-Bold" }]}>{cumQ}%</Text>
                <Text style={[styles.td, { width: "14%", textAlign: "right" }]}>{formatNum(prevA)}</Text>
                <Text style={[styles.td, { width: "14%", textAlign: "right", color: "#3730a3", fontFamily: "Helvetica-Bold", backgroundColor: "#eef2ff" }]}>{formatNum(currA)}</Text>
                <Text style={[styles.td, { width: "14%", textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{formatNum(cumA)}</Text>
              </View>
            );
          })}
          
          {/* Footer Total */}
          <View style={[styles.tr, styles.trTotal]} wrap={false}>
            <Text style={[styles.td, { width: "26%", textAlign: "right" }]}>TOTAL AMOUNT</Text>
            <Text style={[styles.td, { width: "14%", textAlign: "right" }]}>{formatNum(tPartAmt)}</Text>
            <Text style={[styles.td, { width: "6%", textAlign: "center" }]}>{tPrevQ}%</Text>
            <Text style={[styles.td, { width: "6%", textAlign: "center", color: "#3730a3", fontFamily: "Helvetica-Bold", backgroundColor: "#eef2ff" }]}>{tCurrQ}%</Text>
            <Text style={[styles.td, { width: "6%", textAlign: "center" }]}>{tCumQ}%</Text>
            <Text style={[styles.td, { width: "14%", textAlign: "right" }]}>{formatNum(tPrevTotal)}</Text>
            <Text style={[styles.td, { width: "14%", textAlign: "right", color: "#3730a3", fontFamily: "Helvetica-Bold", backgroundColor: "#eef2ff" }]}>{formatNum(tCurrTotal)}</Text>
            <Text style={[styles.td, { width: "14%", textAlign: "right" }]}>{formatNum(tCumTotal)}</Text>
          </View>
          <View style={styles.tr} wrap={false}>
            <Text style={[styles.td, { width: "86%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#6b7280" }]}>GROSS CONTRACT AMOUNT FOR {tower.name.toUpperCase()}</Text>
            <Text style={[styles.td, { width: "14%", textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{formatINR(totalTowerVal)}</Text>
          </View>
          <View style={[styles.tr, { borderBottomWidth: 0 }]} wrap={false}>
            <Text style={[styles.td, { width: "86%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#ef4444" }]}>BALANCE AMOUNT TO BE BILLED FOR {tower.name.toUpperCase()}</Text>
            <Text style={[styles.td, { width: "14%", textAlign: "right", fontFamily: "Helvetica-Bold", color: "#ef4444" }]}>{formatINR(totalTowerVal - tCumTotal)}</Text>
          </View>
        </View>
      <LegendFooter />
      <PageFooter signStr={signStr} settings={data.settings} />
      </Page>
    );
  });
}

function SupplyPage({ data, logoStr, signStr }: any) {
  const { site, runningBill, supplyEntries } = data;

  let totFitterHrs = 0;
  let totHelperHrs = 0;
  let totSupplyAmt = 0;

  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="EXTRA LABOUR SUPPLY" site={site} bill={runningBill} logoStr={logoStr} settings={data.settings} />
      
      <View style={styles.table}>
        <View style={styles.tr} fixed>
          <Text style={[styles.th, { width: "10%" }]}>Date</Text>
          <Text style={[styles.th, { width: "12%" }]}>Challan</Text>
          <Text style={[styles.th, { width: "24%" }]}>Description</Text>
          <Text style={[styles.th, { width: "8%", textAlign: "center" }]}>F. Qty</Text>
          <Text style={[styles.th, { width: "8%", textAlign: "center" }]}>F. Hrs</Text>
          <Text style={[styles.th, { width: "10%", textAlign: "center" }]}>Tot F.H</Text>
          <Text style={[styles.th, { width: "8%", textAlign: "center" }]}>H. Qty</Text>
          <Text style={[styles.th, { width: "10%", textAlign: "center" }]}>Tot H.H</Text>
          <Text style={[styles.th, { width: "10%", textAlign: "right" }]}>Amount</Text>
        </View>

        {(supplyEntries || []).map((se: any, idx: number) => {
          const fHrs = (se.fitterQty || 0) * (se.fitterHours || 8);
          const hHrs = (se.helperQty || 0) * (se.helperHours || 8);
          totFitterHrs += fHrs;
          totHelperHrs += hHrs;
          totSupplyAmt += se.totalAmount || 0;
          const dateStr = se.date ? new Date(se.date).toLocaleDateString("en-IN") : "-";

          return (
            <View style={styles.tr} key={idx} wrap={false}>
              <Text style={[styles.td, { width: "10%" }]}>{dateStr}</Text>
              <Text style={[styles.td, { width: "12%" }]}>{se.challanNo || "-"}</Text>
              <Text style={[styles.td, { width: "24%" }]}>{(se.description || "").slice(0, 30)}</Text>
              <Text style={[styles.td, { width: "8%", textAlign: "center" }]}>{se.fitterQty || 0}</Text>
              <Text style={[styles.td, { width: "8%", textAlign: "center" }]}>{se.fitterHours || 8}h</Text>
              <Text style={[styles.td, { width: "10%", textAlign: "center", color: "#4f46e5" }]}>{fHrs}h</Text>
              <Text style={[styles.td, { width: "8%", textAlign: "center" }]}>{se.helperQty || 0}</Text>
              <Text style={[styles.td, { width: "10%", textAlign: "center", color: "#8b5cf6" }]}>{hHrs}h</Text>
              <Text style={[styles.td, { width: "10%", textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{formatINR(se.totalAmount || 0)}</Text>
            </View>
          );
        })}

        <View style={[styles.tr, styles.trTotal]} wrap={false}>
          <Text style={[styles.td, { width: "46%", textAlign: "right" }]}>TOTAL HOURS</Text>
          <Text style={[styles.td, { width: "8%" }]}></Text>
          <Text style={[styles.td, { width: "8%" }]}></Text>
          <Text style={[styles.td, { width: "10%", textAlign: "center", color: "#4f46e5" }]}>{totFitterHrs}h</Text>
          <Text style={[styles.td, { width: "8%" }]}></Text>
          <Text style={[styles.td, { width: "10%", textAlign: "center", color: "#8b5cf6" }]}>{totHelperHrs}h</Text>
          <Text style={[styles.td, { width: "10%" }]}></Text>
        </View>
      </View>
      
      {(() => {
        const fDays = Math.round((totFitterHrs / 8) * 100) / 100;
        const hDays = Math.round((totHelperHrs / 8) * 100) / 100;
        return (
          <View style={{ marginTop: 20, alignItems: "flex-end" }} wrap={false}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>Total Days: {fDays} Nos (Fitter @ Rs.1100)  |  {hDays} Nos (Helper @ Rs.800)</Text>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" }}>TOTAL EXTRA LABOUR SUPPLY: <Text style={{ color: "#4f46e5" }}>{formatINR(totSupplyAmt)}</Text></Text>
          </View>
        );
      })()}
      <LegendFooter />
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
        <View style={styles.tr} fixed>
          <Text style={[styles.th, { width: "3%" }]}>Sr.</Text>
          <Text style={[styles.th, { width: "8%" }]}>Date</Text>
          <Text style={[styles.th, { width: "18%" }]}>Particulars</Text>
          <Text style={[styles.th, { width: "8%", textAlign: "right" }]}>Bill Gross</Text>
          <Text style={[styles.th, { width: "6%", textAlign: "right" }]}>Ret.</Text>
          <Text style={[styles.th, { width: "8%", textAlign: "right" }]}>Net Bill</Text>
          <Text style={[styles.th, { width: "14%", textAlign: "right" }]}>A/c Credited</Text>
          <Text style={[styles.th, { width: "5%", textAlign: "right" }]}>1% TDS</Text>
          <Text style={[styles.th, { width: "8%", textAlign: "right" }]}>Advance</Text>
          <Text style={[styles.th, { width: "8%", textAlign: "right" }]}>Balance</Text>
          <Text style={[styles.th, { width: "6%", textAlign: "right" }]}>GST</Text>
          <Text style={[styles.th, { width: "8%", textAlign: "right" }]}>Bal+GST</Text>
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
            <View style={styles.tr} key={idx} wrap={false}>
              <Text style={[styles.td, { width: "3%" }]}>{idx + 1}</Text>
              <Text style={[styles.td, { width: "8%" }]}>{item.date.toLocaleDateString("en-IN")}</Text>
              <Text style={[styles.td, { width: "18%", fontFamily: "Helvetica-Bold" }]}>{item.refName.slice(0, 30)}</Text>
              <Text style={[styles.td, { width: "8%", textAlign: "right", color: "#4b5563" }]}>{item.type === "BILL" ? formatINR(item.grossAmount) : "-"}</Text>
              <Text style={[styles.td, { width: "6%", textAlign: "right", color: "#ef4444" }]}>{item.type === "BILL" ? formatINR(item.retentionAmt) : "-"}</Text>
              <Text style={[styles.td, { width: "8%", textAlign: "right" }]}>{item.type === "BILL" ? formatINR(item.netBilledAmt) : "-"}</Text>
              <View style={[styles.td, { width: "14%", alignItems: "flex-end", justifyContent: "center" }]}>
                <Text style={{ color: "#16a34a", fontFamily: "Helvetica-Bold" }}>{item.type === "PAYMENT" ? formatINR(item.paymentRecd) : "-"}</Text>
                {item.type === "PAYMENT" && <Text style={{ color: "#6b7280", fontSize: 6, marginTop: 2 }}>{[item.paymentMode, item.paymentRef].filter(Boolean).join(" | ").slice(0, 35)}</Text>}
              </View>
              <Text style={[styles.td, { width: "5%", textAlign: "right" }]}>{item.type === "BILL" ? formatINR(item.tdsAmt) : "-"}</Text>
              <Text style={[styles.td, { width: "8%", textAlign: "right", color: "#16a34a" }]}>{formatINR(cumAdv)}</Text>
              <Text style={[styles.td, { width: "8%", textAlign: "right", fontFamily: "Helvetica-Bold", color: runBal > 0 ? "#dc2626" : "#16a34a" }]}>{formatINR(runBal)}</Text>
              <Text style={[styles.td, { width: "6%", textAlign: "right", color: "#4b5563" }]}>{item.type === "BILL" ? formatINR(item.gstAmt) : "-"}</Text>
              <Text style={[styles.td, { width: "8%", textAlign: "right", fontFamily: "Helvetica-Bold", color: balWithGst > 0 ? "#dc2626" : "#16a34a" }]}>{formatINR(balWithGst)}</Text>
            </View>
          );
        })}
        <View style={[styles.tr, styles.trTotal, { borderBottomWidth: 0 }]} wrap={false}>
          <Text style={[styles.td, { width: "29%", textAlign: "right" }]}>TOTALS</Text>
          <Text style={[styles.td, { width: "8%", textAlign: "right" }]}>{formatINR(totGross)}</Text>
          <Text style={[styles.td, { width: "6%", textAlign: "right", color: "#ef4444" }]}>{formatINR(totRet)}</Text>
          <Text style={[styles.td, { width: "8%", textAlign: "right" }]}>{formatINR(runCumNet)}</Text>
          <Text style={[styles.td, { width: "14%", textAlign: "right", color: "#16a34a", fontFamily: "Helvetica-Bold" }]}>{formatINR(runCumRecd)}</Text>
          <Text style={[styles.td, { width: "5%", textAlign: "right" }]}>{formatINR(runCumTds)}</Text>
          <Text style={[styles.td, { width: "8%", textAlign: "right", color: "#16a34a" }]}>{formatINR(runCumRecd + runCumTds)}</Text>
          <Text style={[styles.td, { width: "8%", textAlign: "right" }]}></Text>
          <Text style={[styles.td, { width: "6%", textAlign: "right", color: "#4b5563" }]}>{formatINR(runCumGst)}</Text>
          <Text style={[styles.td, { width: "8%", textAlign: "right" }]}></Text>
        </View>
      </View>
      <LegendFooter />
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
  const pdfBytes = await generateBillPdfPackage({
    site: bill.site,
    runningBill: bill,
    towers: bill.site.buildings || [],
    supplyEntries: bill.site.supplyLabourEntries || [],
    payments: bill.site.payments || [],
  });

  return [
    {
      filename: `Running_Bill_${(bill.billNo || "007").replace(/\//g, "-")}_Package.pdf`,
      buffer: pdfBytes,
    },
  ];
}
