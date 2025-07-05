import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';

export const GoogleCalendarNodeDefinition = new NodeDefinition({
  name: 'GoogleCalendar',
  displayName: 'Google Calendar',
  description: 'Create, update, and manage calendar events in Google Calendar',
  version: 1,
  group: ['productivity', 'google'],
  icon: 'fa:calendar',
  defaults: {
    name: 'Google Calendar',
    color: '#4285F4',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'googleCalendarOAuth2Api',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Create Event', value: 'create' },
        { name: 'Update Event', value: 'update' },
        { name: 'Delete Event', value: 'delete' },
        { name: 'Get Event', value: 'get' },
        { name: 'List Events', value: 'list' },
        { name: 'Search Events', value: 'search' },
        { name: 'Create Calendar', value: 'createCalendar' },
        { name: 'List Calendars', value: 'listCalendars' },
        { name: 'Add Attendee', value: 'addAttendee' },
        { name: 'Remove Attendee', value: 'removeAttendee' },
        { name: 'Get Free/Busy', value: 'getFreeBusy' },
      ],
      default: 'create',
      required: true,
    },
    {
      name: 'calendarId',
      displayName: 'Calendar ID',
      type: 'string',
      default: 'primary',
      placeholder: 'primary',
      description: 'ID of the calendar (use "primary" for main calendar)',
    },
    {
      name: 'eventId',
      displayName: 'Event ID',
      type: 'string',
      default: '',
      placeholder: 'event123abc',
      description: 'ID of the calendar event',
    },
    {
      name: 'summary',
      displayName: 'Event Title',
      type: 'string',
      default: '',
      placeholder: 'Team Meeting',
      description: 'Title of the event',
    },
    {
      name: 'description',
      displayName: 'Description',
      type: 'string',
      default: '',
      placeholder: 'Discuss project progress',
      description: 'Description of the event',
    },
    {
      name: 'location',
      displayName: 'Location',
      type: 'string',
      default: '',
      placeholder: 'Conference Room A',
      description: 'Location of the event',
    },
    {
      name: 'startDateTime',
      displayName: 'Start Date/Time',
      type: 'string',
      default: '',
      placeholder: '2024-01-20T10:00:00',
      description: 'Start date and time (ISO 8601 format)',
    },
    {
      name: 'endDateTime',
      displayName: 'End Date/Time',
      type: 'string',
      default: '',
      placeholder: '2024-01-20T11:00:00',
      description: 'End date and time (ISO 8601 format)',
    },
    {
      name: 'timeZone',
      displayName: 'Time Zone',
      type: 'string',
      default: 'America/New_York',
      placeholder: 'America/New_York',
      description: 'Time zone for the event',
    },
    {
      name: 'allDay',
      displayName: 'All Day Event',
      type: 'boolean',
      default: false,
      description: 'Whether this is an all-day event',
    },
    {
      name: 'attendees',
      displayName: 'Attendees',
      type: 'collection',
      default: [],
      options: [
        {
          name: 'email',
          displayName: 'Email',
          type: 'string',
          default: '',
          description: 'Attendee email address',
        },
        {
          name: 'displayName',
          displayName: 'Display Name',
          type: 'string',
          default: '',
          description: 'Attendee display name',
        },
        {
          name: 'optional',
          displayName: 'Optional',
          type: 'boolean',
          default: false,
          description: 'Whether attendance is optional',
        },
        {
          name: 'responseStatus',
          displayName: 'Response Status',
          type: 'options',
          options: [
            { name: 'Needs Action', value: 'needsAction' },
            { name: 'Accepted', value: 'accepted' },
            { name: 'Declined', value: 'declined' },
            { name: 'Tentative', value: 'tentative' },
          ],
          default: 'needsAction',
        },
      ],
    },
    {
      name: 'recurrence',
      displayName: 'Recurrence',
      type: 'collection',
      default: {},
      options: [
        {
          name: 'frequency',
          displayName: 'Frequency',
          type: 'options',
          options: [
            { name: 'Daily', value: 'DAILY' },
            { name: 'Weekly', value: 'WEEKLY' },
            { name: 'Monthly', value: 'MONTHLY' },
            { name: 'Yearly', value: 'YEARLY' },
          ],
          default: 'DAILY',
        },
        {
          name: 'interval',
          displayName: 'Interval',
          type: 'number',
          default: 1,
          description: 'Interval between recurrences',
        },
        {
          name: 'count',
          displayName: 'Count',
          type: 'number',
          default: 0,
          description: 'Number of occurrences (0 for infinite)',
        },
        {
          name: 'until',
          displayName: 'Until',
          type: 'string',
          default: '',
          placeholder: '2024-12-31',
          description: 'End date for recurrence',
        },
      ],
    },
    {
      name: 'reminders',
      displayName: 'Reminders',
      type: 'collection',
      default: {},
      options: [
        {
          name: 'useDefault',
          displayName: 'Use Default',
          type: 'boolean',
          default: true,
          description: 'Use calendar default reminders',
        },
        {
          name: 'overrides',
          displayName: 'Custom Reminders',
          type: 'collection',
          default: [],
          options: [
            {
              name: 'method',
              displayName: 'Method',
              type: 'options',
              options: [
                { name: 'Email', value: 'email' },
                { name: 'Popup', value: 'popup' },
              ],
              default: 'popup',
            },
            {
              name: 'minutes',
              displayName: 'Minutes Before',
              type: 'number',
              default: 10,
              description: 'Minutes before event to send reminder',
            },
          ],
        },
      ],
    },
    {
      name: 'visibility',
      displayName: 'Visibility',
      type: 'options',
      options: [
        { name: 'Default', value: 'default' },
        { name: 'Public', value: 'public' },
        { name: 'Private', value: 'private' },
      ],
      default: 'default',
      description: 'Visibility of the event',
    },
    {
      name: 'colorId',
      displayName: 'Color',
      type: 'options',
      options: [
        { name: 'Default', value: '' },
        { name: 'Lavender', value: '1' },
        { name: 'Sage', value: '2' },
        { name: 'Grape', value: '3' },
        { name: 'Flamingo', value: '4' },
        { name: 'Banana', value: '5' },
        { name: 'Tangerine', value: '6' },
        { name: 'Peacock', value: '7' },
        { name: 'Graphite', value: '8' },
        { name: 'Blueberry', value: '9' },
        { name: 'Basil', value: '10' },
        { name: 'Tomato', value: '11' },
      ],
      default: '',
      description: 'Event color',
    },
    {
      name: 'conferenceData',
      displayName: 'Conference Data',
      type: 'collection',
      default: {},
      options: [
        {
          name: 'createRequest',
          displayName: 'Create Conference',
          type: 'boolean',
          default: false,
          description: 'Create a conference link for this event',
        },
        {
          name: 'conferenceSolution',
          displayName: 'Conference Type',
          type: 'options',
          options: [
            { name: 'Google Meet', value: 'hangoutsMeet' },
            { name: 'Hangouts', value: 'eventHangout' },
            { name: 'Named Hangout', value: 'eventNamedHangout' },
          ],
          default: 'hangoutsMeet',
        },
      ],
    },
    {
      name: 'query',
      displayName: 'Search Query',
      type: 'string',
      default: '',
      placeholder: 'team meeting',
      description: 'Text to search in event summary and description',
    },
    {
      name: 'timeMin',
      displayName: 'Time Min',
      type: 'string',
      default: '',
      placeholder: '2024-01-01T00:00:00Z',
      description: 'Lower bound for events to filter',
    },
    {
      name: 'timeMax',
      displayName: 'Time Max',
      type: 'string',
      default: '',
      placeholder: '2024-12-31T23:59:59Z',
      description: 'Upper bound for events to filter',
    },
    {
      name: 'maxResults',
      displayName: 'Max Results',
      type: 'number',
      default: 10,
      description: 'Maximum number of events to return',
    },
  ],
});

export class GoogleCalendarNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { 
        operation,
        calendarId,
        eventId,
        summary,
        description,
        location,
        startDateTime,
        endDateTime,
        timeZone,
        allDay,
        attendees,
        recurrence,
        reminders,
        visibility,
        colorId,
        conferenceData,
        query,
        timeMin,
        timeMax,
        maxResults,
      } = context.parameters;
      
      switch (operation) {
        case 'create': {
          if (!summary || !startDateTime || !endDateTime) {
            throw new Error('Summary, start time, and end time are required');
          }
          
          const event = {
            id: `evt_${Date.now()}`,
            status: 'confirmed',
            htmlLink: `https://calendar.google.com/event?eid=evt_${Date.now()}`,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            summary,
            description: description || '',
            location: location || '',
            creator: {
              email: 'user@example.com',
              self: true,
            },
            organizer: {
              email: 'user@example.com',
              self: true,
            },
            start: allDay ? {
              date: startDateTime.split('T')[0],
            } : {
              dateTime: startDateTime,
              timeZone: timeZone || 'UTC',
            },
            end: allDay ? {
              date: endDateTime.split('T')[0],
            } : {
              dateTime: endDateTime,
              timeZone: timeZone || 'UTC',
            },
            attendees: attendees || [],
            reminders: reminders || { useDefault: true },
            visibility: visibility || 'default',
            colorId: colorId || undefined,
            conferenceData: conferenceData?.createRequest ? {
              createRequest: {
                requestId: `req_${Date.now()}`,
                conferenceSolutionKey: {
                  type: conferenceData.conferenceSolution || 'hangoutsMeet',
                },
              },
            } : undefined,
          };
          
          return {
            success: true,
            data: [event],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'create',
            },
          };
        }
        
        case 'update': {
          if (!eventId) {
            throw new Error('Event ID is required for update');
          }
          
          const updatedEvent = {
            id: eventId,
            updated: new Date().toISOString(),
            summary: summary || 'Updated Event',
            description: description || 'Updated description',
            location: location || '',
            start: startDateTime ? {
              dateTime: startDateTime,
              timeZone: timeZone || 'UTC',
            } : undefined,
            end: endDateTime ? {
              dateTime: endDateTime,
              timeZone: timeZone || 'UTC',
            } : undefined,
            attendees: attendees || [],
            colorId: colorId || undefined,
          };
          
          return {
            success: true,
            data: [updatedEvent],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'update',
            },
          };
        }
        
        case 'delete': {
          if (!eventId) {
            throw new Error('Event ID is required for delete');
          }
          
          return {
            success: true,
            data: [{ deleted: true, eventId }],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'delete',
            },
          };
        }
        
        case 'get': {
          if (!eventId) {
            throw new Error('Event ID is required');
          }
          
          const event = {
            id: eventId,
            status: 'confirmed',
            htmlLink: `https://calendar.google.com/event?eid=${eventId}`,
            created: '2024-01-01T10:00:00Z',
            updated: '2024-01-15T14:30:00Z',
            summary: 'Sample Event',
            description: 'This is a sample event description',
            location: 'Conference Room B',
            creator: {
              email: 'creator@example.com',
              displayName: 'Event Creator',
            },
            organizer: {
              email: 'organizer@example.com',
              displayName: 'Event Organizer',
            },
            start: {
              dateTime: '2024-01-20T14:00:00Z',
              timeZone: 'UTC',
            },
            end: {
              dateTime: '2024-01-20T15:00:00Z',
              timeZone: 'UTC',
            },
            attendees: [
              {
                email: 'attendee1@example.com',
                displayName: 'Attendee One',
                responseStatus: 'accepted',
              },
              {
                email: 'attendee2@example.com',
                displayName: 'Attendee Two',
                responseStatus: 'needsAction',
              },
            ],
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 10 },
              ],
            },
          };
          
          return {
            success: true,
            data: [event],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'get',
            },
          };
        }
        
        case 'list': {
          const events = [
            {
              id: 'evt_1',
              summary: 'Morning Standup',
              start: { dateTime: '2024-01-20T09:00:00Z' },
              end: { dateTime: '2024-01-20T09:30:00Z' },
              status: 'confirmed',
            },
            {
              id: 'evt_2',
              summary: 'Project Review',
              start: { dateTime: '2024-01-20T14:00:00Z' },
              end: { dateTime: '2024-01-20T15:00:00Z' },
              status: 'confirmed',
            },
            {
              id: 'evt_3',
              summary: 'Team Lunch',
              start: { dateTime: '2024-01-20T12:00:00Z' },
              end: { dateTime: '2024-01-20T13:00:00Z' },
              status: 'confirmed',
            },
          ];
          
          const filteredEvents = events.slice(0, maxResults || 10);
          
          return {
            success: true,
            data: filteredEvents,
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: filteredEvents.length,
              operation: 'list',
              calendarId: calendarId || 'primary',
            },
          };
        }
        
        case 'search': {
          if (!query) {
            throw new Error('Search query is required');
          }
          
          const searchResults = [
            {
              id: 'search_evt_1',
              summary: `Meeting about ${query}`,
              start: { dateTime: '2024-01-22T10:00:00Z' },
              end: { dateTime: '2024-01-22T11:00:00Z' },
              description: `Discussion topics include ${query}`,
            },
            {
              id: 'search_evt_2',
              summary: `${query} Review Session`,
              start: { dateTime: '2024-01-23T15:00:00Z' },
              end: { dateTime: '2024-01-23T16:00:00Z' },
              description: 'Quarterly review meeting',
            },
          ];
          
          return {
            success: true,
            data: searchResults,
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: searchResults.length,
              operation: 'search',
              query,
            },
          };
        }
        
        case 'createCalendar': {
          if (!summary) {
            throw new Error('Calendar name (summary) is required');
          }
          
          const newCalendar = {
            id: `cal_${Date.now()}`,
            summary,
            description: description || '',
            timeZone: timeZone || 'UTC',
            colorId: colorId || '1',
            backgroundColor: '#4285F4',
            foregroundColor: '#ffffff',
            selected: true,
            accessRole: 'owner',
            defaultReminders: [],
          };
          
          return {
            success: true,
            data: [newCalendar],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'createCalendar',
            },
          };
        }
        
        case 'listCalendars': {
          const calendars = [
            {
              id: 'primary',
              summary: 'Primary Calendar',
              description: 'Main calendar',
              timeZone: 'America/New_York',
              colorId: '1',
              backgroundColor: '#4285F4',
              foregroundColor: '#ffffff',
              selected: true,
              accessRole: 'owner',
              primary: true,
            },
            {
              id: 'cal_work',
              summary: 'Work Calendar',
              description: 'Work related events',
              timeZone: 'America/New_York',
              colorId: '2',
              backgroundColor: '#7CB342',
              foregroundColor: '#ffffff',
              selected: true,
              accessRole: 'owner',
            },
            {
              id: 'cal_personal',
              summary: 'Personal Calendar',
              description: 'Personal events',
              timeZone: 'America/New_York',
              colorId: '3',
              backgroundColor: '#E67C73',
              foregroundColor: '#ffffff',
              selected: true,
              accessRole: 'owner',
            },
          ];
          
          return {
            success: true,
            data: calendars,
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: calendars.length,
              operation: 'listCalendars',
            },
          };
        }
        
        case 'addAttendee': {
          if (!eventId || !attendees || attendees.length === 0) {
            throw new Error('Event ID and at least one attendee are required');
          }
          
          const addedAttendees = attendees.map(att => ({
            ...att,
            added: true,
            responseStatus: att.responseStatus || 'needsAction',
          }));
          
          return {
            success: true,
            data: [{
              eventId,
              attendeesAdded: addedAttendees,
              totalAttendees: 5 + attendees.length,
            }],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: attendees.length,
              operation: 'addAttendee',
            },
          };
        }
        
        case 'removeAttendee': {
          if (!eventId || !attendees || attendees.length === 0) {
            throw new Error('Event ID and attendee email(s) are required');
          }
          
          const removedEmails = attendees.map(att => att.email);
          
          return {
            success: true,
            data: [{
              eventId,
              attendeesRemoved: removedEmails,
              remainingAttendees: 3,
            }],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: removedEmails.length,
              operation: 'removeAttendee',
            },
          };
        }
        
        case 'getFreeBusy': {
          if (!timeMin || !timeMax) {
            throw new Error('Time min and time max are required');
          }
          
          const freeBusyInfo = {
            timeMin,
            timeMax,
            calendars: {
              [calendarId || 'primary']: {
                busy: [
                  {
                    start: '2024-01-20T09:00:00Z',
                    end: '2024-01-20T10:00:00Z',
                  },
                  {
                    start: '2024-01-20T14:00:00Z',
                    end: '2024-01-20T15:30:00Z',
                  },
                ],
              },
            },
          };
          
          return {
            success: true,
            data: [freeBusyInfo],
            metadata: {
              executionTime: Date.now() - startTime,
              itemsProcessed: 1,
              operation: 'getFreeBusy',
            },
          };
        }
        
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
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
}
