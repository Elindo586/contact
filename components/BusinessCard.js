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
    department: "Latin America", // Renamed from territory
    email: "info@tu.biz",
    phone: "+1-586-221-3095",
    whatsApp: "https://wa.me/15866125270",
    whatsAppNumber: "+1-586-612-5270",
    website: "https://www.tu.biz",
    homeAddress: {
      street: "",
      locality: "Arlington Heights",
      region: "IL",
      postalCode: "60004",
      country: "USA"
    }
  };

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrError, setQrError] = useState(null);

  // Generate vCard string for QR code
  const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
N:${contact.name.split(" ")[1]};${contact.name.split(" ")[0]};;;;
TITLE:${contact.title}
ORG:${contact.company};${contact.department}
ADR;TYPE=HOME:;;${contact.homeAddress.street};${contact.homeAddress.locality};${contact.homeAddress.region};${contact.homeAddress.postalCode};${contact.homeAddress.country}
EMAIL;TYPE=WORK:${contact.email}
TEL;TYPE=WORK:${contact.phone}
NOTE:WhatsApp:${contact.whatsAppNumber}
URL:${contact.website}
REV:${new Date().toISOString()}
END:VCARD`;

  // Generate QR code with vCard data
  useEffect(() => {
    setQrError(null); // Reset error state
    QRCode.toDataURL(vCard, {
      width: 300, // Larger size for readability
      margin: 2, // Increased margin for scanner compatibility
      errorCorrectionLevel: "H" // High error correction
    }, (err, url) => {
      if (err) {
        console.error("QR Code generation error:", err);
        setQrError("Failed to generate QR code");
        return;
      }
      setQrCodeUrl(url);
    });
  }, []); // Empty dependency array to prevent re-renders

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
      <p className={styles.cardCompany}>{contact.department}</p>

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
          <span className={styles.detailLabel}>Address:</span>{" "}
          {contact.homeAddress.locality}, {contact.homeAddress.region} {contact.homeAddress.postalCode}, {contact.homeAddress.country}
        </p>
      </div>

      <div className={styles.qrCodeContainer}>
        <p className={styles.qrCodeLabel}>Scan to save contact:</p>
        {qrCodeUrl && !qrError ? (
          <Image
            src={qrCodeUrl}
            alt={`QR code to save ${contact.name}'s contact information`}
            width={300}
            height={300}
            className={styles.qrCode}
            unoptimized // Prevent Next.js optimization issues
          />
        ) : (
          <p>{qrError || "Generating QR code..."}</p>
        )}
      </div>

      <VCardGenerator contact={contact} />
    </div>
  );
};

export default BusinessCard;