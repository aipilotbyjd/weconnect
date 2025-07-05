import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';

export const ValidationNodeDefinition = new NodeDefinition({
  name: 'Validation',
  displayName: 'Validation & Utilities',
  description: 'Validate data, generate random values, and perform utility operations',
  version: 1,
  group: ['regular'],
  icon: 'fa:check-circle',
  defaults: {
    name: 'Validation & Utilities',
    color: '#EF4444',
  },
  inputs: ['main'],
  outputs: ['main', 'valid', 'invalid'],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Validate Email', value: 'validateEmail' },
        { name: 'Validate Phone', value: 'validatePhone' },
        { name: 'Validate URL', value: 'validateUrl' },
        { name: 'Validate Credit Card', value: 'validateCreditCard' },
        { name: 'Validate JSON', value: 'validateJson' },
        { name: 'Generate UUID', value: 'generateUuid' },
        { name: 'Generate Random String', value: 'generateRandomString' },
        { name: 'Generate Random Number', value: 'generateRandomNumber' },
        { name: 'Encode Base64', value: 'encodeBase64' },
        { name: 'Decode Base64', value: 'decodeBase64' },
        { name: 'URL Encode', value: 'urlEncode' },
        { name: 'URL Decode', value: 'urlDecode' },
        { name: 'Validate Password Strength', value: 'validatePassword' },
        { name: 'Generate QR Code Data', value: 'generateQrCode' },
        { name: 'Validate IP Address', value: 'validateIp' },
      ],
      default: 'validateEmail',
      required: true,
    },
    {
      name: 'inputValue',
      displayName: 'Input Value',
      type: 'string',
      description: 'Value to validate or process (leave empty to use input data)',
      placeholder: 'Enter value to validate...',
    },
    {
      name: 'validationRules',
      displayName: 'Validation Rules',
      type: 'json',
      default: {
        'required': true,
        'minLength': 3,
        'maxLength': 50
      },
      description: 'Custom validation rules (JSON object)',
      displayOptions: {
        show: {
          operation: ['validatePassword'],
        },
      },
    },
    {
      name: 'stringLength',
      displayName: 'String Length',
      type: 'number',
      default: 10,
      placeholder: '10',
      description: 'Length of random string to generate',
      displayOptions: {
        show: {
          operation: ['generateRandomString'],
        },
      },
    },
    {
      name: 'includeUppercase',
      displayName: 'Include Uppercase',
      type: 'boolean',
      default: true,
      description: 'Include uppercase letters in random string',
      displayOptions: {
        show: {
          operation: ['generateRandomString'],
        },
      },
    },
    {
      name: 'includeLowercase',
      displayName: 'Include Lowercase',
      type: 'boolean',
      default: true,
      description: 'Include lowercase letters in random string',
      displayOptions: {
        show: {
          operation: ['generateRandomString'],
        },
      },
    },
    {
      name: 'includeNumbers',
      displayName: 'Include Numbers',
      type: 'boolean',
      default: true,
      description: 'Include numbers in random string',
      displayOptions: {
        show: {
          operation: ['generateRandomString'],
        },
      },
    },
    {
      name: 'includeSymbols',
      displayName: 'Include Symbols',
      type: 'boolean',
      default: false,
      description: 'Include symbols in random string',
      displayOptions: {
        show: {
          operation: ['generateRandomString'],
        },
      },
    },
    {
      name: 'minNumber',
      displayName: 'Minimum Number',
      type: 'number',
      default: 1,
      placeholder: '1',
      description: 'Minimum value for random number',
      displayOptions: {
        show: {
          operation: ['generateRandomNumber'],
        },
      },
    },
    {
      name: 'maxNumber',
      displayName: 'Maximum Number',
      type: 'number',
      default: 100,
      placeholder: '100',
      description: 'Maximum value for random number',
      displayOptions: {
        show: {
          operation: ['generateRandomNumber'],
        },
      },
    },
    {
      name: 'outputFormat',
      displayName: 'Output Format',
      type: 'options',
      options: [
        { name: 'Split Valid/Invalid', value: 'split' },
        { name: 'All Results', value: 'all' },
        { name: 'Valid Only', value: 'valid' },
        { name: 'Invalid Only', value: 'invalid' },
      ],
      default: 'all',
      description: 'How to output validation results',
    },
  ],
});

export class ValidationNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const {
        operation,
        inputValue,
        validationRules,
        stringLength,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        minNumber,
        maxNumber,
        outputFormat,
      } = context.parameters;

      const results: any[] = [];
      const validResults: any[] = [];
      const invalidResults: any[] = [];

      for (const item of context.inputData) {
        let result;
        const valueToProcess = inputValue || item.value || item.email || item.phone || item.url || JSON.stringify(item);

        switch (operation) {
          case 'validateEmail':
            result = this.validateEmail(valueToProcess);
            break;
          case 'validatePhone':
            result = this.validatePhone(valueToProcess);
            break;
          case 'validateUrl':
            result = this.validateUrl(valueToProcess);
            break;
          case 'validateCreditCard':
            result = this.validateCreditCard(valueToProcess);
            break;
          case 'validateJson':
            result = this.validateJson(valueToProcess);
            break;
          case 'generateUuid':
            result = this.generateUuid();
            break;
          case 'generateRandomString':
            result = this.generateRandomString(
              stringLength,
              includeUppercase,
              includeLowercase,
              includeNumbers,
              includeSymbols
            );
            break;
          case 'generateRandomNumber':
            result = this.generateRandomNumber(minNumber, maxNumber);
            break;
          case 'encodeBase64':
            result = this.encodeBase64(valueToProcess);
            break;
          case 'decodeBase64':
            result = this.decodeBase64(valueToProcess);
            break;
          case 'urlEncode':
            result = this.urlEncode(valueToProcess);
            break;
          case 'urlDecode':
            result = this.urlDecode(valueToProcess);
            break;
          case 'validatePassword':
            result = this.validatePassword(valueToProcess, validationRules);
            break;
          case 'generateQrCode':
            result = this.generateQrCodeData(valueToProcess);
            break;
          case 'validateIp':
            result = this.validateIpAddress(valueToProcess);
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        results.push(result);
        
        // Separate valid and invalid results for split output
        if (result.isValid !== undefined) {
          if (result.isValid) {
            validResults.push(result);
          } else {
            invalidResults.push(result);
          }
        }
      }

      // Prepare outputs based on format
      let outputData = results;
      const outputs: Record<string, any[]> = { main: results };

      if (outputFormat === 'split') {
        outputs.valid = validResults;
        outputs.invalid = invalidResults;
      } else if (outputFormat === 'valid') {
        outputData = validResults;
      } else if (outputFormat === 'invalid') {
        outputData = invalidResults;
      }

      return {
        success: true,
        data: outputData,
        outputs,
        metadata: {
          executionTime: Date.now() - startTime,
          itemsProcessed: results.length,
          validCount: validResults.length,
          invalidCount: invalidResults.length,
          operation,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  private validateEmail(email: string): any {
    if (!email) {
      return {
        operation: 'validateEmail',
        value: email,
        isValid: false,
        errors: ['Email is required'],
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email.trim());
    const errors: string[] = [];

    if (!isValid) {
      errors.push('Invalid email format');
    }

    // Additional validations
    if (email.length > 254) {
      errors.push('Email too long (max 254 characters)');
    }

    const [localPart, domain] = email.split('@');
    if (localPart && localPart.length > 64) {
      errors.push('Local part too long (max 64 characters)');
    }

    return {
      operation: 'validateEmail',
      value: email,
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      details: {
        localPart,
        domain,
        length: email.length,
      },
    };
  }

  private validatePhone(phone: string): any {
    if (!phone) {
      return {
        operation: 'validatePhone',
        value: phone,
        isValid: false,
        errors: ['Phone number is required'],
      };
    }

    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    const errors: string[] = [];

    // Basic validation rules
    if (digitsOnly.length < 7) {
      errors.push('Phone number too short');
    }
    if (digitsOnly.length > 15) {
      errors.push('Phone number too long');
    }

    // International format validation
    const internationalRegex = /^\+?[1-9]\d{1,14}$/;
    const isValidInternational = internationalRegex.test(digitsOnly);

    // US format validation
    const usRegex = /^(\+1|1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
    const isValidUS = usRegex.test(digitsOnly);

    const isValid = errors.length === 0 && (isValidInternational || isValidUS);

    return {
      operation: 'validatePhone',
      value: phone,
      isValid,
      errors: errors.length > 0 ? errors : undefined,
      details: {
        digitsOnly,
        length: digitsOnly.length,
        isValidInternational,
        isValidUS,
        formatted: this.formatPhoneNumber(digitsOnly),
      },
    };
  }

  private validateUrl(url: string): any {
    if (!url) {
      return {
        operation: 'validateUrl',
        value: url,
        isValid: false,
        errors: ['URL is required'],
      };
    }

    const errors: string[] = [];
    let isValid = false;
    let parsedUrl: URL | null = null;

    try {
      parsedUrl = new URL(url);
      isValid = ['http:', 'https:', 'ftp:'].includes(parsedUrl.protocol);
      
      if (!isValid) {
        errors.push('Invalid protocol (must be http, https, or ftp)');
      }
    } catch (error) {
      errors.push('Invalid URL format');
    }

    return {
      operation: 'validateUrl',
      value: url,
      isValid: isValid && errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      details: parsedUrl ? {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        pathname: parsedUrl.pathname,
        search: parsedUrl.search,
        hash: parsedUrl.hash,
      } : null,
    };
  }

  private validateCreditCard(cardNumber: string): any {
    if (!cardNumber) {
      return {
        operation: 'validateCreditCard',
        value: cardNumber,
        isValid: false,
        errors: ['Card number is required'],
      };
    }

    const digitsOnly = cardNumber.replace(/\D/g, '');
    const errors: string[] = [];

    // Length validation
    if (digitsOnly.length < 13 || digitsOnly.length > 19) {
      errors.push('Invalid card number length');
    }

    // Luhn algorithm validation
    const isValidLuhn = this.validateLuhn(digitsOnly);
    if (!isValidLuhn) {
      errors.push('Invalid card number (failed Luhn check)');
    }

    // Determine card type
    const cardType = this.getCardType(digitsOnly);

    return {
      operation: 'validateCreditCard',
      value: cardNumber,
      isValid: errors.length === 0 && isValidLuhn,
      errors: errors.length > 0 ? errors : undefined,
      details: {
        digitsOnly,
        cardType,
        length: digitsOnly.length,
        formatted: this.formatCardNumber(digitsOnly),
      },
    };
  }

  private validateJson(jsonString: string): any {
    if (!jsonString) {
      return {
        operation: 'validateJson',
        value: jsonString,
        isValid: false,
        errors: ['JSON string is required'],
      };
    }

    try {
      const parsed = JSON.parse(jsonString);
      return {
        operation: 'validateJson',
        value: jsonString,
        isValid: true,
        parsedValue: parsed,
        details: {
          type: Array.isArray(parsed) ? 'array' : typeof parsed,
          size: JSON.stringify(parsed).length,
        },
      };
    } catch (error) {
      return {
        operation: 'validateJson',
        value: jsonString,
        isValid: false,
        errors: [error.message],
      };
    }
  }

  private generateUuid(): any {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    return {
      operation: 'generateUuid',
      uuid,
      version: 4,
      generatedAt: new Date(),
    };
  }

  private generateRandomString(
    length: number = 10,
    includeUppercase: boolean = true,
    includeLowercase: boolean = true,
    includeNumbers: boolean = true,
    includeSymbols: boolean = false
  ): any {
    let charset = '';
    
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) {
      throw new Error('At least one character type must be included');
    }

    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return {
      operation: 'generateRandomString',
      randomString: result,
      length,
      charset: {
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
      },
      generatedAt: new Date(),
    };
  }

  private generateRandomNumber(min: number = 1, max: number = 100): any {
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    return {
      operation: 'generateRandomNumber',
      randomNumber,
      min,
      max,
      generatedAt: new Date(),
    };
  }

  private encodeBase64(value: string): any {
    if (!value) {
      throw new Error('Value is required for Base64 encoding');
    }

    const encoded = Buffer.from(value, 'utf8').toString('base64');

    return {
      operation: 'encodeBase64',
      originalValue: value,
      encodedValue: encoded,
      originalLength: value.length,
      encodedLength: encoded.length,
    };
  }

  private decodeBase64(value: string): any {
    if (!value) {
      throw new Error('Value is required for Base64 decoding');
    }

    try {
      const decoded = Buffer.from(value, 'base64').toString('utf8');

      return {
        operation: 'decodeBase64',
        encodedValue: value,
        decodedValue: decoded,
        encodedLength: value.length,
        decodedLength: decoded.length,
      };
    } catch (error) {
      return {
        operation: 'decodeBase64',
        encodedValue: value,
        isValid: false,
        errors: ['Invalid Base64 string'],
      };
    }
  }

  private urlEncode(value: string): any {
    if (!value) {
      throw new Error('Value is required for URL encoding');
    }

    const encoded = encodeURIComponent(value);

    return {
      operation: 'urlEncode',
      originalValue: value,
      encodedValue: encoded,
      originalLength: value.length,
      encodedLength: encoded.length,
    };
  }

  private urlDecode(value: string): any {
    if (!value) {
      throw new Error('Value is required for URL decoding');
    }

    try {
      const decoded = decodeURIComponent(value);

      return {
        operation: 'urlDecode',
        encodedValue: value,
        decodedValue: decoded,
        encodedLength: value.length,
        decodedLength: decoded.length,
      };
    } catch (error) {
      return {
        operation: 'urlDecode',
        encodedValue: value,
        isValid: false,
        errors: ['Invalid URL encoded string'],
      };
    }
  }

  private validatePassword(password: string, rules: any = {}): any {
    if (!password) {
      return {
        operation: 'validatePassword',
        value: password,
        isValid: false,
        errors: ['Password is required'],
        strength: 'weak',
      };
    }

    const errors: string[] = [];
    let score = 0;

    // Default rules
    const defaultRules = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: false,
    };

    const validationRules = { ...defaultRules, ...rules };

    // Length validation
    if (password.length < validationRules.minLength) {
      errors.push(`Password must be at least ${validationRules.minLength} characters`);
    } else {
      score += 1;
    }

    if (password.length > validationRules.maxLength) {
      errors.push(`Password must be no more than ${validationRules.maxLength} characters`);
    }

    // Character type validation
    if (validationRules.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    } else if (/[A-Z]/.test(password)) {
      score += 1;
    }

    if (validationRules.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    } else if (/[a-z]/.test(password)) {
      score += 1;
    }

    if (validationRules.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain numbers');
    } else if (/\d/.test(password)) {
      score += 1;
    }

    if (validationRules.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain symbols');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    }

    // Determine strength
    let strength = 'weak';
    if (score >= 4) {
      strength = 'strong';
    } else if (score >= 2) {
      strength = 'medium';
    }

    return {
      operation: 'validatePassword',
      value: password,
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      strength,
      score,
      details: {
        length: password.length,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSymbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      },
    };
  }

  private generateQrCodeData(value: string): any {
    if (!value) {
      throw new Error('Value is required for QR code generation');
    }

    return {
      operation: 'generateQrCode',
      value,
      qrCodeData: {
        text: value,
        size: '200x200',
        format: 'PNG',
        errorCorrectionLevel: 'M',
        url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}`,
      },
      generatedAt: new Date(),
    };
  }

  private validateIpAddress(ip: string): any {
    if (!ip) {
      return {
        operation: 'validateIp',
        value: ip,
        isValid: false,
        errors: ['IP address is required'],
      };
    }

    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    const isValidIPv4 = ipv4Regex.test(ip);
    const isValidIPv6 = ipv6Regex.test(ip);
    const isValid = isValidIPv4 || isValidIPv6;

    return {
      operation: 'validateIp',
      value: ip,
      isValid,
      details: {
        isIPv4: isValidIPv4,
        isIPv6: isValidIPv6,
        version: isValidIPv4 ? 4 : isValidIPv6 ? 6 : null,
      },
      errors: !isValid ? ['Invalid IP address format'] : undefined,
    };
  }

  // Helper methods
  private validateLuhn(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  private getCardType(cardNumber: string): string {
    if (/^4/.test(cardNumber)) return 'Visa';
    if (/^5[1-5]/.test(cardNumber)) return 'MasterCard';
    if (/^3[47]/.test(cardNumber)) return 'American Express';
    if (/^6(?:011|5)/.test(cardNumber)) return 'Discover';
    return 'Unknown';
  }

  private formatCardNumber(cardNumber: string): string {
    return cardNumber.replace(/(.{4})/g, '$1 ').trim();
  }

  private formatPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length === 10) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    }
    if (phoneNumber.length === 11 && phoneNumber[0] === '1') {
      return `+1 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7)}`;
    }
    return phoneNumber;
  }
}
