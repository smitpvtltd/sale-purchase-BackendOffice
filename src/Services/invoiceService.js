import InvoiceNumber from "../Models/invoiceModel.js";




// export const generateInvoiceNumberService = async () => {
//   const currentYear = new Date().getFullYear();

//   let invoiceData = await InvoiceNumber.findOne({ where: { year: currentYear } });

//   // If no record found for the current year, create one
//   if (!invoiceData) {
//     invoiceData = await InvoiceNumber.create({ year: currentYear, lastInvoiceNumber: 1 });
//   } else {
//     // Increment the last invoice number
//     invoiceData.lastInvoiceNumber += 1;
//     await invoiceData.save();
//   }

//   // Generate the invoice number in the required format: INV-YYYY-XXX
//   const invoiceNumber = `INV-${currentYear}-${String(invoiceData.lastInvoiceNumber).padStart(3, '0')}`;

//   return invoiceNumber;
// };


// export const previewInvoiceNumberService = async () => {
//   const currentYear = new Date().getFullYear();
//   const invoiceData = await InvoiceNumber.findOne({ where: { year: currentYear } });
//   const nextNumber = invoiceData ? invoiceData.lastInvoiceNumber + 1 : 1;
//   return `INV-${currentYear}-${String(nextNumber).padStart(3, "0")}`;
// };











// PREVIEW (without increment)
export const previewInvoiceNumberService = async (prefix) => {
  const currentYear = new Date().getFullYear();

  const invoiceData = await InvoiceNumber.findOne({ where: { year: currentYear, prefix } });

  const nextNumber = invoiceData ? invoiceData.lastInvoiceNumber + 1 : 1;

  return `${prefix}-${currentYear}-${String(nextNumber).padStart(3, "0")}`;
};

// GENERATE (increment + save)
export const generateInvoiceNumberService = async (prefix = "GST") => {
  const currentYear = new Date().getFullYear();

  // Step 1: Find existing record
  let invoiceRecord = await InvoiceNumber.findOne({
    where: { year: currentYear, prefix }
  });

  if (invoiceRecord) {
    // Step 2: Increment if exists
    invoiceRecord.lastInvoiceNumber += 1;
    await invoiceRecord.save();
  } else {
    // Step 3: Start new series
    invoiceRecord = await InvoiceNumber.create({
      year: currentYear,
      prefix,
      lastInvoiceNumber: 1,
    });
  }

  // Step 4: Format like 'GST-2025-001'
  const formatted = `${prefix}-${currentYear}-${String(invoiceRecord.lastInvoiceNumber).padStart(3, '0')}`;
  return formatted;
};
