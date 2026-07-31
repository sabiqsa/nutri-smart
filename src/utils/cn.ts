import classNames from "classnames";

type ClassValue = Parameters<typeof classNames>[number];

export function cn(...args: ClassValue[]): string {
  return classNames(...args);
}
