/**
 * Meeting form validation and input mapping utilities.
 * Used by the CreateMeetingModal component to validate form inputs
 * and map them to the tRPC createEvent procedure input format.
 */

export interface CreateMeetingFormValues {
  title: string; // required, max 200 chars
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h for internal use)
  endTime: string; // HH:mm
  description: string; // optional, max 2000 chars
  attendees: string; // comma-separated emails, max 50
}

export interface ValidationErrors {
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  attendees?: string;
}

/**
 * Validates the meeting form values and returns an object of error messages.
 * An empty returned object means validation passed.
 */
export function validateMeetingForm(
  values: CreateMeetingFormValues
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required";
  } else if (values.title.length > 200) {
    errors.title = "Title must be 200 characters or less";
  }

  if (!values.date) {
    errors.date = "Date is required";
  }

  if (!values.startTime) {
    errors.startTime = "Start time is required";
  }

  if (!values.endTime) {
    errors.endTime = "End time is required";
  }

  if (values.startTime && values.endTime && values.startTime >= values.endTime) {
    errors.endTime = "End time must be after start time";
  }

  if (values.attendees) {
    const emails = values.attendees
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length > 50) {
      errors.attendees = "Maximum 50 attendees allowed";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = emails.find((e) => !emailRegex.test(e));
    if (invalid) {
      errors.attendees = `Invalid email: ${invalid}`;
    }
  }

  return errors;
}

/**
 * Maps form values to the tRPC createEvent input shape.
 * Uses the browser's timezone for datetime construction.
 */
export function formToCreateInput(values: CreateMeetingFormValues) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    summary: values.title,
    description: values.description || undefined,
    start: {
      dateTime: `${values.date}T${values.startTime}:00`,
      timeZone: tz,
    },
    end: {
      dateTime: `${values.date}T${values.endTime}:00`,
      timeZone: tz,
    },
    attendees: values.attendees
      ? values.attendees
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
          .map((email) => ({ email }))
      : undefined,
    calendarId: "primary",
  };
}
