---
name: performance-profiling-optimization
description: >
  Use for slow code, high CPU/memory, render jank, heavy queries, inefficient
  loops, large bundles, startup latency, network waterfalls, caching, and any
  optimization that should be evidence-driven.
---

# Performance Profiling Optimization

## Purpose

Improve performance based on evidence. Avoid premature optimization and preserve correctness while reducing cost, latency, memory, or jank.

## When To Use

- User reports slowness, lag, high CPU, memory leak, timeout, long build, slow query, slow API, UI jank, bundle bloat, or startup delay.
- A feature includes loops, polling, rendering, database queries, large lists, file scanning, media processing, or network calls.
- You are about to optimize code and need to prove the bottleneck.

## Optimization Protocol

1. Define the performance goal:
   - latency target;
   - throughput;
   - frame rate;
   - memory ceiling;
   - query count/time;
   - bundle size;
   - startup time.
2. Locate the hot path from code and available measurements.
3. Measure or estimate with concrete evidence before changing architecture.
4. Make the smallest change that reduces the bottleneck.
5. Verify correctness and compare before/after where possible.

## Investigation Checklist

- Repeated work in loops/render/ticks/intervals.
- N+1 database or API calls.
- Full table/list re-render when patch/update is enough.
- Missing debounce/throttle/cache.
- Expensive parsing/serialization in hot path.
- Large dependency imported for small functionality.
- Memory retained by event listeners, timers, subscriptions, DOM nodes, maps/caches.
- Blocking I/O on request/render path.
- Unbounded recursion, queue, cache, or retry.
- Inefficient selectors, layout thrashing, image/video/font size issues.

## Rules

- Do not sacrifice correctness or security for speed.
- Do not add caching without invalidation rules.
- Do not add concurrency without bounding it and handling cancellation/errors.
- Avoid micro-optimizing cold code while hot paths remain slow.
- Prefer algorithmic improvements, batching, indexing, throttling, and lifecycle cleanup over clever low-level tricks.
- Keep optimized code readable; document non-obvious performance constraints.

## Frontend/UI Focus

- Minimize unnecessary re-renders and DOM churn.
- Use virtualization/pagination for large lists when project supports it.
- Avoid layout thrash: batch reads/writes and avoid repeated forced measurement.
- Optimize images/assets and avoid remote blocking resources.
- Keep animations on transform/opacity when possible.
- Clean up timers/listeners/subscriptions on unmount/hide/resource stop.

## Backend/API Focus

- Validate query plans/indexes before changing query logic when possible.
- Batch database operations and avoid per-item roundtrips.
- Add pagination/limits for list endpoints.
- Bound request body sizes and concurrent work.
- Use cache only with explicit keys, TTL/invalidation, and permission-aware scope.

## Verification

- Run targeted benchmark/profile/test where possible.
- Compare query counts, timings, bundle sizes, memory snapshots, or log timings when available.
- Run correctness tests after optimization.
- If profiling tools are unavailable, explain evidence from code and expected risk.

## Final Response

Report:

- bottleneck found;
- optimization made;
- correctness preserved;
- measurements or verification;
- remaining opportunities if any.
