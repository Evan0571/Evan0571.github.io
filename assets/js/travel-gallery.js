(() => {
  const compactPost = document.querySelector(".post-single.post-images-compact .post-content");

  const createLightbox = () => {
    const overlay = document.createElement("div");
    overlay.className = "travel-lightbox";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="travel-lightbox-backdrop" data-lightbox-close></div>
      <div class="travel-lightbox-dialog" role="dialog" aria-modal="true" aria-label="Expanded photo view">
        <button class="travel-lightbox-close" type="button" aria-label="Close expanded photo" data-lightbox-close>&times;</button>
        <img class="travel-lightbox-media" alt="">
        <div class="travel-lightbox-caption"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const media = overlay.querySelector(".travel-lightbox-media");
    const caption = overlay.querySelector(".travel-lightbox-caption");

    const close = () => {
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("travel-lightbox-open");
      media.removeAttribute("src");
      media.alt = "";
      caption.textContent = "";
    };

    const open = (image) => {
      const figureCaption = image.closest("figure")?.querySelector("figcaption");
      const text = figureCaption?.textContent?.trim() || image.alt || "";
      media.src = image.currentSrc || image.src;
      media.alt = image.alt || "";
      caption.textContent = text;
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("travel-lightbox-open");
    };

    overlay.addEventListener("click", (event) => {
      if (event.target instanceof HTMLElement && event.target.closest("[data-lightbox-close]")) {
        close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && overlay.getAttribute("aria-hidden") === "false") {
        close();
      }
    });

    return { open };
  };

  if (compactPost) {
    const lightbox = createLightbox();
    compactPost
      .querySelectorAll("figure.post-image > img, p:has(> img:only-child) > img, .travel-gallery-item img")
      .forEach((image) => {
        image.addEventListener("click", () => {
          lightbox.open(image);
        });
      });
  }

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

    if (!stage || !items.length) {
      return;
    }

    let activeIndex = 0;
    gallery.dataset.enhanced = "true";

    const positionControls = () => {
      if (!previousButton || !nextButton) {
        return;
      }

      const activeItem = items[activeIndex];
      if (!activeItem) {
        return;
      }

      const stageRect = stage.getBoundingClientRect();
      const media = activeItem.querySelector("img") ?? activeItem;
      const activeRect = media.getBoundingClientRect();
      const buttonWidth = previousButton.getBoundingClientRect().width || 36;
      const buttonRadius = buttonWidth / 2;
      const edgeGap = window.matchMedia("(max-width: 760px)").matches ? 22 : 32;
      const minInset = window.matchMedia("(max-width: 760px)").matches ? 6 : 10;
      const centerY = activeRect.top - stageRect.top + activeRect.height / 2;
      const previousX = Math.max(minInset + buttonRadius, activeRect.left - stageRect.left - buttonRadius - edgeGap);
      const nextX = Math.min(stageRect.width - minInset - buttonRadius, activeRect.right - stageRect.left + buttonRadius + edgeGap);

      previousButton.style.left = `${previousX}px`;
      nextButton.style.left = `${nextX}px`;
      previousButton.style.top = `${centerY}px`;
      nextButton.style.top = `${centerY}px`;
    };

    const syncHeight = () => {
      const stageRect = stage.getBoundingClientRect();
      if (!stageRect.width) {
        return;
      }

      const visibleItems = items.filter((item) => {
        const state = item.dataset.state;
        return state === "active" || state === "next" || state === "next-2";
      });

      let maxBottom = 0;
      visibleItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        maxBottom = Math.max(maxBottom, rect.bottom - stageRect.top);
      });

      const fallbackHeight = items[activeIndex]?.getBoundingClientRect().height ?? 0;
      stage.style.height = `${Math.ceil(maxBottom || fallbackHeight)}px`;
      positionControls();
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
