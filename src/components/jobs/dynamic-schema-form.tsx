"use client";

import React from "react";
import {
  ChevronDown,
} from "lucide-react";

interface SchemaProperty {
  type?: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  items?: Record<string, unknown>;
  properties?: Record<string, unknown>;
}

interface DynamicSchemaFormProps {
  schema: Record<string, unknown>;
  values: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

export function DynamicSchemaForm({
  schema,
  values,
  onChange,
}: DynamicSchemaFormProps) {
  const properties = (schema.properties as Record<string, SchemaProperty>) || {};
  const requiredFields = Array.isArray(schema.required) ? (schema.required as string[]) : [];

  const isLongText = (key: string, prop: SchemaProperty) => {
    const desc = (prop.description || "").toLowerCase();
    const k = key.toLowerCase();
    return (
      desc.includes("payload") ||
      desc.includes("markdown") ||
      desc.includes("code") ||
      desc.includes("clause") ||
      desc.includes("text") ||
      desc.includes("script") ||
      k.includes("payload") ||
      k.includes("description") ||
      k.includes("body") ||
      k.includes("clause") ||
      k.includes("data")
    );
  };

  const handleJsonFieldChange = (key: string, text: string) => {
    try {
      const parsed = JSON.parse(text);
      onChange(key, parsed);
    } catch {
      // Store string temporarily so typing is not interrupted
      onChange(key, text);
    }
  };

  return (
    <div className="space-y-5">
      {Object.entries(properties).map(([key, prop]) => {
        const isRequired = requiredFields.includes(key);
        const value = values[key];
        const propType = prop.type || "string";

        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold text-slate-800 flex items-center gap-1.5">
                <span>{key}</span>
                {isRequired ? (
                  <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded font-mono">
                    Required
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">
                    Optional
                  </span>
                )}
              </label>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {propType}
              </span>
            </div>

            {prop.description && (
              <p className="text-[11px] text-slate-500 leading-normal">
                {prop.description}
              </p>
            )}

            {/* 1. Enum Select */}
            {prop.enum && Array.isArray(prop.enum) ? (
              <div className="relative">
                <select
                  value={String(value ?? prop.default ?? prop.enum[0])}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-cobalt-500 cursor-pointer shadow-sm pr-9"
                >
                  {prop.enum.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : propType === "boolean" ? (
              /* 2. Boolean Switch */
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onChange(key, !value)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cobalt-500 ${
                    value ? "bg-cobalt-500" : "bg-slate-300"
                  }`}
                  role="switch"
                  aria-checked={Boolean(value)}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      value ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-xs font-mono text-slate-700">
                  {value ? "Enabled (true)" : "Disabled (false)"}
                </span>
              </div>
            ) : propType === "integer" || propType === "number" ? (
              /* 3. Number Input */
              <input
                type="number"
                value={value !== undefined ? String(value) : ""}
                onChange={(e) => {
                  const num = e.target.value === "" ? "" : Number(e.target.value);
                  onChange(key, num);
                }}
                placeholder={prop.default !== undefined ? String(prop.default) : "Enter number"}
                required={isRequired}
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 shadow-sm"
              />
            ) : propType === "object" || propType === "array" ? (
              /* 4. Structured JSON / Object */
              <div className="space-y-1">
                <textarea
                  rows={5}
                  value={
                    typeof value === "object"
                      ? JSON.stringify(value, null, 2)
                      : String(value ?? "")
                  }
                  onChange={(e) => handleJsonFieldChange(key, e.target.value)}
                  placeholder="{ ... JSON parameters ... }"
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cobalt-500 shadow-inner"
                />
              </div>
            ) : isLongText(key, prop) ? (
              /* 5. Multiline Textarea */
              <textarea
                rows={4}
                value={String(value ?? "")}
                onChange={(e) => onChange(key, e.target.value)}
                placeholder={prop.default !== undefined ? String(prop.default) : "Enter text payload..."}
                required={isRequired}
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 shadow-sm leading-relaxed"
              />
            ) : (
              /* 6. Standard Single-line Text Input */
              <input
                type="text"
                value={String(value ?? "")}
                onChange={(e) => onChange(key, e.target.value)}
                placeholder={prop.default !== undefined ? String(prop.default) : `Enter ${key}`}
                required={isRequired}
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 shadow-sm"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
