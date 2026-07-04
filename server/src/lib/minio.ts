// ponytail: MinIO 存储模块 - 生产环境请安装 minio 依赖并替换此文件
// npm install minio

class MockMinIO {
  private files = new Map<string, { data: Buffer; meta: Record<string, string> }>();

  async putObject(bucketName: string, objectName: string, data: Buffer): Promise<void> {
    this.files.set(`${bucketName}/${objectName}`, { data, meta: {} });
  }

  async getObject(bucketName: string, objectName: string): Promise<Buffer> {
    const file = this.files.get(`${bucketName}/${objectName}`);
    if (!file) throw new Error('Object not found');
    return file.data;
  }

  async statObject(bucketName: string, objectName: string): Promise<{ size: number; lastModified: Date }> {
    const file = this.files.get(`${bucketName}/${objectName}`);
    if (!file) throw new Error('Object not found');
    return { size: file.data.length, lastModified: new Date() };
  }

  async removeObject(bucketName: string, objectName: string): Promise<void> {
    this.files.delete(`${bucketName}/${objectName}`);
  }

  async makeBucket(bucketName: string): Promise<void> {
  }

  async bucketExists(bucketName: string): Promise<boolean> {
    return true;
  }

  async presignedUrl(method: string, bucketName: string, objectName: string, expires: number): Promise<string> {
    return `http://localhost:9000/${bucketName}/${objectName}?expires=${Date.now() + expires * 1000}`;
  }
}

export const minioClient = new MockMinIO();

export async function uploadFile(bucket: string, filename: string, data: Buffer): Promise<string> {
  await minioClient.putObject(bucket, filename, data);
  return `/${bucket}/${filename}`;
}

export async function downloadFile(bucket: string, filename: string): Promise<Buffer> {
  return minioClient.getObject(bucket, filename);
}

export async function getFileUrl(bucket: string, filename: string, expiresMinutes: number = 60): Promise<string> {
  return minioClient.presignedUrl('GET', bucket, filename, expiresMinutes * 60);
}

export async function deleteFile(bucket: string, filename: string): Promise<void> {
  await minioClient.removeObject(bucket, filename);
}