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
  return `
    <div style="font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background-color: #ffffff; color: #333333; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
      
      <!-- Header Section -->
      <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px; color: #1e3a8a; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${data.companyName}</h1>
        <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563;">${data.companyAddress}</p>
        <div style="margin-top: 20px; display: inline-block; background-color: #eff6ff; color: #1d4ed8; padding: 8px 24px; border-radius: 9999px; font-weight: 700; font-size: 16px; letter-spacing: 0.5px;">
          PAYSLIP FOR THE MONTH OF ${data.month.toUpperCase()} ${data.year}
        </div>
      </div>

      <!-- Employee Details -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
        <tbody>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600; width: 20%;">Employee Name</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; width: 30%; font-weight: 700; color: #111827;">${data.employeeName}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600; width: 20%;">Employee ID</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; width: 30%; color: #374151;">${data.employeeId}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600;">Designation</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #374151;">${data.designation}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600;">Date of Joining</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #374151;">${data.dateOfJoining}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600;">Bank Name</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #374151;">${data.bankName || "N/A"}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600;">Account No.</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-family: monospace; font-size: 13px; color: #374151;">${data.accountNumber || "N/A"}</td>
          </tr>
        </tbody>
      </table>

      <!-- Attendance Summary -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 10px; font-size: 16px; color: #1f2937; border-left: 4px solid #3b82f6; padding-left: 10px;">Attendance Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: center;">
          <thead>
            <tr style="background-color: #f3f4f6; color: #374151;">
              <th style="padding: 10px; border: 1px solid #e5e7eb;">Total Days in Month</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb;">Present Days</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb;">Half Days</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb;">Absent Days</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600;">${data.presentDays + (data.halfDays * 0.5) + data.absentDays}</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; color: #059669; font-weight: 600;">${data.presentDays}</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; color: #d97706; font-weight: 600;">${data.halfDays}</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; color: #dc2626; font-weight: 600;">${data.absentDays}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Salary Details -->
      <div style="display: flex; gap: 20px; margin-bottom: 30px;">
        
        <!-- Earnings -->
        <div style="flex: 1;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr>
                <th style="padding: 10px; border: 1px solid #e5e7eb; background-color: #ecfdf5; color: #065f46; text-align: left; width: 60%;">EARNINGS</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; background-color: #ecfdf5; color: #065f46; text-align: right; width: 40%;">AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #374151;">Basic Monthly Salary</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; color: #374151;">${data.monthlySalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #111827;">Actual Earned Salary<br/><span style="font-size: 11px; font-weight: 400; color: #6b7280;">(Based on attendance)</span></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">${data.earnedSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Deductions -->
        <div style="flex: 1;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr>
                <th style="padding: 10px; border: 1px solid #e5e7eb; background-color: #fef2f2; color: #991b1b; text-align: left; width: 60%;">DEDUCTIONS / ADVANCES</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; background-color: #fef2f2; color: #991b1b; text-align: right; width: 40%;">AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #374151;">Advance Payments Received</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; color: #374151;">${data.advancePaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #111827;">Total Deductions</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">${data.advancePaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- Net Payable -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
        <div style="font-size: 14px; color: #475569;">
          <div><strong>Net Payable Salary:</strong> Actual Earned - Advances</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Net Pay</div>
          <div style="font-size: 28px; font-weight: 900; color: #0f172a;">₹ ${data.netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <!-- Signatures -->
      <div style="display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px;">
        <div style="text-align: center; width: 200px;">
          <div style="border-top: 1px solid #9ca3af; padding-top: 10px; font-size: 14px; font-weight: 600; color: #374151;">Employer Signature</div>
        </div>
        <div style="text-align: center; width: 200px;">
          <div style="border-top: 1px solid #9ca3af; padding-top: 10px; font-size: 14px; font-weight: 600; color: #374151;">Employee Signature</div>
        </div>
      </div>
      
      <!-- Footer Note -->
      <div style="text-align: center; margin-top: 40px; font-size: 11px; color: #9ca3af; font-style: italic;">
        This is a computer-generated document. No signature is strictly required for internal records.
      </div>
    </div>
  `;
}
