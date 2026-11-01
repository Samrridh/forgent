# Meko submission answers

## Problem statement

Teams building applications with multiple AI agents need to pass work between agents without losing the facts, uncertainty, and decisions that shaped the previous step. In customer support, for example, a first agent may recognize that a refund policy is missing and hand the question to another agent. If the receiving agent only sees the latest message, it may repeat work, ask the customer for the same information, or invent an eligibility decision. Forgent explores an agent marketplace where a shared context layer makes the handoff usable across agents and sessions. The current demo uses a fictional annual-plan refund request.

## What Meko does in the product

Forgent uses three Meko capabilities in the handoff demo. First, it saves the first agent's question and response as a **conversation**, preserving the exchange for inspection. Second, it attempts to write the relevant fictional case facts as a **memory**, demonstrating how durable information can be retained beyond an individual run; the UI reports if that write fails. Third, it saves a structured JSON **artifact** containing the question, handoff reason, and known facts, then retrieves it by content hash and passes the retrieved data to the second agent. The second agent uses the artifact to draft a response without inventing a refund policy. Today the second agent does not search the conversation or memory, and shared knowledge promotion remains a manual action in Meko.

## Challenges without Meko

Without a shared persistence layer, Forgent would have to build and maintain its own storage and retrieval for agent conversations, durable facts, and handoff files. Context would be easier to lose when a request moves between agents or processes, forcing repeated questions and making it harder to inspect what each agent knew. Forgent could build these capabilities itself, but it would also need to manage access boundaries, identifiers, and cross-agent retrieval. Meko provides these primitives for the demo; the artifact hash helps retrieve the same handoff but does not establish that its contents are correct.
