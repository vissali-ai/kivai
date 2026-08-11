export type VideoResolution = "auto" | "original" | "2160" | "1080" | "720" | "480" | "360";
export type VideoFps = "original" | "60" | "30" | "24";
export type VideoBitrate = "auto" | "low" | "medium" | "high" | "custom";
export type VideoCodec = "h264" | "hevc";
export const AUDIO_BITRATES = [64, 96, 128, 192] as const;
