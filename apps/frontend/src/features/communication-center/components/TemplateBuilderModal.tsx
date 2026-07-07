'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { RichTextEditor } from '@/features/communication-center/components/RichTextEditor';
import { communicationService } from '@/services';
import { useToast } from '@/hooks/useToast';
import type { CommunicationChannel } from '@/types/communication';

const TEMPLATE_VARIABLES = [
  '{{firstName}}',
  '{{loanNumber}}',
  '{{amount}}',
  '{{collector}}',
  '{{dueDate}}',
];

interface TemplateBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function TemplateBuilderModal({ isOpen, onClose, onSaved }: TemplateBuilderModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('announcement');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [channels, setChannels] = useState<CommunicationChannel[]>(['EMAIL', 'IN_APP']);
  const [preview, setPreview] = useState<{ subject: string; bodyHtml: string } | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const saveTemplate = useMutation({
    mutationFn: () =>
      communicationService.createTemplate({
        name,
        category,
        subject,
        bodyHtml,
        bodyText: htmlToText(bodyHtml),
        channels,
      }),
    onSuccess: () => {
      toastSuccess('Template saved');
      onSaved?.();
      onClose();
    },
    onError: () => toastError('Failed to save template'),
  });

  const previewTemplate = useMutation({
    mutationFn: () =>
      communicationService.previewTemplate({
        subject,
        bodyHtml,
        bodyText: htmlToText(bodyHtml),
      }),
    onSuccess: (result) => setPreview({ subject: result.subject, bodyHtml: result.bodyHtml }),
    onError: () => toastError('Preview failed'),
  });

  function insertVariable(variable: string) {
    setBodyHtml((current) => `${current}<p>${variable}</p>`);
  }

  function toggleChannel(channel: CommunicationChannel) {
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((entry) => entry !== channel)
        : [...current, channel],
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Template Builder">
      <div className="space-y-wilms-4">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" aria-label="Template name" />
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="announcement">Announcement</option>
          <option value="reminder">Reminder</option>
          <option value="onboarding">Onboarding</option>
          <option value="marketing">Marketing</option>
        </Select>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject with {{variables}}" aria-label="Subject" />

        <div className="flex flex-wrap gap-wilms-2">
          {TEMPLATE_VARIABLES.map((variable) => (
            <Button key={variable} type="button" size="sm" variant="secondary" onClick={() => insertVariable(variable)}>
              {variable}
            </Button>
          ))}
        </div>

        <RichTextEditor value={bodyHtml} onChange={setBodyHtml} draftKey="template-builder" />

        <div className="flex flex-wrap gap-wilms-3">
          {(['EMAIL', 'SMS', 'IN_APP'] as CommunicationChannel[]).map((channel) => (
            <label key={channel} className="flex items-center gap-wilms-2 text-small">
              <input
                type="checkbox"
                checked={channels.includes(channel)}
                onChange={() => toggleChannel(channel)}
              />
              {channel}
            </label>
          ))}
        </div>

        {preview ? (
          <div className="rounded-md border border-border bg-background p-wilms-4">
            <p className="text-small font-semibold text-text-muted">Preview</p>
            <p className="text-body font-semibold">{preview.subject}</p>
            <div className="prose prose-sm mt-wilms-2" dangerouslySetInnerHTML={{ __html: preview.bodyHtml }} />
          </div>
        ) : null}

        <div className="flex justify-end gap-wilms-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" disabled={previewTemplate.isPending} onClick={() => previewTemplate.mutate()}>
            Preview
          </Button>
          <Button
            type="button"
            disabled={!name.trim() || !subject.trim() || saveTemplate.isPending}
            onClick={() => saveTemplate.mutate()}
          >
            Save template
          </Button>
        </div>
      </div>
    </Modal>
  );
}
