import { notFound } from "next/navigation";
import { SiteServiceEditor } from "@/components/admin/site-service-editor";
import { getSiteServiceById } from "@/lib/site-cms/service-repository";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) { const item = await getSiteServiceById(decodeURIComponent((await params).id)); if (!item) notFound(); return <SiteServiceEditor initialService={item} />; }
