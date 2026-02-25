import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>AtysPro</h1>
        <p className={styles.subtitle}>
          Qualification des leads par SMS pour artisans
        </p>
        <div className={styles.ctas}>
          <Link href="/dashboard" className={styles.primary}>
            Ouvrir le dashboard
          </Link>
          <a
            className={styles.secondary}
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
          >
            Santé API
          </a>
        </div>
      </main>
    </div>
  );
}
