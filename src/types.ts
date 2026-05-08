export interface Site {
  id: string;
  name: string;
  domain: string | null;
  created_at: string;
}

export interface AnalyticsData {
  total_page_views: number;
  unique_visitors: number;
  unique_countries: number;
  average_duration: number;
  pages_per_visit: number;
  bounce_rate: number;
}

export interface SnapshotData {
  today_visitors: number;
  yesterday_visitors: number;
  visitor_change_percent: number;
  top_referrer: string;
  top_country: string;
  top_region: string;
  average_duration_today: number;
  average_duration_yesterday: number;
  duration_change_percent: number;
}

export interface TimeseriesPoint {
  date_label: string;
  page_views: number;
  unique_visitors: number;
}

export interface PageData {
  url: string;
  page_title: string | null;
  page_views: number;
  unique_visitors: number;
}

export interface SourceData {
  source_name: string;
  source_type: string;
  page_views: number;
  unique_visitors: number;
  click_count: number;
  utm_campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
}

export interface CountryData {
  country: string;
  page_views: number;
  unique_visitors: number;
}

export interface BrowserData {
  browser: string;
  page_views: number;
  unique_visitors: number;
}

export interface OSData {
  os: string;
  page_views: number;
  unique_visitors: number;
}

export interface DeviceData {
  device_type: string;
  page_views: number;
  unique_visitors: number;
}

export interface EventCount {
  event_name: string;
  count: number;
  unique_sessions: number;
}

export interface EventRecord {
  event_name: string;
  properties: Record<string, unknown>;
  url: string | null;
  timestamp: string;
  session_id: string;
}

export interface EventTimeseriesPoint {
  date_label: string;
  count: number;
}

export interface TrackableLink {
  id: string;
  short_code: string;
  destination_url: string;
  source_type: string;
  source_label: string | null;
  click_count: number;
  status: string;
  created_at: string;
  last_clicked_at: string | null;
}

export interface LinkClick {
  clicked_at: string;
  referrer: string | null;
  country: string | null;
}

export interface AuthContext {
  userId: string;
  siteIds: string[];
}

export interface Annotation {
  id: string;
  content: string;
  timestamp: string;
  created_at: string;
}
