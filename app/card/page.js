// src/app/card/page.js
import BusinessCard from "../../components/BusinessCard";
import styles from "./styles.module.css";

export default function Card() {
  return (
    <main className={styles.mainContainer}>
      <BusinessCard />
    </main>
  );
}