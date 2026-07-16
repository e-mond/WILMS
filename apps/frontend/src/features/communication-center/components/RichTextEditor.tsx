'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { sanitizeHtml } from '@/utils/html-sanitize';

const DRAFT_PREFIX = 'wilms-composer-draft:';

const EMOJIS = ['😀', '👍', '🎉', '📢', '💰', '📅', '✅', '⚠️', '📧', '🏦'];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  draftKey?: string;
  placeholder?: string;
  className?: string;
}

function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function RichTextEditor({
  value,
  onChange,
  draftKey = 'default',
  placeholder = 'Write your message...',
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const storageKey = `${DRAFT_PREFIX}${draftKey}`;

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && !value && editorRef.current) {
        editorRef.current.innerHTML = saved;
        onChange(saved);
      }
    } catch {
      // localStorage may be unavailable.
    }
  }, [onChange, storageKey, value]);

  const persistDraft = useCallback(
    (html: string) => {
      onChange(html);
      try {
        localStorage.setItem(storageKey, html);
      } catch {
        // Ignore quota errors.
      }
    },
    [onChange, storageKey],
  );

  const handleInput = () => {
    const html = editorRef.current?.innerHTML ?? '';
    persistDraft(html);
  };

  const handleLink = () => {
    const url = window.prompt('Enter URL');
    if (url) {
      exec('createLink', url);
      handleInput();
    }
  };

  const handleImage = () => {
    const url = window.prompt('Enter image URL');
    if (url) {
      exec('insertImage', url);
      handleInput();
    }
  };

  const handleTable = () => {
    exec(
      'insertHTML',
      '<table><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td></td><td></td></tr></tbody></table>',
    );
    handleInput();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      exec('bold');
      handleInput();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'i') {
      event.preventDefault();
      exec('italic');
      handleInput();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'u') {
      event.preventDefault();
      exec('underline');
      handleInput();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      exec(event.shiftKey ? 'redo' : 'undo');
      handleInput();
    }
  };

  const toolbarButton = (label: string, action: () => void) => (
    <Button type="button" size="sm" variant="secondary" onClick={action} aria-label={label}>
      {label}
    </Button>
  );

  return (
    <div className={cn('rounded-md border border-border bg-card', className)}>
      <div className="flex flex-wrap gap-wilms-1 border-b border-border p-wilms-2">
        {toolbarButton('B', () => { exec('bold'); handleInput(); })}
        {toolbarButton('I', () => { exec('italic'); handleInput(); })}
        {toolbarButton('U', () => { exec('underline'); handleInput(); })}
        {toolbarButton('H2', () => { exec('formatBlock', 'h2'); handleInput(); })}
        {toolbarButton('• List', () => { exec('insertUnorderedList'); handleInput(); })}
        {toolbarButton('1. List', () => { exec('insertOrderedList'); handleInput(); })}
        {toolbarButton('Quote', () => { exec('formatBlock', 'blockquote'); handleInput(); })}
        {toolbarButton('Code', () => { exec('formatBlock', 'pre'); handleInput(); })}
        {toolbarButton('Link', handleLink)}
        {toolbarButton('Table', handleTable)}
        {toolbarButton('Image', handleImage)}
        {toolbarButton('HR', () => { exec('insertHorizontalRule'); handleInput(); })}
        {toolbarButton('Undo', () => { exec('undo'); handleInput(); })}
        {toolbarButton('Redo', () => { exec('redo'); handleInput(); })}
        <Button
          type="button"
          size="sm"
          variant={showEmojis ? 'primary' : 'secondary'}
          onClick={() => setShowEmojis((current) => !current)}
        >
          Emoji
        </Button>
        <Button
          type="button"
          size="sm"
          variant={showPreview ? 'primary' : 'secondary'}
          onClick={() => setShowPreview((current) => !current)}
        >
          {showPreview ? 'Edit' : 'Preview'}
        </Button>
      </div>

      {showEmojis ? (
        <div className="flex flex-wrap gap-wilms-2 border-b border-border p-wilms-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="text-lg"
              onClick={() => {
                exec('insertText', emoji);
                handleInput();
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      {showPreview ? (
        <div
          className="prose prose-sm max-w-none p-wilms-4 text-text-primary"
          // Security: sanitize preview HTML to avoid stored XSS via composed rich text.
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
        />
      ) : (
        <div
          ref={editorRef}
          role="textbox"
          aria-label="Message body"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          className="min-h-[180px] p-wilms-4 text-body text-text-primary outline-none empty:before:text-text-muted empty:before:content-[attr(data-placeholder)]"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
        />
      )}
    </div>
  );
}
