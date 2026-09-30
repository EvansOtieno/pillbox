import type { SVGProps } from "react";

/* Small stroked icons drawn for this project (no icon library). Decorative by default. */

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** The pharmacy cross: filled, so it can "light up". */
export function CrossIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false" {...props}>
      <path
        fill="currentColor"
        d="M9 2.5h6a1 1 0 0 1 1 1V8h4.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H16v4.5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V16H3.5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1H8V3.5a1 1 0 0 1 1-1Z"
      />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20l1.2-3.8A8 8 0 1 1 8 19Z" />
      <path d="M9.2 8.6c.2 2.4 2 4.6 4.6 5.4l1-1.1 1.8.9-.4 1.4c-3.6.2-7.2-3.3-7-7l1.4-.4.8 1.8Z" />
    </Icon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 4h3.5l1.5 4-2 1.3a11 11 0 0 0 6.7 6.7L16 14l4 1.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </Icon>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1" />
      <circle cx="9.5" cy="19.5" r="1.3" />
      <circle cx="17" cy="19.5" r="1.3" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

/* ---------------------------------------------------------------- category marks */

function CapsuleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-35 12 12)" />
      <path d="m10 9.2 4.3 6" />
    </Icon>
  );
}

function DropletIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5s6 6.3 6 10.5a6 6 0 0 1-12 0c0-4.2 6-10.5 6-10.5Z" />
      <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
    </Icon>
  );
}

function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </Icon>
  );
}

function LeafIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z" />
      <path d="M5 19 13 11" />
    </Icon>
  );
}

function BottleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 2.5h4M10.5 2.5v3L8 8.5v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-11l-2.5-3v-3" />
      <path d="M8 12h8M8 16h8" />
    </Icon>
  );
}

function PulseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </Icon>
  );
}

const CATEGORY_ICONS: Record<string, (props: IconProps) => React.JSX.Element> = {
  "pain-fever": CapsuleIcon,
  "cold-flu-allergy": DropletIcon,
  "vitamins-supplements": SunIcon,
  "skin-beauty": LeafIcon,
  "baby-mother": BottleIcon,
  "chronic-care": PulseIcon,
};

/** Icon for a category slug; unknown categories get the capsule. */
export function CategoryIcon({ slug, ...props }: IconProps & { slug: string }) {
  const Component = CATEGORY_ICONS[slug] ?? CapsuleIcon;
  return <Component {...props} />;
}
