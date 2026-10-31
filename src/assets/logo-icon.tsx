import Image from "next/image";
export interface LogoIconProps { className?: string }

export default function LogoIcon({ className = "size-8" }: LogoIconProps) {
  return <Image width={32} height={32} className={className} src="/firefly.svg" alt="" aria-hidden="true" />;
}

export { LogoIcon };
