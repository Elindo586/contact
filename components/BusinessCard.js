// src/components/BusinessCard.js
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import VCardGenerator from "./VCardGenerator";
import styles from "../app/card/styles.module.css";

const BusinessCard = () => {
  const contact = {
    name: "Edgar Lindo",
    title: "President",
    company: "Technical Union",
    territory: "Latin America",
    email: "info@tu.biz",
    phone: "+1 (586) 221-3095",
    whatsApp: "https://wa.me/15866125270",
    whatsAppNumber: "+1-586-612-5270",
    website: "https://www.tu.biz",
    address: "Arlington Heights, IL 60043, USA",
  };

  const [qrCodeUrl, setQrCodeUrl] = useState("");

  // Generate vCard string for QR code
  const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
TITLE:${contact.title}
ORG:${contact.company}
ADR; TYPE=WORK:${contact.territory}
EMAIL;TYPE=WORK:${contact.email}
TEL;TYPE=WORK:${contact.phone}
TEL;TYPE=CELL:${contact.whatsAppNumber}
NOTE:WhatsApp:${contact.whatsAppNumber}
URL:${contact.website}
ADR;TYPE=HOME:;;${contact.address};;;;
END:VCARD`;

  // Generate QR code with vCard data
  useEffect(() => {
    QRCode.toDataURL(vCard, { width: 200, margin: 1 }, (err, url) => {
      if (err) {
        console.error("QR Code generation error:", err);
        return;
      }
      setQrCodeUrl(url);
    });
  }, [vCard]);

  return (
    <div className={styles.cardContainer}>
      <div className={styles.profileImageContainer}>
        <Image
          src="/image/profile.png"
          alt={`Profile picture of ${contact.name}`}
          width={100}
          height={100}
          className={styles.profileImage}
          priority
        />
      </div>

      <h1 className={styles.cardName}>{contact.name}</h1>
      <p className={styles.cardTitle}>{contact.title}</p>
      <p className={styles.cardCompany}>{contact.company}</p>
      <p className={styles.cardCompany}>{contact.territory}</p>

      <div className={styles.cardDetails}>
        <p>
          <span className={styles.detailLabel}>Email:</span>{" "}
          <a href={`mailto:${contact.email}`} className={styles.detailLink}>
            {contact.email}
          </a>
        </p>
        <p>
          <span className={styles.detailLabel}>Phone:</span>{" "}
          <a href={`tel:${contact.phone}`} className={styles.detailLink}>
            {contact.phone}
          </a>
        </p>
        <p>
          <span className={styles.detailLabel}>WhatsApp:</span>{" "}
          <a href={contact.whatsApp} className={styles.detailLink}>
            {contact.whatsAppNumber}
          </a>
        </p>
        <p>
          <span className={styles.detailLabel}>Website:</span>{" "}
          <a
            href={contact.website}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.detailLink}
          >
            {contact.website}
          </a>
        </p>
        <p>
          <span className={styles.detailLabel}>Address:</span> {contact.address}
        </p>
      </div>

      <div className={styles.qrCodeContainer}>
        <p className={styles.qrCodeLabel}>Scan to save contact:</p>
        {qrCodeUrl ? (
          <Image
            src={qrCodeUrl}
            alt={`QR code to save ${contact.name}'s contact information`}
            width={200}
            height={200}
            className={styles.qrCode}
          />
        ) : (
          <p>Error generating QR code</p>
        )}
      </div>

      <VCardGenerator contact={contact} />
    </div>
  );
};

export default BusinessCard;