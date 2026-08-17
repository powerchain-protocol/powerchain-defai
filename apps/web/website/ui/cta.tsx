import Link from "next/link";
import { ArrowRightIcon, CheckCircledIcon } from "@radix-ui/react-icons";

export function CTA() {
  return (
    <section className="web-section pb-24 pt-8 sm:pb-28">
      <div className="web-container">
        <div className="web-cta relative overflow-hidden rounded-[34px] border border-[#214c3a] px-6 py-14 text-center text-white shadow-[0_28px_90px_rgba(16,43,33,.20)] sm:px-10 sm:py-16 lg:px-16">
          <div className="relative z-10 mx-auto max-w-3xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#c7d9d0]">PowerChain DeFAI</p>
            <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-.035em] text-white sm:text-5xl">Move from financial context to wallet-controlled execution.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#d9e7e0]">
              Inspect network readiness, connect a wallet and enter the PowerChain workspace with clear execution boundaries from the first action.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/open/dashboard" className="web-button web-button-on-dark gap-2 px-5">
                Open dashboard <ArrowRightIcon />
              </Link>
              <Link href="/pages/about" className="web-button web-button-ghost-on-dark px-5">About PowerChain</Link>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-[#bfd1c8]">
              {["No custodial signer", "Runtime provider checks", "Explicit wallet approval"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2"><CheckCircledIcon />{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
