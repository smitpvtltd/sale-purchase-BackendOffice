import dotenv from 'dotenv';
import app from './app.js';
import sequelize from './Config/db.js';



dotenv.config();

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Sync models with database tables (adjust options as needed)
    await sequelize.sync({ alter: true }); 

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1); // exit process if DB connection fails
  }
})();
