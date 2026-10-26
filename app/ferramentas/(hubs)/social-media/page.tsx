import { ContextualPlanCallout } from "@/components/marketing/contextual-plan-callout";
import { SocialMediaClient } from "./social-media-client";

export default function SocialMediaPage() {
  return <SocialMediaClient planCallout={<ContextualPlanCallout location="social-hub" />} />;
}
