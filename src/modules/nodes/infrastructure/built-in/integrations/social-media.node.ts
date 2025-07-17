import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';
import axios from 'axios';

export const SocialMediaNodeDefinition = new NodeDefinition({
  name: 'SocialMedia',
  displayName: 'Social Media Integration',
  description: 'Automate social media interactions across multiple platforms',
  version: 1,
  group: ['integrations'],
  icon: 'fa:share-alt',
  defaults: {
    name: 'Social Media',
    color: '#8e44ad',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'socialMediaCredentials',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Post Content', value: 'postContent' },
        { name: 'Get Posts', value: 'getPosts' },
        { name: 'Get Metrics', value: 'getMetrics' },
        { name: 'Search Content', value: 'searchContent' },
        { name: 'Get Followers', value: 'getFollowers' },
        { name: 'Follow User', value: 'followUser' },
        { name: 'Unfollow User', value: 'unfollowUser' },
        { name: 'Delete Post', value: 'deletePost' },
        { name: 'Schedule Post', value: 'schedulePost' },
      ],
      default: 'postContent',
      required: true,
    },
    {
      name: 'content',
      displayName: 'Content',
      type: 'string',
      typeOptions: {
        multipleValues: false,
      },
      required: true,
      placeholder: 'Your social media post content...',
      description: 'The text content for your post',
      displayOptions: {
        show: {
          operation: ['postContent', 'schedulePost'],
        },
      },
    },
    {
      name: 'mediaUrls',
      displayName: 'Media URLs',
      type: 'collection',
      placeholder: 'Add media URL',
      typeOptions: {
        multipleValues: true,
      },
      default: [],
      options: [
        {
          name: 'url',
          displayName: 'Media URL',
          type: 'string',
          required: true,
          placeholder: 'https://example.com/image.jpg',
        },
        {
          name: 'type',
          displayName: 'Media Type',
          type: 'options',
          options: [
            { name: 'Image', value: 'image' },
            { name: 'Video', value: 'video' },
            { name: 'GIF', value: 'gif' },
          ],
          default: 'image',
        },
        {
          name: 'altText',
          displayName: 'Alt Text',
          type: 'string',
          placeholder: 'Description for accessibility',
        },
      ],
      displayOptions: {
        show: {
          operation: ['postContent', 'schedulePost'],
        },
      },
    },
    {
      name: 'hashtags',
      displayName: 'Hashtags',
      type: 'string',
      placeholder: '#hashtag1 #hashtag2 #hashtag3',
      description: 'Space-separated hashtags',
      displayOptions: {
        show: {
          operation: ['postContent', 'schedulePost'],
        },
      },
    },
    {
      name: 'scheduledTime',
      displayName: 'Scheduled Time',
      type: 'string',
      required: true,
      description: 'When to publish the post',
      displayOptions: {
        show: {
          operation: ['schedulePost'],
        },
      },
    },
    {
      name: 'postId',
      displayName: 'Post ID',
      type: 'string',
      required: true,
      placeholder: '1234567890',
      displayOptions: {
        show: {
          operation: ['deletePost'],
        },
      },
    },
    {
      name: 'username',
      displayName: 'Username',
      type: 'string',
      required: true,
      placeholder: 'username',
      displayOptions: {
        show: {
          operation: ['followUser', 'unfollowUser'],
        },
      },
    },
    {
      name: 'searchQuery',
      displayName: 'Search Query',
      type: 'string',
      required: true,
      placeholder: 'search terms',
      displayOptions: {
        show: {
          operation: ['searchContent'],
        },
      },
    },
    {
      name: 'limit',
      displayName: 'Limit',
      type: 'number',
      default: 10,
      description: 'Number of results to return',
      displayOptions: {
        show: {
          operation: ['getPosts', 'searchContent', 'getFollowers'],
        },
      },
    },
    {
      name: 'dateRange',
      displayName: 'Date Range',
      type: 'options',
      options: [
        { name: 'Last 24 Hours', value: '24h' },
        { name: 'Last 7 Days', value: '7d' },
        { name: 'Last 30 Days', value: '30d' },
        { name: 'Last 90 Days', value: '90d' },
      ],
      default: '7d',
      displayOptions: {
        show: {
          operation: ['getMetrics', 'getPosts'],
        },
      },
    },
    {
      name: 'metricTypes',
      displayName: 'Metric Types',
      type: 'collection',
      placeholder: 'Add metric',
      typeOptions: {
        multipleValues: true,
      },
      default: [
        { metric: 'likes' },
        { metric: 'shares' },
        { metric: 'comments' },
      ],
      options: [
        {
          name: 'metric',
          displayName: 'Metric',
          type: 'options',
          options: [
            { name: 'Likes', value: 'likes' },
            { name: 'Shares', value: 'shares' },
            { name: 'Comments', value: 'comments' },
            { name: 'Views', value: 'views' },
            { name: 'Impressions', value: 'impressions' },
            { name: 'Reach', value: 'reach' },
            { name: 'Engagement Rate', value: 'engagement_rate' },
            { name: 'Click-through Rate', value: 'ctr' },
          ],
          required: true,
        },
      ],
      displayOptions: {
        show: {
          operation: ['getMetrics'],
        },
      },
    },
    {
      name: 'includeReplies',
      displayName: 'Include Replies',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['getPosts'],
        },
      },
    },
  ],
});

export class SocialMediaNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const { operation } = context.parameters;
      const credentials = context.credentials?.socialMediaCredentials;

      if (!credentials) {
        throw new Error('Social media credentials are required');
      }

      let result: any;

      switch (operation) {
        case 'postContent':
          result = await this.postContent(context, credentials);
          break;
        case 'getPosts':
          result = await this.getPosts(context, credentials);
          break;
        case 'getMetrics':
          result = await this.getMetrics(context, credentials);
          break;
        case 'searchContent':
          result = await this.searchContent(context, credentials);
          break;
        case 'getFollowers':
          result = await this.getFollowers(context, credentials);
          break;
        case 'followUser':
          result = await this.followUser(context, credentials);
          break;
        case 'unfollowUser':
          result = await this.unfollowUser(context, credentials);
          break;
        case 'deletePost':
          result = await this.deletePost(context, credentials);
          break;
        case 'schedulePost':
          result = await this.schedulePost(context, credentials);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return {
        success: true,
        data: Array.isArray(result) ? result : [result],
        metadata: {
          executionTime: Date.now() - startTime,
          operation,
          platform: credentials.platform,
          itemsProcessed: Array.isArray(result) ? result.length : 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
          operation: context.parameters.operation,
          platform: context.credentials?.socialMediaCredentials?.platform,
        },
      };
    }
  }

  private async postContent(context: NodeExecutionContext, credentials: any) {
    const { content, mediaUrls, hashtags } = context.parameters;

    const postData = {
      text: content + (hashtags ? ` ${hashtags}` : ''),
      media: mediaUrls || [],
      platform: credentials.platform,
      timestamp: new Date().toISOString(),
    };

    // Mock implementation for different platforms
    switch (credentials.platform) {
      case 'twitter':
        return await this.postToTwitter(postData, credentials);
      case 'facebook':
        return await this.postToFacebook(postData, credentials);
      case 'instagram':
        return await this.postToInstagram(postData, credentials);
      case 'linkedin':
        return await this.postToLinkedIn(postData, credentials);
      default:
        throw new Error(
          `Posting not supported for platform: ${credentials.platform}`,
        );
    }
  }

  private async getPosts(context: NodeExecutionContext, credentials: any) {
    const { limit, dateRange, includeReplies } = context.parameters;

    // Mock implementation
    const posts: any[] = [];
    for (let i = 0; i < (limit || 10); i++) {
      posts.push({
        id: `post_${Date.now()}_${i}`,
        content: `Sample post content ${i + 1}`,
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        likes: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 25),
        platform: credentials.platform,
      });
    }

    return posts;
  }

  private async getMetrics(context: NodeExecutionContext, credentials: any) {
    const { metricTypes, dateRange } = context.parameters;

    const metrics = {};

    metricTypes.forEach((metricConfig: any) => {
      const metric = metricConfig.metric;
      // Mock data generation
      switch (metric) {
        case 'likes':
          metrics[metric] = Math.floor(Math.random() * 1000);
          break;
        case 'shares':
          metrics[metric] = Math.floor(Math.random() * 500);
          break;
        case 'comments':
          metrics[metric] = Math.floor(Math.random() * 200);
          break;
        case 'views':
          metrics[metric] = Math.floor(Math.random() * 5000);
          break;
        case 'impressions':
          metrics[metric] = Math.floor(Math.random() * 10000);
          break;
        case 'reach':
          metrics[metric] = Math.floor(Math.random() * 8000);
          break;
        case 'engagement_rate':
          metrics[metric] = (Math.random() * 10).toFixed(2) + '%';
          break;
        case 'ctr':
          metrics[metric] = (Math.random() * 5).toFixed(2) + '%';
          break;
      }
    });

    return {
      platform: credentials.platform,
      dateRange,
      metrics,
      generatedAt: new Date().toISOString(),
    };
  }

  private async searchContent(context: NodeExecutionContext, credentials: any) {
    const { searchQuery, limit } = context.parameters;

    // Mock search results
    const results: any[] = [];
    for (let i = 0; i < (limit || 10); i++) {
      results.push({
        id: `search_${Date.now()}_${i}`,
        content: `Content matching "${searchQuery}" - result ${i + 1}`,
        author: `user_${i + 1}`,
        createdAt: new Date(Date.now() - i * 7200000).toISOString(),
        likes: Math.floor(Math.random() * 50),
        platform: credentials.platform,
        relevanceScore: Math.random().toFixed(3),
      });
    }

    return results;
  }

  private async getFollowers(context: NodeExecutionContext, credentials: any) {
    const { limit } = context.parameters;

    // Mock followers list
    const followers: any[] = [];
    for (let i = 0; i < (limit || 10); i++) {
      followers.push({
        id: `user_${Date.now()}_${i}`,
        username: `follower_${i + 1}`,
        displayName: `Follower ${i + 1}`,
        followedAt: new Date(Date.now() - i * 86400000).toISOString(),
        followerCount: Math.floor(Math.random() * 1000),
        verified: Math.random() > 0.8,
        platform: credentials.platform,
      });
    }

    return followers;
  }

  private async followUser(context: NodeExecutionContext, credentials: any) {
    const { username } = context.parameters;

    return {
      action: 'follow',
      username,
      success: true,
      followedAt: new Date().toISOString(),
      platform: credentials.platform,
    };
  }

  private async unfollowUser(context: NodeExecutionContext, credentials: any) {
    const { username } = context.parameters;

    return {
      action: 'unfollow',
      username,
      success: true,
      unfollowedAt: new Date().toISOString(),
      platform: credentials.platform,
    };
  }

  private async deletePost(context: NodeExecutionContext, credentials: any) {
    const { postId } = context.parameters;

    return {
      action: 'delete',
      postId,
      success: true,
      deletedAt: new Date().toISOString(),
      platform: credentials.platform,
    };
  }

  private async schedulePost(context: NodeExecutionContext, credentials: any) {
    const { content, mediaUrls, hashtags, scheduledTime } = context.parameters;

    return {
      action: 'schedule',
      postId: `scheduled_${Date.now()}`,
      content: content + (hashtags ? ` ${hashtags}` : ''),
      media: mediaUrls || [],
      scheduledFor: scheduledTime,
      status: 'scheduled',
      platform: credentials.platform,
      createdAt: new Date().toISOString(),
    };
  }

  // Platform-specific implementations (mock)
  private async postToTwitter(postData: any, credentials: any) {
    return {
      id: `tw_${Date.now()}`,
      status: 'published',
      url: `https://twitter.com/user/status/${Date.now()}`,
      ...postData,
    };
  }

  private async postToFacebook(postData: any, credentials: any) {
    return {
      id: `fb_${Date.now()}`,
      status: 'published',
      url: `https://facebook.com/${Date.now()}`,
      ...postData,
    };
  }

  private async postToInstagram(postData: any, credentials: any) {
    return {
      id: `ig_${Date.now()}`,
      status: 'published',
      url: `https://instagram.com/p/${Date.now()}`,
      ...postData,
    };
  }

  private async postToLinkedIn(postData: any, credentials: any) {
    return {
      id: `li_${Date.now()}`,
      status: 'published',
      url: `https://linkedin.com/posts/${Date.now()}`,
      ...postData,
    };
  }

  validate(configuration: Record<string, any>): boolean {
    // Basic validation - override in specific implementations
    return true;
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {},
      required: [],
    };
  }
}
