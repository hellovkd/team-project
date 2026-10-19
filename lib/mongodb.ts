import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var nutritionMongooseCache: MongooseCache | undefined;
}

// 전역 캐시를 사용해 개발 중 새로고침마다 DB 연결이 늘지 않게 합니다.
const cached = global.nutritionMongooseCache ?? { conn: null, promise: null };
global.nutritionMongooseCache = cached;

export function isDatabaseConfigured() {
  return Boolean(process.env.MONGODB_URI?.trim());
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("팀 프로젝트의 MONGODB_URI를 설정해주세요.");
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  }
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    // 연결 실패 후 다음 요청에서 다시 연결할 수 있도록 실패한 Promise를 비웁니다.
    cached.promise = null;
    throw error;
  }
}
