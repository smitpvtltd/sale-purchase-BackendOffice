import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';
import Firm from './firmModel.js';
import Customer from './customerModel.js';



const Receipt = sequelize.define('Receipt', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATE, allowNull: false },
  receiptNumber: { type: DataTypes.STRING, unique: true },
  firmId: { type: DataTypes.INTEGER, references: { model: 'firms', key: 'id' } },
  customerId: { type: DataTypes.INTEGER, references: { model: 'customers', key: 'id' } },
  totalAmount: { type: DataTypes.FLOAT, allowNull: false },
  paidAmount: { type: DataTypes.FLOAT, allowNull: false },
  netBalance: { type: DataTypes.FLOAT, allowNull: false },
  narration: { type: DataTypes.TEXT },
  paymentMode: { type: DataTypes.STRING, allowNull: false },
  payingAmount: { type: DataTypes.FLOAT, allowNull: false },
  balanceAmount: { type: DataTypes.FLOAT, allowNull: false },
  transactionId: { type: DataTypes.STRING },
  bankName: { type: DataTypes.STRING },
  chequeNumber: { type: DataTypes.STRING },
  chequeDate: { type: DataTypes.DATE },
  onlinePaymentType: { type: DataTypes.STRING },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'receipts',
  timestamps: true,
});



// ✅ Associations here
Receipt.belongsTo(Firm, { foreignKey: 'firmId', as: 'firm', onDelete: 'CASCADE', });
Firm.hasMany(Receipt, {foreignKey: 'firmId',onDelete: 'CASCADE'});
Receipt.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

export default Receipt;
