import { LoaderCircle } from "lucide-react";
import styles from "./candidate-progress.module.css";

export function CandidateProgress() {
  return <div className={styles.progress} role="status" aria-live="polite">
    <div className={styles.header}><LoaderCircle className={styles.spinner} size={19} aria-hidden="true"/><div><strong>Preparing your candidates</strong><p>Comparing your requirements with the available agents. This can take a moment.</p></div></div>
    <div className={styles.track} aria-hidden="true"><span /></div>
  </div>;
}
