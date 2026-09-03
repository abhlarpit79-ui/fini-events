import { SITE_NAME } from "@/lib/constants";

export default function Terms() {
  return (
    <article className="prose prose-sm max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Terms of use</h1>
      <p className="text-xs text-muted">Draft – to be finalised by your legal advisor before public launch.</p>
      <h2 className="font-semibold mt-4">1. What {SITE_NAME} is</h2>
      <p>{SITE_NAME} is a free listing and registration platform. It displays events organised by independent professionals (&ldquo;Hosts&rdquo;) and lets parents register interest. {SITE_NAME} is an intermediary within the meaning of section 2(1)(w) of the Information Technology Act, 2000 and does not organise, deliver, or supervise any event.</p>
      <h2 className="font-semibold mt-4">2. Hosts</h2>
      <p>Hosts confirm that they hold the qualifications they state, that they are solely responsible for the safety, content, venue, refunds and any fees of their events, and that they will comply with applicable law and professional-conduct rules. Verification badges reflect documents reviewed by {SITE_NAME} and are not a guarantee of service quality.</p>
      <h2 className="font-semibold mt-4">3. Parents</h2>
      <p>Registration on {SITE_NAME} is free. Any fee shown is payable to the Host directly; {SITE_NAME} does not collect payments. Parents are responsible for assessing whether an event is suitable for their child and for supervising their child at all times.</p>
      <h2 className="font-semibold mt-4">4. Free during launch</h2>
      <p>All services are currently offered free of charge. {SITE_NAME} may introduce optional paid features in future with prior notice; existing listings will not be charged retrospectively.</p>
      <h2 className="font-semibold mt-4">5. Content and conduct</h2>
      <p>Listings must be accurate and must not contain medical claims prohibited under the Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954 or solicitation contrary to professional regulations. {SITE_NAME} may remove any listing or account at its discretion.</p>
      <h2 className="font-semibold mt-4">6. Liability</h2>
      <p>To the fullest extent permitted by law, {SITE_NAME} is not liable for any loss, injury or damage arising from attendance at, or cancellation of, any listed event.</p>
      <h2 className="font-semibold mt-4">7. Grievance officer</h2>
      <p>Complaints under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 may be sent to: [Name], [email]. We acknowledge complaints within 24 hours and resolve them within 15 days.</p>
    </article>
  );
}
