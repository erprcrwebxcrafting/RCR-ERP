export function generateSalarySlipHTML(data: {
  companyName: string;
  companyAddress: string;
  employeeName: string;
  employeeId: string;
  designation: string;
  month: string;
  year: string;
  dateOfJoining: string;
  bankName: string;
  accountNumber: string;
  monthlySalary: number;
  salaryString?: string;
  hasMultipleRates?: boolean;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  earnedSalary: number;
  advancePaid: number;
  netPayable: number;
}) {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const totalPayableDays = data.presentDays + (data.halfDays * 0.5);

  return `
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          
          * {
            box-sizing: border-box;
            font-family: 'Inter', sans-serif;
          }

          body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .slip-wrapper {
            width: 210mm;
            height: 297mm;
            max-height: 297mm;
            margin: 0 auto;
            background-color: #ffffff;
            color: #0f172a;
            position: relative;
            overflow: hidden;
          }

          .slip-content {
            padding: 40px 50px;
            position: relative;
            z-index: 2;
          }

          /* Header Styling */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-bottom: 20px;
            border-bottom: 3px solid #1e40af;
            margin-bottom: 25px;
          }

          .logo-area img {
            height: 60px;
            width: auto;
          }

          .company-info {
            text-align: right;
          }

          .company-name {
            font-size: 26px;
            font-weight: 800;
            color: #1e40af;
            letter-spacing: -0.5px;
            margin: 0 0 4px 0;
            text-transform: uppercase;
          }

          .slip-title {
            font-size: 16px;
            font-weight: 600;
            color: #64748b;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin: 0;
          }

          /* Employee Information Grid */
          .employee-card {
            background-color: #f1f5f9;
            border-radius: 12px;
            padding: 20px 25px;
            margin-bottom: 25px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 30px;
            border: 1px solid #e2e8f0;
          }

          .info-group {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .info-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .info-value {
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
          }

          /* Attendance Summary */
          .section-title {
            font-size: 15px;
            font-weight: 700;
            color: #1e40af;
            margin: 0 0 15px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .attendance-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }

          .stat-card {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #3b82f6;
            border-radius: 8px;
            padding: 12px 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          }

          .stat-card.payable {
            border-left-color: #10b981;
            background-color: #ecfdf5;
          }

          .stat-card.absent {
            border-left-color: #ef4444;
          }

          .stat-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
            margin-bottom: 4px;
          }

          .stat-value {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
          }

          /* Earnings and Deductions */
          .financials-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 25px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th {
            background-color: #f8fafc;
            color: #64748b;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 15px;
            text-align: left;
            border-bottom: 2px solid #e2e8f0;
          }

          th.amount-col {
            text-align: right;
          }

          td {
            padding: 12px 15px;
            font-size: 13px;
            color: #334155;
            border-bottom: 1px solid #f1f5f9;
          }

          td.amount-col {
            text-align: right;
            font-weight: 500;
          }

          tr.total-row td {
            background-color: #f8fafc;
            font-weight: 700;
            color: #0f172a;
            border-top: 2px solid #e2e8f0;
            border-bottom: none;
            padding: 15px;
          }

          /* Net Pay Section */
          .net-pay-section {
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            border-radius: 12px;
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #ffffff;
            margin-bottom: 30px;
          }

          .net-pay-label {
            font-size: 14px;
            font-weight: 500;
            opacity: 0.9;
            margin-bottom: 4px;
          }

          .net-pay-amount {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -1px;
          }

          .net-pay-words {
            font-size: 12px;
            font-style: italic;
            opacity: 0.8;
            margin-top: 4px;
          }

          /* Footer / Signatures */
          .footer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            margin-top: 30px;
            padding-top: 10px;
            align-items: end;
          }

          .signature-box {
            text-align: center;
          }

          .signature-line {
            width: 200px;
            border-top: 1px solid #94a3b8;
            margin: 0 auto 10px auto;
          }

          .signature-title {
            font-size: 12px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
          }

          /* Watermark */
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 120px;
            font-weight: 900;
            color: rgba(226, 232, 240, 0.4);
            z-index: 1;
            pointer-events: none;
            white-space: nowrap;
          }

        </style>
      </head>
      <body>
        <div class="slip-wrapper">
          <div class="watermark">RCR ERP</div>
          
          <div class="slip-content">
            <!-- Header -->
            <div class="header">
              <div class="logo-area">
                <img src="/rcr-logo.png" alt="RCR Logo" onerror="this.style.display='none'" />
              </div>
              <div class="company-info">
                <h1 class="company-name">${data.companyName}</h1>
                <h2 class="slip-title">PAYSLIP &bull; ${data.month.toUpperCase()} ${data.year}</h2>
              </div>
            </div>

            <!-- Employee Info -->
            <div class="employee-card">
              <div class="info-group">
                <span class="info-label">Employee Name</span>
                <span class="info-value">${data.employeeName}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Employee ID</span>
                <span class="info-value">${data.employeeId}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Designation</span>
                <span class="info-value">${data.designation}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Date of Joining</span>
                <span class="info-value">${data.dateOfJoining}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Bank Name</span>
                <span class="info-value">${data.bankName}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Account Number</span>
                <span class="info-value">${data.accountNumber}</span>
              </div>
            </div>

            <!-- Attendance Summaries -->
            <h3 class="section-title">Attendance Summary</h3>
            <div class="attendance-grid">
              <div class="stat-card">
                <div class="stat-label">Full Days</div>
                <div class="stat-value">${data.presentDays}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Half Days</div>
                <div class="stat-value">${data.halfDays}</div>
              </div>
              <div class="stat-card absent">
                <div class="stat-label">Absent Days</div>
                <div class="stat-value">${data.absentDays}</div>
              </div>
              <div class="stat-card payable">
                <div class="stat-label">Total Payable Days</div>
                <div class="stat-value">${totalPayableDays}</div>
              </div>
            </div>

            <!-- Financials Grid -->
            <div class="financials-grid">
              <!-- Earnings -->
              <div class="financial-section">
                <h3 class="section-title">Earnings</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th class="amount-col">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Basic Salary (Per Month) ${data.hasMultipleRates ? '<span style="font-size: 10px; color: #ef4444; font-weight: bold; margin-left: 6px;">(Revised)</span>' : ''}</td>
                      <td class="amount-col">${data.salaryString ? data.salaryString : '₹' + data.monthlySalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td>Salary Earned (Based on Days)</td>
                      <td class="amount-col">₹${data.earnedSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr class="total-row">
                      <td>Total Earnings</td>
                      <td class="amount-col">₹${data.earnedSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Deductions -->
              <div class="financial-section">
                <h3 class="section-title">Deductions</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th class="amount-col">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Advance / Previous Dues</td>
                      <td class="amount-col">₹${data.advancePaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td>Other Deductions</td>
                      <td class="amount-col">₹0.00</td>
                    </tr>
                    <tr class="total-row">
                      <td>Total Deductions</td>
                      <td class="amount-col">₹${data.advancePaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Net Pay Highlight -->
            <div class="net-pay-section">
              <div>
                <div class="net-pay-label">Net Payable Amount</div>
                <div class="net-pay-amount">₹${data.netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
              </div>
              <div style="text-align: right;">
                <div class="net-pay-label">Pay Date</div>
                <div style="font-size: 16px; font-weight: 600;">${currentDate}</div>
              </div>
            </div>

            <!-- Signatures -->
            <div class="footer-section">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-title">Employee Signature</div>
              </div>
              <div class="signature-box" style="margin-left: auto; text-align: right;">
                <img src="/sign&logo.png" alt="Authorized Signatory" style="max-width: 160px; height: auto; margin-bottom: 5px; display: inline-block;" onerror="this.style.display='none'" />
              </div>
            </div>

          </div>
        </div>
      </body>
    </html>
  `;
}
