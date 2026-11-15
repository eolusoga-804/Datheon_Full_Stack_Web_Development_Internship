// Name the units explicitly so display components can format them consistently.
export type CurrentWeather = {
  temperatureC: number;
  conditionCode: number;
  description: string;
  calculatedAtUnix: number;
  providerIconCode?: string;
  feelsLikeC?: number;
  humidityPercent?: number;
  pressureHpa?: number;
  windSpeedMps?: number;
  windDirectionDeg?: number;
  visibilityMeters?: number;
  cloudCoverPercent?: number;
  sunriseUnix?: number;
  sunsetUnix?: number;
  utcOffsetSeconds?: number;
  rainLastHourMm?: number;
  snowLastHourMm?: number;
};
