import { v2 as cloudinary } from 'cloudinary';
import { getUploadConfig, isCloudinaryConfigured } from './config.js';
import {
  buildCloudinaryTransformUrl,
  resolveCloudinaryResourceType,
  resolveTransformPresetForPurpose,
} from './cloudinary-transform.js';
import type { UploadProvider, UploadProviderResult, UploadSaveInput } from './types.js';

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

  async save(input: UploadSaveInput): Promise<UploadProviderResult> {
    const config = getUploadConfig();
    const publicId = `${input.purpose}/${input.id}`;
    const resourceType = resolveCloudinaryResourceType(input.mimeType);

    const result = await new Promise<{
      public_id: string;
      secure_url: string;
      bytes: number;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: resourceType,
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

    const preset = resolveTransformPresetForPurpose(input.purpose);
    const deliveryUrl = buildCloudinaryTransformUrl(result.public_id, preset);

    return {
      storageKey: result.public_id,
      url: deliveryUrl,
      sizeBytes: result.bytes ?? input.sizeBytes,
    };
  }

  async delete(_id: string, storageKey: string, mimeType?: string): Promise<boolean> {
    const resourceType = mimeType ? resolveCloudinaryResourceType(mimeType) : 'image';
    const response = await cloudinary.uploader.destroy(storageKey, { resource_type: resourceType });
    return response.result === 'ok' || response.result === 'not found';
  }

  async readBuffer(_storageKey: string, url: string): Promise<Buffer | null> {
    const response = await fetch(url);
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
