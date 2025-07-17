export interface DictItem {
  id: number;
  dictType: string;
  dictCode: string;
  dictLabel: string;
  dictValue: string;
  sort: number;
  lang: string;
  version: number;
  isActive: number;
  isDeleted: number;
  createTime: string;
  updateTime: string;
}

export interface DictPageParams {
  pageNum: number;
  pageSize: number;
  dictType?: string;
  dictCode?: string;
  dictLabel?: string;
}

export interface DictPageResult {
  code: number;
  msg: string;
  data: {
    total: number;
    list: DictItem[];
  };
} 