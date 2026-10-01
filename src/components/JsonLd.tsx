/** Renders schema.org structured data for search engines. */
export default function JsonLd({ data }: { data: object }) {
  // "<" is escaped so text from listings cannot close the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
