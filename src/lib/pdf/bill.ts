import { PDFDocument, StandardFonts } from "pdf-lib";

export async function generateBillPdfs(bill: any): Promise<{ filename: string; buffer: Uint8Array }[]> {
  const files: { filename: string; buffer: Uint8Array }[] = [];
  
  const makePdf = async (title: string, contentLines: string[]) => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage([595.28, 841.89]);
    
    page.drawText(title, { x: 50, y: 800, size: 18, font });
    page.drawText(`Bill No: ${bill.billNo}`, { x: 50, y: 780, size: 12, font });
    page.drawText(`Project: ${bill.site.projectName}`, { x: 50, y: 760, size: 12, font });
    
    let y = 720;
    for (const line of contentLines) {
      if (y < 50) break; // simple pagination prevention for demo
      page.drawText(line, { x: 50, y, size: 10, font });
      y -= 15;
    }
    
    return pdfDoc.save();
  };

  const total = bill.lines.reduce((s:any, l:any) => s + l.currentAmount, 0);

  files.push({
    filename: "Tax Invoice.pdf",
    buffer: await makePdf("Tax Invoice", [`Invoice for ${bill.site.client.name}`, `Total Amount: Rs. ${total.toFixed(2)}`])
  });

  files.push({
    filename: "Running Summary.pdf",
    buffer: await makePdf("Running Bill Summary", ["Summary of all buildings and labour for this period."])
  });

  const byBuilding = new Map<string, any[]>();
  for (const l of bill.lines) {
    if (l.building) {
      const b = byBuilding.get(l.building.name) || [];
      b.push(l);
      byBuilding.set(l.building.name, b);
    }
  }

  for (const [buildingName, lines] of byBuilding.entries()) {
    files.push({
      filename: `${buildingName}.pdf`,
      buffer: await makePdf(`Detailed Bill - ${buildingName}`, lines.map((l:any) => `${l.description}: ${l.currentQty} x ${l.rate} = ${l.currentAmount}`))
    });
  }

  files.push({
    filename: "Labour Supply.pdf",
    buffer: await makePdf("Labour Supply Sheet", ["Departmental labour supply details for this bill."])
  });

  files.push({
    filename: "Balance Sheet.pdf",
    buffer: await makePdf("Balance Sheet", ["Payment history and outstanding balances."])
  });

  return files;
}
