import type { ReactNode } from "react";

export function AboutLayout({
  eyebrow = "About PowerChain",
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id="about" className="web-section web-section-soft py-24 sm:py-28">
      <div className="web-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="web-eyebrow">{eyebrow}</p>
          <h2 className="web-section-title mt-4">{title}</h2>
          <p className="web-section-copy mx-auto mt-5 max-w-2xl">{description}</p>
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
