// DOM utilities for TES

function isPlayerPage() {
  return window.location.href.includes("Player.aspx");
}

function findInjectionTarget() {
  const psico = document.querySelector("div[id*='Psico']");
  if (psico) return psico;

  const tabs = document.querySelector(".tabmenu");
  if (tabs) return tabs;

  return document.body;
}
