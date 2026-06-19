import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import type { RegistrationConflict } from '@/types/borrower-conflicts';

export interface RegistrationConflictAlertsProps {
  blocking: RegistrationConflict[];
  warnings: RegistrationConflict[];
  warningsAcknowledged: boolean;
  onAcknowledgeWarnings: () => void;
}

export function RegistrationConflictAlerts({
  blocking,
  warnings,
  warningsAcknowledged,
  onAcknowledgeWarnings,
}: RegistrationConflictAlertsProps) {
  return (
    <div className="space-y-wilms-3">
      {blocking.map((conflict) => (
        <Alert key={`${conflict.code}-${conflict.relatedBorrowerId ?? conflict.message}`} variant="error" title="Registration blocked">
          {conflict.message}
        </Alert>
      ))}

      {warnings.length > 0 && !warningsAcknowledged ? (
        <Alert variant="warning" title="Similar names found">
          <ul className="list-disc space-y-wilms-1 pl-wilms-4">
            {warnings.map((warning) => (
              <li key={`${warning.code}-${warning.relatedBorrowerId}`}>{warning.message}</li>
            ))}
          </ul>
          <Button
            type="button"
            variant="secondary"
            className="mt-wilms-3"
            onClick={onAcknowledgeWarnings}
          >
            Acknowledge and continue
          </Button>
        </Alert>
      ) : null}
    </div>
  );
}
