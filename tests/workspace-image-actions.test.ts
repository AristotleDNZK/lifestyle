import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

globalThis.React = React;

type WorkspaceImageActionsModule = typeof import("../app/workspace/_components/workspace-image-actions");

async function renderImageActions() {
  const module = (await import(
    "../app/workspace/_components/workspace-image-actions"
  )) as WorkspaceImageActionsModule;
  const { WorkspaceImageActionOverlay } = module;

  return renderToStaticMarkup(
    React.createElement(
      WorkspaceImageActionOverlay,
      {
        imageUrl: "https://example.com/result.png",
        imageAlt: "Result image",
        downloadName: "result-image.png",
        viewLabel: "View full image",
      },
      React.createElement("img", {
        src: "https://example.com/result.png",
        alt: "Result image",
      })
    )
  );
}

test("workspace image actions expose full-view and download controls", async () => {
  const html = await renderImageActions();

  assert.match(html, /View full image/);
  assert.match(html, /Download/);
  assert.match(html, /result-image\.png/);
});
