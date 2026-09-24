import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { PDFDownloadLink, Page, Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer";
import QRCode from "react-qr-code";
import { format } from "date-fns";
import { shipmentService } from "../services/shipmentService";
import { Shipment } from "../types/database";

// basic invoice document
const styles = StyleSheet.create({
  page: { fontSize: 12, padding: 24, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  logo: { width: 60, height: 60 },
  section: { marginBottom: 12 },
  table: { display: "table", width: "auto", borderStyle: "solid", borderWidth: 1, borderColor: "#ccc" },
  tableRow: { margin: "auto", flexDirection: "row" },
  tableColHeader: { width: "50%", backgroundColor: "#eee", padding: 4, fontWeight: "bold" },
  tableCol: { width: "50%", padding: 4 },
});

function InvoiceDocument({ data }: { data: any }) {
  const tax = data.shippingFee * 0.1;
  const total = data.shippingFee + tax;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwdV07RyApr_mVZOJRk3Rht0P98deLiSYB0Q&s" style={styles.logo} />
          <View>
            <Text>Buske Logistics</Text>
            <Text>{format(new Date(), "PPP")}</Text>
          </View>
          <View>
            {/* placeholder barcode/qr */}
            <Text>Barcode: {data.id}</Text>
            <Text>QR: {data.id}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text>Sender:</Text>
          <Text>{data.senderName}</Text>
          <Text>{data.senderAddress}</Text>
          <Text>{data.senderEmail}</Text>
        </View>
        <View style={styles.section}>
          <Text>Receiver:</Text>
          <Text>{data.receiverName}</Text>
          <Text>{data.deliveryAddress}</Text>
        </View>
        <View style={styles.section}>
          <Text>Package:</Text>
          <Text>{data.packageName} ({data.weight || "N/A"})</Text>
          <Text>Vehicles: {data.vehiclesCount}</Text>
        </View>
        <View style={styles.section}>
          <Text>Financials:</Text>
          <Text>Shipping Fee: ${data.shippingFee?.toFixed(2)}</Text>
          <Text>Tax (10%): ${tax.toFixed(2)}</Text>
          <Text>Total: ${total.toFixed(2)}</Text>
        </View>
        <View style={styles.section}>
          <Text>Thank You</Text>
          <Text>#7 Gateway Commerce Center Dr. W, Suite 7, Edwardsville, IL 62025</Text>
          <Text>+1 618-931-6091</Text>
        </View>
      </Page>
    </Document>
  );
}

export default function Invoice() {
  const [params] = useSearchParams();
  const [shipment, setShipment] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const id = params.get("id");
    if (!id) {
      navigate("/");
      return;
    }
    shipmentService.getShipment(id).then(({ data, error }) => {
      if (error || !data) return;
      setShipment(data);
    });
  }, [params, navigate]);

  if (!shipment) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-4">Invoice for Shipment {shipment.id}</h1>
      <PDFDownloadLink document={<InvoiceDocument data={shipment} />} fileName={`invoice-${shipment.id}.pdf`}>
        {({ blob, url, loading, error }) =>
          loading ? "Generating PDF..." : <button className="px-6 py-3 bg-blue-600 text-white rounded">Download PDF</button>
        }
      </PDFDownloadLink>
    </div>
  );
}
