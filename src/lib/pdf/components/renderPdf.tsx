import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { QuotationDocument } from "./QuotationDocument";
import { QuotationData } from "../quotation";

export async function renderQuotationToStream(data: QuotationData & { logoUrl?: string, signUrl?: string }) {
  return await renderToStream(<QuotationDocument data={data} />);
}
