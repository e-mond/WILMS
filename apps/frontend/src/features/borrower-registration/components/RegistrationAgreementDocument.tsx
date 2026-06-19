'use client';

import { Avatar } from '@/components/data-display/Avatar';
import type { RegistrationAgreementContent } from '@/utils/registration-agreement-fields';
import { cn } from '@/utils/cn';

export interface RegistrationAgreementDocumentProps {
  content: RegistrationAgreementContent;
  className?: string;
  mode?: 'screen' | 'print';
}

function FieldGrid({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-x-wilms-4 gap-y-wilms-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="border-b border-border/60 pb-wilms-2">
          <dt className="text-small font-semibold uppercase tracking-wide text-text-muted">{row.label}</dt>
          <dd className="mt-wilms-1 text-body text-text-primary">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-border pb-wilms-2 text-center text-heading-2 font-bold uppercase tracking-wide text-brand-primary">
      {children}
    </h2>
  );
}

function SignatureBlock({
  label,
  imageDataUrl,
  showThumbprint = false,
  thumbprintDataUrl,
  dateLabel,
  manualThumbprintNote = false,
}: {
  label: string;
  imageDataUrl?: string | null;
  showThumbprint?: boolean;
  thumbprintDataUrl?: string | null;
  dateLabel: string;
  manualThumbprintNote?: boolean;
}) {
  return (
    <div className="space-y-wilms-3">
      <p className="text-center text-small font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <div className="grid gap-wilms-3 sm:grid-cols-2">
        <div>
          <p className="mb-wilms-1 text-center text-small text-text-muted">Signature</p>
          {imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageDataUrl}
              alt={`${label} signature`}
              className="h-20 w-full rounded-sm border border-border bg-background object-contain"
            />
          ) : (
            <div
              aria-label={`${label} signature area`}
              className="flex h-20 items-end justify-center border-b-2 border-dashed border-text-muted px-wilms-2 pb-wilms-1 text-small text-text-muted"
            >
              Sign here
            </div>
          )}
        </div>
        {showThumbprint ? (
          <div>
            <p className="mb-wilms-1 text-center text-small text-text-muted">Thumbprint</p>
            {thumbprintDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbprintDataUrl}
                alt={`${label} thumbprint`}
                className="h-20 w-full rounded-sm border border-border bg-background object-contain"
              />
            ) : manualThumbprintNote ? (
              <p className="flex h-20 items-center justify-center rounded-sm border border-dashed border-border bg-background px-wilms-2 text-center text-small text-text-muted">
                Thumbprint to be applied on printed copy
              </p>
            ) : (
              <div
                aria-label={`${label} thumbprint area`}
                className="flex h-20 items-end justify-center border-b-2 border-dashed border-text-muted px-wilms-2 pb-wilms-1 text-small text-text-muted"
              >
                Thumbprint here
              </div>
            )}
          </div>
        ) : null}
      </div>
      <div>
        <p className="mb-wilms-1 text-center text-small text-text-muted">Date</p>
        <div className="border-b-2 border-dashed border-text-muted pb-wilms-1 text-center text-body text-text-primary">
          {dateLabel}
        </div>
      </div>
    </div>
  );
}

export function RegistrationAgreementDocument({
  content,
  className,
  mode = 'screen',
}: RegistrationAgreementDocumentProps) {
  const { legal } = content;
  const isPrint = mode === 'print';

  return (
    <article
      className={cn(
        'registration-agreement overflow-hidden rounded-sm border-2 border-brand-primary bg-card text-text-primary shadow-none',
        isPrint && 'rounded-none border-black bg-white text-black print:border-black',
        className,
      )}
    >
      <div
        className={cn(
          'registration-agreement-page space-y-wilms-6 px-wilms-6 py-wilms-5',
          isPrint && 'print:break-after-page',
        )}
      >
        <header className="border-b-2 border-brand-primary pb-wilms-5 text-center">
          <p className="text-display font-bold tracking-[0.2em] text-brand-primary">WILMS</p>
          <p className="mt-wilms-2 text-body font-semibold uppercase tracking-wide text-text-primary">
            {legal.programName}
          </p>
          <h1 className="mt-wilms-3 text-heading-1 font-bold uppercase tracking-wide text-text-primary">
            {legal.formTitle}
          </h1>
          <p className="mx-auto mt-wilms-4 max-w-2xl text-body text-text-primary">{legal.instructionText}</p>
          <p className="mx-auto mt-wilms-3 max-w-2xl text-small italic text-text-muted">
            {legal.programDeclaration}
          </p>
        </header>

        <section>
          <SectionHeading>Applicant Information</SectionHeading>
          <div className="mt-wilms-4 flex flex-wrap justify-center gap-wilms-4">
            {content.borrowerPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={content.borrowerPhotoUrl}
                alt="Applicant passport photo"
                className="h-36 w-28 rounded-sm border-2 border-brand-primary object-cover"
              />
            ) : (
              <div className="flex h-36 w-28 items-center justify-center rounded-sm border-2 border-dashed border-brand-primary bg-background text-small text-text-muted">
                Passport photo
              </div>
            )}
          </div>
          <div className="mt-wilms-4">
            <FieldGrid rows={content.applicantRows} />
          </div>
        </section>

        <section>
          <SectionHeading>Work / Business Information</SectionHeading>
          <div className="mt-wilms-4">
            <FieldGrid rows={content.workRows} />
          </div>
        </section>

        <section>
          <SectionHeading>Guarantor Information</SectionHeading>
          <div className="mt-wilms-4 flex flex-wrap items-start justify-center gap-wilms-4">
            {content.guarantorPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={content.guarantorPhotoUrl}
                alt="Guarantor passport photo"
                className="h-28 w-24 shrink-0 rounded-sm border border-border object-cover"
              />
            ) : (
              <Avatar label={content.guarantorRows[0]?.value ?? 'Guarantor'} size="lg" />
            )}
            <div className="min-w-0 flex-1">
              <FieldGrid rows={content.guarantorRows} />
            </div>
          </div>
        </section>

        <section className="rounded-sm border border-border bg-background px-wilms-4 py-wilms-4">
          <h2 className="text-center text-body font-bold uppercase tracking-wide text-brand-primary">
            Guarantor Declaration
          </h2>
          <p className="mt-wilms-3 text-body text-text-primary">{legal.guarantorDeclaration}</p>
          <div className="mt-wilms-4">
            <SignatureBlock
              label="Guarantor"
              imageDataUrl={content.guarantorSignature}
              showThumbprint
              thumbprintDataUrl={content.guarantorThumbprint}
              manualThumbprintNote={!content.guarantorThumbprint}
              dateLabel={content.signedDate}
            />
          </div>
        </section>

        <section className="rounded-sm border border-border bg-background px-wilms-4 py-wilms-4">
          <h2 className="text-center text-body font-bold uppercase tracking-wide text-brand-primary">
            Borrower Declaration
          </h2>
          <p className="mt-wilms-3 text-body text-text-primary">{legal.borrowerDeclaration}</p>
          <div className="mt-wilms-4">
            <SignatureBlock
              label="Borrower"
              imageDataUrl={content.borrowerSignature}
              showThumbprint
              thumbprintDataUrl={content.borrowerThumbprint}
              manualThumbprintNote={!content.borrowerThumbprint}
              dateLabel={content.signedDate}
            />
          </div>
        </section>
      </div>

      <div
        className={cn(
          'registration-agreement-page space-y-wilms-6 border-t-2 border-brand-primary px-wilms-6 py-wilms-5',
          isPrint && 'print:break-before-page',
        )}
      >
        <section>
          <SectionHeading>Key Terms &amp; Enforcement</SectionHeading>
          <p className="mt-wilms-4 whitespace-pre-wrap text-body text-text-primary">{legal.keyTerms}</p>
        </section>

        <section>
          <SectionHeading>Legal Notice</SectionHeading>
          <p className="mt-wilms-4 whitespace-pre-wrap text-body text-text-primary">{legal.legalNotice}</p>
        </section>

        <section className="border-t border-border pt-wilms-4">
          <SectionHeading>Officer Verification</SectionHeading>
          <div className="mt-wilms-4">
            <SignatureBlock
              label={`Registration Officer — ${content.officerName}`}
              imageDataUrl={content.officerSignature}
              dateLabel={content.signedDate}
            />
          </div>
        </section>

        <section className="rounded-sm border border-border bg-background px-wilms-4 py-wilms-3">
          <SectionHeading>Document Metadata &amp; Audit Information</SectionHeading>
          <dl className="mt-wilms-4 grid gap-wilms-2 text-small sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-text-muted">Officer</dt>
              <dd>{content.officerName}</dd>
            </div>
            <div>
              <dt className="font-semibold text-text-muted">Signed date</dt>
              <dd>{content.signedDate}</dd>
            </div>
            <div>
              <dt className="font-semibold text-text-muted">Form version</dt>
              <dd>{legal.formTitle}</dd>
            </div>
            <div>
              <dt className="font-semibold text-text-muted">System</dt>
              <dd>WILMS Registration Module</dd>
            </div>
          </dl>
        </section>

        <footer className="border-t border-border pt-wilms-3 text-center text-small text-text-muted">
          WILMS · Women&apos;s Interest-Free Loan Management System · Registration Agreement · Page 2 of 2
        </footer>
      </div>
    </article>
  );
}
