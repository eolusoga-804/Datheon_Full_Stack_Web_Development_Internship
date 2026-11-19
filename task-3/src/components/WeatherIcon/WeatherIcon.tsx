import {
  faCircleQuestion,
  faCloud,
  faCloudBolt,
  faCloudMoon,
  faCloudRain,
  faCloudShowersHeavy,
  faCloudSun,
  faMoon,
  faSmog,
  faSnowflake,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type WeatherIconProps = {
  conditionCode: number;
  providerIconCode?: string;
  className?: string;
};

// Map OpenWeather's condition groups to Font Awesome artwork.
function resolveWeatherIcon(code: number, isNight: boolean) {
  if (code === 800) return isNight ? faMoon : faSun;
  if (code === 801) return isNight ? faCloudMoon : faCloudSun;
  if (code >= 802 && code <= 804) return faCloud;

  switch (Math.floor(code / 100)) {
    case 2:
      return faCloudBolt;
    case 3:
      return faCloudRain;
    case 5:
      return faCloudShowersHeavy;
    case 6:
      return faSnowflake;
    case 7:
      return faSmog;
    default:
      return faCircleQuestion;
  }
}

export default function WeatherIcon({
  conditionCode,
  providerIconCode,
  className,
}: WeatherIconProps) {
  return (
    <FontAwesomeIcon
      icon={resolveWeatherIcon(
        conditionCode,
        providerIconCode?.endsWith("n") === true,
      )}
      className={className}
      aria-hidden="true"
    />
  );
}
