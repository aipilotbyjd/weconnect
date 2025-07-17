import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  AZURE = 'azure',
}

export interface AIProviderConfig {
  provider: AIProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseURL?: string;
}

@Injectable()
export class AIProviderService {
  private readonly logger = new Logger(AIProviderService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Create a language model instance based on provider configuration
   */
  createLanguageModel(config: AIProviderConfig): BaseChatModel {
    const { provider, model, temperature = 0.7, maxTokens = 1000 } = config;

    try {
      switch (provider) {
        case AIProvider.OPENAI:
          return new ChatOpenAI({
            modelName: model,
            temperature,
            maxTokens,
            openAIApiKey:
              config.apiKey || this.configService.get('OPENAI_API_KEY'),
          });

        case AIProvider.ANTHROPIC:
          return new ChatAnthropic({
            modelName: model,
            temperature,
            maxTokens,
            anthropicApiKey:
              config.apiKey || this.configService.get('ANTHROPIC_API_KEY'),
          });

        case AIProvider.GOOGLE:
          return new ChatGoogleGenerativeAI({
            model,
            temperature,
            maxOutputTokens: maxTokens,
            apiKey:
              config.apiKey || this.configService.get('GOOGLE_AI_API_KEY'),
          });

        default:
          throw new BadRequestException(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to create language model for provider ${provider}:`,
        error,
      );
      throw new BadRequestException(
        `Failed to initialize ${provider} model: ${error.message}`,
      );
    }
  }

  /**
   * Get available models for a specific provider
   */
  getAvailableModels(provider: AIProvider): string[] {
    switch (provider) {
      case AIProvider.OPENAI:
        return [
          'gpt-4',
          'gpt-4-turbo',
          'gpt-4o',
          'gpt-3.5-turbo',
          'gpt-3.5-turbo-16k',
        ];

      case AIProvider.ANTHROPIC:
        return [
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
          'claude-2.1',
          'claude-2.0',
        ];

      case AIProvider.GOOGLE:
        return [
          'gemini-pro',
          'gemini-pro-vision',
          'text-bison-001',
          'chat-bison-001',
        ];

      case AIProvider.AZURE:
        return ['gpt-4', 'gpt-4-32k', 'gpt-35-turbo', 'gpt-35-turbo-16k'];

      default:
        return [];
    }
  }

  /**
   * Validate provider configuration
   */
  validateProviderConfig(config: AIProviderConfig): boolean {
    const { provider, model } = config;

    // Check if provider is supported
    if (!Object.values(AIProvider).includes(provider)) {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }

    // Check if model is available for the provider
    const availableModels = this.getAvailableModels(provider);
    if (!availableModels.includes(model)) {
      throw new BadRequestException(
        `Model ${model} is not available for provider ${provider}. Available models: ${availableModels.join(', ')}`,
      );
    }

    // Check if API key is provided or configured
    const apiKeyEnvMap = {
      [AIProvider.OPENAI]: 'OPENAI_API_KEY',
      [AIProvider.ANTHROPIC]: 'ANTHROPIC_API_KEY',
      [AIProvider.GOOGLE]: 'GOOGLE_AI_API_KEY',
      [AIProvider.AZURE]: 'AZURE_OPENAI_API_KEY',
    };

    const envKey = apiKeyEnvMap[provider];
    if (!config.apiKey && !this.configService.get(envKey)) {
      throw new BadRequestException(
        `API key not provided for ${provider}. Set ${envKey} environment variable or provide apiKey in configuration.`,
      );
    }

    return true;
  }

  /**
   * Get provider information
   */
  getProviderInfo(provider: AIProvider) {
    const providerInfo = {
      [AIProvider.OPENAI]: {
        name: 'OpenAI',
        description: 'Advanced language models from OpenAI',
        website: 'https://openai.com',
        supportsStreaming: true,
        supportsFunctions: true,
      },
      [AIProvider.ANTHROPIC]: {
        name: 'Anthropic',
        description: 'Constitutional AI models from Anthropic',
        website: 'https://anthropic.com',
        supportsStreaming: true,
        supportsFunctions: false,
      },
      [AIProvider.GOOGLE]: {
        name: 'Google AI',
        description: 'Gemini and PaLM models from Google',
        website: 'https://ai.google.dev',
        supportsStreaming: true,
        supportsFunctions: true,
      },
      [AIProvider.AZURE]: {
        name: 'Azure OpenAI',
        description: 'OpenAI models hosted on Microsoft Azure',
        website:
          'https://azure.microsoft.com/en-us/products/cognitive-services/openai-service',
        supportsStreaming: true,
        supportsFunctions: true,
      },
    };

    return providerInfo[provider] || null;
  }

  /**
   * Get all supported providers
   */
  getAllProviders() {
    return Object.values(AIProvider).map((provider) => ({
      id: provider,
      ...this.getProviderInfo(provider),
      models: this.getAvailableModels(provider),
    }));
  }
}
