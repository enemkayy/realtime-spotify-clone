// import mongoose from "mongoose";

// export const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGODB_URI);
//     console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
//   } catch (error) {
//     console.error("❌ Failed to connect to MongoDB:", error.message);
//     process.exit(1);
//   }
// };

import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // --- BƯỚC DEBUG QUAN TRỌNG ---
    // Hãy in chuỗi kết nối ra để xem nó có giá trị hay không
    console.log("Attempting to connect with URI:", process.env.MONGODB_URI);
    // -----------------------------

    // Đảm bảo rằng bạn đang truyền chuỗi URI vào
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB connected successfully!");
  } catch (err) {
    // In lỗi chi tiết
    console.error("❌ Failed to connect to MongoDB:", err.message);
    
    // Thoát khỏi ứng dụng nếu không kết nối được DB
    process.exit(1); 
  }
};