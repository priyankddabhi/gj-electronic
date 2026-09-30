import type { CSSProperties, ReactNode } from "react";

/*
  Navy title band for inner pages (rich theme): eyebrow line, headline whose words sharpen in one by one,
  a crimson rule that draws in, and an optional line of text.
*/
export default function PageHero({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: ReactNode }) {
  return (
    <section className="page-hero">
      <div className="wrap">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>
          {title.trim().split(/\s+/).map((w, i) => (
            <span key={i}>
              <span className="w" style={{ "--i": i } as CSSProperties}>{w}</span>{" "}
            </span>
          ))}
        </h1>
        {sub && <p>{sub}</p>}
      </div>
    </section>
  );
}
