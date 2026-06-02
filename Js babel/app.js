// Navegacion suave y realce visual para la pagina principal.
const scrollButtons = document.querySelectorAll("[data-scroll-to]");

scrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Lleva al bloque de destino sin salto brusco.
    const targetId = button.getAttribute("data-scroll-to");
    if (!targetId) {
      return;
    }

    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

const frontActions = document.querySelectorAll(".target-point");

frontActions.forEach((point) => {
  point.addEventListener("click", () => {
    // Marca temporalmente el punto seleccionado.
    const label = point.querySelector(".label");
    if (!label) {
      return;
    }

    const baseText = label.textContent || "";
    label.textContent = `${baseText} | Seleccionado`;
    label.style.borderColor = "rgba(255, 61, 61, 0.8)";

    window.setTimeout(() => {
      label.textContent = baseText;
      label.style.borderColor = "rgba(255, 255, 255, 0.2)";
    }, 1200);
  });
});

const heroSection = document.getElementById("inicio");
const upButton = document.querySelector(".rank-corporal");

// Muestra el acceso rapido arriba cuando la pagina ya se desplazo.
function toggleUpButton() {
  if (!heroSection || !upButton) {
    return;
  }

  const threshold = heroSection.offsetHeight * 0.75;
  if (window.scrollY > threshold) {
    upButton.classList.add("is-visible");
  } else {
    upButton.classList.remove("is-visible");
  }
}

window.addEventListener("scroll", toggleUpButton, { passive: true });
window.addEventListener("resize", toggleUpButton);
toggleUpButton();
