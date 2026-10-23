import {
  BookOpen,
  CheckCircle2,
  CircleHelp,
  CircleX,
  Clock,
  Cog,
  CreditCard,
  FileText,
  Globe,
  Heart,
  IndianRupee,
  Info,
  Leaf,
  Lock,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

/**
 * Curated icons an admin can assign to policy-page sections
 * (Admin -> CMS -> Policy & Static Pages). Keys are stored on the page's
 * sections; unknown names fall back to FileText at render time.
 */
export const POLICY_ICONS: Record<string, LucideIcon> = {
  Truck,
  MapPin,
  ShoppingCart,
  Package,
  RotateCcw,
  ShieldCheck,
  Leaf,
  BookOpen,
  FileText,
  CreditCard,
  User,
  Users,
  Info,
  CircleHelp,
  Scale,
  Lock,
  Phone,
  Clock,
  CheckCircle2,
  Sparkles,
  CircleX,
  Cog,
  IndianRupee,
  Globe,
  Heart,
};

export const POLICY_ICON_OPTIONS = Object.keys(POLICY_ICONS).map((name) => ({
  name,
  label: name.replace(/([a-z0-9])([A-Z])/g, '$1 $2'),
}));

export function getPolicyIcon(name?: string | null): LucideIcon {
  return (name && POLICY_ICONS[name]) || FileText;
}
