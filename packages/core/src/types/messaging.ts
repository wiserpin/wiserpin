import type { PagePreview } from './page';

/**
 * Message types for extension communication
 */
export enum MessageType {
  // Metadata extraction
  GET_PAGE_METADATA = 'GET_PAGE_METADATA',
  PAGE_METADATA_RESPONSE = 'PAGE_METADATA_RESPONSE',

  // Summarization
  GENERATE_SUMMARY = 'GENERATE_SUMMARY',
  SUMMARY_RESPONSE = 'SUMMARY_RESPONSE',

  // Storage operations
  SYNC_DATA = 'SYNC_DATA',
  SYNC_COMPLETE = 'SYNC_COMPLETE',

  // General
  ERROR = 'ERROR',
}

/**
 * Base message structure
 */
export interface BaseMessage<T = unknown> {
  type: MessageType;
  payload: T;
  requestId?: string;
}

/**
 * Get page metadata request
 */
export interface GetPageMetadataMessage extends BaseMessage<{ tabId?: number }> {
  type: MessageType.GET_PAGE_METADATA;
}

/**
 * Page metadata response
 */
export interface PageMetadataResponseMessage extends BaseMessage<PagePreview> {
  type: MessageType.PAGE_METADATA_RESPONSE;
}

/**
 * Generate summary request
 */
export interface GenerateSummaryMessage extends BaseMessage<{
  url: string;
  title?: string;
  content?: string;
}> {
  type: MessageType.GENERATE_SUMMARY;
}

/**
 * Summary response
 */
export interface SummaryResponseMessage extends BaseMessage<{ summary: string }> {
  type: MessageType.SUMMARY_RESPONSE;
}

/**
 * Error message
 */
export interface ErrorMessage extends BaseMessage<{
  error: string;
  details?: unknown;
}> {
  type: MessageType.ERROR;
}

/**
 * Union of all message types
 */
export type ExtensionMessage =
  | GetPageMetadataMessage
  | PageMetadataResponseMessage
  | GenerateSummaryMessage
  | SummaryResponseMessage
  | ErrorMessage;
