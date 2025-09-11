const mongoose = require('mongoose');
const Table = require('./models/tableModel');
const config = require('./config/config');

const debugTables = async () => {
  try {
    await mongoose.connect(config.databaseURI);
    console.log('🔍 Tables in database:');
    
    const tables = await Table.find().sort({ tableNo: 1 });
    
    if (tables.length === 0) {
      console.log('❌ No tables found in database!');
    } else {
      tables.forEach(table => {
        console.log(`📋 Table ${table.tableNo}: ObjectId = ${table._id}, Status = ${table.status}`);
      });
    }
    
    console.log(`\n📊 Total tables: ${tables.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

debugTables();

