import { WizardShell } from "@/components/wizard/wizard-shell";

export default function ResumeFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WizardShell>{children}</WizardShell>;
}
