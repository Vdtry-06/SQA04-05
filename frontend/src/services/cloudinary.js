export async function uploadToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  
  if (!cloudName) throw new Error('Lỗi: Cloud name không được cấu hình');
  if (!uploadPreset) throw new Error('Lỗi: Upload preset không được cấu hình');

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', uploadPreset);
  fd.append('resource_type', 'auto');

  try {
    console.log(`📤 Đang upload: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
    
    // Thêm timeout 30 giây
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const res = await fetch(url, { 
      method: 'POST', 
      body: fd,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`📡 Response status: ${res.status}`);
    
    // Đọc response
    let data;
    try {
      data = await res.json();
      console.log('📦 Response data:', data);
    } catch (err) {
      const text = await res.text();
      console.error('Lỗi parse JSON:', text);
      throw new Error(`Response không phải JSON: ${text}`);
    }
    
    // Xử lý lỗi từ Cloudinary
    if (data.error) {
      const errorMsg = data.error.message || JSON.stringify(data.error);
      console.error('Lỗi Cloudinary:', errorMsg);
      throw new Error(`${errorMsg}`);
    }
    
    // Check status HTTP
    if (!res.ok) {
      console.error('HTTP error:', res.status, res.statusText);
      throw new Error(`Upload thất bại: HTTP ${res.status} ${res.statusText}`);
    }
    
    // Success - kiểm tra secure_url
    if (data.secure_url) {
      console.log(`Upload thành công!`);
      console.log(`URL: ${data.secure_url}`);
      return data;
    }
    
    // Nếu 200 OK nhưng không có secure_url
    console.error('Response 200 OK nhưng không có secure_url');
    console.error('Data nhận được:', JSON.stringify(data, null, 2));
    throw new Error('Upload không trả về URL');
    
  } catch (error) {
    // Catch timeout
    if (error.name === 'AbortError') {
      console.error('Upload timeout (quá 30 giây)');
      throw new Error('Upload timeout - mạng quá chậm');
    }
    
    console.error('Upload error:', error.message);
    throw error;
  }
}

// Debug: Log config
export function debugCloudinaryConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  console.log('🔍 Cloudinary Config:', {
    cloudName,
    uploadPreset,
    configured: !!(cloudName && uploadPreset)
  });
}