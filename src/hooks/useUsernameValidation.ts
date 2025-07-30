import { useState, useEffect } from 'react';
import { checkUsernameExists } from '@/lib/firestore';

interface UsernameValidationProps {
  username: string;
  currentUserId?: string;
  onValidationChange: (isValid: boolean, message: string) => void;
}

export const useUsernameValidation = ({ username, currentUserId, onValidationChange }: UsernameValidationProps) => {
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const validateUsername = async () => {
      if (!username) {
        onValidationChange(false, '');
        return;
      }

      // Format validation: only lowercase letters and numbers
      const formatRegex = /^[a-z0-9]+$/;
      if (!formatRegex.test(username)) {
        onValidationChange(false, 'Username can only contain lowercase letters and numbers');
        return;
      }

      // Length validation
      if (username.length < 3) {
        onValidationChange(false, 'Username must be at least 3 characters');
        return;
      }

      if (username.length > 20) {
        onValidationChange(false, 'Username cannot exceed 20 characters');
        return;
      }

      // Check if username exists in Firestore
      setIsChecking(true);
      try {
        const exists = await checkUsernameExists(username, currentUserId);
        if (exists) {
          onValidationChange(false, 'Username is already taken');
        } else {
          onValidationChange(true, 'Username is available');
        }
      } catch (error) {
        console.error('Error checking username:', error);
        onValidationChange(false, 'Error checking username availability');
      } finally {
        setIsChecking(false);
      }
    };

    // Debounce the validation
    const timeoutId = setTimeout(validateUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username, currentUserId, onValidationChange]);

  return { isChecking };
};