// Run this script to add 'status' field to all existing messages
// This is a ONE-TIME migration script

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from './Models/Message.js';

dotenv.config();

const updateMessages = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Update all messages that don't have a status field
    const result = await Message.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'sent' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} messages with status field`);
    console.log(`Total messages checked: ${result.matchedCount}`);

    // Verify the update
    const sampleMessage = await Message.findOne().sort({ createdAt: -1 });
    console.log('\nSample message:', {
      id: sampleMessage._id,
      content: sampleMessage.content,
      status: sampleMessage.status,
      createdAt: sampleMessage.createdAt
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating messages:', error);
    process.exit(1);
  }
};

updateMessages();
