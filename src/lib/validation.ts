// Pure validators and input formatters for the checkout form. Kept free of any
// component state so they're directly unit-testable (see the checkout flow test).

export function isRequired(value: string): boolean {
  return value.trim().length > 0
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

export function isValidPostalCode(postalCode: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$/.test(postalCode.trim())
}

export function formatCardNumberInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19)
  return (digits.match(/.{1,4}/g) ?? []).join(' ')
}

export function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.length === 0) return false

  let sum = 0
  let shouldDouble = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i])
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}

export function isValidCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '')
  return digits.length >= 13 && digits.length <= 19 && luhnCheck(digits)
}

export function formatExpiryInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function isValidExpiry(expiry: string, now: Date = new Date()): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry.trim())
  if (!match) return false

  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return false

  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  if (year < currentYear) return false
  if (year === currentYear && month < currentMonth) return false
  return true
}

export function isValidCvc(cvc: string): boolean {
  return /^\d{3,4}$/.test(cvc.trim())
}

export interface ShippingInfo {
  fullName: string
  email: string
  address1: string
  address2: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
}

export interface PaymentInfo {
  cardName: string
  cardNumber: string
  expiry: string
  cvc: string
}

export type ShippingErrors = Partial<Record<keyof ShippingInfo, string>>
export type PaymentErrors = Partial<Record<keyof PaymentInfo, string>>

export function validateShippingField(key: keyof ShippingInfo, value: string): string | undefined {
  switch (key) {
    case 'fullName':
      return isRequired(value) ? undefined : 'Full name is required'
    case 'email':
      if (!isRequired(value)) return 'Email is required'
      return isValidEmail(value) ? undefined : 'Enter a valid email address'
    case 'address1':
      return isRequired(value) ? undefined : 'Address is required'
    case 'address2':
      return undefined
    case 'city':
      return isRequired(value) ? undefined : 'City is required'
    case 'state':
      return isRequired(value) ? undefined : 'State / province is required'
    case 'postalCode':
      if (!isRequired(value)) return 'Postal code is required'
      return isValidPostalCode(value) ? undefined : 'Enter a valid postal code'
    case 'country':
      return isRequired(value) ? undefined : 'Country is required'
    case 'phone':
      if (!isRequired(value)) return 'Phone number is required'
      return isValidPhone(value) ? undefined : 'Enter a valid phone number'
    default:
      return undefined
  }
}

export function validateShipping(value: ShippingInfo): ShippingErrors {
  const errors: ShippingErrors = {}
  for (const key of Object.keys(value) as (keyof ShippingInfo)[]) {
    const error = validateShippingField(key, value[key])
    if (error) errors[key] = error
  }
  return errors
}

export function validatePaymentField(key: keyof PaymentInfo, value: string): string | undefined {
  switch (key) {
    case 'cardName':
      return isRequired(value) ? undefined : 'Name on card is required'
    case 'cardNumber':
      if (!isRequired(value)) return 'Card number is required'
      return isValidCardNumber(value) ? undefined : 'Enter a valid card number'
    case 'expiry':
      if (!isRequired(value)) return 'Expiry is required'
      return isValidExpiry(value) ? undefined : 'Enter a valid, unexpired MM/YY date'
    case 'cvc':
      if (!isRequired(value)) return 'CVC is required'
      return isValidCvc(value) ? undefined : 'Enter a valid CVC'
    default:
      return undefined
  }
}

export function validatePayment(value: PaymentInfo): PaymentErrors {
  const errors: PaymentErrors = {}
  for (const key of Object.keys(value) as (keyof PaymentInfo)[]) {
    const error = validatePaymentField(key, value[key])
    if (error) errors[key] = error
  }
  return errors
}
