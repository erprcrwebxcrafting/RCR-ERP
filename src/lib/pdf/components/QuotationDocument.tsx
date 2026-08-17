import React from "react";
import { Page, Text, View, Document, StyleSheet, Image, Font, Svg, Path } from "@react-pdf/renderer";
import { QuotationData } from "../quotation";

Font.register({
  family: "Open Sans",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf" },
    { src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf", fontWeight: 700 },
    { src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-800.ttf", fontWeight: 800 },
  ],
});

const themeColor = "#2699bf"; // Kept teal, but used sparingly as an accent
const darkText = "#000000";
const grayText = "#333333";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Open Sans",
    fontSize: 9.5,
    color: darkText,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 50,
    backgroundColor: "#ffffff",
  },
  topRibbonContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 150,
    height: 75,
  },
  bottomRibbonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 150,
    height: 75,
  },
  mainContent: {
    // Padding moved to page
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  logo: {
    width: 70,
    height: 70,
    objectFit: "contain",
    marginRight: 15,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
    color: themeColor,
  },
  companyAddress: {
    fontSize: 9,
    color: grayText,
    fontWeight: 700,
  },
  documentTitleBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: 800,
    textDecoration: "underline",
    textTransform: "uppercase",
  },
  metaBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: "1px solid #eee",
    paddingBottom: 10,
  },
  metaLine: {
    fontWeight: 700,
  },
  toBlock: {
    marginBottom: 15,
  },
  toText: {
    fontWeight: 700,
    marginBottom: 2,
  },
  addressText: {
    marginBottom: 2,
  },
  subjectLine: {
    fontWeight: 700,
    marginBottom: 20,
  },
  salutation: {
    marginBottom: 10,
  },
  introText: {
    marginBottom: 20,
  },
  table: {
    width: "100%",
    marginBottom: 25,
    borderTop: "1px solid #000",
    borderBottom: "1px solid #000",
  },
  tableHeaderRow: {
    flexDirection: "row",
    fontWeight: 700,
    paddingVertical: 6,
    borderBottom: "1px solid #000",
    backgroundColor: "#f9f9f9",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: "1px solid #eee",
  },
  colSr: { width: "10%" },
  colDesc: { width: "50%" },
  colUnit: { width: "15%", textAlign: "center" },
  colRate: { width: "25%", textAlign: "right" },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 15,
    marginBottom: 8,
    color: themeColor,
  },
  listItem: {
    paddingLeft: 25,
    position: "relative",
    marginBottom: 2,
  },
  listBullet: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 25,
    fontWeight: 700,
  },
  listText: {
    lineHeight: 1.3,
  },
  signatureSection: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signBlock: {
    width: 200,
    alignItems: "center",
    position: "relative",
  },
  signCompany: {
    fontWeight: 800,
    fontSize: 10,
    marginBottom: 50,
  },
  signLabel: {
    fontSize: 10,
  },
  signImage: {
    position: "absolute",
    left: 0,
    top: 5,
    width: 100,
    height: 100,
    objectFit: "contain",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 50,
    right: 50,
    borderTop: "1px solid #000",
    paddingTop: 5,
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: grayText,
  },
  stampBox: {
    position: "absolute",
    bottom: 30,
    right: 50,
    width: 100,
    height: 100,
  },
  stampImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
});

function renderList(list: string[]) {
  if (!list || list.length === 0) return null;

  return list.map((item, i) => {
    const trimmed = item.trim();
    if (trimmed === "---" || trimmed === "[PAGE BREAK]") {
      return <View key={i} break />;
    }
    
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      return (
        <Text key={i} style={[styles.sectionTitle, { marginTop: i === 0 ? 0 : 15 }]}>
          {trimmed.replace(/\*\*/g, "")}
        </Text>
      );
    }

    const numMatch = trimmed.match(/^((?:\d+|[ivx]+)[\)\.])\s*/i);
    if (numMatch) {
      const prefix = numMatch[1];
      const text = trimmed.substring(numMatch[0].length);
      return (
        <View key={i} style={styles.listItem} wrap={false}>
          <Text style={styles.listBullet}>{prefix}</Text>
          <Text style={styles.listText}>{text}</Text>
        </View>
      );
    }

    if (trimmed.startsWith("- ")) {
      return (
        <View key={i} style={styles.listItem} wrap={false}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.listText}>{trimmed.substring(2)}</Text>
        </View>
      );
    }

    if (trimmed === "") {
      return <View key={i} style={{ height: 4 }} />;
    }

    return (
      <View key={i} style={styles.listItem} wrap={false}>
        <Text style={styles.listText}>{trimmed}</Text>
      </View>
    );
  });
}

// Custom shapes inspired by the reference
const TopRightWave = () => (
  <View style={styles.topRibbonContainer} fixed>
    <Svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      <Path d="M 0 0 L 100 0 L 100 100 Q 50 60 0 20 Z" fill="#F48A42" />
      <Path d="M 20 0 L 100 0 L 100 80 Q 60 50 20 0 Z" fill="#E86A22" />
    </Svg>
  </View>
);

const BottomLeftWave = () => (
  <View style={styles.bottomRibbonContainer} fixed>
    <Svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      <Path d="M 0 0 Q 50 40 100 80 L 100 100 L 0 100 Z" fill="#F48A42" />
      <Path d="M 0 20 Q 40 50 100 100 L 0 100 Z" fill="#E86A22" />
    </Svg>
  </View>
);

export function QuotationDocument({ data }: { data: QuotationData }) {
  const logoUrl = data.logoUrl;
  const signUrl = data.signUrl;
  
  // Re-format GST / Email / Phone / Website as a clean header string
  const headerAddress = [
    data.companyGst ? `GST No: ${data.companyGst}` : "",
    data.companyEmail ? `Email: ${data.companyEmail}` : "",
    data.companyPhone ? `Contact: ${data.companyPhone}` : "",
    data.companyWebsite ? `Website: ${data.companyWebsite}` : "",
  ].filter(Boolean).join("  |  ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <TopRightWave />
        <BottomLeftWave />

        <View style={styles.mainContent}>
          {/* HEADER */}
          <View style={styles.headerRow}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{data.companyName}</Text>
              <Text style={styles.companyAddress}>{headerAddress}</Text>
            </View>
          </View>

          {/* TITLE */}
          <View style={styles.documentTitleBox}>
            <Text style={styles.documentTitle}>QUOTATION</Text>
          </View>

          {/* META INFO */}
          <View style={styles.metaBlock}>
            <Text style={styles.metaLine}>WO No.: {data.quotationNo || "NEW"}</Text>
            <Text style={styles.metaLine}>Date: {data.date}</Text>
          </View>

          {/* TO BLOCK */}
          <View style={styles.toBlock}>
            <Text style={styles.toText}>To,</Text>
            <Text style={styles.toText}>{data.clientName}</Text>
            {data.projectAddress && <Text style={styles.addressText}>{data.projectAddress}</Text>}
          </View>

          <Text style={styles.subjectLine}>SUB: Quotation for {data.subject}</Text>

          <Text style={styles.salutation}>Dear Sir/Madam,</Text>
          <Text style={styles.introText}>
            This is to Authorize you to commence the construction work on for the below mentioned project:
          </Text>

          {/* TABLE */}
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.colSr}>Sr. No.</Text>
              <Text style={styles.colDesc}>Description</Text>
              <Text style={styles.colUnit}>Unit</Text>
              <Text style={styles.colRate}>Rate (Rs)</Text>
            </View>
            
            {data.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colSr}>{index + 1}</Text>
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colUnit}>{item.unit}</Text>
                <Text style={styles.colRate}>{item.rate.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* TERMS */}
          {data.terms && data.terms.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Terms & Conditions:</Text>
              {renderList(data.terms)}
            </View>
          )}

          {/* EXCLUSIONS */}
          {data.exclusions && data.exclusions.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.sectionTitle}>Exclusions:</Text>
              {renderList(data.exclusions)}
            </View>
          )}

          {/* SIGNATURES */}
          <View style={styles.signatureSection} wrap={false}>
            <View style={styles.signBlock}>
              <Text style={styles.signCompany}>{data.companyName.toUpperCase()}</Text>
              {signUrl && <Image src={signUrl} style={styles.signImage} />}
              <Text style={styles.signLabel}>Signature</Text>
            </View>
            
            <View style={styles.signBlock}>
              <Text style={styles.signCompany}>{data.clientName.toUpperCase()}</Text>
              <Text style={styles.signLabel}>Signature</Text>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {data.companyAddress || "Office No- 04, Raipada, Nr. Anand Gaushalla, Chandansar Road, Virar (E) - 401305"}
          </Text>
        </View>

        {/* EVERY PAGE STAMP (EXCEPT LAST PAGE) */}
        {signUrl && (
          <View style={styles.stampBox} fixed render={({ pageNumber, totalPages }: any) => {
            if (pageNumber === totalPages) return null;
            return <Image src={signUrl} style={styles.stampImage} />;
          }} />
        )}

      </Page>
    </Document>
  );
}
