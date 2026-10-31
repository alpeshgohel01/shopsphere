import { PolicyPage } from "@/components/shop/PolicyPage";
import { SIZE_GUIDE } from "@/lib/shop/copy";

export const metadata = {
  title: SIZE_GUIDE.title,
  description: SIZE_GUIDE.intro,
};

function SizeTable({ caption, headers, rows }) {
  return (
    <section className="border-t border-border pt-6">
      <h2 className="font-display text-2xl">{caption}</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-80 text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-muted text-xs tracking-[0.1em] text-muted-foreground uppercase">
            <tr>
              {headers.map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="px-4 py-3 font-semibold">
                      {cell}
                    </th>
                  ) : (
                    <td key={i} className="px-4 py-3 tabular-nums">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function SizeGuidePage() {
  return (
    <PolicyPage title={SIZE_GUIDE.title} intro={SIZE_GUIDE.intro}>
      <SizeTable
        caption="Sneakers"
        headers={SIZE_GUIDE.sneakerHeaders}
        rows={SIZE_GUIDE.sneakerRows}
      />
      <SizeTable
        caption="Apparel"
        headers={SIZE_GUIDE.apparelHeaders}
        rows={SIZE_GUIDE.apparelRows}
      />
      <p className="text-sm text-muted-foreground">{SIZE_GUIDE.tip}</p>
    </PolicyPage>
  );
}
