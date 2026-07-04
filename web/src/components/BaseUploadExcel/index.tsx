// 修改点：1. Upload.Dragger→Upload 2. maxCount→limit 3. UploadItem 类型从 interface.d.ts 导入 4. 修复隐式 any 5. 修复 onChange 参数类型
import { Upload, Button, Message } from '@arco-design/web-react';
import type { UploadItem, RequestOptions } from '@arco-design/web-react/es/Upload/interface';
import { IconUpload, IconFile } from '@arco-design/web-react/icon';
import { useState } from 'react';
import styles from './style.module.css';

type BaseUploadExcelProps<T = unknown> = {
  action?: string;
  onSuccess?: (response: T, file: File) => void;
  onError?: (error: Error, file: File) => void;
  maxCount?: number;
  tip?: string;
  accept?: string;
  disabled?: boolean;
};

function BaseUploadExcel<T = unknown>({
  action,
  onSuccess,
  onError,
  maxCount = 1,
  tip = '仅支持 .xlsx / .xls 格式文件',
  accept = '.xlsx,.xls',
  disabled = false,
}: BaseUploadExcelProps<T>) {
  const [fileList, setFileList] = useState<UploadItem[]>([]);

  const customRequest = (option: RequestOptions) => {
    const file = option.file as File;

    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      Message.error('请上传 Excel 文件（.xlsx / .xls）');
      option.onError?.(new Error('Invalid file type'));
      return;
    }

    if (!action) {
      onSuccess?.(null as unknown as T, file);
      option.onSuccess?.(null as unknown as object);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', action);

    xhr.upload.onprogress = (e) => {
      if (e.total > 0) {
        option.onProgress?.((e.loaded / e.total) * 100, e);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          onSuccess?.(response as T, file);
          option.onSuccess?.(response);
        } catch {
          onSuccess?.(xhr.responseText as unknown as T, file);
          option.onSuccess?.({ data: xhr.responseText });
        }
      } else {
        const error = new Error(`Upload failed: ${xhr.status}`);
        onError?.(error, file);
        option.onError?.(error);
      }
    };

    xhr.onerror = () => {
      const error = new Error('Network error');
      onError?.(error, file);
      option.onError?.(error);
    };

    xhr.send(formData);
  };

  return (
    <div className={styles.container}>
      <Upload
        accept={accept}
        limit={maxCount}
        fileList={fileList}
        onChange={(fileListNew, _file) => setFileList(fileListNew)}
        customRequest={customRequest}
        disabled={disabled}
        tip={
          <div className={styles.tip}>
            <IconFile className={styles.tipIcon} />
            <span>{tip}</span>
          </div>
        }
      >
        <div className={styles.dragContent}>
          <IconUpload className={styles.uploadIcon} />
          <p className={styles.dragText}>点击或拖拽文件到此处上传</p>
          <Button type="primary" icon={<IconUpload />} disabled={disabled}>
            选择文件
          </Button>
        </div>
      </Upload>
    </div>
  );
}

export default BaseUploadExcel;
