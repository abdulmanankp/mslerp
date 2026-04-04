/**
 * Production Data Validation Schemas
 * Ensures all data entering the application meets required constraints
 * before persisting to Firestore
 */

// Simple validation utilities (no external dependencies required)
export class ValidationError extends Error {
  constructor(
    public field: string,
    public message: string,
  ) {
    super(`[${field}] ${message}`);
    this.name = "ValidationError";
  }
}

// ============== STRING VALIDATORS ==============
export const validateEmail = (email: unknown): string => {
  if (typeof email !== "string" || !email.trim()) {
    throw new ValidationError("email", "Email is required");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("email", "Invalid email format");
  }
  return email.trim().toLowerCase();
};

export const validatePhoneNumber = (phone: unknown): string => {
  if (typeof phone !== "string" || !phone.trim()) {
    throw new ValidationError("phone", "Phone number is required");
  }
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
    throw new ValidationError("phone", "Invalid phone number format");
  }
  return phone.trim();
};

export const validateString = (
  value: unknown,
  fieldName: string,
  options?: { minLength?: number; maxLength?: number; required?: boolean },
): string => {
  const { minLength = 1, maxLength = 1000, required = true } = options || {};

  if (required && (typeof value !== "string" || !value.trim())) {
    throw new ValidationError(fieldName, `${fieldName} is required`);
  }

  if (typeof value !== "string") {
    throw new ValidationError(fieldName, `${fieldName} must be a string`);
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    throw new ValidationError(fieldName, `${fieldName} must be at least ${minLength} characters`);
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(fieldName, `${fieldName} cannot exceed ${maxLength} characters`);
  }

  return trimmed;
};

// ============== NUMBER VALIDATORS ==============
export const validateNumber = (
  value: unknown,
  fieldName: string,
  options?: { min?: number; max?: number; integer?: boolean; required?: boolean },
): number => {
  const { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false, required = true } = options || {};

  if (required && (value === null || value === undefined)) {
    throw new ValidationError(fieldName, `${fieldName} is required`);
  }

  const num = Number(value);

  if (isNaN(num)) {
    throw new ValidationError(fieldName, `${fieldName} must be a valid number`);
  }

  if (integer && !Number.isInteger(num)) {
    throw new ValidationError(fieldName, `${fieldName} must be an integer`);
  }

  if (num < min) {
    throw new ValidationError(fieldName, `${fieldName} must be at least ${min}`);
  }

  if (num > max) {
    throw new ValidationError(fieldName, `${fieldName} cannot exceed ${max}`);
  }

  return num;
};

// ============== ARRAY VALIDATORS ==============
export const validateArray = (
  value: unknown,
  fieldName: string,
  options?: { minLength?: number; maxLength?: number; required?: boolean },
): unknown[] => {
  const { minLength = 0, maxLength = 10000, required = true } = options || {};

  if (required && (!Array.isArray(value) || value.length === 0)) {
    throw new ValidationError(fieldName, `${fieldName} must be a non-empty array`);
  }

  if (!Array.isArray(value)) {
    throw new ValidationError(fieldName, `${fieldName} must be an array`);
  }

  if (value.length < minLength) {
    throw new ValidationError(fieldName, `${fieldName} must contain at least ${minLength} items`);
  }

  if (value.length > maxLength) {
    throw new ValidationError(fieldName, `${fieldName} cannot contain more than ${maxLength} items`);
  }

  return value;
};

export const validateStringArray = (
  value: unknown,
  fieldName: string,
  options?: { minLength?: number; maxLength?: number; required?: boolean },
): string[] => {
  const arr = validateArray(value, fieldName, options);
  return arr.map((item, idx) => {
    if (typeof item !== "string") {
      throw new ValidationError(fieldName, `${fieldName}[${idx}] must be a string`);
    }
    return item.trim();
  });
};

// ============== DATE VALIDATORS ==============
export const validateDate = (
  value: unknown,
  fieldName: string,
  options?: { required?: boolean; minDate?: Date; maxDate?: Date },
): Date => {
  const { required = true, minDate, maxDate } = options || {};

  if (required && !value) {
    throw new ValidationError(fieldName, `${fieldName} is required`);
  }

  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "string") {
    date = new Date(value);
  } else if (typeof value === "number") {
    date = new Date(value);
  } else {
    throw new ValidationError(fieldName, `${fieldName} must be a valid date`);
  }

  if (isNaN(date.getTime())) {
    throw new ValidationError(fieldName, `${fieldName} is not a valid date`);
  }

  if (minDate && date < minDate) {
    throw new ValidationError(fieldName, `${fieldName} cannot be before ${minDate.toISOString()}`);
  }

  if (maxDate && date > maxDate) {
    throw new ValidationError(fieldName, `${fieldName} cannot be after ${maxDate.toISOString()}`);
  }

  return date;
};

// ============== ENTITY VALIDATORS ==============
export const validateCoordinator = (data: unknown) => {
  if (typeof data !== "object" || !data) {
    throw new ValidationError("coordinator", "Invalid coordinator data");
  }

  const obj = data as Record<string, unknown>;

  return {
    name: validateString(obj.name, "name", { minLength: 2, maxLength: 100 }),
    phone: validatePhoneNumber(obj.phone),
    address: validateString(obj.address, "address", { required: false, maxLength: 300 }),
    zone: validateString(obj.zone, "zone", { minLength: 1 }),
    districtId: validateString(obj.districtId, "districtId", { minLength: 1 }),
    status: validateString(obj.status, "status", { minLength: 1 }),
  };
};

export const validateDistrict = (data: unknown) => {
  if (typeof data !== "object" || !data) {
    throw new ValidationError("district", "Invalid district data");
  }

  const obj = data as Record<string, unknown>;

  return {
    name: validateString(obj.name, "name", { minLength: 2, maxLength: 100 }),
    zone: validateString(obj.zone, "zone", { minLength: 1 }),
    population: validateNumber(obj.population, "population", { min: 0, max: 100000000, integer: true, required: false }),
  };
};

export const validateMeeting = (data: unknown) => {
  if (typeof data !== "object" || !data) {
    throw new ValidationError("meeting", "Invalid meeting data");
  }

  const obj = data as Record<string, unknown>;

  return {
    title: validateString(obj.title, "title", { minLength: 3, maxLength: 200 }),
    monthDate: validateDate(obj.monthDate, "monthDate"),
    scope: validateString(obj.scope, "scope", { minLength: 1 }),
    districtIds: validateStringArray(obj.districtIds, "districtIds", { minLength: 1, maxLength: 100 }),
  };
};

export const validateUniversityGoal = (data: unknown) => {
  if (typeof data !== "object" || !data) {
    throw new ValidationError("universityGoal", "Invalid university goal data");
  }

  const obj = data as Record<string, unknown>;

  return {
    month: validateString(obj.month, "month", { minLength: 1 }),
    universityId: validateString(obj.universityId, "universityId", { minLength: 1 }),
    scenarioId: validateString(obj.scenarioId, "scenarioId", { minLength: 1 }),
    targetNumber: validateNumber(obj.targetNumber, "targetNumber", { min: 0, max: 1000000, integer: true }),
  };
};

export const validateActivityReport = (data: unknown) => {
  if (typeof data !== "object" || !data) {
    throw new ValidationError("activityReport", "Invalid activity report data");
  }

  const obj = data as Record<string, unknown>;

  return {
    activityId: validateString(obj.activityId, "activityId", { minLength: 1 }),
    targetNumber: validateNumber(obj.targetNumber, "targetNumber", { min: 0, max: 1000000, integer: true }),
    achievedNumber: validateNumber(obj.achievedNumber, "achievedNumber", { min: 0, max: 1000000, integer: true }),
    notes: validateString(obj.notes, "notes", { required: false, maxLength: 500 }),
  };
};

export const validateMeetingReport = (data: unknown) => {
  if (typeof data !== "object" || !data) {
    throw new ValidationError("meetingReport", "Invalid meeting report data");
  }

  const obj = data as Record<string, unknown>;
  const districtIds = validateStringArray(obj.districtIds, "districtIds", { minLength: 1 });
  const activityReports = validateArray(obj.activityReports, "activityReports", { required: false });

  return {
    meetingId: validateString(obj.meetingId, "meetingId", { minLength: 1 }),
    districtIds,
    activityReports: activityReports?.map((report, idx) => {
      try {
        return validateActivityReport(report);
      } catch (error) {
        throw new ValidationError("activityReports", `Item ${idx}: ${error instanceof Error ? error.message : "Invalid"}`);
      }
    }) || [],
    status: validateString(obj.status, "status", { minLength: 1 }),
  };
};

// ============== PERMISSION VALIDATORS ==============
export const validatePermissions = (data: unknown) => {
  if (typeof data !== "object" || !data) {
    throw new ValidationError("permissions", "Invalid permissions data");
  }

  const obj = data as Record<string, unknown>;

  // Ensure all required permission fields are present
  const requiredPermissions = [
    "appAccess",
    "canAddDistrictData",
    "canEditDistrictData",
    "canCreateMeetings",
    "canManageUsers",
    "canCreateUniversityMeetings",
    "canManageUniversityRecords",
    "canManageUniversityCampaigns",
    "canMonitorUniversityAnalytics",
    "canExportUniversityReports",
  ];

  const permissions: Record<string, boolean | string[]> = {};

  for (const perm of requiredPermissions) {
    if (typeof obj[perm] !== "boolean") {
      throw new ValidationError("permissions", `Permission '${perm}' must be a boolean`);
    }
    permissions[perm] = obj[perm] as boolean;
  }

  // Validate assignedDistrictIds
  if (obj.assignedDistrictIds !== undefined) {
    permissions.assignedDistrictIds = validateStringArray(obj.assignedDistrictIds, "assignedDistrictIds", {
      required: false,
    });
  }

  return permissions;
};

// ============== HELPER: SAFE VALIDATION WRAPPER ==============
export const validateSafely = <T>(validator: () => T, defaultValue: T, context: string = ""): T => {
  try {
    return validator();
  } catch (error) {
    console.error(`Validation error in ${context}:`, error);
    // In production, this should also trigger error logging/monitoring
    return defaultValue;
  }
};
