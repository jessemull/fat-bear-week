import type { ComponentPropsWithoutRef, FormEvent, ReactNode } from "react";

import { cn } from "@/lib/cn";
import {
  defaultFormWidthTier,
  formShellClassNames,
  formStandaloneActionClassNames,
  formWidthShellClassNames,
  type FormWidthTier,
} from "@/lib/form-styles";

interface FormShellProps extends Omit<ComponentPropsWithoutRef<"div">, "onSubmit"> {
  as?: "div" | "form";
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  tier?: FormWidthTier;
}

/** Caps form width and enables container-query breakpoints for fields and actions. */
export function FormShell({
  as: Tag = "div",
  children,
  className,
  onSubmit,
  tier = defaultFormWidthTier,
  ...rest
}: FormShellProps) {
  return (
    <Tag
      className={cn(formShellClassNames[tier], className)}
      onSubmit={Tag === "form" ? onSubmit : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

interface FormWidthShellProps {
  children: ReactNode;
  className?: string;
  tier?: FormWidthTier;
}

/** Container shell without vertical field spacing — for standalone controls. */
export function FormWidthShell({
  children,
  className,
  tier = defaultFormWidthTier,
}: FormWidthShellProps) {
  return (
    <div className={cn(formWidthShellClassNames[tier], className)}>
      {children}
    </div>
  );
}

interface FormStandaloneActionProps {
  children: ReactNode;
  className?: string;
  tier?: FormWidthTier;
}

/** Wraps a lone button so it tracks the same width tier as sibling form fields. */
export function FormStandaloneAction({
  children,
  className,
  tier = defaultFormWidthTier,
}: FormStandaloneActionProps) {
  return (
    <FormWidthShell className={className} tier={tier}>
      <div className={formStandaloneActionClassNames[tier]}>{children}</div>
    </FormWidthShell>
  );
}
