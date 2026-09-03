export default function Privacy() {
  return (
    <article className="prose prose-sm max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Privacy notice</h1>
      <p className="text-xs text-muted">Draft prepared with reference to the Digital Personal Data Protection Act, 2023 – to be finalised by your legal advisor.</p>
      <h2 className="font-semibold mt-4">What we collect</h2>
      <p><b>Parents:</b> mobile number (for login), your name and your child&rsquo;s age band. We deliberately do not collect your child&rsquo;s name, date of birth or photographs.</p>
      <p><b>Hosts:</b> name, contact details, professional category and credential documents you upload.</p>
      <h2 className="font-semibold mt-4">Why</h2>
      <p>To let you register for events, to share your name, mobile number and child&rsquo;s age band with the Host of an event you register for, to send you confirmations and reminders, and — only if you opt in — weekly event picks on WhatsApp.</p>
      <h2 className="font-semibold mt-4">Children&rsquo;s data</h2>
      <p>Information about your child is provided by you as parent or lawful guardian (section 9, DPDP Act 2023). We do not track children, profile them, or show them targeted advertising.</p>
      <h2 className="font-semibold mt-4">Sharing</h2>
      <p>Registration details are visible only to the Host of that specific event. We do not sell data. Data is stored with our hosting provider (Supabase / Vercel).</p>
      <h2 className="font-semibold mt-4">Your rights</h2>
      <p>You may withdraw WhatsApp consent, correct your details, or ask for your account and data to be deleted by writing to [email]. Credential documents are deleted on request once verification is complete.</p>
    </article>
  );
}
