import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { getUploadConfig, isCloudinaryConfigured } from './config.js';
import type { StoredUpload, UploadProvider } from './types.js';

const metadata = new Map<string, StoredUpload>();

function configureCloudinary(): void {
  const config = getUploadConfig();
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

export class CloudinaryUploadProvider implements UploadProvider {
  constructor() {
    if (!isCloudinaryConfigured()) {
      throw new Error('Cloudinary credentials are not configured.');
    }
    configureCloudinary();
  }

  async save(input: {
    purpose: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    entityId?: string;
    buffer: Buffer;
  }): Promise<StoredUpload> {
    const config = getUploadConfig();
    const id = randomUUID();
    const publicId = `${config.cloudinary.folder}/${input.purpose}/${id}`;

    const result = await new Promise<{
      public_id: string;
      secure_url: string;
      bytes: number;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'auto',
          folder: config.cloudinary.folder,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error('Cloudinary upload failed.'));
            return;
          }

          resolve({
            public_id: uploadResult.public_id,
            secure_url: uploadResult.secure_url,
            bytes: uploadResult.bytes,
          });
        },
      );

      stream.end(input.buffer);
    });

    const record: StoredUpload = {
      id,
      purpose: input.purpose,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: result.bytes ?? input.sizeBytes,
      entityId: input.entityId,
      uploadedAt: new Date().toISOString(),
      storageKey: result.public_id,
      url: result.secure_url,
    };

    metadata.set(id, record);
    return record;
  }

  async get(id: string): Promise<StoredUpload | null> {
    return metadata.get(id) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const record = metadata.get(id);
    if (!record) {
      return false;
    }

    await cloudinary.uploader.destroy(record.storageKey, { resource_type: 'auto' });
    metadata.delete(id);
    return true;
  }

  async readBuffer(id: string): Promise<Buffer | null> {
    const record = metadata.get(id);
    if (!record) {
      return null;
    }

    const response = await fetch(record.url);
    if (!response.ok) {
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  }

  async getSignedUploadParams(): Promise<{
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    folder: string;
  }> {
    const config = getUploadConfig();
    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      timestamp,
      folder: config.cloudinary.folder,
    };
    const signature = cloudinary.utils.api_sign_request(params, config.cloudinary.apiSecret);

    return {
      cloudName: config.cloudinary.cloudName,
      apiKey: config.cloudinary.apiKey,
      timestamp,
      signature,
      folder: config.cloudinary.folder,
    };
  }
}
