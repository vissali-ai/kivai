import type {Metadata} from "next";
import {SupportCenter} from "@/components/account/support-center";
import {noIndexRobots} from "@/lib/seo";
export const metadata:Metadata={title:"Central de Atendimento",robots:noIndexRobots};
export const dynamic="force-dynamic";
export default function SupportPage(){
 return <main className="mx-auto min-h-[75vh] w-full max-w-6xl px-4 pb-20 pt-24 sm:px-6 lg:px-8"><SupportCenter/></main>;
}
