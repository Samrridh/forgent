import { ChevronDown, Database, TriangleAlert } from "lucide-react";
import type { BusinessSchemaDescription } from "@/server/compiler/business-schema-description";
import styles from "./schema-review.module.css";

export function SchemaReview({ description }: { description: BusinessSchemaDescription }) {
  const { models, warnings } = description;
  const fieldCount = models.reduce((total, model) => total + model.fields.length, 0);
  return <section className={styles.section} aria-labelledby="schema-review-title">
    <div className={styles.heading}><div><span className={styles.eyebrow}>DATA STRUCTURE</span><h3 id="schema-review-title">Schema review</h3><p>Models and fields extracted from your schema.</p></div></div>
    {models.length === 0 ? <div className={styles.empty}><Database size={18} aria-hidden="true" /><span>No complete models provided.</span></div> : <details className={styles.overview}>
      <summary><span className={styles.icon}><Database size={17} aria-hidden="true" /></span><span className={styles.summaryText}><strong>Explore data models</strong><small>{models.length} {models.length === 1 ? "model" : "models"} · {fieldCount} {fieldCount === 1 ? "field" : "fields"}</small></span><ChevronDown className={styles.chevron} size={17} aria-hidden="true" /></summary>
      <div className={styles.models}>{models.map((model, index) => <details className={styles.model} key={`${model.name}-${index}`}><summary><span className={styles.modelName}>{model.name}</span><span className={styles.fieldCount}>{model.fields.length} {model.fields.length === 1 ? "field" : "fields"}</span><ChevronDown className={styles.chevron} size={15} aria-hidden="true" /></summary>
        {model.fields.length ? <div className={styles.fields} role="list">{model.fields.map((field, fieldIndex) => <div className={styles.field} role="listitem" key={`${field.name}-${fieldIndex}`}><code>{field.name}</code><span className={styles.fieldMeta}><span className={styles.type}>{field.type}{field.list ? "[]" : ""}</span>{field.optional && <span className={styles.optional}>optional</span>}</span></div>)}</div> : <p className={styles.noFields}>No fields found.</p>}
      </details>)}</div>
    </details>}
    {warnings.length > 0 && <details className={styles.warnings}><summary><TriangleAlert size={16} aria-hidden="true" /><span>{warnings.length} schema {warnings.length === 1 ? "note" : "notes"} to review</span><ChevronDown className={styles.chevron} size={16} aria-hidden="true" /></summary><ul>{warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></details>}
  </section>;
}
