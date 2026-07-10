import { RequireAuth } from '@/components/RequireAuth';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
