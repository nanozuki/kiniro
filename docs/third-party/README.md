# Third-party documentation

This directory stores local snapshots of external documentation that agents may
need while working on this repository.

## Melt UI next-gen

- Source: <https://github.com/melt-ui/next-gen/tree/main/docs/src/content/docs>
- Local path: `docs/third-party/melt-ui`
- Fetched on: 2026-05-25

Use the local snapshot before reaching for network access when implementing or
reviewing Melt UI primitives. Prefer Melt UI's builder pattern over its
component pattern for this project.

### Document map

Read these files from the local snapshot based on the work being done:

- `melt-ui/index.mdx`: overview and entry point.
- `melt-ui/guides/installation.mdx`: package setup and integration requirements.
- `melt-ui/guides/how-to-use.md`: usage model, including builder and component patterns.
- `melt-ui/guides/styling.md`: styling approaches and data attributes.
- `melt-ui/reference/api.md`: shared API conventions and type/reference details.
- `melt-ui/components/accordion.mdx`: Accordion primitive.
- `melt-ui/components/avatar.mdx`: Avatar primitive.
- `melt-ui/components/collapsible.mdx`: Collapsible primitive.
- `melt-ui/components/combobox.mdx`: Combobox primitive.
- `melt-ui/components/dialog.mdx`: Dialog primitive.
- `melt-ui/components/file-upload.mdx`: File Upload primitive.
- `melt-ui/components/pin-input.mdx`: PIN Input primitive.
- `melt-ui/components/popover.mdx`: Popover primitive.
- `melt-ui/components/progress.mdx`: Progress primitive.
- `melt-ui/components/radio-group.mdx`: Radio Group primitive.
- `melt-ui/components/select.mdx`: Select primitive.
- `melt-ui/components/slider.mdx`: Slider primitive.
- `melt-ui/components/SpatialMenu.mdx`: Spatial Menu primitive, marked WIP upstream.
- `melt-ui/components/tabs.mdx`: Tabs primitive.
- `melt-ui/components/toaster.mdx`: Toaster primitive.
- `melt-ui/components/toggle.mdx`: Toggle primitive.
- `melt-ui/components/tooltip.mdx`: Tooltip primitive.
- `melt-ui/components/tree.mdx`: Tree primitive.

## Runed

- Source: <https://github.com/svecosystem/runed/tree/main/sites/docs/src/content>
- Local path: `docs/third-party/runed`
- Fetched on: 2026-05-26

Use the local snapshot before reaching for network access when implementing or
reviewing Runed utilities. Runed provides Svelte 5 rune-based utility classes
and functions for shared state, observers, events, persistence, and reactive
browser state.

### Document map

Read these files from the local snapshot based on the work being done:

- `runed/index.md`: overview, principles, and project positioning.
- `runed/getting-started.md`: installation and first-use guidance.
- `runed/utilities/active-element.md`: `activeElement` utility.
- `runed/utilities/animation-frames.md`: `AnimationFrames` utility.
- `runed/utilities/bool-attr.md`: `boolAttr` utility.
- `runed/utilities/context.md`: `Context` utility.
- `runed/utilities/debounced.md`: `Debounced` utility.
- `runed/utilities/element-rect.md`: `ElementRect` utility.
- `runed/utilities/element-size.md`: `ElementSize` utility.
- `runed/utilities/extract.md`: `extract` utility.
- `runed/utilities/finite-state-machine.md`: `FiniteStateMachine` utility.
- `runed/utilities/is-document-visible.md`: `IsDocumentVisible` utility.
- `runed/utilities/is-focus-within.md`: `IsFocusWithin` utility.
- `runed/utilities/is-idle.md`: `IsIdle` utility.
- `runed/utilities/is-in-viewport.md`: `IsInViewport` utility.
- `runed/utilities/is-mounted.md`: `IsMounted` utility.
- `runed/utilities/on-cleanup.md`: `onCleanup` utility.
- `runed/utilities/on-click-outside.md`: `onClickOutside` utility.
- `runed/utilities/persisted-state.md`: `PersistedState` utility.
- `runed/utilities/pressed-keys.md`: `PressedKeys` utility.
- `runed/utilities/previous.md`: `Previous` utility.
- `runed/utilities/resource.md`: `resource` utility.
- `runed/utilities/scroll-state.md`: `ScrollState` utility.
- `runed/utilities/state-history.md`: `StateHistory` utility.
- `runed/utilities/textarea-autosize.md`: `TextareaAutosize` utility.
- `runed/utilities/throttled.md`: `Throttled` utility.
- `runed/utilities/use-debounce.md`: `useDebounce` utility.
- `runed/utilities/use-event-listener.md`: `useEventListener` utility.
- `runed/utilities/use-geolocation.md`: `useGeolocation` utility.
- `runed/utilities/use-intersection-observer.md`: `useIntersectionObserver` utility.
- `runed/utilities/use-interval.md`: `useInterval` utility.
- `runed/utilities/use-mutation-observer.md`: `useMutationObserver` utility.
- `runed/utilities/use-resize-observer.md`: `useResizeObserver` utility.
- `runed/utilities/use-search-params.md`: `useSearchParams` utility.
- `runed/utilities/use-throttle.md`: `useThrottle` utility.
- `runed/utilities/watch.md`: `watch` utility.
