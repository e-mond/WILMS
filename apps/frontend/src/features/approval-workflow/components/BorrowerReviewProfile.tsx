import { Avatar, StatusBadge } from '@/components/data-display';
import type { BorrowerReviewDetail } from '@/types/approval';
import { formatDisplayDate } from '@/utils/format-date';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';

export interface BorrowerReviewProfileProps {
  borrower: BorrowerReviewDetail;
  guarantorEligibility?: {
    activeGuaranteeCount: number;
    maxGuarantees: number;
    validationStatus: string;
  } | null;
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
          ['Date of birth', borrower.dateOfBirth],
          ['Gender', borrower.gender],
          ['Phone', borrower.phone],
          ['Email', borrower.email || 'Not provided'],
          ['Nationality', borrower.nationality],
          ['ID type', borrower.idType],
          ['ID number', borrower.idNumber],
        ]}
      />

      <ReviewSection
        title="Address"
        items={[
          ['House address', borrower.houseAddress],
          ['GPS address', borrower.gpsAddress],
          ['City', borrower.city],
          ['Region', borrower.region],
          ['District', borrower.district],
          ['Community', borrower.community],
        ]}
      />

      <ReviewSection
        title="Business information"
        items={[
          ['Business name', borrower.businessName],
          ['Business address', borrower.businessAddress],
          ['Type of work', borrower.typeOfWork],
        ]}
      />

      <ReviewSection
        title="Guarantor"
        items={[
          ['Name', borrower.guarantorName],
          ['Phone', borrower.guarantorPhone],
          ['Relationship', borrower.guarantorRelationship],
        ]}
      />

      <ReviewSection
        title="Registration"
        items={[
          ['Registered by', borrower.registeredByOfficerName],
          ['Submitted', formatDisplayDate(borrower.registeredAt)],
          ['Photo', `${borrower.photoFileName} (${borrower.photoMimeType})`],
        ]}
      />
    </div>
  );
}
