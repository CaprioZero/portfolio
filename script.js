document.querySelectorAll(".reveal").forEach((button) => {
  button.addEventListener("click", () => {
    const address = `${button.dataset.u}@${button.dataset.d}`;
    const link = document.createElement("a");
    link.className = "email";
    link.href = `mailto:${address}`;
    link.textContent = address;
    button.replaceWith(link);
    link.focus();
  });
});

const viewer = document.getElementById("viewer");
if (viewer && typeof viewer.showModal === "function") {
  const image = viewer.querySelector("img");
  const caption = viewer.querySelector(".viewer-caption");
  document.querySelectorAll("a.shot").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const figure = link.closest("figure");
      image.src = link.href;
      image.alt = link.querySelector("img").alt;
      caption.textContent = figure.querySelector("figcaption").textContent;
      viewer.showModal();
    });
  });
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) viewer.close();
  });
}

const demo = document.querySelector(".demo video");
if (demo && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) demo.play().catch(() => {});
      else demo.pause();
    },
    { threshold: 0.6 }
  ).observe(demo);
}

const links = new Map();
document.querySelectorAll(".toc a").forEach((a) => links.set(a.getAttribute("href").slice(1), a));
if ("IntersectionObserver" in window && links.size) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.removeAttribute("aria-current"));
        links.get(entry.target.id)?.setAttribute("aria-current", "true");
      });
    },
    { rootMargin: "-20% 0px -70% 0px" }
  );
  links.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}
