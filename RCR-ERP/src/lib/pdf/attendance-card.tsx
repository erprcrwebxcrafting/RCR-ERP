import { Document, Page, View, Text, StyleSheet, Font, Image } from "@react-pdf/renderer";
import { renderToBuffer } from "@react-pdf/renderer";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ff99cc",
    padding: 15, // Reduced padding to save vertical space
    fontFamily: "Helvetica",
    position: "relative",
  },
  watermark: {
    position: "absolute",
    top: "30%",
    left: "15%",
    transform: "rotate(-30deg)",
    opacity: 0.05,
    width: "70%",
  },
  headerContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 15,
  },
  logo: {
    width: 70, // Reduced from 100
    height: 70, // Reduced from 100
    objectFit: "contain",
    marginBottom: 5,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    textTransform: "uppercase",
    borderTopWidth: 1.5,
    borderTopColor: "#0f172a",
    borderTopStyle: "dashed",
    paddingTop: 10,
    width: "100%",
    marginTop: 5,
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    border: "1px solid #000",
    padding: 8,
    marginBottom: 10,
  },
  infoCol: {
    width: "48%",
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
  },
  fieldLabel: {
    fontSize: 10,
    width: 90,
  },
  fieldValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  table: {
    width: "100%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  tableColHeader: {
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  tableCol: {
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
    height: 14, // Reduced from 16
  },
  textSmall: {
    fontSize: 9,
  },
  textMedium: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#000",
  },
  footerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15, // Reduced from 30
    paddingHorizontal: 20,
  },
  signLine: {
    width: 150,
    borderTopWidth: 1,
    borderTopColor: "#000",
    textAlign: "center",
    paddingTop: 5,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  }
});

export interface AttendanceCardData {
  factoryName: string;
  workerName: string;
  monthName: string; 
  rate: number;
  days: {
    dateNum: number;
    fullDateStr?: string;
    presentStr: string; 
    advDateNum: number;
    advFullDateStr?: string;
    advanceAmt: number | null;
    remarks: string;
  }[];
  totalDays: number;
  totalEarned: number;
  totalAdvance: number;
  deductions: number;
  balancePayable: number;
  openingBalance?: number;
  logoStr?: string;
}

export const AttendanceCardPages = ({ data }: { data: AttendanceCardData }) => {
  return (
    <Page size="A4" orientation="portrait" style={styles.page}>
      {/* Watermark Logo */}
      {data.logoStr ? <Image src={data.logoStr} style={styles.watermark} /> : null}
      
      {/* Header */}
      <View style={styles.headerContainer}>
        {data.logoStr ? <Image src={data.logoStr} style={styles.logo} /> : null}
        <Text style={styles.title}>WORKMAN&apos;S ATTENDANCE CARD</Text>
      </View>

      {/* Info & Summary block combined */}
      <View style={styles.infoSection}>
        {/* Left Column */}
        <View style={styles.infoCol}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name</Text>
            <Text style={styles.fieldValue}>{data.workerName}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Factory</Text>
            <Text style={styles.fieldValue}>{data.factoryName}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Month</Text>
            <Text style={styles.fieldValue}>{data.monthName}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Wages Rate (Rs.)</Text>
            <Text style={styles.fieldValue}>{data.rate}</Text>
          </View>
        </View>
        
        {/* Right Column */}
        <View style={styles.infoCol}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Total Days</Text>
            <Text style={styles.fieldValue}>{data.totalDays}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Total Amt (Rs.)</Text>
            <Text style={styles.fieldValue}>{Math.round(data.totalEarned).toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Total Adv (Rs.)</Text>
            <Text style={styles.fieldValue}>- {Math.round(data.totalAdvance).toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Prev. Balance</Text>
            <Text style={styles.fieldValue}>
              {!data.openingBalance || data.openingBalance === 0
                ? "0"
                : data.openingBalance > 0
                ? `+ ${Math.round(data.openingBalance).toLocaleString("en-IN")}`
                : `- ${Math.round(Math.abs(data.openingBalance)).toLocaleString("en-IN")} (Adv)`}
            </Text>
          </View>
          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.fieldLabel, { fontFamily: "Helvetica-Bold" }]}>Bal. Payable</Text>
            <Text style={styles.fieldValue}>
              {data.balancePayable >= 0
                ? `Rs. ${Math.round(data.balancePayable).toLocaleString("en-IN")}`
                : `- Rs. ${Math.round(Math.abs(data.balancePayable)).toLocaleString("en-IN")} (Adv)`}
            </Text>
          </View>
        </View>
      </View>

      {/* Single Table 1-31 */}
      <View style={styles.table}>
        <View style={[styles.tableRow, { backgroundColor: "#ffb6c1" }]}>
          <View style={[styles.tableColHeader, { width: "14%" }]}><Text style={styles.textMedium}>Dt.</Text></View>
          <View style={[styles.tableColHeader, { width: "14%" }]}><Text style={styles.textMedium}>Present</Text></View>
          <View style={[styles.tableColHeader, { width: "14%" }]}><Text style={styles.textMedium}>Adv Dt.</Text></View>
          <View style={[styles.tableColHeader, { width: "14%" }]}><Text style={styles.textMedium}>Advance</Text></View>
          <View style={[styles.tableColHeader, { width: "44%", borderRightWidth: 0 }]}><Text style={styles.textMedium}>Remarks</Text></View>
        </View>
        {data.days.map((day, idx) => (
          <View style={styles.tableRow} key={idx}>
            <View style={[styles.tableCol, { width: "14%" }]}><Text style={styles.textSmall}>{day.fullDateStr || (day.dateNum > 0 && day.dateNum <= 31 ? day.dateNum : "")}</Text></View>
            <View style={[styles.tableCol, { width: "14%" }]}><Text style={styles.textMedium}>{day.presentStr}</Text></View>
            <View style={[styles.tableCol, { width: "14%" }]}><Text style={styles.textSmall}>{day.advFullDateStr || (day.advDateNum > 0 ? day.advDateNum : "")}</Text></View>
            <View style={[styles.tableCol, { width: "14%" }]}><Text style={styles.textMedium}>{day.advanceAmt ? day.advanceAmt : ""}</Text></View>
            <View style={[styles.tableCol, { width: "44%", borderRightWidth: 0 }]}>
              {/* No truncation needed now because width is 44% of A4 portrait! */}
              <Text style={styles.textSmall}>{day.remarks}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footerSection}>
        <Text style={styles.signLine}>Worker's Signature</Text>
        <Text style={styles.signLine}>Manager's Signature</Text>
      </View>

    </Page>
  );
};

export const AttendanceCard = ({ data }: { data: AttendanceCardData }) => (
  <Document>
    <AttendanceCardPages data={data} />
  </Document>
);

export default AttendanceCard;

export const BulkAttendanceCard = ({ dataArray }: { dataArray: AttendanceCardData[] }) => (
  <Document>
    {dataArray.map((data, idx) => (
      <AttendanceCardPages key={idx} data={data} />
    ))}
  </Document>
);

export async function generateAttendanceCardBuffer(data: AttendanceCardData): Promise<Buffer> {
  const stream = await renderToBuffer(<AttendanceCard data={data} />);
  return stream as unknown as Buffer;
}

export async function generateBulkAttendanceCardBuffer(dataArray: AttendanceCardData[]): Promise<Buffer> {
  const stream = await renderToBuffer(<BulkAttendanceCard dataArray={dataArray} />);
  return stream as unknown as Buffer;
}
