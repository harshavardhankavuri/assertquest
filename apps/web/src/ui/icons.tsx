import { FontAwesomeIcon, type FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import {
  faChartColumn,
  faCreditCard,
  faGaugeHigh,
  faLocationDot,
  faRightFromBracket,
  faShieldHalved,
  faTruck,
  faBoxOpen,
  faFlask,
  faFingerprint,
  faClone,
  faShuffle,
  faHourglassHalf,
  faArrowsUpDown,
  faFilm,
  faBoltLightning,
  faWifi,
  faLinkSlash,
  faTerminal,
  faWindowRestore,
  faLayerGroup,
  faBan,
  faRotate,
  faCommentDots,
  faArrowsRotate,
  faBroom,
} from "@fortawesome/free-solid-svg-icons";

type IconProps = Omit<FontAwesomeIconProps, "icon">;

export function DashboardIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faGaugeHigh} {...props} />;
}

export function PackageIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faBoxOpen} {...props} />;
}

export function MapPinIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faLocationDot} {...props} />;
}

export function TruckIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faTruck} {...props} />;
}

export function CreditCardIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faCreditCard} {...props} />;
}

export function ShieldIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faShieldHalved} {...props} />;
}

export function BarChartIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faChartColumn} {...props} />;
}

export function LogoutIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faRightFromBracket} {...props} />;
}

export function FlaskIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faFlask} {...props} />;
}

export function FingerprintIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faFingerprint} {...props} />;
}

export function CloneIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faClone} {...props} />;
}

export function ShuffleIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faShuffle} {...props} />;
}

export function HourglassIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faHourglassHalf} {...props} />;
}

export function LayoutShiftIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faArrowsUpDown} {...props} />;
}

export function SlowMotionIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faFilm} {...props} />;
}

export function BoltIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faBoltLightning} {...props} />;
}

export function WifiIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faWifi} {...props} />;
}

export function LinkSlashIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faLinkSlash} {...props} />;
}

export function TerminalIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faTerminal} {...props} />;
}

export function IframeIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faWindowRestore} {...props} />;
}

export function ShadowDomIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faLayerGroup} {...props} />;
}

export function ClickInterceptedIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faBan} {...props} />;
}

export function StaleElementIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faRotate} {...props} />;
}

export function DialogIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faCommentDots} {...props} />;
}

export function ResetSessionIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faArrowsRotate} {...props} />;
}

export function ResetAllIcon(props: IconProps) {
  return <FontAwesomeIcon icon={faBroom} {...props} />;
}
