import { createOpenWeatherRoute } from "../server/openWeather.ts";

// Serve current conditions through the shared OpenWeather handler.
export default createOpenWeatherRoute("weather");
