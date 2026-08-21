import type { ComponentPropsWithoutRef, FormEvent, ReactNode } from "react";

import { cn } from "@/lib/cn";
import {
  defaultFormWidthTier,
  formShellClassNames,
  formStandaloneActionClassNames,
  formWidthShellClassNames,
  type FormWidthTier,
} from "@/lib/form-styles";

interface FormShellBaseProps {
  children?: ReactNode;
  className?: string;
  tier?: FormWidthTier;
}

interface FormShellAsDivProps
  extends FormShellBaseProps, Omit<ComponentPropsWithoutRef<"div">, "className"> {
  as?: "div";
  onSubmit?: never;
}

interface FormShellAsFormProps
  extends FormShellBaseProps,
    Omit<ComponentPropsWithoutRef<"form">, "className" | "onSubmit"> {
  as: "form";
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}

type FormShellProps = FormShellAsDivProps | FormShellAsFormProps;

/** Caps form width and enables container-query breakpoints for fields and actions. */
export function FormShell({
  as = "div",
  children,
  className,
  onSubmit,
  tier = defaultFormWidthTier,
  ...rest
}: FormShellProps) {
  const shellClassName = cn(formShellClassNames[tier], className);

  if (as === "form") {
    return (
      <form
        className={shellClassName}
        onSubmit={onSubmit}
        {...(rest as Omit<ComponentPropsWithoutRef<"form">, "className" | "onSubmit">)}
      >
        {children}
      </form>
    );
  }

  return (
    <div
      className={shellClassName}
      {...(rest as Omit<ComponentPropsWithoutRef<"div">, "className">)}
    >
      {children}
    </div>
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
