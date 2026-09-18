import { Document, Page, View, Text, StyleSheet, Font, Image } from "@react-pdf/renderer";
import { renderToBuffer } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

let logoBase64 = "";
try {
  const imageBuffer = fs.readFileSync(path.join(process.cwd(), "public", "rcr-logo.png"));
  logoBase64 = `data:image/png;base64,${imageBuffer.toString("base64")}`;
} catch (e) {
  console.error("Failed to load logo", e);
}

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "row", // Two pages side-by-side to mimic the booklet inside
    backgroundColor: "#ff99cc", // Pinkish theme
    padding: 20,
    fontFamily: "Helvetica",
  },
  halfPage: {
    width: "50%",
    padding: 10,
    height: "100%",
    border: "1px solid #000",
  },
  headerText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 5,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
  },
  fieldLabel: {
    fontSize: 9,
    width: 100,
  },
  fieldValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  table: {
    width: "100%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000",
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  tableColHeader: {
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  tableCol: {
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
    height: 14,
  },
  textSmall: {
    fontSize: 8,
  },
  textMedium: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#000",
  }
});

export interface AttendanceCardData {
  factoryName: string;
  workerName: string;
  monthName: string; // e.g. "01 July 2026"
  rate: number;
  days: {
    dateNum: number;
    presentStr: string; // 'P', 'A', 'P 1/2', 'PPP'
    advDateNum: number;
    advanceAmt: number | null;
    remarks: string;
  }[];
  totalDays: number; // Sum of hajaris
  totalEarned: number;
  totalAdvance: number;
  deductions: number;
  balancePayable: number;
  openingBalance?: number;
}

export const AttendanceCardPages = ({ data }: { data: AttendanceCardData }) => {
  // Split days into two halves (1-16 and 17-31) to fit in the booklet style
  const firstHalf = data.days.slice(0, 16);
  const secondHalf = data.days.slice(16);

  // Fill second half with empty rows if it's less than 15 rows (to make layout equal)
  const emptyRowsNeeded = 15 - secondHalf.length;
  for (let i = 0; i < emptyRowsNeeded; i++) {
    const nextDate = secondHalf.length > 0 ? secondHalf[secondHalf.length - 1].dateNum + 1 : 17 + i;
    secondHalf.push({
      dateNum: nextDate,
      presentStr: "",
      advDateNum: 0,
      advanceAmt: null,
      remarks: ""
    });
  }

  return (
    <>
      {/* Front and Back Page (Outer cover) */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        
        {/* Back Page (Summary) */}
        <View style={styles.halfPage}>
          <View style={{ marginTop: 20 }}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Total Days</Text>
              <Text style={styles.fieldValue}>{data.totalDays}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Rate Rs.</Text>
              <Text style={styles.fieldValue}>{data.rate}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Total Amt. Rs.</Text>
              <Text style={styles.fieldValue}>{data.totalEarned.toLocaleString("en-IN")}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Advance Rs.</Text>
              <Text style={styles.fieldValue}>- {data.totalAdvance.toLocaleString("en-IN")}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Deduction Rs.</Text>
              <Text style={styles.fieldValue}>- {data.deductions.toLocaleString("en-IN")}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Prev. Pending Rs.</Text>
              <Text style={styles.fieldValue}>{(data.openingBalance && data.openingBalance > 0) ? data.openingBalance.toLocaleString("en-IN") : "0"}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Bal. Payable Rs.</Text>
              <Text style={styles.fieldValue}>{data.balancePayable.toLocaleString("en-IN")}</Text>
            </View>
            
            <View style={[styles.fieldRow, { marginTop: 40 }]}>
              <Text style={styles.fieldLabel}>Sign</Text>
              <Text style={styles.fieldValue}></Text>
            </View>
          </View>
        </View>

        {/* Front Page */}
        <View style={styles.halfPage}>
          {/* Premium RCR Logo */}
          <View style={{ flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 15, marginTop: 5 }}>
            {logoBase64 ? (
              <Image 
                src={logoBase64} 
                style={{ width: 120, height: 120, objectFit: "contain" }} 
              />
            ) : null}
          </View>
          
          <View style={{ borderTopWidth: 1.5, borderTopColor: "#0f172a", borderTopStyle: "dashed", marginHorizontal: 20, marginBottom: 12 }} />

          <Text style={[styles.title, { fontSize: 15, letterSpacing: 0.5, color: "#0f172a" }]}>WORKMAN&apos;S ATTENDANCE CARD</Text>
          
          <View style={{ marginTop: 20 }}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Name of the Factory</Text>
              <Text style={styles.fieldValue}>{data.factoryName}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Card No.</Text>
              <Text style={styles.fieldValue}></Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.fieldValue}>{data.workerName}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>For the Month of</Text>
              <Text style={styles.fieldValue}>{data.monthName}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Wages at the rate of Rs.</Text>
              <Text style={styles.fieldValue}>{data.rate}</Text>
            </View>
          </View>
        </View>

      </Page>

      {/* Inside Pages (Attendance grid 1-31) */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        
        {/* Left Side (Days 1-16) */}
        <View style={styles.halfPage}>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableColHeader, { width: "10%" }]}><Text style={styles.textSmall}>Dt.</Text></View>
              <View style={[styles.tableColHeader, { width: "25%" }]}><Text style={styles.textSmall}>Present</Text></View>
              <View style={[styles.tableColHeader, { width: "15%" }]}><Text style={styles.textSmall}>Adv Dt.</Text></View>
              <View style={[styles.tableColHeader, { width: "25%" }]}><Text style={styles.textSmall}>Advance</Text></View>
              <View style={[styles.tableColHeader, { width: "25%", borderRightWidth: 0 }]}><Text style={styles.textSmall}>Remarks</Text></View>
            </View>
            {firstHalf.map((day, idx) => (
                <View style={styles.tableRow} key={idx}>
                  <View style={[styles.tableCol, { width: "10%" }]}><Text style={styles.textSmall}>{day.dateNum}</Text></View>
                  <View style={[styles.tableCol, { width: "25%" }]}><Text style={styles.textMedium}>{day.presentStr}</Text></View>
                  <View style={[styles.tableCol, { width: "15%" }]}><Text style={styles.textSmall}>{day.advDateNum > 0 ? day.advDateNum : ""}</Text></View>
                  <View style={[styles.tableCol, { width: "25%" }]}><Text style={styles.textMedium}>{day.advanceAmt ? day.advanceAmt : ""}</Text></View>
                  <View style={[styles.tableCol, { width: "25%", borderRightWidth: 0 }]}><Text style={styles.textSmall}>{day.remarks.length > 22 ? day.remarks.substring(0, 20) + ".." : day.remarks}</Text></View>
                </View>
            ))}
          </View>
        </View>

        {/* Right Side (Days 17-31) */}
        <View style={styles.halfPage}>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableColHeader, { width: "10%" }]}><Text style={styles.textSmall}>Dt.</Text></View>
              <View style={[styles.tableColHeader, { width: "25%" }]}><Text style={styles.textSmall}>Present</Text></View>
              <View style={[styles.tableColHeader, { width: "15%" }]}><Text style={styles.textSmall}>Adv Dt.</Text></View>
              <View style={[styles.tableColHeader, { width: "25%" }]}><Text style={styles.textSmall}>Advance</Text></View>
              <View style={[styles.tableColHeader, { width: "25%", borderRightWidth: 0 }]}><Text style={styles.textSmall}>Remarks</Text></View>
            </View>
            {secondHalf.map((day, idx) => (
                <View style={styles.tableRow} key={idx}>
                  <View style={[styles.tableCol, { width: "10%" }]}><Text style={styles.textSmall}>{day.dateNum > 0 && day.dateNum <= 31 ? day.dateNum : ""}</Text></View>
                  <View style={[styles.tableCol, { width: "25%" }]}><Text style={styles.textMedium}>{day.presentStr}</Text></View>
                  <View style={[styles.tableCol, { width: "15%" }]}><Text style={styles.textSmall}>{day.advDateNum > 0 ? day.advDateNum : ""}</Text></View>
                  <View style={[styles.tableCol, { width: "25%" }]}><Text style={styles.textMedium}>{day.advanceAmt ? day.advanceAmt : ""}</Text></View>
                  <View style={[styles.tableCol, { width: "25%", borderRightWidth: 0 }]}><Text style={styles.textSmall}>{day.remarks.length > 22 ? day.remarks.substring(0, 20) + ".." : day.remarks}</Text></View>
                </View>
            ))}
          </View>
        </View>

      </Page>
    </>
  );
};

export const AttendanceCard = ({ data }: { data: AttendanceCardData }) => (
  <Document>
    <AttendanceCardPages data={data} />
  </Document>
);

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
