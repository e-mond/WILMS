import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DOCUMENT_CAMERA_DENIED_MESSAGE,
  DocumentUpload,
} from '@/components/forms/DocumentUpload';
import { UPLOAD_PURPOSE } from '@/types/upload';

const uploadFileWithOfflineQueue = vi.fn();
const deleteUploadedFile = vi.fn();

vi.mock('@/utils/upload-file', () => ({
  uploadFileWithOfflineQueue: (...args: unknown[]) => uploadFileWithOfflineQueue(...args),
  deleteUploadedFile: (...args: unknown[]) => deleteUploadedFile(...args),
  isQueuedUpload: (result: { queued?: boolean }) => Boolean(result?.queued),
}));

function StatefulDocumentUpload(props: {
  uploadPurpose?: (typeof UPLOAD_PURPOSE)[keyof typeof UPLOAD_PURPOSE];
}) {
  const [value, setValue] = useState<File | null>(null);

  return (
    <DocumentUpload
      id="idDocument"
      label="National ID scan or photo"
      value={value}
      onChange={setValue}
      uploadPurpose={props.uploadPurpose}
      onUploadRecordChange={vi.fn()}
    />
  );
}

describe('DocumentUpload', () => {
  beforeEach(() => {
    uploadFileWithOfflineQueue.mockReset();
    deleteUploadedFile.mockReset();
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => 'blob:preview'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });
  });

  it('renders upload, scan, and capture-using-mobile actions on desktop', () => {
    render(
      <DocumentUpload
        id="idDocument"
        label="National ID scan or photo"
        onChange={vi.fn()}
        registrationSessionId="reg-1"
        officerId="officer-1"
      />,
    );

    expect(screen.getByRole('button', { name: 'Upload file' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scan document' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Capture using mobile' })).toBeInTheDocument();
    expect(document.getElementById('idDocument-camera')).toHaveAttribute('capture', 'environment');
  });

  it('accepts a valid image from the file picker', async () => {
    render(<StatefulDocumentUpload />);

    const file = new File(['image'], 'id-scan.jpg', { type: 'image/jpeg' });
    const fileInput = document.getElementById('idDocument') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByRole('img', { name: /preview of id-scan.jpg/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('rejects unsupported file types with an inline error', () => {
    const onChange = vi.fn();

    render(
      <DocumentUpload id="idDocument" label="National ID scan or photo" onChange={onChange} />,
    );

    const file = new File(['text'], 'notes.txt', { type: 'text/plain' });
    const fileInput = document.getElementById('idDocument') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent(/PDF or image/i);
  });

  it('uploads through the shared pipeline and only commits after success', async () => {
    uploadFileWithOfflineQueue.mockResolvedValue({
      id: 'upload-1',
      url: 'https://cdn.example/id.jpg',
      fileName: 'id-scan.jpg',
      purpose: UPLOAD_PURPOSE.REGISTRATION_ATTACHMENT,
      mimeType: 'image/jpeg',
      sizeBytes: 5,
      uploadedAt: new Date().toISOString(),
    });

    const onChange = vi.fn();
    const onUploadRecordChange = vi.fn();

    render(
      <DocumentUpload
        id="idDocument"
        label="National ID scan or photo"
        onChange={onChange}
        uploadPurpose={UPLOAD_PURPOSE.REGISTRATION_ATTACHMENT}
        onUploadRecordChange={onUploadRecordChange}
      />,
    );

    const file = new File(['image'], 'id-scan.jpg', { type: 'image/jpeg' });
    fireEvent.change(document.getElementById('idDocument') as HTMLInputElement, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(uploadFileWithOfflineQueue).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith(file);
      expect(onUploadRecordChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'upload-1' }),
      );
    });
  });

  it('clears the selection when upload fails so registration cannot submit a failed attachment', async () => {
    uploadFileWithOfflineQueue.mockRejectedValue(new Error('network'));

    const onChange = vi.fn();
    const onUploadRecordChange = vi.fn();

    render(
      <DocumentUpload
        id="idDocument"
        label="National ID scan or photo"
        onChange={onChange}
        uploadPurpose={UPLOAD_PURPOSE.REGISTRATION_ATTACHMENT}
        onUploadRecordChange={onUploadRecordChange}
      />,
    );

    const file = new File(['image'], 'id-scan.jpg', { type: 'image/jpeg' });
    fireEvent.change(document.getElementById('idDocument') as HTMLInputElement, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(null);
      expect(onUploadRecordChange).toHaveBeenCalledWith(null);
      expect(screen.getByRole('alert')).toHaveTextContent(/unable to upload document/i);
    });
  });

  it('removes a selected document', async () => {
    const user = userEvent.setup();

    render(<StatefulDocumentUpload />);

    const file = new File(['image'], 'id-scan.jpg', { type: 'image/jpeg' });
    fireEvent.change(document.getElementById('idDocument') as HTMLInputElement, {
      target: { files: [file] },
    });

    await user.click(await screen.findByRole('button', { name: 'Remove' }));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('National ID scan or photo')).toBeInTheDocument();
  });

  it('shows the camera-denied message when desktop scan permission is denied', async () => {
    const user = userEvent.setup();
    const getUserMedia = vi
      .fn()
      .mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });

    render(
      <DocumentUpload id="idDocument" label="National ID scan or photo" onChange={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Scan document' }));
    await user.click(await screen.findByRole('button', { name: 'Open camera' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(DOCUMENT_CAMERA_DENIED_MESSAGE);
    expect(screen.getByRole('button', { name: 'Upload file' })).toBeInTheDocument();
  });
});
