import express from 'express';
import cors from 'cors';
import userRoutes from './Routes/userRoutes.js';
import categoryRoutes from './Routes/categoryRoutes.js';
import customerRoutes from './Routes/customerRoutes.js';
import productRoutes from './Routes/productRoutes.js';
import stateRoute from './Routes/stateRoute.js';
import cityRoute from './Routes/cityRoute.js';
import invoiceRoutes from './Routes/invoiceRoutes.js';
import sellRoutes from './Routes/sellRoutes.js';
import firmRoutes from './Routes/firmRoutes.js';
import purchaseRoutes from "./Routes/purchaseRoutes.js";
import purchasePartyRoutes from './Routes/purchasePartyRoutes.js';
import stockRoutes from './Routes/stockRoutes.js';
import receiptRoutes from './Routes/receiptRoutes.js';
import purchaseReceiptRoutes from "./Routes/purchaseReceiptRoutes.js";
import advanceSettlementRoutes from "./Routes/AdvanceSettlementRoutes.js";
import challanEntryRoutes from "./Routes/ChallanEntryRoutes.js";
import quotationRoutes from "./Routes/QuotationRoutes.js";
import menuRoutes from './Routes/menuRoutes.js';
import employeeRoutes from './Routes/employeeRoutes.js';



const app = express();

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files (images)
app.use('/uploads', express.static('uploads'));

// routes 
app.use('/api/users', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/product', productRoutes);
app.use('/api/state', stateRoute);
app.use('/api/city', cityRoute);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/sell', sellRoutes);
app.use('/api/firm', firmRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use('/api/purchase-party', purchasePartyRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/receipt', receiptRoutes); // for sale 
app.use("/api/purchase-receipt", purchaseReceiptRoutes); // for purchase
app.use("/api/advance-settlements", advanceSettlementRoutes); // for advance settlement
app.use("/api/challan-entry", challanEntryRoutes); // for challan entry
app.use("/api/quotation-entry", quotationRoutes); // for quotation entry
app.use("/api/menu", menuRoutes); // for dynamic menu items
app.use('/api/employee', employeeRoutes); // for employee management




export default app;
