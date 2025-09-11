#!/usr/bin/env node

const mongoose = require('mongoose');
const Table = require('./models/tableModel');
require('dotenv').config();

// Database connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/pos-system');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};

// Test setup tables
const testSetup = async () => {
    try {
        console.log('🧪 Testing table setup...\n');
        
        // Connect to database
        await connectDB();
        
        // Check current tables
        const existingTables = await Table.find().sort({ tableNo: 1 });
        console.log('📊 Current tables in database:');
        
        if (existingTables.length === 0) {
            console.log('   No tables found.\n');
        } else {
            existingTables.forEach(table => {
                console.log(`   Table ${table.tableNo}: ${table.status} (${table.seats} seats)`);
            });
            console.log(`\n   Total: ${existingTables.length} tables\n`);
        }
        
        // Create sample tables if none exist
        if (existingTables.length === 0) {
            console.log('🔧 Creating sample tables...');
            
            const sampleTables = [
                { tableNo: 1, seats: 2, status: "Available" },
                { tableNo: 2, seats: 4, status: "Available" },
                { tableNo: 3, seats: 6, status: "Available" },
                { tableNo: 4, seats: 2, status: "Available" },
                { tableNo: 5, seats: 8, status: "Available" },
                { tableNo: 6, seats: 4, status: "Available" },
                { tableNo: 7, seats: 2, status: "Available" },
                { tableNo: 8, seats: 6, status: "Available" },
                { tableNo: 9, seats: 4, status: "Available" },
                { tableNo: 10, seats: 10, status: "Available" }
            ];
            
            const createdTables = await Table.insertMany(sampleTables);
            console.log(`✅ Created ${createdTables.length} tables successfully!`);
            
            createdTables.forEach(table => {
                console.log(`   ✓ Table ${table.tableNo}: ${table.status} (${table.seats} seats)`);
            });
        }
        
        // Test table access by ID
        console.log('\n🔍 Testing table access...');
        for (let i = 1; i <= 3; i++) {
            try {
                const table = await Table.findOne({ tableNo: i });
                if (table) {
                    console.log(`   ✅ Table ${i}: Found (ID: ${table._id})`);
                } else {
                    console.log(`   ❌ Table ${i}: Not found`);
                }
            } catch (error) {
                console.log(`   ❌ Table ${i}: Error - ${error.message}`);
            }
        }
        
        console.log('\n🎉 Setup test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Database disconnected');
    }
};

// Run the test
testSetup();
