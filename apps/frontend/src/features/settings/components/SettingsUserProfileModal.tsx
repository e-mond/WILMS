'use client';

import { Avatar, CurrencyAmount } from '@/components/data-display';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { SettingsUserPermissionOverrides } from '@/features/settings/components/SettingsUserPermissionOverrides';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PERMISSION } from '@/constants/permissions';
import { useSettingsUserProfile } from '@/features/settings/hooks/useSettingsUserProfile';
import { useSettingsUserMutations } from '@/features/settings/hooks/useSettingsUserMutations';
import { formatSettingsUserStatus } from '@/utils/settings-user-presentation';
import { formatDisplayDate } from '@/utils/format-date';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/state/authStore';

export interface SettingsUserProfileModalProps {
  userId: string | null;
  onClose: () => void;
}

export function SettingsUserProfileModal({ userId, onClose }: SettingsUserProfileModalProps) {
  const { data, isLoading, isError, error } = useSettingsUserProfile(userId);
  const { disableUser } = useSettingsUserMutations();
  const toast = useToast();
  const currentUserId = useAuthStore((state) => state.user?.id);

  async function handleSuspendAccount() {
    if (!data) {
      return;
    }

    try {
      await disableUser.mutateAsync(data.id);
      toast.success('Account suspended');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Try again shortly.';
      toast.error('Unable to suspend account', { message });
    }
  }

  return (
    <Modal isOpen={Boolean(userId)} onClose={onClose} title="User Profile">
      {isLoading ? (
        <InlinePanelSkeleton />
      ) : isError ? (
        <QueryErrorState
          title="Unable to load user profile"
          description={error instanceof Error ? error.message : 'Try again shortly.'}
        />
      ) : !data ? (
        <QueryErrorState title="User not found" description="This profile could not be loaded." />
      ) : (
        <div className="space-y-wilms-5">
          <div className="flex flex-wrap items-start gap-wilms-4">
            <Avatar
              label={data.displayName}
              photoUrl={resolveEntityPhotoUrl({
                name: data.displayName,
                id: data.id,
                photoUrl: data.profileImageUrl,
              })}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-heading-3 font-semibold text-text-primary">{data.displayName}</h3>
              <p className="text-small text-text-muted">{data.staffId}</p>
              <p className="mt-wilms-1 text-body">
                {data.roleLabel} · {formatSettingsUserStatus(data.status, data.statusLabel)}
              </p>
              <p className="mt-wilms-1 text-small text-text-muted">
                Last login: {data.lastLoginAt}
              </p>
            </div>
          </div>

          <section>
            <h4 className="text-body font-semibold text-text-primary">Personal</h4>
            <dl className="mt-wilms-2 grid gap-wilms-3 sm:grid-cols-2">
              <div>
                <dt className="text-small text-text-muted">Phone</dt>
                <dd className="font-semibold">{data.phone}</dd>
              </div>
              <div>
                <dt className="text-small text-text-muted">Email</dt>
                <dd className="font-semibold">{data.email}</dd>
              </div>
              <div>
                <dt className="text-small text-text-muted">Branch</dt>
                <dd className="font-semibold">{data.branch}</dd>
              </div>
              <div>
                <dt className="text-small text-text-muted">Region / Zone</dt>
                <dd className="font-semibold">
                  {data.region} · {data.zone}
                </dd>
              </div>
            </dl>
          </section>

          {data.approvalMetrics ? (
            <section>
              <h4 className="text-body font-semibold text-text-primary">Approval performance</h4>
              <dl className="mt-wilms-2 grid gap-wilms-2 sm:grid-cols-3 text-small">
                <div>
                  <dt className="text-text-muted">Approvals</dt>
                  <dd className="font-semibold">{data.approvalMetrics.approvalsCount}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">Rejections</dt>
                  <dd className="font-semibold">{data.approvalMetrics.rejectionsCount}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">Pending queue</dt>
                  <dd className="font-semibold">{data.approvalMetrics.pendingQueueCount}</dd>
                </div>
              </dl>
            </section>
          ) : null}

          {data.registrationMetrics ? (
            <section>
              <h4 className="text-body font-semibold text-text-primary">Registration performance</h4>
              <dl className="mt-wilms-2 grid gap-wilms-2 sm:grid-cols-2 text-small">
                <div>
                  <dt className="text-text-muted">Completed</dt>
                  <dd className="font-semibold">{data.registrationMetrics.registrationsCompleted}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">Pending</dt>
                  <dd className="font-semibold">{data.registrationMetrics.pendingRegistrations}</dd>
                </div>
              </dl>
            </section>
          ) : null}

          {data.performanceMetrics.collectionRatePercent > 0 ? (
            <section>
              <h4 className="text-body font-semibold text-text-primary">Collection performance</h4>
              <dl className="mt-wilms-2 grid gap-wilms-2 sm:grid-cols-2">
                <div>
                  <dt className="text-small text-text-muted">Collection rate</dt>
                  <dd className="font-semibold">{data.performanceMetrics.collectionRatePercent}%</dd>
                </div>
                <div>
                  <dt className="text-small text-text-muted">Borrowers managed</dt>
                  <dd className="font-semibold">{data.performanceMetrics.borrowersManaged}</dd>
                </div>
                <div>
                  <dt className="text-small text-text-muted">Weekly collected</dt>
                  <dd className="font-semibold">
                    <CurrencyAmount value={data.performanceMetrics.weeklyCollectedPesewas} />
                  </dd>
                </div>
                {data.performanceMetrics.expenseTotalPesewas ? (
                  <div>
                    <dt className="text-small text-text-muted">Expenses recorded</dt>
                    <dd className="font-semibold">
                      <CurrencyAmount value={data.performanceMetrics.expenseTotalPesewas} />
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}

          <section>
            <h4 className="text-body font-semibold text-text-primary">Assigned permissions</h4>
            <ul className="mt-wilms-2 flex flex-wrap gap-wilms-2">
              {(data.assignedPermissionIds ?? []).map((permissionId) => (
                <li
                  key={permissionId}
                  className="rounded-sm border border-border bg-background px-wilms-2 py-wilms-1 text-small font-semibold text-text-primary"
                >
                  {permissionId}
                </li>
              ))}
            </ul>
          </section>

          {(data.delegatedPermissionIds ?? []).length > 0 ? (
            <section>
              <h4 className="text-body font-semibold text-text-primary">Delegated permissions</h4>
              <p className="mt-wilms-1 text-small text-text-muted">
                Additional permissions beyond the base role composition.
              </p>
              <ul className="mt-wilms-2 flex flex-wrap gap-wilms-2">
                {(data.delegatedPermissionIds ?? []).map((permissionId) => (
                  <li
                    key={permissionId}
                    className="rounded-sm border border-brand-primary bg-brand-primary-light px-wilms-2 py-wilms-1 text-small font-semibold text-brand-primary"
                  >
                    {permissionId}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h4 className="text-body font-semibold text-text-primary">Device history</h4>
            <ul className="mt-wilms-2 space-y-wilms-2 text-small">
              {(data.deviceHistory ?? []).map((device) => (
                <li key={device.id}>
                  {device.deviceLabel} · {device.platform} · {formatDisplayDate(device.lastSeenAt)}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-body font-semibold text-text-primary">Login history</h4>
            <ul className="mt-wilms-2 space-y-wilms-2 text-small">
              {(data.loginHistory ?? []).map((item) => (
                <li key={item.id}>
                  {item.deviceLabel} · {item.locationLabel} · {formatDisplayDate(item.occurredAt)}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-body font-semibold text-text-primary">Security actions</h4>
            <div className="mt-wilms-3 flex flex-wrap gap-wilms-2">
              <PermissionGate permission={PERMISSION.RESET_PASSWORD}>
                <Button type="button" variant="secondary" size="sm" disabled title="Password reset is managed by your identity provider">
                  Reset password
                </Button>
              </PermissionGate>
              <PermissionGate permission={PERMISSION.RESET_PIN}>
                <Button type="button" variant="secondary" size="sm" disabled title="PIN reset is available on collector devices">
                  Reset PIN
                </Button>
              </PermissionGate>
              {data.id !== currentUserId ? (
                <PermissionGate permission={PERMISSION.SUSPEND_USERS}>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={disableUser.isPending || data.status === 'SUSPENDED'}
                    onClick={() => void handleSuspendAccount()}
                  >
                    Suspend account
                  </Button>
                </PermissionGate>
              ) : null}
            </div>
          </section>
          <SettingsUserPermissionOverrides userId={data.id} />
        </div>
      )}
    </Modal>
  );
}
