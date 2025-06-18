import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'


// 上传产品图片
export const uploadProductHeroImage = async (file: File): Promise<ApiResponse<String>> => {
    const formData = new FormData();
    formData.append('file', file as unknown as Blob);
    formData.append('type', 'hero');
    return instance.post('/admin/file/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
} 
