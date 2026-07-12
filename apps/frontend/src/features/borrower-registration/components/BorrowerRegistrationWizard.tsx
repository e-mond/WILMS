'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { BORROWER_ID_PLACEHOLDERS, formatGhanaCardInput } from '@wilms/shared-validation';
import { Alert } from '@/components/feedback/Alert';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FormField, MultiStepForm, PhotoUploadField } from '@/components/forms';
import { DocumentUpload } from '@/components/forms/DocumentUpload';
import { IdentityCaptureField } from '@/components/forms/IdentityCaptureField';
import { SignatureUploadField } from '@/components/forms/SignatureUploadField';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  BORROWER_GENDER,
  BORROWER_ID_TYPE,
  GUARANTOR_RELATIONSHIP_OPTIONS,
  REGISTRATION_ADDRESS_MAX_LENGTH,
  REGISTRATION_ADDRESS_MIN_LENGTH,
  REGISTRATION_GPS_MAX_ACCURACY_METERS,
  TYPE_OF_WORK_OPTIONS,
} from '@/constants/borrower-registration';
import { RegistrationConflictAlerts } from '@/features/borrower-registration/components/RegistrationConflictAlerts';
import { RegistrationReviewPanel } from '@/features/borrower-registration/components/RegistrationReviewPanel';
import {
  notifyMutationError,
  notifyMutationSuccess,
} from '@/utils/mutation-feedback';
import {
  getConflictTargetStep,
  runRegistrationConflictChecks,
} from '@/features/borrower-registration/registration-conflicts';
import {
  DEFAULT_REGISTRATION_VALUES,
  normalizeDraftFormValues,
  reviewDetailToFormValues,
  toRegisterBorrowerPayload,
} from '@/features/borrower-registration/registration.utils';
import {
  borrowerRegistrationSchema,
  MAX_BORROWER_DATE_OF_BIRTH,
  REGISTRATION_STEP_FIELD_NAMES,
  REGISTRATION_STEP_SCHEMAS,
} from '@/features/borrower-registration/registration.schema';
import { PERMISSION } from '@/constants/permissions';
import { UPLOAD_PURPOSE } from '@/types/upload';
import { useAuth } from '@/hooks/useAuth';
import { borrowerService, locationService } from '@/services';
import type { RegistrationConflictReport } from '@/types/borrower-conflicts';
import type { BorrowerRegistrationFormValues } from '@/types/borrower-registration';
import type { GuarantorEligibilityResult } from '@/types/guarantor-eligibility';
import { ApiError } from '@/types/api';

const REGISTRATION_STEP_LABELS = [
  'Personal Details',
  'Address',
  'Business Info',
  'Guarantor',
  'Photo',
  'Signatures',
  'Review',
] as const;

const REGISTRATION_STEPS = REGISTRATION_STEP_LABELS.map((title, index) => ({
  id: `step-${index + 1}`,
  title,
}));

function applySchemaErrors(
  issues: { path: (string | number)[]; message: string }[],
  setError: ReturnType<typeof useForm<BorrowerRegistrationFormValues>>['setError'],
) {
  for (const issue of issues) {
    const field = issue.path[0];

    if (typeof field === 'string') {
      setError(field as keyof BorrowerRegistrationFormValues, {
        type: 'manual',
        message: issue.message,
      });
    }
  }
}

export function BorrowerRegistrationWizard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(searchParams.get('edit'));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registeredBorrowerId, setRegisteredBorrowerId] = useState<string | null>(null);
  const [conflictReport, setConflictReport] = useState<RegistrationConflictReport>({
    blocking: [],
    warnings: [],
  });
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(false);
  const [guarantorEligibility, setGuarantorEligibility] = useState<GuarantorEligibilityResult | null>(null);
  const registrationSessionRef = useRef(
    searchParams.get('edit') ?? `reg-${user?.id ?? 'guest'}-${crypto.randomUUID()}`,
  );
  const registrationSessionId = draftId ?? registrationSessionRef.current;

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setError,
    setValue,
    clearErrors,
    trigger,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BorrowerRegistrationFormValues>({
    defaultValues: DEFAULT_REGISTRATION_VALUES,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const editId = searchParams.get('edit');
    if (!editId) {
      return;
    }

    let cancelled = false;

    async function loadEditRegistration() {
      try {
        const draft = await borrowerService.getRegistrationDraft(editId!);
        if (cancelled) {
          return;
        }

        setDraftId(draft.id);
        reset(normalizeDraftFormValues(draft.draftPayload as Record<string, unknown>));
        setCurrentStep(Math.min(draft.lastCompletedStep + 1, REGISTRATION_STEPS.length - 1));
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 404) {
          try {
            const review = await borrowerService.getBorrowerReview(editId!);
            if (cancelled) {
              return;
            }

            setDraftId(editId);
            reset(reviewDetailToFormValues(review));
            setCurrentStep(REGISTRATION_STEPS.length - 1);
            return;
          } catch {
            setSubmitError('Unable to load this registration for editing.');
            return;
          }
        }

        setSubmitError('Unable to load this registration for editing.');
      }
    }

    void loadEditRegistration();

    return () => {
      cancelled = true;
    };
  }, [user?.id, searchParams, reset]);

  useEffect(() => {
    if (!user?.id || searchParams.get('edit') || draftId) {
      return;
    }

    void borrowerService.createRegistrationDraft({}).then((created) => {
      setDraftId(created.id);
    });
  }, [user?.id, searchParams, draftId]);

  const persistDraft = async (step: number) => {
    if (!draftId) {
      return;
    }

    await borrowerService.updateRegistrationDraft(
      draftId,
      getValues() as unknown as Record<string, unknown>,
      step,
    );
  };

  const watchedGuarantorPhone = watch('guarantorPhone');
  const watchedGuarantorName = watch('guarantorName');
  const watchedGuarantorIdNumber = watch('guarantorIdNumber');

  useEffect(() => {
    setGuarantorEligibility(null);
    clearErrors(['guarantorPhone', 'guarantorName', 'guarantorIdNumber']);
  }, [watchedGuarantorPhone, watchedGuarantorName, watchedGuarantorIdNumber, clearErrors]);

  useEffect(() => {
    if (!draftId) {
      return;
    }

    let timer: number | undefined;
    const subscription = watch(() => {
      if (timer) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(() => {
        void borrowerService
          .updateRegistrationDraft(
            draftId,
            getValues() as unknown as Record<string, unknown>,
            currentStep,
          )
          .catch(() => undefined);
      }, 800);
    });

    return () => {
      subscription.unsubscribe();
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [watch, draftId, currentStep, getValues]);

  const watchedFullName = watch('fullName');
  const watchedPhone = watch('phone');
  const watchedIdType = watch('idType');
  const watchedIdNumber = watch('idNumber');

  useEffect(() => {
    setWarningsAcknowledged(false);
    setConflictReport({ blocking: [], warnings: [] });
  }, [watchedFullName, watchedPhone, watchedIdType, watchedIdNumber]);

  const watchedGuarantorIdType = watch('guarantorIdType');
  const watchedTypeOfWork = watch('typeOfWork');
  const watchedRegion = watch('region');
  const watchedDistrict = watch('district');
  const watchedHouseAddress = watch('houseAddress') ?? '';
  const watchedBusinessAddress = watch('businessAddress') ?? '';
  const watchedGpsAddress = watch('gpsAddress') ?? '';
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const { data: regions = [] } = useQuery({
    queryKey: ['locations', 'regions'],
    queryFn: () => locationService.getRegions(),
  });

  const regionOptions = regions;

  const selectedRegionId = useMemo(
    () => regionOptions.find((region) => region.name === watchedRegion)?.id ?? '',
    [regionOptions, watchedRegion],
  );

  const { data: districts = [] } = useQuery({
    queryKey: ['locations', 'districts', selectedRegionId],
    queryFn: () => locationService.getDistricts(selectedRegionId),
    enabled: Boolean(selectedRegionId),
  });

  const selectedDistrictId = useMemo(
    () => districts.find((district) => district.name === watchedDistrict)?.id ?? '',
    [districts, watchedDistrict],
  );

  const { data: cities = [] } = useQuery({
    queryKey: ['locations', 'cities', selectedDistrictId],
    queryFn: () => locationService.getCities(selectedDistrictId),
    enabled: Boolean(selectedDistrictId),
  });

  const handleUseCurrentLocation = async () => {
    setLocationFeedback(null);
    setIsLocating(true);

    try {
      const result = await locationService.getCurrentLocation();

      if (
        result.accuracyMeters != null &&
        result.accuracyMeters > REGISTRATION_GPS_MAX_ACCURACY_METERS
      ) {
        setLocationFeedback(
          `Location accuracy is low (±${Math.round(result.accuracyMeters)}m). Move outdoors or enter the GPS address manually.`,
        );
        return;
      }

      const gpsValue =
        result.address ??
        `${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`;

      setValue('gpsAddress', gpsValue, { shouldDirty: true, shouldValidate: true });
      const accuracyNote =
        result.accuracyMeters != null
          ? ` Accuracy ±${Math.round(result.accuracyMeters)}m.`
          : '';
      setLocationFeedback(`Current location applied to GPS address.${accuracyNote}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to determine your current location. Try again or enter it manually.';

      setLocationFeedback(message);
    } finally {
      setIsLocating(false);
    }
  };

  const phoneField = register('phone', {
    validate: async (phone) => {
      if (!phone?.trim()) {
        return true;
      }

      const [phoneResult, activeLoanResult, blacklistResult] = await Promise.all([
        borrowerService.checkPhone(phone),
        borrowerService.checkActiveLoan(phone),
        borrowerService.checkBlacklist({
          fullName: getValues('fullName'),
          phone,
          idType: getValues('idType') || undefined,
          idNumber: getValues('idNumber') || undefined,
        }),
      ]);

      if (phoneResult.isDuplicate) {
        return `Phone number is already registered to ${phoneResult.existingBorrowerName}.`;
      }

      if (activeLoanResult.hasActiveLoan) {
        return `${activeLoanResult.existingBorrowerName} already has an active loan.`;
      }

      if (blacklistResult.isBlacklisted) {
        return `${blacklistResult.existingBorrowerName} is blacklisted and cannot be registered.`;
      }

      return true;
    },
  });

  const idNumberField = register('idNumber', {
    validate: async (idNumber) => {
      const idType = getValues('idType');

      if (!idType || !idNumber?.trim()) {
        return true;
      }

      const [idResult, blacklistResult] = await Promise.all([
        borrowerService.checkId(idType, idNumber),
        borrowerService.checkBlacklist({
          fullName: getValues('fullName'),
          phone: getValues('phone'),
          idType,
          idNumber,
        }),
      ]);

      if (idResult.isDuplicate) {
        return `This ID is already registered to ${idResult.existingBorrowerName}.`;
      }

      if (blacklistResult.isBlacklisted) {
        return `${blacklistResult.existingBorrowerName} is blacklisted and cannot be registered.`;
      }

      return true;
    },
  });

  const validateCurrentStep = async (): Promise<boolean> => {
    clearErrors();
    const fieldNames = REGISTRATION_STEP_FIELD_NAMES[currentStep] ?? [];
    await trigger(fieldNames as (keyof BorrowerRegistrationFormValues)[]);

    const stepSchema = REGISTRATION_STEP_SCHEMAS[currentStep];
    if (!stepSchema) {
      return true;
    }

    const values = getValues();
    const stepValues = Object.fromEntries(
      fieldNames.map((field) => [field, values[field as keyof BorrowerRegistrationFormValues]]),
    );

    const parsed = stepSchema.safeParse(stepValues);

    if (!parsed.success) {
      applySchemaErrors(parsed.error.issues, setError);
      return false;
    }

    if (currentStep === 3 && values.guarantorPhone === values.phone) {
      setError('guarantorPhone', {
        type: 'manual',
        message: 'Guarantor phone must differ from borrower phone.',
      });
      return false;
    }

    if (currentStep === 3) {
      const eligibility = await borrowerService.checkGuarantorEligibility({
        guarantorPhone: values.guarantorPhone,
        guarantorIdNumber: values.guarantorIdNumber,
        guarantorName: values.guarantorName,
        borrowerPhone: values.phone,
      });
      setGuarantorEligibility(eligibility);

      if (!eligibility.isEligible) {
        setError('guarantorPhone', {
          type: 'manual',
          message: eligibility.message ?? 'Guarantor is not eligible.',
        });
        return false;
      }
    }

    if (currentStep === 0) {
      const asyncFieldsValid = await trigger(['phone', 'idNumber']);
      if (!asyncFieldsValid) {
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      return;
    }

    const nextStep = Math.min(currentStep + 1, REGISTRATION_STEPS.length - 1);
    await persistDraft(currentStep);
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    const parsed = borrowerRegistrationSchema.safeParse(values);
    if (!parsed.success) {
      applySchemaErrors(parsed.error.issues, setError);
      return;
    }

    const conflictChecks = await runRegistrationConflictChecks({
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      idType: parsed.data.idType,
      idNumber: parsed.data.idNumber,
    });

    if (conflictChecks.blocking.length > 0) {
      setConflictReport(conflictChecks);
      setWarningsAcknowledged(false);

      for (const conflict of conflictChecks.blocking) {
        if (conflict.field) {
          setError(conflict.field, {
            type: 'manual',
            message: conflict.message,
          });
        }
      }

      setCurrentStep(getConflictTargetStep(conflictChecks.blocking));
      return;
    }

    if (conflictChecks.warnings.length > 0 && !warningsAcknowledged) {
      setConflictReport(conflictChecks);
      return;
    }

    if (!user?.id) {
      setSubmitError('You must be signed in to register a borrower.');
      return;
    }

    try {
      if (draftId) {
        await borrowerService.updateRegistrationDraft(
          draftId,
          parsed.data as Record<string, unknown>,
          REGISTRATION_STEPS.length - 1,
        );
      }

      const result = draftId
        ? await borrowerService.submitRegistrationDraft(draftId)
        : await borrowerService.registerBorrower(toRegisterBorrowerPayload(parsed.data, user.id));
      setRegisteredBorrowerId(result.id);
      setConflictReport({ blocking: [], warnings: [] });
      notifyMutationSuccess(
        'Borrower registered',
        'The application is pending approver review.',
      );
    } catch (error) {
      notifyMutationError('Registration failed', error, 'Unable to submit registration.');
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Unable to submit registration. Please try again.',
      );
    }
  });

  if (registeredBorrowerId) {
    return (
      <EmptyState
        title="Borrower registered"
        description="The application has been saved with Pending status and is ready for approver review."
        action={
          <Button type="button" onClick={() => window.location.reload()}>
            Register another borrower
          </Button>
        }
      />
    );
  }

  return (
    <MultiStepForm
      steps={REGISTRATION_STEPS}
      currentStep={currentStep}
      onBack={handleBack}
      onNext={handleNext}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      hideFutureSteps
      showProgressBar
      submitPermissions={[PERMISSION.REGISTER_BORROWERS]}
    >
      {submitError ? (
        <Alert title="Registration failed" variant="error">
          {submitError}
        </Alert>
      ) : null}

      {conflictReport.blocking.length > 0 || conflictReport.warnings.length > 0 ? (
        <RegistrationConflictAlerts
          blocking={conflictReport.blocking}
          warnings={conflictReport.warnings}
          warningsAcknowledged={warningsAcknowledged}
          onAcknowledgeWarnings={() => setWarningsAcknowledged(true)}
        />
      ) : null}

      {currentStep === 0 ? (
        <section className="grid gap-wilms-4 md:grid-cols-2">
          <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
            <Input id="fullName" hasError={Boolean(errors.fullName)} {...register('fullName')} />
          </FormField>
          <FormField
            label="Date of birth"
            htmlFor="dateOfBirth"
            required
            error={errors.dateOfBirth?.message}
          >
            <Input
              id="dateOfBirth"
              type="date"
              max={MAX_BORROWER_DATE_OF_BIRTH}
              hasError={Boolean(errors.dateOfBirth)}
              {...register('dateOfBirth')}
            />
          </FormField>
          <FormField label="Gender" htmlFor="gender" required error={errors.gender?.message}>
            <Select id="gender" hasError={Boolean(errors.gender)} {...register('gender')}>
              <option value="">Select gender</option>
              <option value={BORROWER_GENDER.FEMALE}>Female</option>
              <option value={BORROWER_GENDER.MALE}>Male</option>
              <option value={BORROWER_GENDER.OTHER}>Other</option>
            </Select>
          </FormField>
          <FormField label="Phone" htmlFor="phone" required error={errors.phone?.message}>
            <Input id="phone" type="tel" hasError={Boolean(errors.phone)} {...phoneField} />
          </FormField>
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" hasError={Boolean(errors.email)} {...register('email')} />
          </FormField>
          <FormField
            label="Nationality"
            htmlFor="nationality"
            required
            error={errors.nationality?.message}
          >
            <Input
              id="nationality"
              hasError={Boolean(errors.nationality)}
              {...register('nationality')}
            />
          </FormField>
          <FormField label="ID type" htmlFor="idType" required error={errors.idType?.message}>
            <Select id="idType" hasError={Boolean(errors.idType)} {...register('idType')}>
              <option value="">Select ID type</option>
              <option value={BORROWER_ID_TYPE.GHANA_CARD}>Ghana Card</option>
              <option value={BORROWER_ID_TYPE.VOTER_ID}>Voter ID</option>
              <option value={BORROWER_ID_TYPE.PASSPORT}>Passport</option>
            </Select>
          </FormField>
          <FormField label="ID number" htmlFor="idNumber" required error={errors.idNumber?.message}>
            <Input
              id="idNumber"
              hasError={Boolean(errors.idNumber)}
              placeholder={
                watchedIdType
                  ? BORROWER_ID_PLACEHOLDERS[watchedIdType as keyof typeof BORROWER_ID_PLACEHOLDERS]
                  : 'Select ID type first'
              }
              {...idNumberField}
              onBlur={(event) => {
                void idNumberField.onBlur(event);
                if (getValues('idType') === BORROWER_ID_TYPE.GHANA_CARD) {
                  setValue('idNumber', formatGhanaCardInput(event.target.value), {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
            />
          </FormField>
          <FormField
            label="ID document attachment"
            htmlFor="idDocument"
            error={errors.idDocument?.message}
            className="md:col-span-2"
          >
            <Controller
              control={control}
              name="idDocument"
              render={({ field }) => (
                <DocumentUpload
                  id="idDocument"
                  label="National ID scan or photo"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  uploadPurpose={UPLOAD_PURPOSE.REGISTRATION_ATTACHMENT}
                  entityId={user?.id}
                  onUploadRecordChange={(record) =>
                    setValue('idDocumentUploadId', record?.id, { shouldDirty: true })
                  }
                />
              )}
            />
          </FormField>
        </section>
      ) : null}

      {currentStep === 1 ? (
        <section className="grid gap-wilms-4 md:grid-cols-2">
          <FormField
            label="Home address"
            htmlFor="houseAddress"
            required
            error={errors.houseAddress?.message}
            hint={`Street, landmark, or house number (${REGISTRATION_ADDRESS_MIN_LENGTH}–${REGISTRATION_ADDRESS_MAX_LENGTH} characters).`}
            characterCount={{
              current: watchedHouseAddress.length,
              max: REGISTRATION_ADDRESS_MAX_LENGTH,
            }}
            className="md:col-span-2"
          >
            <Textarea
              id="houseAddress"
              rows={3}
              maxLength={REGISTRATION_ADDRESS_MAX_LENGTH}
              placeholder="e.g. House No. 12, Ring Road Central, Accra"
              hasError={Boolean(errors.houseAddress)}
              {...register('houseAddress')}
            />
          </FormField>
          <FormField
            label="GPS address"
            htmlFor="gpsAddress"
            required
            error={errors.gpsAddress?.message}
            hint="Ghana Post GPS code (GA-XXX-XXXX) or coordinates from current location."
            characterCount={{
              current: watchedGpsAddress.length,
              max: REGISTRATION_ADDRESS_MAX_LENGTH,
            }}
            className="md:col-span-2"
          >
            <div className="flex flex-col gap-wilms-2 sm:flex-row sm:items-start">
              <Input
                id="gpsAddress"
                hasError={Boolean(errors.gpsAddress)}
                className="min-w-0 flex-1"
                maxLength={REGISTRATION_ADDRESS_MAX_LENGTH}
                placeholder="GA-123-4567 or coordinates"
                {...register('gpsAddress')}
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 sm:min-w-[11rem]"
                disabled={isLocating}
                onClick={() => void handleUseCurrentLocation()}
              >
                {isLocating ? 'Locating…' : 'Use current location'}
              </Button>
            </div>
            {locationFeedback ? (
              <p className="mt-wilms-2 text-small text-text-muted" role="status">
                {locationFeedback}
              </p>
            ) : null}
          </FormField>
          <FormField label="Region" htmlFor="region" required error={errors.region?.message}>
            <Controller
              name="region"
              control={control}
              render={({ field }) => (
                <Select
                  id="region"
                  hasError={Boolean(errors.region)}
                  value={selectedRegionId}
                  onChange={(event) => {
                    const region = regionOptions.find((entry) => entry.id === event.target.value);
                    field.onChange(region?.name ?? '');
                    setValue('district', '', { shouldDirty: true });
                    setValue('city', '', { shouldDirty: true });
                  }}
                  onBlur={field.onBlur}
                >
                  <option value="">Select region</option>
                  {regionOptions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </Select>
              )}
            />
          </FormField>
          <FormField label="District" htmlFor="district" required error={errors.district?.message}>
            <Controller
              name="district"
              control={control}
              render={({ field }) => (
                <Select
                  id="district"
                  hasError={Boolean(errors.district)}
                  value={selectedDistrictId}
                  disabled={!selectedRegionId}
                  onChange={(event) => {
                    const district = districts.find((entry) => entry.id === event.target.value);
                    field.onChange(district?.name ?? '');
                    setValue('city', '', { shouldDirty: true });
                  }}
                  onBlur={field.onBlur}
                >
                  <option value="">{selectedRegionId ? 'Select district' : 'Select a region first'}</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </Select>
              )}
            />
          </FormField>
          <FormField label="City" htmlFor="city" required error={errors.city?.message}>
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <Select
                  id="city"
                  hasError={Boolean(errors.city)}
                  value={cities.find((entry) => entry.name === field.value)?.id ?? ''}
                  disabled={!selectedDistrictId}
                  onChange={(event) => {
                    const city = cities.find((entry) => entry.id === event.target.value);
                    field.onChange(city?.name ?? '');
                  }}
                  onBlur={field.onBlur}
                >
                  <option value="">
                    {selectedDistrictId ? 'Select city' : 'Select a district first'}
                  </option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </Select>
              )}
            />
          </FormField>
        </section>
      ) : null}

      {currentStep === 2 ? (
        <section className="grid gap-wilms-4 md:grid-cols-2">
          <FormField
            label="Business name"
            htmlFor="businessName"
            required
            error={errors.businessName?.message}
          >
            <Input
              id="businessName"
              hasError={Boolean(errors.businessName)}
              {...register('businessName')}
            />
          </FormField>
          <FormField
            label="Type of work"
            htmlFor="typeOfWork"
            required
            error={errors.typeOfWork?.message}
          >
            <Select id="typeOfWork" hasError={Boolean(errors.typeOfWork)} {...register('typeOfWork')}>
              <option value="">Select type of work</option>
              {TYPE_OF_WORK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FormField>
          {watchedTypeOfWork === 'Other' ? (
            <FormField
              label="Please specify"
              htmlFor="typeOfWorkOther"
              required
              error={errors.typeOfWorkOther?.message}
              className="md:col-span-2"
            >
              <Input
                id="typeOfWorkOther"
                hasError={Boolean(errors.typeOfWorkOther)}
                {...register('typeOfWorkOther')}
              />
            </FormField>
          ) : null}
          <FormField
            label="Business address"
            htmlFor="businessAddress"
            required
            error={errors.businessAddress?.message}
            hint={`Where the business operates (${REGISTRATION_ADDRESS_MIN_LENGTH}–${REGISTRATION_ADDRESS_MAX_LENGTH} characters).`}
            characterCount={{
              current: watchedBusinessAddress.length,
              max: REGISTRATION_ADDRESS_MAX_LENGTH,
            }}
            className="md:col-span-2"
          >
            <Textarea
              id="businessAddress"
              rows={3}
              maxLength={REGISTRATION_ADDRESS_MAX_LENGTH}
              placeholder="e.g. Makola Market, Stall 24, Accra"
              hasError={Boolean(errors.businessAddress)}
              {...register('businessAddress')}
            />
          </FormField>
        </section>
      ) : null}

      {currentStep === 3 ? (
        <section className="grid gap-wilms-4 md:grid-cols-2">
          <FormField
            label="Guarantor full name"
            htmlFor="guarantorName"
            required
            error={errors.guarantorName?.message}
          >
            <Input
              id="guarantorName"
              hasError={Boolean(errors.guarantorName)}
              {...register('guarantorName')}
            />
          </FormField>
          <FormField
            label="Guarantor contact"
            htmlFor="guarantorPhone"
            required
            error={errors.guarantorPhone?.message}
          >
            <Input
              id="guarantorPhone"
              type="tel"
              hasError={Boolean(errors.guarantorPhone)}
              {...register('guarantorPhone')}
            />
          </FormField>
          <FormField
            label="National ID type"
            htmlFor="guarantorIdType"
            required
            error={errors.guarantorIdType?.message}
          >
            <Select
              id="guarantorIdType"
              hasError={Boolean(errors.guarantorIdType)}
              {...register('guarantorIdType')}
            >
              <option value="">Select ID type</option>
              {Object.values(BORROWER_ID_TYPE).map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label="National ID number"
            htmlFor="guarantorIdNumber"
            required
            error={errors.guarantorIdNumber?.message}
          >
            <Input
              id="guarantorIdNumber"
              hasError={Boolean(errors.guarantorIdNumber)}
              placeholder={
                watchedGuarantorIdType
                  ? BORROWER_ID_PLACEHOLDERS[
                      watchedGuarantorIdType as keyof typeof BORROWER_ID_PLACEHOLDERS
                    ]
                  : 'Select ID type first'
              }
              {...register('guarantorIdNumber', {
                onBlur: (event) => {
                  if (getValues('guarantorIdType') === BORROWER_ID_TYPE.GHANA_CARD) {
                    setValue('guarantorIdNumber', formatGhanaCardInput(event.target.value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                },
              })}
            />
          </FormField>
          <FormField
            label="Relationship"
            htmlFor="guarantorRelationship"
            required
            error={errors.guarantorRelationship?.message}
          >
            <Select
              id="guarantorRelationship"
              hasError={Boolean(errors.guarantorRelationship)}
              {...register('guarantorRelationship')}
            >
              <option value="">Select relationship</option>
              {GUARANTOR_RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label="Guarantor passport photo"
            htmlFor="guarantorPhoto"
            required
            error={errors.guarantorPhoto?.message}
            className="md:col-span-2"
          >
            <Controller
              control={control}
              name="guarantorPhoto"
              render={({ field }) => (
                <PhotoUploadField
                  id="guarantorPhoto"
                  name={field.name}
                  value={field.value}
                  hasError={Boolean(errors.guarantorPhoto)}
                  error={errors.guarantorPhoto?.message}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  registrationSessionId={registrationSessionId}
                  officerId={user?.id}
                  captureTarget="guarantor"
                  uploadPurpose={UPLOAD_PURPOSE.GUARANTOR_PHOTO}
                  entityId={user?.id}
                  onUploadRecordChange={(record) =>
                    setValue('guarantorPhotoUploadId', record?.id, { shouldDirty: true })
                  }
                />
              )}
            />
          </FormField>
          {guarantorEligibility ? (
            <div className="md:col-span-2 rounded-sm border border-border bg-background px-wilms-3 py-wilms-2 text-small text-text-primary">
              Current Guarantees: {guarantorEligibility.activeGuaranteeCount} of{' '}
              {guarantorEligibility.maxGuarantees} · {guarantorEligibility.validationStatus}
            </div>
          ) : null}
        </section>
      ) : null}

      {currentStep === 4 ? (
        <section>
          <FormField label="Borrower passport photo" htmlFor="photo" required error={errors.photo?.message}>
            <Controller
              control={control}
              name="photo"
              render={({ field }) => (
                <PhotoUploadField
                  id="photo"
                  name={field.name}
                  value={field.value}
                  hasError={Boolean(errors.photo)}
                  error={errors.photo?.message}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  registrationSessionId={registrationSessionId}
                  officerId={user?.id}
                  captureTarget="borrower"
                  uploadPurpose={UPLOAD_PURPOSE.BORROWER_PHOTO}
                  entityId={user?.id}
                  onUploadRecordChange={(record) =>
                    setValue('photoUploadId', record?.id, { shouldDirty: true })
                  }
                />
              )}
            />
          </FormField>
        </section>
      ) : null}

      {currentStep === 5 ? (
        <section className="space-y-wilms-4">
          <p className="text-body text-text-muted">
            Signatures and thumbprints are optional during digital registration. They can be captured
            now or applied manually after printing the agreement.
          </p>
          <div className="grid gap-wilms-4 md:grid-cols-2 xl:grid-cols-3">
            <Controller
              control={control}
              name="borrowerSignatureUploadId"
              render={({ field: signatureField }) => (
                <Controller
                  control={control}
                  name="borrowerThumbprintUploadId"
                  render={({ field: thumbprintField }) => (
                    <Controller
                      control={control}
                      name="borrowerThumbprintManualPlaceholder"
                      render={({ field: manualField }) => (
                        <IdentityCaptureField
                          id="borrowerIdentity"
                          label="Borrower"
                          optional
                          signatureUploadId={signatureField.value}
                          thumbprintUploadId={thumbprintField.value}
                          manualThumbprintPlaceholder={manualField.value}
                          onSignatureUploadIdChange={signatureField.onChange}
                          onThumbprintUploadIdChange={thumbprintField.onChange}
                          onManualThumbprintPlaceholderChange={manualField.onChange}
                          entityId={registrationSessionId}
                        />
                      )}
                    />
                  )}
                />
              )}
            />
            <Controller
              control={control}
              name="guarantorSignatureUploadId"
              render={({ field: signatureField }) => (
                <Controller
                  control={control}
                  name="guarantorThumbprintUploadId"
                  render={({ field: thumbprintField }) => (
                    <Controller
                      control={control}
                      name="guarantorThumbprintManualPlaceholder"
                      render={({ field: manualField }) => (
                        <IdentityCaptureField
                          id="guarantorIdentity"
                          label="Guarantor"
                          optional
                          signatureUploadId={signatureField.value}
                          thumbprintUploadId={thumbprintField.value}
                          manualThumbprintPlaceholder={manualField.value}
                          onSignatureUploadIdChange={signatureField.onChange}
                          onThumbprintUploadIdChange={thumbprintField.onChange}
                          onManualThumbprintPlaceholderChange={manualField.onChange}
                          entityId={registrationSessionId}
                        />
                      )}
                    />
                  )}
                />
              )}
            />
            <Controller
              control={control}
              name="officerSignatureUploadId"
              render={({ field }) => (
                <SignatureUploadField
                  id="officerSignature"
                  label="Officer signature"
                  optional
                  uploadId={field.value}
                  onUploadIdChange={field.onChange}
                  entityId={user?.id}
                />
              )}
            />
          </div>
        </section>
      ) : null}

      {currentStep === 6 ? (
        <RegistrationReviewPanel
          values={getValues()}
          guarantorEligibility={guarantorEligibility}
          officerName={user?.displayName ?? 'Registration Officer'}
        />
      ) : null}
    </MultiStepForm>
  );
}
