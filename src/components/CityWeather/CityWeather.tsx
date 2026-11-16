import { useState } from "react";
import type { City } from "../../types/city";
import type { Forecast } from "../../types/weather";
import CurrentWeatherPanel from "../CurrentWeather/CurrentWeatherPanel";
import ForecastPanel from "../Forecast/ForecastPanel";

export default function CityWeather({ city }: { city: City }) {
  // Share one forecast response across the cards and current-weather summary.
  const [forecast, setForecast] = useState<Forecast | null>(null);

  return (
    <>
      <CurrentWeatherPanel city={city} forecast={forecast} />
      <ForecastPanel city={city} onForecastReady={setForecast} />
    </>
  );
}
