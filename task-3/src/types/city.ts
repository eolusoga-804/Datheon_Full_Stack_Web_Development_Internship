// Share the selected location between search and weather features.
export type City = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  region?: string;
  country?: string;
  timezone?: string;
};
