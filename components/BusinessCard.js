"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import VCardGenerator from "./VCardGenerator";
import styles from "../app/card/styles.module.css";

const BusinessCard = () => {
  const contact = {
    name: "Edgar Lindo",
    title: "Independent Sales Rep.",
    companyMain: "Technical Union",
    companySpecialties: "Hydraulics | Pneumatics | Electrical | Mechanical",
    department: "Latin America",
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

  const clean = (str) => String(str || "").replace(/[,;]/g, '\\$&').trim();

  const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${clean(contact.name)}
N:${clean(contact.name.split(" ")[1])};${clean(contact.name.split(" ")[0])};;;
TITLE:${clean(contact.title)}
ORG:${clean(contact.companyMain)};${clean(contact.companySpecialties)};${clean(contact.department)}
ADR;TYPE=HOME:;;${clean(contact.homeAddress.street)};${clean(contact.homeAddress.locality)};${clean(contact.homeAddress.region)};${clean(contact.homeAddress.postalCode)};${clean(contact.homeAddress.country)}
EMAIL;TYPE=WORK:${clean(contact.email)}
TEL;TYPE=WORK:${clean(contact.phone)}
NOTE:WhatsApp: ${clean(contact.whatsAppNumber)}
URL;TYPE=WORK:${clean(contact.website)}
URL;TYPE=WHATSAPP:${clean(contact.whatsApp)}
REV:${new Date().toISOString()}
END:VCARD`;

  useEffect(() => {
    setQrError(null);
    QRCode.toDataURL(vCard, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: "H"
    }, (err, url) => {
      if (err) {
        console.error("QR Code generation error:", err);
        setQrError("Failed to generate QR code");
        return;
      }
      setQrCodeUrl(url);
    });
  }, []);

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
      
      {/* Changed: two separate lines */}
      <p className={styles.cardCompany}>{contact.companyMain}</p>
      <p className={styles.cardSpecialties}>{contact.companySpecialties}</p>
      
      <p className={styles.cardDepartment}>{contact.department}</p>

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
            unoptimized
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