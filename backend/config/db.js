const mongoose = require('mongoose');

// MongoDB connection options
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
};

// MongoDB connection function
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whispernet';
        const conn = await mongoose.connect(mongoURI, options);
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Handle connection events
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected from MongoDB');
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('Mongoose connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Export connection function
module.exports = connectDB;

// Export mongoose instance for use in models
module.exports.mongoose = mongoose;
