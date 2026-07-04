import { describe, it, expect } from 'vitest';
import { minioClient, uploadFile, downloadFile, getFileUrl, deleteFile } from '../lib/minio.js';
const TEST_BUCKET = 'test-bucket';
describe('MinIO Mock - 对象存储', () => {
    it('uploadFile 和 downloadFile - 上传下载文件', async () => {
        const filename = 'test.txt';
        const content = Buffer.from('Hello MinIO!');
        const url = await uploadFile(TEST_BUCKET, filename, content);
        expect(url).toContain(filename);
        const downloaded = await downloadFile(TEST_BUCKET, filename);
        expect(downloaded.toString()).toBe('Hello MinIO!');
    });
    it('deleteFile - 删除文件后无法读取', async () => {
        const filename = 'delete-test.txt';
        await uploadFile(TEST_BUCKET, filename, Buffer.from('to delete'));
        await deleteFile(TEST_BUCKET, filename);
        await expect(downloadFile(TEST_BUCKET, filename)).rejects.toThrow();
    });
    it('getFileUrl - 返回预签名 URL', async () => {
        const filename = 'presign.txt';
        await uploadFile(TEST_BUCKET, filename, Buffer.from('presign'));
        const url = await getFileUrl(TEST_BUCKET, filename, 60);
        expect(url).toContain(TEST_BUCKET);
        expect(url).toContain(filename);
        expect(url).toContain('expires=');
    });
    it('bucketExists - 检查桶存在', async () => {
        const exists = await minioClient.bucketExists(TEST_BUCKET);
        expect(exists).toBe(true);
    });
});
//# sourceMappingURL=minio.test.js.map