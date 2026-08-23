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

  return `
    <style>
      @page {
        size: A4 portrait;
        margin: 5mm; /* Very small margin so browser doesn't cut it off, but doesn't add huge padding */
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

      /* Internal padding to give it a professional border offset, without taking too much vertical space */
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

      th:last-child {
        text-align: right;
      }

      td {
        padding: 5px 8px;
        border: 1px solid #a0a0a0;
        color: #000000;
      }

      td:last-child {
        text-align: right;
      }

      tr.total-row td {
        font-weight: bold;
        background-color: #f2f2f2;
      }

      /* Footer summary */
      .footer-summary {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        font-size: 11px;
        page-break-inside: avoid;
      }

      .summary-details {
        display: grid;
        grid-template-columns: 90px 1fr;
        row-gap: 4px;
      }

      .summary-label {
        font-weight: normal;
        color: #333333;
      }

      .summary-value {
        font-weight: bold;
        color: #000000;
      }
      
      .summary-value.net-pay {
        font-size: 13px;
      }

      .summary-value::before {
        content: ":  ";
        white-space: pre;
        font-weight: normal;
      }

      .signature-section {
        text-align: center;
        width: 220px;
        margin-top: 10px;
      }

      .signature-label {
        margin-bottom: 30px;
        color: #333333;
        text-align: left;
        padding-left: 20px;
      }

      .signature-line {
        border-top: 1px solid #000000;
        padding-top: 4px;
        font-weight: bold;
        color: #000000;
      }

      @media print {
        .slip-wrapper {
          page-break-after: auto;
        }
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
            <h2>PAYROLL SLIP</h2>
          </div>
        </div>

        <div class="divider"></div>

        <div class="info-grid">
          <div class="info-label">Month</div>
          <div class="info-value">${data.month} ${data.year}</div>

          <div class="info-label">Employee Name</div>
          <div class="info-value">${data.employeeName}</div>

          <div class="info-label">Employee ID</div>
          <div class="info-value">${data.employeeId}</div>

          <div class="info-label">Designation</div>
          <div class="info-value">${data.designation}</div>

          <div class="info-label">Date of Joining</div>
          <div class="info-value">${data.dateOfJoining}</div>

          <div class="info-label">Pay Date</div>
          <div class="info-value">${currentDate}</div>
        </div>

        <!-- Attendance Stats -->
        <h3 class="section-title">Attendance Details</h3>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Days</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Present Days</td>
              <td>${data.presentDays}</td>
            </tr>
            <tr>
              <td>Total Half Days</td>
              <td>${data.halfDays}</td>
            </tr>
            <tr>
              <td>Total Absent Days</td>
              <td>${data.absentDays}</td>
            </tr>
            <tr class="total-row">
              <td>Total Payable Days</td>
              <td>${data.presentDays + (data.halfDays * 0.5)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Earnings Table -->
        <h3 class="section-title">Earnings</h3>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Monthly Salary</td>
              <td>₹${data.monthlySalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Earned Salary (Based on Attendance)</td>
              <td>₹${data.earnedSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td>Total Earnings</td>
              <td>₹${data.earnedSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <!-- Deductions Table -->
        <h3 class="section-title">Deductions</h3>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Advance Payments / Deductions</td>
              <td>₹${data.advancePaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td>Total Deductions</td>
              <td>₹${data.advancePaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <!-- Footer / Signature -->
        <div class="footer-summary">
          <div class="summary-details">
            <div class="summary-label">Net Pay</div>
            <div class="summary-value net-pay">₹${data.netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            
            <div class="summary-label">Bank Account</div>
            <div class="summary-value">${data.accountNumber || "N/A"}</div>
            
            <div class="summary-label">Bank Name</div>
            <div class="summary-value">${data.bankName || "N/A"}</div>
          </div>
          
          <div class="signature-section">
            <div class="signature-label">Authorized by:</div>
            <div class="signature-line">For ${data.companyName}</div>
          </div>
        </div>

      </div>
    </div>
  `;
}
