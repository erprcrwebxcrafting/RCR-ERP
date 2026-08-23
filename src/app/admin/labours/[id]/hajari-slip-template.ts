export function generateHajariSlipHTML(data: {
  companyName: string;
  companyAddress: string;
  labourName: string;
  labourId: string;
  category: string;
  siteName: string;
  dateOfJoining: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  wageRate: number;
  totalHajari: number;
  earnedAmount: number;
  advancePaid: number;
  netPayable: number;
}) {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return `
    <style>
      @page {
        size: A4 portrait;
        margin: 5mm;
      }
      
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 0;
        background-color: #ffffff;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .slip-wrapper {
        font-family: Arial, Helvetica, sans-serif;
        max-width: 100%;
        margin: 0;
        background-color: #ffffff;
        color: #000000;
        line-height: 1.3;
      }

      .slip-content {
        padding: 20px 30px;
        box-sizing: border-box;
      }

      .header-section {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }

      .logo-container {
        width: 120px;
      }

      .logo-container img {
        width: 100%;
        height: auto;
      }

      .company-title {
        text-align: right;
      }

      .company-title h1 {
        margin: 0;
        font-size: 22px;
        color: #000000;
        font-weight: bold;
      }

      .company-title h2 {
        margin: 2px 0 0;
        font-size: 16px;
        color: #2b579a;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .divider {
        height: 2px;
        background-color: #000000;
        margin: 8px 0 15px;
      }

      /* Employee Info Section */
      .info-grid {
        display: grid;
        grid-template-columns: 140px 1fr;
        row-gap: 4px;
        font-size: 11px;
        margin-bottom: 15px;
      }

      .info-label {
        font-weight: normal;
        color: #333333;
      }

      .info-value {
        font-weight: bold;
        color: #000000;
      }

      .info-value::before {
        content: ":  ";
        white-space: pre;
        font-weight: normal;
      }

      /* Tables styling */
      .section-title {
        font-size: 12px;
        font-weight: bold;
        color: #000000;
        margin: 0 0 4px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
        font-size: 11px;
      }

      th {
        background-color: #dbe4f0;
        color: #000000;
        font-weight: bold;
        padding: 5px 8px;
        text-align: left;
        border: 1px solid #a0a0a0;
      }

      td {
        padding: 5px 8px;
        border: 1px solid #a0a0a0;
      }

      .text-right {
        text-align: right;
      }

      .fw-bold {
        font-weight: bold;
      }

      .total-row td {
        background-color: #f0f4f8;
        font-weight: bold;
      }

      .net-pay-box {
        border: 2px solid #000000;
        background-color: #f0f4f8;
        padding: 8px 12px;
        margin-top: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .net-pay-label {
        font-size: 14px;
        font-weight: bold;
      }

      .net-pay-amount {
        font-size: 18px;
        font-weight: bold;
        color: #000000;
      }

      /* Footer */
      .footer-section {
        margin-top: 40px;
        display: flex;
        justify-content: space-between;
        font-size: 11px;
      }

      .signature-box {
        text-align: center;
        width: 150px;
      }

      .signature-line {
        border-top: 1px solid #000;
        margin-top: 30px;
        padding-top: 5px;
      }
      
      .slip-footer {
        text-align: center;
        margin-top: 20px;
        font-size: 9px;
        color: #666666;
        border-top: 1px dashed #ccc;
        padding-top: 10px;
      }
    </style>
    <div class="slip-wrapper">
      <div class="slip-content">
        
        <div class="header-section">
          <div class="logo-container">
            <img src="/rcr-logo.png" alt="Company Logo" onerror="this.style.display='none'" />
          </div>
          <div class="company-title">
            <h1>${data.companyName}</h1>
            <h2>Hajari Slip (Overall Settlement)</h2>
          </div>
        </div>

        <div class="divider"></div>

        <div class="info-grid">
          <div class="info-label">Labour Name</div>
          <div class="info-value">${data.labourName}</div>

          <div class="info-label">Labour ID</div>
          <div class="info-value">${data.labourId}</div>
          
          <div class="info-label">Category</div>
          <div class="info-value">${data.category}</div>
          
          <div class="info-label">Assigned Site</div>
          <div class="info-value">${data.siteName}</div>

          <div class="info-label">Date of Joining</div>
          <div class="info-value">${data.dateOfJoining}</div>

          <div class="info-label">Bank Name</div>
          <div class="info-value">${data.bankName || 'N/A'}</div>

          <div class="info-label">Account No.</div>
          <div class="info-value">${data.accountNumber || 'N/A'}</div>
          
          <div class="info-label">IFSC Code</div>
          <div class="info-value">${data.ifscCode || 'N/A'}</div>

          <div class="info-label">Date of Generation</div>
          <div class="info-value">${currentDate}</div>
        </div>

        <div class="section-title">Hajari & Earnings Details</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Details</th>
              <th class="text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Wage Rate (Per Hajari)</td>
              <td class="text-right">-</td>
              <td class="text-right">${data.wageRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Total Hajari Logged</td>
              <td class="text-right">${data.totalHajari} hajari</td>
              <td class="text-right">-</td>
            </tr>
            <tr class="total-row">
              <td>Gross Earned Amount</td>
              <td class="text-right"></td>
              <td class="text-right">${data.earnedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div class="section-title">Payments & Settlement</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Advance / Payments Issued</td>
              <td class="text-right">${data.advancePaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div class="net-pay-box">
          <div class="net-pay-label">Net Pending Balance</div>
          <div class="net-pay-amount">₹ ${data.netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div style="font-size: 10px; margin-top: 5px; color: #555;">
          * Note: Net Pending Balance = (Gross Earned Amount - Total Advance Issued)
        </div>

        <div class="footer-section">
          <div class="signature-box">
            <div class="signature-line">Employer Signature</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Labour Signature</div>
          </div>
        </div>

        <div class="slip-footer">
          This is a computer-generated document and does not require a physical stamp. Generated on ${currentDate}.
        </div>

      </div>
    </div>
  `;
}
