//esto sirve para el scroll suave entre secciones, y también para mostrar
//  el botón de scroll-top cuando se hace scroll más allá de cierto punto 
// en la sección de inicio, lo que mejora la navegación y la experiencia del usuario al permitir un acceso rápido a la parte superior de la página. Además, el código incluye una función para animar los puntos de acción en la sección de frente, proporcionando retroalimentación visual al usuario al hacer clic en ellos.
const scrollButtons = document.querySelectorAll("[data-scroll-to]");

scrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
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
