import instance from '@/config/axios';
import type { ApiResponse } from '@/types/api';
import type { DictItem, DictPageParams, DictPageResult } from '../types/dict';

// 字典项分页查询
export const fetchDictPage = (params: DictPageParams): Promise<DictPageResult> => {
  return instance.post('/admin/dict/page', params);
};

// 创建字典项
export const createDictItem = (data: Omit<DictItem, 'id' | 'createTime' | 'updateTime' | 'version' | 'isActive' | 'isDeleted'>): Promise<ApiResponse<DictItem>> => {
  return instance.post('/admin/dict/create', data);
};

// 更新字典项
export const updateDictItem = (data: DictItem): Promise<ApiResponse<DictItem>> => {
  return instance.post('/admin/dict/update', data);
};

// 删除字典项
export const deleteDictItem = (id: number): Promise<ApiResponse<null>> => {
  return instance.post(`/admin/dict/delete/${id}`);
};

// 获取字典项详情
export const getDictItem = (id: number): Promise<ApiResponse<DictItem>> => {
  return instance.get(`/admin/dict/${id}`);
}; 