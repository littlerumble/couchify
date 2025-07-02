import type { SVGProps } from "react";

export function DiscordIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.79 0 3.48-.46 4.98-1.28L22 22l-1.72-4.98C21.54 15.48 22 13.79 22 12c0-5.52-4.48-10-10-10zM8.5 10.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm7 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z" />
      </svg>
    );
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M13.235 10.39 21.338 1h-1.9L13.1 9.38l-4.282-4.283H1l8.52 12.23-8.52 8.52h1.9l6.9-7.92 4.621 4.622h7.82L13.235 10.39zm-2.07 2.65.66-.94 6.16-8.79h-2.8l-5.06 7.22-.66.94-6.6 9.42h2.8l5.52-7.88z" />
    </svg>
  );
}
