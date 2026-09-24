import { PageHeading } from '../components/customer/CustomerShell';
import { brandConfig } from '../../config/brand';
export default function About() {
  return <div className="dhl-narrow dhl-search-page"><PageHeading title="About this concept" backTo="/home"/><section className="dhl-card" style={{ padding: 30 }}><p className="dhl-muted">This is a {brandConfig.appName} customer experience redesign concept. Shipment tracking and private chat use the connected application backend. Other services will be added as they are verified.</p></section></div>;
}
