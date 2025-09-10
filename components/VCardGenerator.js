// src/components/VCardGenerator.js
"use client";

import { saveAs } from "file-saver";
import styles from "../app/card/styles.module.css";

const VCardGenerator = ({ contact }) => {
  const generateVCard = () => {
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
TITLE:${contact.title}
ORG:${contact.company}
EMAIL;TYPE=WORK:${contact.email}
TEL;TYPE=WORK:${contact.phone}
NOTE:WhatsApp:${contact.whatsAppNumber}
URL:${contact.website}
ADR;TYPE=WORK:${contact.territory}
ADR;TYPE=HOME:;;${contact.address};;;;
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