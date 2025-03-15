import { useCallback } from 'react';
import useI18n from './useI18n';
import useError from './useError';

const useValidation = (options = {}) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  const { translate } = useI18n();
  const { handleError } = useError();

  // Basic validators
  const validators = {
    // Required field
    required: useCallback((value) => {
      if (value === undefined || value === null || value === '') {
        return translate('validation.required');
      }
      return null;
    }, [translate]),

    // Min length
    minLength: useCallback((min) => (value) => {
      if (value && value.length < min) {
        return translate('validation.minLength', { min });
      }
      return null;
    }, [translate]),

    // Max length
    maxLength: useCallback((max) => (value) => {
      if (value && value.length > max) {
        return translate('validation.maxLength', { max });
      }
      return null;
    }, [translate]),

    // Email format
    email: useCallback((value) => {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (value && !emailRegex.test(value)) {
        return translate('validation.email');
      }
      return null;
    }, [translate]),

    // Phone number format
    phone: useCallback((value) => {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (value && !phoneRegex.test(value)) {
        return translate('validation.phone');
      }
      return null;
    }, [translate]),

    // Number range
    range: useCallback((min, max) => (value) => {
      const num = Number(value);
      if (isNaN(num)) {
        return translate('validation.number');
      }
      if (num < min || num > max) {
        return translate('validation.range', { min, max });
      }
      return null;
    }, [translate]),

    // Password strength
    password: useCallback((value) => {
      if (!value) return null;

      const hasMinLength = value.length >= 8;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumbers = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

      if (!hasMinLength) {
        return translate('validation.password.length');
      }
      if (!hasUpperCase || !hasLowerCase) {
        return translate('validation.password.case');
      }
      if (!hasNumbers) {
        return translate('validation.password.numbers');
      }
      if (!hasSpecialChar) {
        return translate('validation.password.special');
      }
      return null;
    }, [translate]),

    // Match other field
    matches: useCallback((otherValue, fieldName) => (value) => {
      if (value !== otherValue) {
        return translate('validation.matches', { field: fieldName });
      }
      return null;
    }, [translate]),

    // URL format
    url: useCallback((value) => {
      try {
        new URL(value);
        return null;
      } catch {
        return translate('validation.url');
      }
    }, [translate]),

    // Date format and range
    date: useCallback((minDate, maxDate) => (value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return translate('validation.date.format');
      }
      if (minDate && date < new Date(minDate)) {
        return translate('validation.date.min', { date: minDate });
      }
      if (maxDate && date > new Date(maxDate)) {
        return translate('validation.date.max', { date: maxDate });
      }
      return null;
    }, [translate]),
  };

  // Custom validator
  const createValidator = useCallback((validationFn, errorMessage) => {
    return (value) => {
      try {
        const isValid = validationFn(value);
        return isValid ? null : (errorMessage || translate('validation.invalid'));
      } catch (error) {
        handleError(error);
        return translate('validation.error');
      }
    };
  }, [translate, handleError]);

  // Validate single value
  const validateValue = useCallback((value, validations = []) => {
    for (const validation of validations) {
      const error = typeof validation === 'function'
        ? validation(value)
        : validators[validation]?.(value);

      if (error) return error;
    }
    return null;
  }, [validators]);

  // Validate form values
  const validateForm = useCallback((values, schema) => {
    const errors = {};
    
    Object.entries(schema).forEach(([field, validations]) => {
      const error = validateValue(values[field], validations);
      if (error) {
        errors[field] = error;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, [validateValue]);

  return {
    // Validators
    validators,
    createValidator,

    // Validation methods
    validateValue,
    validateForm,

    // Validation options
    validateOnChange,
    validateOnBlur,
  };
};

// Example usage with form validation
export const useFormValidation = (schema) => {
  const validation = useValidation();

  const validateField = useCallback((field, value) => {
    if (!schema[field]) return null;
    return validation.validateValue(value, schema[field]);
  }, [validation, schema]);

  const validateAllFields = useCallback((values) => {
    return validation.validateForm(values, schema);
  }, [validation, schema]);

  return {
    ...validation,
    validateField,
    validateAllFields,
  };
};

// Example usage with specific validations
export const useAuthValidation = () => {
  const validation = useValidation();
  const { validators } = validation;

  const validateLogin = useCallback((values) => {
    const schema = {
      email: [validators.required, validators.email],
      password: [validators.required, validators.minLength(8)],
    };
    return validation.validateForm(values, schema);
  }, [validation, validators]);

  const validateRegistration = useCallback((values) => {
    const schema = {
      name: [validators.required, validators.minLength(2)],
      email: [validators.required, validators.email],
      password: [validators.required, validators.password],
      confirmPassword: [
        validators.required,
        validators.matches(values.password, 'password'),
      ],
    };
    return validation.validateForm(values, schema);
  }, [validation, validators]);

  return {
    ...validation,
    validateLogin,
    validateRegistration,
  };
};

export default useValidation;
