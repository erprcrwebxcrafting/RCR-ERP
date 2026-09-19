import React from "react";
import { renderToStream, renderToBuffer } from "@react-pdf/renderer";
import { QuotationDocument } from "./QuotationDocument";
import { QuotationData } from "../quotation";

export async function renderQuotationToStream(data: QuotationData & { logoUrl?: string, signUrl?: string }) {
  return await renderToStream(<QuotationDocument data={data} />);
}

export async function renderQuotationToBuffer(data: QuotationData & { logoUrl?: string, signUrl?: string }) {
  return await renderToBuffer(<QuotationDocument data={data} />);
}
