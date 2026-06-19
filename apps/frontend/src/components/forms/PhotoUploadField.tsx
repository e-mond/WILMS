'use client';

import { forwardRef } from 'react';
import { PhotoUpload } from '@/components/forms/PhotoUpload';
import { cn } from '@/utils/cn';

export interface PhotoUploadFieldProps {
  id: string;
  name: string;
  onChange: (file: File | null) => void;
  onBlur?: () => void;
  value?: File | null;
  hasError?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
  registrationSessionId?: string;
  officerId?: string;
  captureTarget?: 'borrower' | 'guarantor';
  uploadPurpose?: import('@/types/upload').UploadPurpose;
  entityId?: string;
  onUploadRecordChange?: (record: import('@/types/upload').UploadRecord | null) => void;
}

export const PhotoUploadField = forwardRef<HTMLInputElement, PhotoUploadFieldProps>(
  function PhotoUploadField(
    {
      id,
      name,
      onChange,
      onBlur,
      value,
      hasError = false,
      error,
      className,
      disabled,
      registrationSessionId,
      officerId,
      captureTarget,
      uploadPurpose,
      entityId,
      onUploadRecordChange,
    },
    ref,
  ) {
    return (
      <div className={cn(className)}>
        <PhotoUpload
          id={id}
          value={value}
          hasError={hasError}
          error={error}
          disabled={disabled}
          onBlur={onBlur}
          onChange={onChange}
          registrationSessionId={registrationSessionId}
          officerId={officerId}
          captureTarget={captureTarget}
          uploadPurpose={uploadPurpose}
          entityId={entityId}
          onUploadRecordChange={onUploadRecordChange}
        />
        <input ref={ref} type="hidden" name={name} value={value?.name ?? ''} readOnly tabIndex={-1} />
      </div>
    );
  },
);
