import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_BORROWER_PHOTO_BYTES } from '@/constants/borrower-registration';
import { PhotoUpload } from '@/components/forms/PhotoUpload';
import { PHOTO_VALIDATION_MESSAGE } from '@/utils/photo-validation';

function StatefulPhotoUpload() {
  const [value, setValue] = useState<File | null>(null);

  return <PhotoUpload id="photo" value={value} onChange={setValue} />;
}

describe('PhotoUpload', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => 'blob:preview'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });
  });

  it('renders camera-first actions and a file-picker fallback', () => {
    render(<PhotoUpload id="photo" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Take photo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload photo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Capture using mobile' })).toBeInTheDocument();
    expect(document.getElementById('photo-camera')).toHaveAttribute('capture', 'user');
    expect(document.getElementById('photo-file')).not.toHaveAttribute('capture');
  });

  it('accepts a valid image from the file picker', () => {
    render(<StatefulPhotoUpload />);

    const file = new File(['image'], 'passport.jpg', { type: 'image/jpeg' });
    const fileInput = document.getElementById('photo-file') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByRole('img', { name: /preview of passport.jpg/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove photo' })).toBeInTheDocument();
  });

  it('rejects non-image files with an inline error', () => {
    const onChange = vi.fn();

    render(<PhotoUpload id="photo" onChange={onChange} />);

    const file = new File(['text'], 'notes.txt', { type: 'text/plain' });
    const fileInput = document.getElementById('photo-file') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent(PHOTO_VALIDATION_MESSAGE.TYPE);
  });

  it('rejects oversized images', () => {
    const onChange = vi.fn();

    render(<PhotoUpload id="photo" onChange={onChange} />);

    const file = new File(
      [new Uint8Array(MAX_BORROWER_PHOTO_BYTES + 1)],
      'large.jpg',
      { type: 'image/jpeg' },
    );
    const fileInput = document.getElementById('photo-file') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent(PHOTO_VALIDATION_MESSAGE.SIZE);
  });

  it('clears the selected photo', async () => {
    const user = userEvent.setup();

    render(<StatefulPhotoUpload />);

    const file = new File(['image'], 'passport.jpg', { type: 'image/jpeg' });
    const fileInput = document.getElementById('photo-file') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await user.click(screen.getByRole('button', { name: 'Remove photo' }));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Passport-style photo')).toBeInTheDocument();
  });
});
