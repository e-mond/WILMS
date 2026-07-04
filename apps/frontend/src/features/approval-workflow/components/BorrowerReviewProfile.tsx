import { Avatar, StatusBadge } from '@/components/data-display';
import type { BorrowerReviewDetail } from '@/types/approval';
import { formatDisplayDate } from '@/utils/format-date';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
import { resolveUserDisplayId } from '@/utils/entity-display-id';

export interface BorrowerReviewProfileProps {
  borrower: BorrowerReviewDetail;
  guarantorEligibility?: {
    activeGuaranteeCount: number;
    maxGuarantees: number;
    validationStatus: string;
  } | null;
}

function formatField(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'Not provided';
}

function formatRegisteredBy(borrower: BorrowerReviewDetail): string {
  const officerName = borrower.registeredByOfficerName?.trim();
  const officerId = borrower.registeredByOfficerId?.trim();

  if (officerName && officerId && officerName !== officerId) {
    return `${officerName} (${resolveUserDisplayId(officerId)})`;
  }

  return officerName || (officerId ? resolveUserDisplayId(officerId) : 'Not provided');
}

function formatPhotoReference(borrower: BorrowerReviewDetail): string {
  if (borrower.photoUrl) {
    return borrower.photoFileName?.trim()
      ? `${borrower.photoFileName} · Photo on file`
      : 'Photo on file';
  }

  return 'No photo uploaded';
}

function ReviewSection({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
  return (
    <section className="rounded-sm border border-border bg-card p-wilms-4">
      <h2 className="text-heading-3 font-semibold text-text-primary">{title}</h2>
      <dl className="mt-wilms-3 grid gap-wilms-3 md:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-small font-semibold text-text-muted">{label}</dt>
            <dd className="text-body text-text-primary">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function BorrowerReviewProfile({
  borrower,
  guarantorEligibility,
}: BorrowerReviewProfileProps) {
  const applicantName = borrower.fullName?.trim() || 'Applicant';
  const guarantorName = borrower.guarantorName?.trim() || 'Guarantor';

  return (
    <div className="space-y-wilms-4">
      <div className="grid gap-wilms-4 lg:grid-cols-2">
        <section className="rounded-sm border-2 border-brand-primary bg-card p-wilms-4 text-center">
          <h2 className="text-body font-semibold uppercase tracking-wide text-brand-primary">Applicant</h2>
          <Avatar
            label={applicantName}
            photoUrl={resolveEntityPhotoUrl({
              name: applicantName,
              id: borrower.id,
              photoFileName: borrower.photoFileName,
              photoUrl: borrower.photoUrl,
            })}
            size="lg"
            className="mx-auto mt-wilms-4"
          />
          <p className="mt-wilms-3 text-heading-3 font-semibold text-text-primary">{applicantName}</p>
          <p className="text-small text-text-muted">{borrower.phone}</p>
        </section>

        <section className="rounded-sm border-2 border-brand-primary bg-card p-wilms-4 text-center">
          <h2 className="text-body font-semibold uppercase tracking-wide text-brand-primary">Guarantor</h2>
          <Avatar
            label={guarantorName}
            photoUrl={resolveEntityPhotoUrl({
              name: guarantorName,
              id: `${borrower.id}-guarantor`,
              photoUrl: borrower.guarantorPhotoUrl,
            })}
            size="lg"
            className="mx-auto mt-wilms-4"
          />
          <p className="mt-wilms-3 text-heading-3 font-semibold text-text-primary">{guarantorName}</p>
          <p className="text-small text-text-muted">{borrower.guarantorPhone}</p>
          {guarantorEligibility ? (
            <p className="mt-wilms-2 text-small text-text-primary">
              Guarantees: {guarantorEligibility.activeGuaranteeCount}/{guarantorEligibility.maxGuarantees} ·{' '}
              {guarantorEligibility.validationStatus}
            </p>
          ) : null}
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-wilms-3">
        <h2 className="text-heading-2 font-semibold text-text-primary">{borrower.fullName}</h2>
        <StatusBadge status={borrower.status} />
      </div>

      <ReviewSection
        title="Personal details"
        items={[
          ['Registration ID', formatField(borrower.displayId)],
          ['Date of birth', formatField(borrower.dateOfBirth)],
          ['Gender', formatField(borrower.gender)],
          ['Phone', formatField(borrower.phone)],
          ['Email', formatField(borrower.email)],
          ['Nationality', formatField(borrower.nationality)],
          ['ID type', formatField(borrower.idType)],
          ['ID number', formatField(borrower.idNumber)],
        ]}
      />

      <ReviewSection
        title="Address"
        items={[
          ['House address', formatField(borrower.houseAddress)],
          ['GPS address', formatField(borrower.gpsAddress)],
          ['City', formatField(borrower.city)],
          ['Region', formatField(borrower.region)],
          ['District', formatField(borrower.district)],
          ['Community', formatField(borrower.community)],
        ]}
      />

      <ReviewSection
        title="Business information"
        items={[
          ['Business name', formatField(borrower.businessName)],
          ['Business address', formatField(borrower.businessAddress)],
          ['Type of work', formatField(borrower.typeOfWork)],
        ]}
      />

      <ReviewSection
        title="Guarantor"
        items={[
          ['Name', formatField(borrower.guarantorName)],
          ['Phone', formatField(borrower.guarantorPhone)],
          ['Relationship', formatField(borrower.guarantorRelationship)],
        ]}
      />

      <ReviewSection
        title="Registration"
        items={[
          ['Registered by', formatRegisteredBy(borrower)],
          ['Submitted', formatDisplayDate(borrower.registeredAt)],
          ['Photo', formatPhotoReference(borrower)],
        ]}
      />
    </div>
  );
}
