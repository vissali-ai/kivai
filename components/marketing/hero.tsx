import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#ECEFF3] pt-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <h1 className="max-w-5xl text-[2.45rem] font-semibold leading-[1.04] tracking-[-0.045em] text-[#202938] min-[430px]:text-5xl sm:text-6xl lg:text-7xl lg:leading-[1.02]">
          Ferramentas e{" "}
          <span className="text-[#5847AD]">
            soluções digitais
          </span>
        </h1>

        <p className="mt-5 max-w-3xl text-[15px] leading-7 text-[#546174] sm:mt-6 sm:text-lg sm:leading-8">
          Ferramentas e serviços para criar, otimizar e acelerar seus resultados
          no digital.
        </p>

        <div className="mt-8">
          <Button
            size="lg"
            asChild
            className="group rounded-xl bg-[#5847AD] px-8 text-white hover:bg-[#483994]"
          >
            <Link href="#ferramentas">
              Explorar Ferramentas
              <ArrowRight className="ml-2 size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
