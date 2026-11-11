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
  const box = viewer.querySelector(".viewer-scroll");
  document.querySelectorAll("a.shot").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const figure = link.closest("figure");
      image.removeAttribute("style");
      box.removeAttribute("style");
      image.src = link.href;
      image.alt = link.querySelector("img").alt;
      caption.textContent = figure.querySelector("figcaption").textContent;
      viewer.showModal();
      box.scrollTo(0, 0);
    });
  });
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) viewer.close();
  });

  let pinch = null;
  const fingers = (touches) => {
    const [a, b] = touches;
    return {
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
      distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
    };
  };
  box.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 2 || !image.naturalWidth) return;
    const start = fingers(event.touches);
    const rect = image.getBoundingClientRect();
    if (!box.style.height) box.style.height = `${box.offsetHeight}px`;
    const fitHeight = box.clientHeight;
    pinch = {
      ...start,
      width: rect.width,
      fx: (start.x - rect.left) / rect.width,
      fy: (start.y - rect.top) / rect.height,
      min: Math.min(image.naturalWidth, box.clientWidth, (fitHeight * image.naturalWidth) / image.naturalHeight),
      max: image.naturalWidth * 2,
    };
  }, { passive: true });
  box.addEventListener("touchmove", (event) => {
    if (!pinch || event.touches.length !== 2) return;
    event.preventDefault();
    const now = fingers(event.touches);
    const width = Math.min(pinch.max, Math.max(pinch.min, (pinch.width * now.distance) / pinch.distance));
    image.style.maxWidth = "none";
    image.style.height = "auto";
    image.style.marginInline = "auto";
    image.style.width = `${width}px`;
    const rect = image.getBoundingClientRect();
    box.scrollLeft += rect.left - (now.x - pinch.fx * rect.width);
    box.scrollTop += rect.top - (now.y - pinch.fy * rect.height);
  }, { passive: false });
  box.addEventListener("touchend", (event) => {
    if (event.touches.length < 2) pinch = null;
  });
  box.addEventListener("touchcancel", () => { pinch = null; });
  box.addEventListener("gesturestart", (event) => event.preventDefault());
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

[
  [".up-contents", ".toc ul"],
  [".up-top", ".hero"],
].forEach(([linkSelector, targetSelector]) => {
  const link = document.querySelector(linkSelector);
  const target = document.querySelector(targetSelector);
  if (!link || !target) return;
  const update = () => {
    link.hidden = target.getBoundingClientRect().bottom > 0;
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
});

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
