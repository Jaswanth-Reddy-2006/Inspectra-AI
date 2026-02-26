# Bug Detection Feature Summary Report

## 1. Components Utilized
The Bug Detection architecture relies on a streamlined set of React components and libraries to maintain a reactive, enterprise-grade UI:
*   **`BugDetection.jsx`**: The primary React page component responsible for rendering the entire defect intelligence hub. 
*   **`DetailModal`** (Internal Component): A focused overlay modal within `BugDetection.jsx` that presents advanced, deep-dive information for a specific selected defect.
*   **`ScanContext` (`useScanContext`)**: A global React Context environment (`src/context/ScanContext.jsx`) that serves as the single source of truth, persisting scan results across the application ecosystem.
*   **`Recharts`**: A composable charting library (using `PieChart`, `Pie`, `Cell`, `Tooltip`) deployed to render the interactive Severity Distribution donut chart.
*   **`lucide-react`**: Provides the standardized SVG iconography (e.g., `ShieldAlert`, `Terminal`, `Layers`) used throughout the interface.

## 2. Defect Ingestion Model (How we get the "bugs")
The system acquires and structures bug data through a strict pipeline connecting the autonomous backend to the global frontend state:
1.  **Scan Initiation**: The workflow begins when a user inputs a target URL on the homepage and triggers an autonomous scan.
2.  **Backend Telemetry Processing (`scorer.js`)**: The backend orchestrates various analysis tools against the target URL. The `summarizeIssues` function specifically aggregates all detected anomalies, deduplicates them, and standardizes them into a strict schema `[ { id, title, category, severity, confidence, impactSurface, suggestedFix... } ]`.
3.  **Context Publication**: The structured output is injected precisely into the `productionIntelligence.pillars.bugDetection` object of the final JSON response payload.
4.  **Frontend State Consumption**: The `ScanContext` receives this payload, saving the scan memory securely. The `BugDetection` component then reads directly from this shared baseline.

## 3. UI Presentation & Platform Data Reading
The platform isolates the Bug Detection page as a **strict read-only analytical view**, ensuring it only consumes and visualizes validated data securely.

**How the platform reads the data:**
*   The component safely mounts and queries the global state: `const bugData = productionIntelligence?.pillars?.bugDetection;`
*   If the scan memory is wiped or missing, the platform intercepts the render to display a secure **"Scan Session Expired"** empty state.
*   If the telemetry returns 0 bugs, a graceful **"No Bug Detection Data Available"** screen is activated.
*   During extraction, extensive optional chaining (`?.`) is utilized (e.g., `issue?.severity`) to ensure UI immunity against runtime crashes (the "black screen" fix).

**What is visualized in the UI:**
*   **Intelligence Top-Stats:** A primary widget showing the global `BugDetection` score out of 100, the total volume of defects, and the confidence rating of the scan.
*   **Severity Distribution Chart:** A donut graph visually breaking the payload into `Critical`, `High`, `Medium`, and `Low` risk slices.
*   **Defect Breakdown Table:** A priority-oriented ledger mapping out every single bug alongside its Category, Severity badge, Signature (Title/ID), and Impact Surface.
*   **Risk Summary Console (Right Panel):** Highlights tactical engineering metrics like *Critical Density* (percentage of severe bugs vs total) and the projected Score Recovery if the bugs are patched.
*   **Topological Trace:** A visual component simulating the structural path tracing from the app's root level down to the localized defect origin.
*   **Deep-Dive Patch Directives:** Clicking any table row opens the `DetailModal`, showing an actionable assessment on "Why It Matters" coupled with a simulated terminal block offering a concrete code-level patch suggestion.
