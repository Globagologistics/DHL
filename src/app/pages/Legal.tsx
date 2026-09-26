import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, ShieldCheck, Scale } from 'lucide-react';
import { PageHeading } from '../components/customer/CustomerShell';
import { brandConfig } from '../../config/brand';
import { useI18n } from '../../i18n';

/**
 * Terms and Privacy. Both describe only what this application actually does:
 * shipments created by authorised administrators or submitted through the
 * public request form, tracking, support conversations with attachments, and
 * the language/session state the browser keeps. No company registration,
 * address, licence or carrier affiliation is stated, because the project holds
 * no such values.
 */

const EFFECTIVE_DATE = '26 September 2026';
/** Neutral public identity, kept in one place with the rest of the metadata. */
const SERVICE_NAME = brandConfig.pageTitle;

function LegalPage({ icon, eyebrow, title, intro, children }: { icon: ReactNode; eyebrow: string; title: string; intro: string; children: ReactNode }) {
  const { t } = useI18n();
  return <div className="dhl-container dhl-legal">
    <PageHeading title={title} backTo="/settings" eyebrow={eyebrow} />
    <article className="dhl-card dhl-legal-card">
      <header className="dhl-legal-head">
        <span className="dhl-legal-icon" aria-hidden="true">{icon}</span>
        <div>
          <p className="dhl-legal-effective"><strong>{t('effectiveDate')}:</strong> {EFFECTIVE_DATE}</p>
          <p className="dhl-legal-intro">{intro}</p>
        </div>
      </header>
      <div className="dhl-legal-body">{children}</div>
      <footer className="dhl-legal-footer">
        <Link className="dhl-secondary-button" to="/chat"><Headphones size={17} /> {t('support')}</Link>
      </footer>
    </article>
  </div>;
}

function Section({ number, heading, children }: { number: number; heading: string; children: ReactNode }) {
  return <section className="dhl-legal-section">
    <h2><span aria-hidden="true">{number}.</span> {heading}</h2>
    {children}
  </section>;
}

export function Terms() {
  const { t } = useI18n();
  return <LegalPage
    icon={<Scale size={22} />}
    eyebrow={t('legal')}
    title={t('terms')}
    intro={`These terms govern your use of ${SERVICE_NAME}, the shipment tracking and support service provided through this application.`}
  >
    <Section number={1} heading="Acceptance of Terms">
      <p>By using {SERVICE_NAME} you agree to these terms. If you do not agree with them, please do not use the service.</p>
    </Section>

    <Section number={2} heading="Use of the Service">
      <p>{SERVICE_NAME} lets you track a shipment using its 12-digit tracking number, view its progress and route, and contact shipment support. Some areas, such as shipment administration, are restricted to authorised operators.</p>
    </Section>

    <Section number={3} heading="Shipment Information">
      <p>Shipment and tracking information shown in the application is based on details entered by authorised administrators, on information submitted through the shipment request form, and on updates recorded against the shipment as it moves.</p>
      <p>We aim to keep this information accurate and current, but it depends on the details supplied and on updates being recorded. Estimated delivery dates are estimates, not guarantees.</p>
    </Section>

    <Section number={4} heading="Tracking Services">
      <p>A tracking number lets you view the status, recorded checkpoints, route and delivery estimate of the shipment it belongs to. Please keep your tracking number to yourself, since anyone holding it can view that shipment's public tracking page.</p>
    </Section>

    <Section number={5} heading="Customer Support and Messaging">
      <p>You can contact support from within the application about a shipment you are a party to. Support conversations, including any images or files you attach, may be retained for service, security and operational purposes, and may be reviewed by authorised staff to handle your request.</p>
      <p>Access to a conversation is verified by the shipment support service. Please do not send information in a support conversation that is not needed to resolve your request.</p>
    </Section>

    <Section number={6} heading="User Responsibilities">
      <p>Please provide accurate information when you create or request a shipment or contact support, keep any account credentials secure, and use the service only for lawful purposes.</p>
    </Section>

    <Section number={7} heading="Prohibited Use">
      <p>You may not abuse the service, attempt to gain unauthorised access to accounts, shipments, conversations or systems, interfere with or disrupt the service, submit fraudulent shipment or payment information, upload malicious files, or use the service to harass others or to misrepresent a shipment.</p>
    </Section>

    <Section number={8} heading="Availability of the Service">
      <p>We try to keep {SERVICE_NAME} available and working, but availability may occasionally be interrupted by maintenance, network problems or issues affecting third-party infrastructure the service relies on. Features may change over time.</p>
    </Section>

    <Section number={9} heading="Intellectual Property">
      <p>The application, its interface, design and content are protected by intellectual property rights and remain the property of their respective owners. Nothing in these terms transfers those rights to you. Trademarks shown in the application belong to their respective owners.</p>
    </Section>

    <Section number={10} heading="Third-Party Services">
      <p>The service relies on third-party infrastructure to operate, which may include cloud hosting, database and file storage, email delivery, messaging and security services. Their involvement is limited to providing that infrastructure on our behalf.</p>
    </Section>

    <Section number={11} heading="Limitation of Liability">
      <p>The service is provided on an “as available” basis. To the extent permitted by applicable law, we are not liable for indirect or consequential loss arising from use of the service, from reliance on tracking information, or from interruptions to availability. Nothing here limits liability that cannot be limited by law.</p>
    </Section>

    <Section number={12} heading="Changes to These Terms">
      <p>These terms may be updated from time to time. The effective date above shows when this version was published. Continued use of the service after an update means you accept the revised terms.</p>
    </Section>

    <Section number={13} heading="Contact and Support">
      <p>For questions about these terms or about a shipment, please use the Customer Support section within the application.</p>
    </Section>
  </LegalPage>;
}

export function Privacy() {
  const { t } = useI18n();
  return <LegalPage
    icon={<ShieldCheck size={22} />}
    eyebrow={t('legal')}
    title={t('privacy')}
    intro={`This policy explains what information ${SERVICE_NAME} handles, why it is handled, and the choices available to you.`}
  >
    <Section number={1} heading="Information We Collect">
      <p>Depending on how the service is used, the following may be collected:</p>
      <ul>
        <li>Sender details, such as name and phone number</li>
        <li>Receiver details, such as name, phone number and email address</li>
        <li>Pickup and drop-off addresses, and shipment route locations</li>
        <li>Package or consignment details, including description, declared value, currency and payment status</li>
        <li>Images of a package uploaded with a shipment or shipment request</li>
        <li>Support conversation messages and any attachments sent in them</li>
        <li>Technical and service logs needed to operate and secure the service</li>
        <li>Preferences kept in your browser, such as your chosen language</li>
      </ul>
    </Section>

    <Section number={2} heading="How We Use Information">
      <p>Information is used to create and manage shipments, provide tracking, answer support requests, send shipment notifications, keep the service secure, investigate problems, and improve the reliability of the service.</p>
    </Section>

    <Section number={3} heading="Shipment and Recipient Information">
      <p>Shipment details, including information about a recipient, are submitted by authorised administrators or by customers through the shipment request form as part of arranging and tracking a shipment. If you submit someone else's details, please make sure you are entitled to do so.</p>
    </Section>

    <Section number={4} heading="Images and Attachments">
      <p>Package images are stored so a shipment can be documented and shown on its tracking page. Attachments sent in a support conversation are stored privately and are made viewable only to the participants of that conversation and to authorised support staff, through time-limited links generated when the file is displayed.</p>
    </Section>

    <Section number={5} heading="Customer Support Messages">
      <p>Support conversations are linked to the shipment they concern and are retained so that the conversation history remains available to you and to support staff handling your request.</p>
    </Section>

    <Section number={6} heading="Cookies and Local Storage">
      <p>The application stores information in your browser to work correctly. This includes your chosen language, access and verification state, the tracking number most recently looked up in the current tab, and — for signed-in users — the session information needed to keep you signed in. Administrators also have an unfinished shipment form saved locally so it survives a page refresh.</p>
      <p>This state is not used for advertising or cross-site tracking.</p>
    </Section>

    <Section number={7} heading="Service Providers">
      <p>The service may use cloud hosting, database, file storage, email, security and communications providers to operate the platform. These providers process information on our behalf in order to provide their service, and are not permitted to use it for their own purposes.</p>
    </Section>

    <Section number={8} heading="Data Security">
      <p>Access to shipment records, support conversations and stored files is restricted, attachments in support conversations are held in private storage, and administrative functions require an authorised account. No online service can be guaranteed completely secure, but we take reasonable measures to protect information.</p>
    </Section>

    <Section number={9} heading="Data Retention">
      <p>Records are retained for as long as needed to operate shipments and provide support, and afterwards where retention is needed for security, dispute handling, accounting or other legal requirements, or for other legitimate service purposes.</p>
    </Section>

    <Section number={10} heading="Your Choices">
      <p>You can change the interface language at any time from the navigation menu, and clear the information the application keeps in your browser through your browser's settings. To ask a question about shipment information held about you, please use Customer Support within the application.</p>
    </Section>

    <Section number={11} heading="Children's Privacy">
      <p>The service is intended for use by adults arranging or receiving shipments and is not directed at children. We do not knowingly collect information from children.</p>
    </Section>

    <Section number={12} heading="Changes to This Policy">
      <p>This policy may be updated from time to time. The effective date above shows when this version was published.</p>
    </Section>

    <Section number={13} heading="Contact">
      <p>For questions about this policy or about information relating to a shipment, please use the Customer Support section within the application.</p>
    </Section>
  </LegalPage>;
}
