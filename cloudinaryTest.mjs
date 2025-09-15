import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : undefined,
});

try {
  const res = await cloudinary.api.ping();
  console.log('✅ Cloudinary está conectada correctamente');
} catch (err) {
  console.error('❌ Error conectando a Cloudinary:', err);
}
