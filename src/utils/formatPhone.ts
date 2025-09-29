/**
 * Phone formatting utility for US phone numbers
 * Formats input as (555) 123-4567 and caps at 10 digits
 */

export function formatUSPhone(input: string) {
  // Remove all non-digit characters and limit to 10 digits
  const digits = (input || '').replace(/\D/g, '').slice(0, 10);

  // Split into parts
  const p1 = digits.slice(0, 3);  // Area code
  const p2 = digits.slice(3, 6);  // First 3 digits
  const p3 = digits.slice(6, 10); // Last 4 digits

  // Build formatted string
  let formatted = '';
  if (p1) {
    formatted = `(${p1}`;
    if (p1.length === 3 && p2) {
      formatted += `) ${p2}`;
      if (p2.length === 3 && p3) {
        formatted += `-${p3}`;
      }
    }
  }

  return {
    digits,      // Raw digits for submission
    formatted    // Formatted string for display
  };
}

/**
 * Validates if a phone number has exactly 10 digits
 */
export function isValidUSPhone(phone: string): boolean {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length === 10;
}

/**
 * Extracts raw digits from any phone format
 */
export function extractDigits(phone: string): string {
  return (phone || '').replace(/\D/g, '').slice(0, 10);
}