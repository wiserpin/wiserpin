/**
 * PagePreview contains metadata about a web page
 */
export interface PagePreview {
  /** Full URL of the page */
  url: string;

  /** Page title */
  title?: string;

  /** Open Graph image URL */
  ogImageUrl?: string;

  /** Site name from OG metadata */
  siteName?: string;
}

/**
 * Summary contains AI-generated summary of page content
 */
export interface Summary {
  /** Summary text */
  text: string;

  /** ISO timestamp when summary was created */
  createdAt: string;
}
