import { describe, expect, it } from 'vitest'
import {
  formatCardNumberInput,
  formatExpiryInput,
  isRequired,
  isValidCardNumber,
  isValidCvc,
  isValidEmail,
  isValidExpiry,
  isValidPhone,
  isValidPostalCode,
  luhnCheck,
  validatePayment,
  validatePaymentField,
  validateShipping,
  validateShippingField,
  type PaymentInfo,
  type ShippingInfo,
} from './validation'

describe('isRequired', () => {
  it('is false for empty or whitespace-only strings', () => {
    expect(isRequired('')).toBe(false)
    expect(isRequired('   ')).toBe(false)
  })

  it('is true once there is non-whitespace content', () => {
    expect(isRequired('Jane')).toBe(true)
    expect(isRequired('  Jane  ')).toBe(true)
  })
})

describe('isValidEmail', () => {
  it('accepts a well-formed address', () => {
    expect(isValidEmail('jane@example.com')).toBe(true)
  })

  it('rejects addresses missing an @ or a domain', () => {
    expect(isValidEmail('jane@example')).toBe(false)
    expect(isValidEmail('jane.example.com')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('isValidPhone', () => {
  it('accepts 7-15 digits regardless of formatting', () => {
    expect(isValidPhone('555-123-4567')).toBe(true)
    expect(isValidPhone('(555) 123 4567')).toBe(true)
    expect(isValidPhone('5551234')).toBe(true)
  })

  it('rejects too few or too many digits', () => {
    expect(isValidPhone('55512')).toBe(false)
    expect(isValidPhone('1234567890123456')).toBe(false)
  })
})

describe('isValidPostalCode', () => {
  it('accepts common postal code shapes', () => {
    expect(isValidPostalCode('94105')).toBe(true)
    expect(isValidPostalCode('K1A 0B1')).toBe(true)
    expect(isValidPostalCode('SW1A 1AA')).toBe(true)
  })

  it('rejects codes that are too short or contain disallowed characters', () => {
    expect(isValidPostalCode('9')).toBe(false)
    expect(isValidPostalCode('12')).toBe(false)
    expect(isValidPostalCode('941#5')).toBe(false)
  })
})

describe('formatCardNumberInput', () => {
  it('strips non-digits and groups into 4s', () => {
    expect(formatCardNumberInput('4111111111111111')).toBe('4111 1111 1111 1111')
    expect(formatCardNumberInput('4111-1111-1111-1111')).toBe('4111 1111 1111 1111')
  })

  it('caps at 19 digits', () => {
    expect(formatCardNumberInput('1'.repeat(25)).replace(/\s/g, '')).toHaveLength(19)
  })
})

describe('luhnCheck', () => {
  it('accepts a known-valid test card number', () => {
    expect(luhnCheck('4111111111111111')).toBe(true)
  })

  it('rejects a single mistyped digit', () => {
    expect(luhnCheck('4111111111111112')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(luhnCheck('')).toBe(false)
  })
})

describe('isValidCardNumber', () => {
  it('accepts a valid card number regardless of spacing', () => {
    expect(isValidCardNumber('4111 1111 1111 1111')).toBe(true)
  })

  it('rejects a card number that is too short', () => {
    expect(isValidCardNumber('4111111111')).toBe(false)
  })

  it('rejects a correctly-sized number that fails the checksum', () => {
    expect(isValidCardNumber('4111111111111112')).toBe(false)
  })
})

describe('formatExpiryInput', () => {
  it('inserts a slash after two digits', () => {
    expect(formatExpiryInput('1230')).toBe('12/30')
  })

  it('leaves one or two digits alone', () => {
    expect(formatExpiryInput('1')).toBe('1')
    expect(formatExpiryInput('12')).toBe('12')
  })

  it('caps at 4 digits total', () => {
    expect(formatExpiryInput('123045')).toBe('12/30')
  })
})

describe('isValidExpiry', () => {
  const now = new Date('2026-06-15T00:00:00')

  it('rejects a malformed value', () => {
    expect(isValidExpiry('13/26', now)).toBe(false)
    expect(isValidExpiry('6/26', now)).toBe(false)
    expect(isValidExpiry('', now)).toBe(false)
  })

  it('rejects a month out of range', () => {
    expect(isValidExpiry('00/30', now)).toBe(false)
    expect(isValidExpiry('13/30', now)).toBe(false)
  })

  it('rejects a date in the past', () => {
    expect(isValidExpiry('05/26', now)).toBe(false)
    expect(isValidExpiry('12/25', now)).toBe(false)
  })

  it('accepts the current month and future dates', () => {
    expect(isValidExpiry('06/26', now)).toBe(true)
    expect(isValidExpiry('07/26', now)).toBe(true)
    expect(isValidExpiry('01/30', now)).toBe(true)
  })
})

describe('isValidCvc', () => {
  it('accepts 3 or 4 digits', () => {
    expect(isValidCvc('123')).toBe(true)
    expect(isValidCvc('1234')).toBe(true)
  })

  it('rejects non-digit or wrong-length values', () => {
    expect(isValidCvc('12')).toBe(false)
    expect(isValidCvc('12345')).toBe(false)
    expect(isValidCvc('12a')).toBe(false)
  })
})

function shipping(overrides: Partial<ShippingInfo> = {}): ShippingInfo {
  return {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    address1: '123 Main St',
    address2: '',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62704',
    country: 'US',
    phone: '5551234567',
    ...overrides,
  }
}

describe('validateShippingField', () => {
  it('requires fullName, address1, city, state, country', () => {
    expect(validateShippingField('fullName', '')).toBe('Full name is required')
    expect(validateShippingField('address1', '')).toBe('Address is required')
    expect(validateShippingField('city', '')).toBe('City is required')
    expect(validateShippingField('state', '')).toBe('State / province is required')
    expect(validateShippingField('country', '')).toBe('Country is required')
  })

  it('leaves the optional address2 field error-free', () => {
    expect(validateShippingField('address2', '')).toBeUndefined()
  })

  it('validates email format beyond required', () => {
    expect(validateShippingField('email', '')).toBe('Email is required')
    expect(validateShippingField('email', 'not-an-email')).toBe('Enter a valid email address')
    expect(validateShippingField('email', 'jane@example.com')).toBeUndefined()
  })

  it('validates postal code format beyond required', () => {
    expect(validateShippingField('postalCode', '')).toBe('Postal code is required')
    expect(validateShippingField('postalCode', '9')).toBe('Enter a valid postal code')
    expect(validateShippingField('postalCode', '62704')).toBeUndefined()
  })

  it('validates phone format beyond required', () => {
    expect(validateShippingField('phone', '')).toBe('Phone number is required')
    expect(validateShippingField('phone', '123')).toBe('Enter a valid phone number')
    expect(validateShippingField('phone', '5551234567')).toBeUndefined()
  })
})

describe('validateShipping', () => {
  it('returns no errors for a complete, valid form', () => {
    expect(validateShipping(shipping())).toEqual({})
  })

  it('collects an error per invalid field', () => {
    const errors = validateShipping(shipping({ fullName: '', email: 'bad', phone: '1' }))
    expect(Object.keys(errors).sort()).toEqual(['email', 'fullName', 'phone'])
  })
})

function payment(overrides: Partial<PaymentInfo> = {}): PaymentInfo {
  return {
    cardName: 'Jane Doe',
    cardNumber: '4111 1111 1111 1111',
    expiry: '12/30',
    cvc: '123',
    ...overrides,
  }
}

describe('validatePaymentField', () => {
  it('requires cardName', () => {
    expect(validatePaymentField('cardName', '')).toBe('Name on card is required')
  })

  it('validates card number beyond required', () => {
    expect(validatePaymentField('cardNumber', '')).toBe('Card number is required')
    expect(validatePaymentField('cardNumber', '4111 1111 1111 1112')).toBe(
      'Enter a valid card number',
    )
    expect(validatePaymentField('cardNumber', '4111 1111 1111 1111')).toBeUndefined()
  })

  it('validates expiry beyond required', () => {
    expect(validatePaymentField('expiry', '')).toBe('Expiry is required')
    expect(validatePaymentField('expiry', '13/20')).toBe('Enter a valid, unexpired MM/YY date')
  })

  it('validates cvc beyond required', () => {
    expect(validatePaymentField('cvc', '')).toBe('CVC is required')
    expect(validatePaymentField('cvc', '12')).toBe('Enter a valid CVC')
    expect(validatePaymentField('cvc', '123')).toBeUndefined()
  })
})

describe('validatePayment', () => {
  it('returns no errors for a complete, valid form', () => {
    expect(validatePayment(payment())).toEqual({})
  })

  it('collects an error per invalid field', () => {
    const errors = validatePayment(payment({ cardName: '', cvc: '1' }))
    expect(Object.keys(errors).sort()).toEqual(['cardName', 'cvc'])
  })
})
