import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';

export const TextProcessingNodeDefinition = new NodeDefinition({
  name: 'TextProcessing',
  displayName: 'Text Processing',
  description: 'Process and manipulate text data with various string operations',
  version: 1,
  group: ['data'],
  icon: 'fa:font',
  defaults: {
    name: 'Text Processing',
    color: '#F59E0B',
  },
  inputs: ['main'],
  outputs: ['main'],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Extract Text', value: 'extract' },
        { name: 'Replace Text', value: 'replace' },
        { name: 'Split Text', value: 'split' },
        { name: 'Join Text', value: 'join' },
        { name: 'Transform Case', value: 'transformCase' },
        { name: 'Trim Text', value: 'trim' },
        { name: 'Format Text', value: 'format' },
        { name: 'Validate Text', value: 'validate' },
        { name: 'Count Words', value: 'countWords' },
        { name: 'Generate Hash', value: 'hash' },
      ],
      default: 'extract',
      required: true,
    },
    {
      name: 'inputText',
      displayName: 'Input Text',
      type: 'string',
      description: 'Text to process (leave empty to use input data)',
      placeholder: 'Enter text to process...',
    },
    {
      name: 'pattern',
      displayName: 'Pattern/Regex',
      type: 'string',
      placeholder: '\\b\\w+@\\w+\\.\\w+\\b',
      description: 'Regular expression pattern for extraction or matching',
      displayOptions: {
        show: {
          operation: ['extract', 'replace', 'validate'],
        },
      },
    },
    {
      name: 'replacement',
      displayName: 'Replacement Text',
      type: 'string',
      placeholder: 'New text',
      description: 'Text to replace matches with',
      displayOptions: {
        show: {
          operation: ['replace'],
        },
      },
    },
    {
      name: 'delimiter',
      displayName: 'Delimiter',
      type: 'string',
      default: ',',
      placeholder: ',',
      description: 'Character(s) to split or join text on',
      displayOptions: {
        show: {
          operation: ['split', 'join'],
        },
      },
    },
    {
      name: 'caseType',
      displayName: 'Case Type',
      type: 'options',
      options: [
        { name: 'Uppercase', value: 'upper' },
        { name: 'Lowercase', value: 'lower' },
        { name: 'Title Case', value: 'title' },
        { name: 'Sentence Case', value: 'sentence' },
        { name: 'Camel Case', value: 'camel' },
        { name: 'Snake Case', value: 'snake' },
        { name: 'Kebab Case', value: 'kebab' },
      ],
      default: 'lower',
      displayOptions: {
        show: {
          operation: ['transformCase'],
        },
      },
    },
    {
      name: 'trimType',
      displayName: 'Trim Type',
      type: 'options',
      options: [
        { name: 'Both Ends', value: 'both' },
        { name: 'Start Only', value: 'start' },
        { name: 'End Only', value: 'end' },
        { name: 'Custom Characters', value: 'custom' },
      ],
      default: 'both',
      displayOptions: {
        show: {
          operation: ['trim'],
        },
      },
    },
    {
      name: 'customTrimChars',
      displayName: 'Custom Trim Characters',
      type: 'string',
      placeholder: ' \\t\\n',
      description: 'Characters to trim (for custom trim type)',
      displayOptions: {
        show: {
          operation: ['trim'],
          trimType: ['custom'],
        },
      },
    },
    {
      name: 'formatTemplate',
      displayName: 'Format Template',
      type: 'string',
      placeholder: 'Hello {{name}}, you have {{count}} messages',
      description: 'Template string with {{variable}} placeholders',
      displayOptions: {
        show: {
          operation: ['format'],
        },
      },
    },
    {
      name: 'hashAlgorithm',
      displayName: 'Hash Algorithm',
      type: 'options',
      options: [
        { name: 'MD5', value: 'md5' },
        { name: 'SHA-1', value: 'sha1' },
        { name: 'SHA-256', value: 'sha256' },
        { name: 'SHA-512', value: 'sha512' },
      ],
      default: 'sha256',
      displayOptions: {
        show: {
          operation: ['hash'],
        },
      },
    },
    {
      name: 'encoding',
      displayName: 'Hash Encoding',
      type: 'options',
      options: [
        { name: 'Hexadecimal', value: 'hex' },
        { name: 'Base64', value: 'base64' },
      ],
      default: 'hex',
      displayOptions: {
        show: {
          operation: ['hash'],
        },
      },
    },
  ],
});

export class TextProcessingNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { 
        operation, 
        inputText, 
        pattern, 
        replacement, 
        delimiter, 
        caseType, 
        trimType, 
        customTrimChars,
        formatTemplate,
        hashAlgorithm,
        encoding
      } = context.parameters;
      
      const results: any[] = [];

      for (const item of context.inputData) {
        let result;
        const textToProcess = inputText || item.text || JSON.stringify(item);

        switch (operation) {
          case 'extract':
            result = this.extractText(textToProcess, pattern);
            break;
          case 'replace':
            result = this.replaceText(textToProcess, pattern, replacement);
            break;
          case 'split':
            result = this.splitText(textToProcess, delimiter);
            break;
          case 'join':
            result = this.joinText(item, delimiter);
            break;
          case 'transformCase':
            result = this.transformCase(textToProcess, caseType);
            break;
          case 'trim':
            result = this.trimText(textToProcess, trimType, customTrimChars);
            break;
          case 'format':
            result = this.formatText(formatTemplate, item);
            break;
          case 'validate':
            result = this.validateText(textToProcess, pattern);
            break;
          case 'countWords':
            result = this.countWords(textToProcess);
            break;
          case 'hash':
            result = await this.generateHash(textToProcess, hashAlgorithm, encoding);
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        results.push(result);
      }

      return {
        success: true,
        data: results,
        metadata: {
          executionTime: Date.now() - startTime,
          itemsProcessed: results.length,
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

  private extractText(text: string, pattern: string): any {
    if (!pattern) {
      throw new Error('Pattern is required for extract operation');
    }

    try {
      const regex = new RegExp(pattern, 'g');
      const matches = text.match(regex) || [];
      
      return {
        originalText: text,
        pattern,
        matches,
        matchCount: matches.length,
        firstMatch: matches[0] || null,
      };
    } catch (error) {
      throw new Error(`Invalid regex pattern: ${error.message}`);
    }
  }

  private replaceText(text: string, pattern: string, replacement: string = ''): any {
    if (!pattern) {
      throw new Error('Pattern is required for replace operation');
    }

    try {
      const regex = new RegExp(pattern, 'g');
      const originalText = text;
      const replacedText = text.replace(regex, replacement);
      const matchCount = (text.match(regex) || []).length;
      
      return {
        originalText,
        replacedText,
        pattern,
        replacement,
        matchCount,
        changed: originalText !== replacedText,
      };
    } catch (error) {
      throw new Error(`Invalid regex pattern: ${error.message}`);
    }
  }

  private splitText(text: string, delimiter: string = ','): any {
    const parts = text.split(delimiter);
    
    return {
      originalText: text,
      delimiter,
      parts,
      partCount: parts.length,
    };
  }

  private joinText(data: any, delimiter: string = ','): any {
    let parts: string[] = [];
    
    if (Array.isArray(data)) {
      parts = data.map(item => String(item));
    } else if (Array.isArray(data.parts)) {
      parts = data.parts.map(item => String(item));
    } else if (typeof data === 'object') {
      parts = Object.values(data).map(item => String(item));
    } else {
      parts = [String(data)];
    }
    
    const joinedText = parts.join(delimiter);
    
    return {
      parts,
      delimiter,
      joinedText,
      partCount: parts.length,
    };
  }

  private transformCase(text: string, caseType: string): any {
    let transformedText: string;
    
    switch (caseType) {
      case 'upper':
        transformedText = text.toUpperCase();
        break;
      case 'lower':
        transformedText = text.toLowerCase();
        break;
      case 'title':
        transformedText = text.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
        break;
      case 'sentence':
        transformedText = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        break;
      case 'camel':
        transformedText = text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
          index === 0 ? word.toLowerCase() : word.toUpperCase()
        ).replace(/\s+/g, '');
        break;
      case 'snake':
        transformedText = text.toLowerCase().replace(/\s+/g, '_');
        break;
      case 'kebab':
        transformedText = text.toLowerCase().replace(/\s+/g, '-');
        break;
      default:
        throw new Error(`Unknown case type: ${caseType}`);
    }
    
    return {
      originalText: text,
      transformedText,
      caseType,
      changed: text !== transformedText,
    };
  }

  private trimText(text: string, trimType: string, customChars?: string): any {
    let trimmedText: string;
    
    switch (trimType) {
      case 'both':
        trimmedText = text.trim();
        break;
      case 'start':
        trimmedText = text.trimStart();
        break;
      case 'end':
        trimmedText = text.trimEnd();
        break;
      case 'custom':
        if (!customChars) {
          throw new Error('Custom trim characters are required');
        }
        const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedChars = escapeRegex(customChars);
        const regex = new RegExp(`^[${escapedChars}]+|[${escapedChars}]+$`, 'g');
        trimmedText = text.replace(regex, '');
        break;
      default:
        throw new Error(`Unknown trim type: ${trimType}`);
    }
    
    return {
      originalText: text,
      trimmedText,
      trimType,
      customChars: customChars || null,
      charactersRemoved: text.length - trimmedText.length,
    };
  }

  private formatText(template: string, data: any): any {
    if (!template) {
      throw new Error('Format template is required');
    }
    
    const formattedText = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
    
    const variablesUsed = template.match(/\{\{(\w+)\}\}/g) || [];
    const variableNames = variablesUsed.map(v => v.replace(/[\{\}]/g, ''));
    
    return {
      template,
      formattedText,
      data,
      variablesUsed,
      variableNames,
      changed: template !== formattedText,
    };
  }

  private validateText(text: string, pattern: string): any {
    if (!pattern) {
      throw new Error('Pattern is required for validate operation');
    }
    
    try {
      const regex = new RegExp(pattern);
      const isValid = regex.test(text);
      const matches = text.match(regex) || [];
      
      return {
        text,
        pattern,
        isValid,
        matches,
        matchCount: matches.length,
      };
    } catch (error) {
      throw new Error(`Invalid regex pattern: ${error.message}`);
    }
  }

  private countWords(text: string): any {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const lines = text.split('\n').length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    
    return {
      text,
      wordCount: words.length,
      characterCount: characters,
      characterCountNoSpaces: charactersNoSpaces,
      lineCount: lines,
      paragraphCount: paragraphs,
      words,
      averageWordsPerLine: lines > 0 ? words.length / lines : 0,
    };
  }

  private async generateHash(text: string, algorithm: string, encoding: string): Promise<any> {
    const crypto = require('crypto');
    
    try {
      const hash = crypto.createHash(algorithm).update(text).digest(encoding);
      
      return {
        originalText: text,
        hash,
        algorithm,
        encoding,
        length: hash.length,
      };
    } catch (error) {
      throw new Error(`Failed to generate hash: ${error.message}`);
    }
  }
}
