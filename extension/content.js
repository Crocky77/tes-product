(function () {

  function isPlayerPage() {
    return window.location.href.includes("Player.aspx");
  }

  function injectTES() {

    if (!isPlayerPage()) return;
    if (document.getElementById("tes-box")) return;

    // pronađi naslov igrača (najstabilniji element)
    const header = document.querySelector("h1");
    if (!header) return;

    const box = document.createElement("div");
    box.id = "tes-box";
    box.style.margin = "10px 0";
    box.style.padding = "10px";
    box.style.border = "2px solid #cc0000";
    box.style.background = "#fff7f7";
    box.style.display = "flex";
    box.style.justifyContent = "space-between";
    box.style.fontWeight = "bold";

    box.innerHTML = `
      <span>TES</span>
      <span>99 (mock)</span>
    `;

    header.parentNode.insertBefore(box, header.nextSibling);
  }

  const observer = new MutationObserver(() => {
    injectTES();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  injectTES();

})();
