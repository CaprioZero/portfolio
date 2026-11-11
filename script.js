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
      cancelAnimationFrame(animation);
      lastTap = null;
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

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animation = 0;
  let pinch = null;
  let tap = null; // the current one-finger touch
  let lastTap = null; // where and when the previous tap ended
  const limits = () => {
    if (!box.style.height) box.style.height = `${box.offsetHeight}px`;
    const fit = Math.min(image.naturalWidth, box.clientWidth, (box.clientHeight * image.naturalWidth) / image.naturalHeight);
    return { fit, max: image.naturalWidth * 2 };
  };
  const zoomTo = (width, x, y, fx, fy) => {
    image.style.maxWidth = "none";
    image.style.height = "auto";
    image.style.marginInline = "auto";
    image.style.width = `${width}px`;
    const rect = image.getBoundingClientRect();
    box.scrollLeft += rect.left - (x - fx * rect.width);
    box.scrollTop += rect.top - (y - fy * rect.height);
  };
  const toggleZoom = (x, y) => {
    const { fit } = limits();
    const rect = image.getBoundingClientRect();
    const from = rect.width;
    const to = from < image.naturalWidth - 1 ? image.naturalWidth : fit;
    if (Math.abs(to - from) < 1) return;
    const clamp = (n) => Math.min(1, Math.max(0, n));
    const fx = clamp((x - rect.left) / rect.width);
    const fy = clamp((y - rect.top) / rect.height);
    if (reduceMotion.matches) return zoomTo(to, x, y, fx, fy);
    const start = performance.now();
    const step = (time) => {
      const progress = Math.min(1, (time - start) / 250);
      zoomTo(from + (to - from) * (1 - (1 - progress) ** 3), x, y, fx, fy);
      if (progress < 1) animation = requestAnimationFrame(step);
    };
    animation = requestAnimationFrame(step);
  };
  const fingers = (touches) => {
    const [a, b] = touches;
    return {
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
      distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
    };
  };
  box.addEventListener("touchstart", (event) => {
    cancelAnimationFrame(animation);
    const [first] = event.touches;
    tap = event.touches.length === 1 ? { x: first.clientX, y: first.clientY, moved: false } : null;
    if (event.touches.length !== 2 || !image.naturalWidth) return;
    const start = fingers(event.touches);
    const rect = image.getBoundingClientRect();
    pinch = {
      ...start,
      ...limits(),
      width: rect.width,
      fx: (start.x - rect.left) / rect.width,
      fy: (start.y - rect.top) / rect.height,
    };
  }, { passive: true });
  box.addEventListener("touchmove", (event) => {
    const [first] = event.touches;
    if (tap && Math.hypot(first.clientX - tap.x, first.clientY - tap.y) > 10) tap.moved = true;
    if (!pinch || event.touches.length !== 2) return;
    event.preventDefault();
    const now = fingers(event.touches);
    zoomTo(Math.min(pinch.max, Math.max(pinch.fit, (pinch.width * now.distance) / pinch.distance)), now.x, now.y, pinch.fx, pinch.fy);
  }, { passive: false });
  box.addEventListener("touchend", (event) => {
    if (event.touches.length < 2) pinch = null;
    const ended = tap;
    tap = null;
    if (!ended || ended.moved || event.touches.length || !image.naturalWidth) return;
    const time = performance.now();
    if (lastTap && time - lastTap.time < 300 && Math.hypot(ended.x - lastTap.x, ended.y - lastTap.y) < 30) {
      lastTap = null;
      event.preventDefault(); // no click or mouse events from the second tap
      toggleZoom(ended.x, ended.y);
    } else {
      lastTap = { x: ended.x, y: ended.y, time };
    }
  }, { passive: false });
  box.addEventListener("touchcancel", () => { pinch = null; tap = null; });
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
