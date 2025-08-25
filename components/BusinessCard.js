// src/components/BusinessCard.js
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import VCardGenerator from "./VCardGenerator";
import styles from "../app/card/styles.module.css";


const BusinessCard = () => {
  // Contact details (customize these)
  const contact = {
    name: "Edgar Lindo",
    title: "Sales Engineer",
    company: "Technical Union",
    email: "info@tu.biz",
    phone: "+1 (586) 221-3095",
    whatsApp: "https://wa.me/15866125270",
    whatsAppNumber: "+1-586-612-5270",
    website: "https://www.tu.biz",
    address: "Arlington Heights, IL 6004",
  };

  // URL for QR code (use deployed URL or localhost)
  const cardUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  // Generate QR code
  useEffect(() => {
    QRCode.toDataURL(cardUrl, { width: 200, margin: 1 }, (err, url) => {
      if (err) {
        console.error("QR Code generation error:", err);
        return;
      }
      setQrCodeUrl(url);
    });
  }, [cardUrl]);

  return (
    <div className={styles.cardContainer}>
      {/* Profile Image (optional) */}
      <div className={styles.profileImageContainer}>
        <Image
          src="/image/profile.png"
          alt="Profile"
          width={100}
          height={100}
          className={styles.profileImage}
        />
      </div>

      {/* Contact Details */}
      <h1 className={styles.cardName}>{contact.name}</h1>
      <p className={styles.cardTitle}>{contact.title}</p>
      <p className={styles.cardCompany}>{contact.company}</p>

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
          <span className={styles.detailLabel}>WhatsApp</span>{" "}
          <a href={`tel:${contact.whatsApp}`} className={styles.detailLink}>
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

      {/* QR Code */}
      <div className={styles.qrCodeContainer}>
        <p className={styles.qrCodeLabel}>Scan to save contact:</p>
        {qrCodeUrl && (
          <Image
            src={qrCodeUrl}
            alt="QR Code"
            width={200}
            height={200}
            className={styles.qrCode}
          />
        )}
      </div>

      {/* vCard Download Button */}
      <VCardGenerator contact={contact} />
    </div>
  );
};

export default BusinessCard;