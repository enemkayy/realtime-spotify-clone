
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    
    // -----------------------------
    console.log("Attempting to connect with URI:", process.env.MONGODB_URI);
    // -----------------------------

    // Kết nối đến MongoDB sử dụng mongoose
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB connected successfully!");
  } catch (err) {
    // In lỗi chi tiết
    console.error("❌ Failed to connect to MongoDB:", err.message);
    
    // Thoát khỏi ứng dụng nếu không kết nối được DB
    process.exit(1); 
  }
};