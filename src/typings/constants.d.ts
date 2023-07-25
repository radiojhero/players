declare interface Source {
    title: string;
    type: string;
    bitrate: number;
    burst: number;
    src: string;
}

declare const SOURCES: Source[];

declare const METADATA_URL: string;
declare const METADATA_INTERVAL: number;
declare const PLAYER_DOMAIN: string;
declare const PLAYER_NAMESPACE: '__player_namespace';
declare const PLAYER_INITIAL_VOLUME: number;
declare const MAIN_WEBSITE_HOME: string;
declare const MAIN_WEBSITE_TIMETABLE: string;
declare const MAIN_WEBSITE_REQUESTS: string;
declare const MAIN_WEBSITE_CHAT: string;
declare const MAIN_WEBSITE_LISTEN: string;
declare const LISTEN_URL: string;
declare const LISTEN_MANUAL_URL: string;
declare const TRACKER_URL: string;
