'use client';

import { Avatar } from '@/components/data-display/Avatar';
import { WILMS_BRAND_LOGO_PATH } from '@/features/export/constants/branding';
import type { RegistrationAgreementContent } from '@/utils/registration-agreement-fields';
import { cn } from '@/utils/cn';

export interface RegistrationAgreementDocumentProps {
  content: RegistrationAgreementContent;
  className?: string;
  mode?: 'screen' | 'print';
}

function FieldGrid({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-x-wilms-6 gap-y-wilms-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="rounded-sm border border-border/70 bg-card px-wilms-3 py-wilms-2">
          <dt className="text-small font-semibold uppercase tracking-wide text-text-muted">{row.label}</dt>
          <dd className="mt-wilms-1 whitespace-pre-wrap text-body leading-relaxed text-text-primary">
            {row.value || '—'}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b-2 border-brand-primary pb-wilms-2 text-left text-heading-3 font-bold uppercase tracking-wide text-brand-primary">
      {children}
    </h2>
  );
}

function SignatureLine({
  label,
  imageDataUrl,
  thumbprintDataUrl,
  dateLabel,
}: {
  label: string;
  imageDataUrl?: string | null;
  thumbprintDataUrl?: string | null;
  dateLabel: string;
}) {
  const hasMedia = Boolean(imageDataUrl || thumbprintDataUrl);

  return (
    <div className="space-y-wilms-3">
      {hasMedia ? (
        <div className="grid gap-wilms-3 sm:grid-cols-2">
          {imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageDataUrl}
              alt={label}
              className="h-20 w-full rounded-sm border border-border bg-card object-contain"
            />
          ) : null}
          {thumbprintDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbprintDataUrl}
              alt="Thumbprint"
              className="h-20 w-full rounded-sm border border-border bg-card object-contain"
            />
          ) : null}
        </div>
      ) : (
        <div className="flex items-end gap-wilms-3">
          <p className="shrink-0 text-small font-semibold text-text-primary">{label}</p>
          <div className="h-12 flex-1 border-b-2 border-text-primary" />
        </div>
      )}
      <div className="flex items-end gap-wilms-3">
        <p className="shrink-0 text-small font-semibold text-text-primary">Date:</p>
        <div className="flex h-10 flex-1 items-end border-b-2 border-text-primary pb-wilms-1 text-body text-text-primary">
          {hasMedia ? dateLabel : null}
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
  const logoSrc = content.logoDataUrl || WILMS_BRAND_LOGO_PATH;

  return (
    <article
      className={cn(
        'registration-agreement overflow-hidden rounded-sm border-2 border-brand-primary bg-card text-text-primary shadow-none',
        isPrint && 'rounded-none border-black bg-white text-black print:border-black',
        className,
      )}
    >
      <div className="registration-agreement-page space-y-wilms-5 px-wilms-6 py-wilms-5">
        <header className="border-b border-brand-primary pb-wilms-4 text-center">
          <div className="mx-auto mb-wilms-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-brand-primary/30 bg-brand-primary-light">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="WILMS" width={64} height={64} className="h-full w-full object-cover" />
          </div>
          <p className="text-body font-bold uppercase tracking-wide text-text-primary">
            {legal.programName}
          </p>
          <h1 className="mt-wilms-2 text-heading-2 font-bold uppercase tracking-wide text-brand-primary">
            {content.documentTitle || legal.formTitle}
          </h1>
          <p className="mt-wilms-2 text-small text-text-muted">
            {content.registrationReference ? (
              <span className="font-semibold text-text-primary">{content.registrationReference}</span>
            ) : (
              <span>Reference pending assignment</span>
            )}
            {' · '}
            Generated {content.generatedAt}
            {content.applicationStatus ? ` · ${content.applicationStatus}` : null}
          </p>
          <p className="mx-auto mt-wilms-3 max-w-3xl text-left text-small leading-relaxed text-text-primary">
            {legal.instructionText}
          </p>
          <p className="mx-auto mt-wilms-2 max-w-3xl text-left text-small leading-relaxed text-text-muted">
            {legal.programDeclaration}
          </p>
        </header>

        <section>
          <SectionHeading>Applicant Passport Photograph</SectionHeading>
          <div className="mt-wilms-3 flex justify-center">
            {content.borrowerPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={content.borrowerPhotoUrl}
                alt="Applicant passport photograph"
                className="h-36 w-28 rounded-sm border-2 border-brand-primary bg-card object-contain"
              />
            ) : (
              <div className="flex h-36 w-28 items-center justify-center rounded-sm border-2 border-dashed border-brand-primary bg-card px-wilms-2 text-center text-small text-text-muted">
                Photograph not available
              </div>
            )}
          </div>
        </section>

        <section>
          <SectionHeading>Applicant Information</SectionHeading>
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
                alt="Guarantor photograph"
                className="h-28 w-24 shrink-0 rounded-sm border border-border bg-card object-contain"
              />
            ) : (
              <Avatar label={content.guarantorRows[0]?.value ?? 'Guarantor'} size="lg" />
            )}
            <div className="min-w-0 flex-1">
              <FieldGrid rows={content.guarantorRows} />
            </div>
          </div>
        </section>

        <section className="rounded-sm border border-brand-primary/25 bg-brand-primary/5 px-wilms-4 py-wilms-4">
          <SectionHeading>Guarantor Declaration</SectionHeading>
          <p className="mt-wilms-3 whitespace-pre-wrap text-body leading-relaxed text-text-primary">
            {legal.guarantorDeclaration}
          </p>
          <div className="mt-wilms-4">
            <SignatureLine
              label="Guarantor Signature / Thumbprint:"
              imageDataUrl={content.guarantorSignature}
              thumbprintDataUrl={content.guarantorThumbprint}
              dateLabel={content.signedDate}
            />
          </div>
        </section>

        <section className="rounded-sm border border-brand-primary/25 bg-brand-primary/5 px-wilms-4 py-wilms-4">
          <SectionHeading>Borrower Declaration</SectionHeading>
          <p className="mt-wilms-3 whitespace-pre-wrap text-body leading-relaxed text-text-primary">
            {legal.borrowerDeclaration}
          </p>
          <div className="mt-wilms-4">
            <SignatureLine
              label="Applicant Signature / Thumbprint:"
              imageDataUrl={content.borrowerSignature}
              thumbprintDataUrl={content.borrowerThumbprint}
              dateLabel={content.signedDate}
            />
          </div>
        </section>

        <section>
          <SectionHeading>Key Terms &amp; Enforcement</SectionHeading>
          <p className="mt-wilms-4 whitespace-pre-wrap text-body leading-relaxed text-text-primary">
            {legal.keyTerms}
          </p>
        </section>

        <section>
          <SectionHeading>Legal Notice</SectionHeading>
          <p className="mt-wilms-4 whitespace-pre-wrap text-body leading-relaxed text-text-primary">
            {legal.legalNotice}
          </p>
        </section>

        <section className="border-t border-border pt-wilms-4">
          <SectionHeading>Officer Verification</SectionHeading>
          <dl className="mt-wilms-4 grid gap-wilms-3 sm:grid-cols-2">
            <div>
              <dt className="text-small font-semibold text-text-muted">Officer Name</dt>
              <dd className="text-body text-text-primary">{content.officerName || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-small font-semibold text-text-muted">Officer ID</dt>
              <dd className="text-body text-text-primary">{content.officerId ?? 'Not provided'}</dd>
            </div>
          </dl>
          <div className="mt-wilms-4">
            <SignatureLine
              label="Officer Signature:"
              imageDataUrl={content.officerSignature}
              dateLabel={content.signedDate}
            />
          </div>
        </section>

        <footer className="border-t border-brand-primary pt-wilms-3 text-center text-small text-text-muted">
          WILMS · Women&apos;s Interest-Free Loan Management System · Official programme record
        </footer>
      </div>
    </article>
  );
}
