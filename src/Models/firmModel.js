// models/firmModel.js
import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';
import User from './userModel.js'; // Import User





const Firm = sequelize.define('Firm', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  firmName: { type: DataTypes.STRING, allowNull: false },
  contact: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  gstNumber: { type: DataTypes.STRING },
  panNumber: { type: DataTypes.STRING },
  deliveryChallanInitial: { type: DataTypes.STRING },
  saleEntryInitialGST: { type: DataTypes.STRING },
  saleEntryInitialNoGST: { type: DataTypes.STRING },
  saleReceiptInitial: { type: DataTypes.STRING },
  saleQuotationInitial: { type: DataTypes.STRING },
  purchaseRefInitial: { type: DataTypes.STRING },
  proformaInitialGST: { type: DataTypes.STRING },
  proformaInitialNoGST: { type: DataTypes.STRING },
  accountName: { type: DataTypes.STRING },
  bankName: { type: DataTypes.STRING },
  ifscCode: { type: DataTypes.STRING },
  accountNumber: { type: DataTypes.STRING },
  firmLogo: { type: DataTypes.STRING },

  // ✅ Foreign key to User
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'firms',
  timestamps: true
});

// ✅ Set association
User.hasOne(Firm, { foreignKey: 'userId' });
Firm.belongsTo(User, { foreignKey: 'userId' });



export default Firm;
