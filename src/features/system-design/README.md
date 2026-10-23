# System Design practice (local feature)

Routes: `/system-design` and `/system-design/:id`, inside the existing authenticated app layout.

Five original repair exercises cover API load balancing, read caching, asynchronous email jobs,
CDN offload and write sharding. React Flow provides the editable directed graph. The evaluator
in `model.ts` checks topology, required components, complete request paths, bottlenecks and unused
nodes. It accumulates fan-in in topological order. It never awards a pass for a disconnected fix,
cache bypass or cyclic diagram. Each case has explicit educational capacity assumptions, rather
than claimed real-world benchmarks. Queue processing preserves the burst's total job count;
worker throughput and total drain time are shown separately from API acknowledgement latency.

This is a deterministic teaching model, **not** a production benchmark, packet simulator or
DSLabs model checker. It does not model cache warm-up, failures, retries, persistence, billing,
consistency protocols or real network/CPU scheduling. These trade-offs appear after a successful
repair. No backend API or ordinary training quota is involved.

Progress is versioned browser storage, partitioned by authenticated user and exercise. Existing
private-cache cleanup removes it at logout. Undo/redo are session-only. Invalid cached graphs
fall back to the original exercise. Desktop and mobile share graph data; the mobile connection
form and block list provide an alternative to precise pointer wiring. Browser storage failures
are visible and do not disable practice.

## Sources inspected

- Reference reel: https://www.instagram.com/reel/DezqA14SPKx/
- Tool identified in the video: **PRISM**, https://www.prismhld.com/
- Its accessible canvas: https://www.prismhld.com/canvas/practice/library_management
  (component catalog, directed canvas, inspector, simulation feedback and trade-off review).
  No PRISM code, assets or exercise text has been copied.
- **DSLabs**, https://github.com/emichael/dslabs
  and `framework/tst/dslabs/framework/testing/StatePredicate.java`:
  https://github.com/emichael/dslabs/blob/master/framework/tst/dslabs/framework/testing/StatePredicate.java
  Inspired explicit invariants and explanatory execution traces. The Java framework and its lab
  solutions are not embedded in this browser feature; no DSLabs source code was copied.
- React Flow accessibility and keyboard controls:
  https://reactflow.dev/learn/advanced-use/accessibility

## Local verification

`node --test scripts/system-design.test.mjs`

`npm run build` includes TypeScript, Vite, prerender and existing SEO checks.

Development runs in the existing `interverse-frontend-dev` container at port 3000.
This feature has not been merged, pushed to a registry or deployed to production.

## Board interactions

Drag a library card (mouse) or its dedicated grip (touch) onto the canvas; the preview morphs to
node scale over the board. Drop on a highlighted edge to splice in the new component atomically.
Dragging an existing isolated or simple inline component onto another edge moves it there and
restores its previous inline route. Branching nodes are never detached implicitly.

Click/tap an edge for insertion controls, including on mobile. Removing a simple inline component
restores its predecessor-to-successor connection. Undo/redo capture the complete operation.
Node actions also offer duplication and starting a connection. Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z,
Ctrl+Y and Delete work outside form controls. Selects use Radix keyboard and focus management.
