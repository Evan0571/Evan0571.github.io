(() => {
  const galleries = document.querySelectorAll("[data-travel-gallery]");
  if (!galleries.length) {
    return;
  }

  const mod = (value, size) => ((value % size) + size) % size;

  galleries.forEach((gallery) => {
    const stage = gallery.querySelector(".travel-gallery-stage");
    const items = Array.from(gallery.querySelectorAll("[data-gallery-item]"));
    const previousButton = gallery.querySelector("[data-gallery-prev]");
    const nextButton = gallery.querySelector("[data-gallery-next]");
    const status = gallery.querySelector("[data-gallery-status]");

    if (!stage || !items.length) {
      return;
    }

    let activeIndex = 0;
    gallery.dataset.enhanced = "true";
    const getStackDepth = () => (window.matchMedia("(max-width: 760px)").matches ? 30 : 46);

    const syncHeight = () => {
      const activeItem = items[activeIndex];
      if (!activeItem) {
        return;
      }
      const nextLayer = items.find((item) => item.dataset.state === "next");
      const nextTwoLayer = items.find((item) => item.dataset.state === "next-2");
      const activeHeight = activeItem.getBoundingClientRect().height;
      const stackDepth = nextLayer || nextTwoLayer ? getStackDepth() : 0;
      stage.style.height = `${Math.ceil(activeHeight + stackDepth)}px`;
    };

    const applyState = () => {
      const count = items.length;

      items.forEach((item, index) => {
        const forward = mod(index - activeIndex, count);
        const backward = mod(activeIndex - index, count);
        let state = "hidden";

        if (index === activeIndex) {
          state = "active";
        } else if (forward === 1) {
          state = "next";
        } else if (forward === 2) {
          state = "next-2";
        } else if (backward === 1) {
          state = "prev";
        }

        item.dataset.state = state;
        item.setAttribute("aria-hidden", state === "active" ? "false" : "true");
      });

      if (status) {
        status.textContent = `${activeIndex + 1} / ${count}`;
      }

      syncHeight();
    };

    const move = (direction) => {
      activeIndex = mod(activeIndex + direction, items.length);
      applyState();
    };

    previousButton?.addEventListener("click", () => move(-1));
    nextButton?.addEventListener("click", () => move(1));

    stage.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
      }
    });

    let pointerStartX = null;

    stage.addEventListener("pointerdown", (event) => {
      pointerStartX = event.clientX;
    });

    stage.addEventListener("pointerup", (event) => {
      if (pointerStartX === null) {
        return;
      }

      const deltaX = event.clientX - pointerStartX;
      pointerStartX = null;

      if (Math.abs(deltaX) < 36) {
        return;
      }

      move(deltaX > 0 ? -1 : 1);
    });

    stage.addEventListener("pointercancel", () => {
      pointerStartX = null;
    });

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => {
        syncHeight();
      });

      items.forEach((item) => resizeObserver.observe(item));
    } else {
      window.addEventListener("resize", syncHeight, { passive: true });
    }

    gallery.querySelectorAll("img").forEach((image) => {
      if (image.complete) {
        return;
      }

      image.addEventListener("load", syncHeight, { once: false });
      image.addEventListener("error", syncHeight, { once: false });
    });

    applyState();
  });
})();
