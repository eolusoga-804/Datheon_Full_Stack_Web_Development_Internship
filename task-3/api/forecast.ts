import { createOpenWeatherRoute } from "../server/openWeather.ts";

// Serve the five-day forecast at the provider's three-hour resolution.
export default createOpenWeatherRoute("forecast");
