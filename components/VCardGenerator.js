// src/components/VCardGenerator.js
"use client";

import { saveAs } from "file-saver";
import styles from "../app/card/styles.module.css";

const VCardGenerator = ({ contact }) => {
  const generateVCard = () => {
   const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
N:${contact.name.split(" ")[1]};${contact.name.split(" ")[0]};;;;
TITLE:${contact.title}
ORG:${contact.company};${contact.department}
ADR;TYPE=HOME:;;${contact.homeAddress?.street || ""};${contact.homeAddress?.locality || "Arlington Heights"};${contact.homeAddress?.region || "IL"};${contact.homeAddress?.postalCode || "60043"};${contact.homeAddress?.country || "USA"}
EMAIL;TYPE=WORK:${contact.email}
TEL;TYPE=WORK:${contact.phone}
TEL;TYPE=CELL:${contact.whatsAppNumber}
NOTE:WhatsApp:${contact.whatsAppNumber};WhatsApp Link:${contact.whatsApp}
URL:${contact.website}
REV:${new Date().toISOString()}
END:VCARD`;

    const blob = new Blob([vCard], { type: "text/vcard;charset=utf-8" });
    saveAs(blob, `${contact.name.replace(/\s+/g, "_")}.vcf`);
  };

  return (
    <button onClick={generateVCard} className={styles.vcardButton}>
      Download vCard
    </button>
  );
};

export default VCardGenerator;