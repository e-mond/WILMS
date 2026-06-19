'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormField } from '@/components/forms';
import { DocumentUpload } from '@/components/forms/DocumentUpload';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import { PERMISSION } from '@/constants/permissions';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { EXPENSE_CATEGORY, type ExpenseCategory } from '@/types/expense';
import { EXPENSE_CATEGORY_LABELS } from '@/constants/expenses';
import { UPLOAD_PURPOSE } from '@/types/upload';
import { useAuth } from '@/hooks/useAuth';
import { expenseService } from '@/services';
import {
  notifyMutationError,
  notifyMutationSuccess,
} from '@/utils/mutation-feedback';

interface ExpenseFormValues {
  category: ExpenseCategory | '';
  amount: string;
  expenseDate: string;
  reason: string;
  notes: string;
  receiptFile: File | null;
  receiptUploadId?: string;
}

export function CollectorExpenseForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    defaultValues: {
      category: '',
      amount: '',
      expenseDate: new Date().toISOString().slice(0, 10),
      reason: '',
      notes: '',
      receiptFile: null,
      receiptUploadId: undefined,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!user) {
      return;
    }

    setIsSubmitting(true);

    try {
      const amountPesewas = Math.round(Number(values.amount) * 100);

      await expenseService.createExpense({
        category: values.category as ExpenseCategory,
        amountPesewas,
        expenseDate: values.expenseDate,
        reason: values.reason,
        notes: values.notes || undefined,
        receiptFileName: values.receiptFile?.name ?? undefined,
        receiptUploadId: values.receiptUploadId,
        recordedById: user.id,
        recordedByName: user.displayName ?? user.id,
      });

      notifyMutationSuccess('Expense submitted', 'Your expense is pending admin approval.');
      reset();
    } catch (error) {
      notifyMutationError('Expense submission failed', error, 'Unable to record expense.');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-wilms-4">
      <div className="grid gap-wilms-4 md:grid-cols-2">
        <FormField label="Category" htmlFor="category" required error={errors.category?.message}>
          <Select id="category" hasError={Boolean(errors.category)} {...register('category', { required: 'Category is required.' })}>
            <option value="">Select category</option>
            {Object.values(EXPENSE_CATEGORY).map((category) => (
              <option key={category} value={category}>
                {EXPENSE_CATEGORY_LABELS[category]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Amount (GHS)" htmlFor="amount" required error={errors.amount?.message}>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            hasError={Boolean(errors.amount)}
            {...register('amount', { required: 'Amount is required.' })}
          />
        </FormField>
        <FormField label="Date" htmlFor="expenseDate" required error={errors.expenseDate?.message}>
          <Input
            id="expenseDate"
            type="date"
            hasError={Boolean(errors.expenseDate)}
            {...register('expenseDate', { required: 'Date is required.' })}
          />
        </FormField>
        <FormField label="Receipt" htmlFor="receiptFile" className="md:col-span-2">
          <Controller
            control={control}
            name="receiptFile"
            render={({ field }) => (
              <DocumentUpload
                id="receiptFile"
                label="Expense receipt"
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
                uploadPurpose={UPLOAD_PURPOSE.DOCUMENT}
                entityId={user?.id}
                onUploadRecordChange={(record) =>
                  setValue('receiptUploadId', record?.id, { shouldDirty: true })
                }
              />
            )}
          />
        </FormField>
        <FormField
          label="Reason"
          htmlFor="reason"
          required
          error={errors.reason?.message}
          className="md:col-span-2"
        >
          <Input id="reason" hasError={Boolean(errors.reason)} {...register('reason', { required: 'Reason is required.' })} />
        </FormField>
        <FormField label="Notes" htmlFor="notes" className="md:col-span-2">
          <Textarea id="notes" {...register('notes')} />
        </FormField>
      </div>
      <PermissionGate permission={PERMISSION.RECORD_EXPENSES}>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          Submit expense
        </Button>
      </PermissionGate>
    </form>
  );
}
