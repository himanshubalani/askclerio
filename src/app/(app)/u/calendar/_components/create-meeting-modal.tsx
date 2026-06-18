"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, AlertCircleIcon } from "@hugeicons/core-free-icons";
import {
  type CreateMeetingFormValues,
  type ValidationErrors,
  validateMeetingForm,
} from "../_lib/form-validation";

export interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CreateMeetingFormValues) => void;
  isPending: boolean;
  error: string | null;
}

const initialFormValues: CreateMeetingFormValues = {
  title: "",
  date: "",
  startTime: "",
  endTime: "",
  description: "",
  attendees: "",
};

export function CreateMeetingModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  error,
}: CreateMeetingModalProps) {
  const [formValues, setFormValues] =
    useState<CreateMeetingFormValues>(initialFormValues);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormValues(initialFormValues);
      setValidationErrors({});
    }
  }, [isOpen]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function handleFieldChange(
    field: keyof CreateMeetingFormValues,
    value: string
  ) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    // Clear field-level validation error on change
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors = validateMeetingForm(formValues);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    onSubmit(formValues);
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-meeting-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#fcfcfc] shadow-[0_24px_64px_rgba(2,43,58,0.16),0_8px_24px_rgba(2,43,58,0.08),0_2px_8px_rgba(2,43,58,0.04)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e1e5f2] px-6 py-4">
          <h2
            id="create-meeting-title"
            className="text-lg font-semibold text-[#022b3a]"
          >
            Create Meeting
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#022b3a]/60 transition-[color,background-color] hover:bg-[#e1e5f2]/50 hover:text-[#022b3a]"
            aria-label="Close modal"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="flex flex-col gap-4">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="meeting-title"
                className="text-sm font-medium text-[#022b3a]"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="meeting-title"
                type="text"
                value={formValues.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                maxLength={200}
                className="rounded-md border border-[#e1e5f2] px-3 py-2 text-sm text-[#022b3a] placeholder:text-[#022b3a]/40 focus:outline-none focus:ring-1 focus:ring-[#1f7a8c]"
                placeholder="Meeting title"
              />
              {validationErrors.title && (
                <span className="text-xs text-red-600">
                  {validationErrors.title}
                </span>
              )}
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="meeting-date"
                className="text-sm font-medium text-[#022b3a]"
              >
                Date <span className="text-red-500">*</span>
              </label>
              <input
                id="meeting-date"
                type="date"
                value={formValues.date}
                onChange={(e) => handleFieldChange("date", e.target.value)}
                className="rounded-md border border-[#e1e5f2] px-3 py-2 text-sm text-[#022b3a] focus:outline-none focus:ring-1 focus:ring-[#1f7a8c]"
              />
              {validationErrors.date && (
                <span className="text-xs text-red-600">
                  {validationErrors.date}
                </span>
              )}
            </div>

            {/* Start Time / End Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="meeting-start-time"
                  className="text-sm font-medium text-[#022b3a]"
                >
                  Start time <span className="text-red-500">*</span>
                </label>
                <input
                  id="meeting-start-time"
                  type="time"
                  value={formValues.startTime}
                  onChange={(e) =>
                    handleFieldChange("startTime", e.target.value)
                  }
                  className="rounded-md border border-[#e1e5f2] px-3 py-2 text-sm text-[#022b3a] focus:outline-none focus:ring-1 focus:ring-[#1f7a8c]"
                />
                {validationErrors.startTime && (
                  <span className="text-xs text-red-600">
                    {validationErrors.startTime}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="meeting-end-time"
                  className="text-sm font-medium text-[#022b3a]"
                >
                  End time <span className="text-red-500">*</span>
                </label>
                <input
                  id="meeting-end-time"
                  type="time"
                  value={formValues.endTime}
                  onChange={(e) => handleFieldChange("endTime", e.target.value)}
                  className="rounded-md border border-[#e1e5f2] px-3 py-2 text-sm text-[#022b3a] focus:outline-none focus:ring-1 focus:ring-[#1f7a8c]"
                />
                {validationErrors.endTime && (
                  <span className="text-xs text-red-600">
                    {validationErrors.endTime}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="meeting-description"
                className="text-sm font-medium text-[#022b3a]"
              >
                Description
              </label>
              <textarea
                id="meeting-description"
                value={formValues.description}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                maxLength={2000}
                rows={3}
                className="rounded-md border border-[#e1e5f2] px-3 py-2 text-sm text-[#022b3a] placeholder:text-[#022b3a]/40 focus:outline-none focus:ring-1 focus:ring-[#1f7a8c] resize-none"
                placeholder="Add a description (optional)"
              />
            </div>

            {/* Attendees */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="meeting-attendees"
                className="text-sm font-medium text-[#022b3a]"
              >
                Attendees
              </label>
              <input
                id="meeting-attendees"
                type="text"
                value={formValues.attendees}
                onChange={(e) => handleFieldChange("attendees", e.target.value)}
                className="rounded-md border border-[#e1e5f2] px-3 py-2 text-sm text-[#022b3a] placeholder:text-[#022b3a]/40 focus:outline-none focus:ring-1 focus:ring-[#1f7a8c]"
                placeholder="Comma-separated emails (e.g., alice@example.com, bob@example.com)"
              />
              {validationErrors.attendees && (
                <span className="text-xs text-red-600">
                  {validationErrors.attendees}
                </span>
              )}
            </div>
          </div>

          {/* API Error Banner */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                className="h-4 w-4 shrink-0 text-red-600"
              />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#e1e5f2] px-4 py-2 text-sm font-medium text-[#022b3a]/60 transition-[color,background-color] hover:text-[#022b3a] hover:bg-[#e1e5f2]/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-[#1f7a8c] px-4 py-2 text-sm font-medium text-white transition-[transform,background-color] hover:bg-[#022b3a] active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Creating…" : "Create Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
