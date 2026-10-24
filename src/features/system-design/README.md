# System Design practice (local feature)

Routes: `/system-design` and `/system-design/:id`, inside the existing authenticated app layout.

Twenty-five original exercises form five tracks: load fundamentals, reliable requests,
replication/consistency, event delivery, and caching/resource protection. The first five cover API
load balancing, read caching, asynchronous email jobs, CDN offload and write sharding. React Flow provides the editable directed graph. The evaluator
in `model.ts` checks topology, required components, complete request paths, bottlenecks and unused
nodes. It accumulates fan-in in topological order. It never awards a pass for a disconnected fix,
cache bypass or cyclic diagram. Each case has explicit educational capacity assumptions, rather
than claimed real-world benchmarks. Queue processing preserves the burst's total job count;
worker throughput and total drain time are shown separately from API acknowledgement latency.

This is a deterministic teaching model, **not** a production benchmark, packet simulator or
DSLabs model checker. The twenty advanced scenarios check ordered protection on **every** request route and show a fixed
failure/recovery example. A replica group, consensus group, outbox, and 2PC coordinator are
encapsulated protocol components with explicit contracts in the palette, not implementations of
those protocols. The evaluator checks their placement; it does not execute arbitrary distributed
protocols, enumerate network schedules, or prove correctness in production. Numeric traffic
remains a separate check: admission explicitly rejects excess and single-flight combines only
the stated simultaneous reads of one key. Cache hits never hide writes or cold-cache incidents.
Billing, real clocks and persistence faults are not simulated. Trade-offs appear after repair. No backend API or ordinary training quota is involved.

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

## Dashboard and news

The dashboard announcement dissolves into ASCII and reveals the original report recommendations through ASCII. The reverse face is
inert/aria-hidden while concealed; focus moves to the visible face after the transition.
The effect uses the original `ascii-reveal` library by Quan Hoang (MIT), pinned to commit
`bbb9472d45d7ce9a982f36403dc4e80e145343a5`, with preset `dither`, cinematic timing and speed 0.7.
Source and demo: https://github.com/quanhoangindex/ascii-reveal and
https://quanhoangindex.github.io/ascii-reveal/. It runs on dashboard mount and on card changes.
Keyboard changes are immediate; the library respects reduced motion for mount effects.
The animation cancels on unmount and locks repeated activation while running. The entire
front is a link, with the close button as a sibling (no nested interactive controls). The card
stores the chosen face per account in the existing private browser-cache namespace; the
reverse-side button returns to the announcement. Account changes remount it with that account’s
preference. Logout clears private browser cache.

News ID `system-design-path-20261024` is also registered in interview-service `PublishedNews`.
Read receipts retain the existing authenticated, per-user backend storage; no global local
"read" flag has been introduced. Deploy these two repositories together when this feature is
subsequently approved for production.

## Fullscreen board

The bottom-right diagonal-arrow button opens fullscreen and becomes a collapse button.
A right-hand drawer contains Task, Blocks, Connections and Check; the top action checks the
design and opens its result. Entry/exit use the same original Dither preset as the dashboard.
Native fullscreen requests landscape orientation on coarse-pointer devices when supported.
Browsers refusing orientation lock keep a functional full-viewport board with a rotate-phone
hint; CSS rotation is deliberately avoided because it corrupts React Flow pointer coordinates.
Radix selects portal inside the native fullscreen element. Scroll locking and hidden-panel
inertness are restored on exit. Actual mobile orientation locking requires a physical device.
