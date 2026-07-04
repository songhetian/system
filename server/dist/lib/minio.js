// ponytail: MinIO 存储模块 - 生产环境请安装 minio 依赖并替换此文件
// npm install minio
class MockMinIO {
    files = new Map();
    async putObject(bucketName, objectName, data) {
        this.files.set(`${bucketName}/${objectName}`, { data, meta: {} });
    }
    async getObject(bucketName, objectName) {
        const file = this.files.get(`${bucketName}/${objectName}`);
        if (!file)
            throw new Error('Object not found');
        return file.data;
    }
    async statObject(bucketName, objectName) {
        const file = this.files.get(`${bucketName}/${objectName}`);
        if (!file)
            throw new Error('Object not found');
        return { size: file.data.length, lastModified: new Date() };
    }
    async removeObject(bucketName, objectName) {
        this.files.delete(`${bucketName}/${objectName}`);
    }
    async makeBucket(bucketName) {
    }
    async bucketExists(bucketName) {
        return true;
    }
    async presignedUrl(method, bucketName, objectName, expires) {
        return `http://localhost:9000/${bucketName}/${objectName}?expires=${Date.now() + expires * 1000}`;
    }
}
export const minioClient = new MockMinIO();
export async function uploadFile(bucket, filename, data) {
    await minioClient.putObject(bucket, filename, data);
    return `/${bucket}/${filename}`;
}
export async function downloadFile(bucket, filename) {
    return minioClient.getObject(bucket, filename);
}
export async function getFileUrl(bucket, filename, expiresMinutes = 60) {
    return minioClient.presignedUrl('GET', bucket, filename, expiresMinutes * 60);
}
export async function deleteFile(bucket, filename) {
    await minioClient.removeObject(bucket, filename);
}
//# sourceMappingURL=minio.js.map