document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".resource-tab");
  const contents = document.querySelectorAll(".resource-details");
  const popup = document.getElementById("resource-popup");
  const popupContent = document.getElementById("popup-content");
  let allItems = [];
  let allTags = [];

  // Configure showdown.js for markdown parsing
  if (typeof showdown !== "undefined") {
    const converter = new showdown.Converter({
      ghCompatibleHeaderId: true,
      simpleLineBreaks: true,
      openLinksInNewWindow: true,
      noHeaderId: false,
      simplifiedAutoLink: true,
    });
    converter.setFlavor("github");
    console.log("showdown.js loaded successfully");
    window.markdownConverter = converter;
  } else {
    console.error("showdown.js not loaded");
  }

  // Load content from JSON files
  const loadContent = async () => {
    try {
      const [updates, knowledgeArticles, downloads] = await Promise.all([
        fetch("data/updates.json").then((res) => {
          if (!res.ok)
            throw new Error(`Failed to fetch updates.json: ${res.status}`);
          return res.json();
        }),
        fetch("data/knowledge-articles.json").then((res) => {
          if (!res.ok)
            throw new Error(
              `Failed to fetch knowledge-articles.json: ${res.status}`
            );
          return res.json();
        }),
        fetch("data/downloads.json").then((res) => {
          if (!res.ok)
            throw new Error(`Failed to fetch downloads.json: ${res.status}`);
          return res.json();
        }),
      ]);

      console.log("Loaded updates:", updates);
      console.log("Loaded knowledge articles:", knowledgeArticles);
      console.log("Loaded downloads:", downloads);

      // Add section identifier and normalize data
      allItems = [
        ...updates.map((item) => ({ ...item, section: "updates" })),
        ...knowledgeArticles.map((item) => ({
          ...item,
          section: "knowledge-articles",
        })),
        ...downloads.map((item) => ({ ...item, section: "downloads" })),
      ];

      console.log("All items:", allItems);

      // Collect unique tags
      allTags = [...new Set(allItems.flatMap((item) => item.tags || []))];
      console.log("All tags:", allTags);

      // Populate tag dropdown
      const tagSelect = document.getElementById("tag-select");
      tagSelect.innerHTML = '<option value="">All Tags</option>';
      allTags.forEach((tag) => {
        const option = document.createElement("option");
        option.value = tag;
        option.textContent = tag;
        tagSelect.appendChild(option);
      });

      // Sort items: pinned articles first (by date, most recent first), then non-pinned (by date, most recent first)
      const sortItems = (items) => {
        const pinned = items
          .filter((item) => item.pinned === true)
          .sort(
            (a, b) =>
              new Date(b.date || "1970-01-01") -
              new Date(a.date || "1970-01-01")
          );
        const nonPinned = items
          .filter((item) => !item.pinned)
          .sort(
            (a, b) =>
              new Date(b.date || "1970-01-01") -
              new Date(a.date || "1970-01-01")
          );
        return [...pinned, ...nonPinned];
      };

      // Initial render
      renderContent(
        sortItems(updates),
        sortItems(knowledgeArticles),
        sortItems(downloads)
      );
    } catch (error) {
      console.error("Error loading content:", error);
      document.getElementById("updates-content").innerHTML =
        "<p>Error loading content. Please try again later.</p>";
      document.getElementById("knowledge-articles-content").innerHTML =
        "<p>Error loading content. Please try again later.</p>";
      document.getElementById("downloads-content").innerHTML =
        "<p>Error loading content. Please try again later.</p>";
    }
  };

  // Render content for the active section
  const renderContent = (updates, knowledgeArticles, downloads) => {
    const updatesContent = document.getElementById("updates-content");
    const knowledgeContent = document.getElementById(
      "knowledge-articles-content"
    );
    const downloadsContent = document.getElementById("downloads-content");

    updatesContent.innerHTML = "";
    knowledgeContent.innerHTML = "";
    downloadsContent.innerHTML = "";

    const renderItem = (item, container) => {
      console.log("Rendering item:", item);
      const div = document.createElement("div");
      div.classList.add("resource-item");
      div.dataset.id = `${item.section}-${item.title}`;
      const contentText =
        item.content || item.description || "No content available";
      const previewText =
        typeof showdown !== "undefined"
          ? window.markdownConverter.makeHtml(contentText)
          : contentText;
      console.log("Preview content:", previewText);
      const tagsHtml = (item.tags || [])
        .map((tag) => `<span class="tag">${tag}</span>`)
        .join("");
      const pinnedIcon = item.pinned
        ? '<span class="material-icons pinned-icon">push_pin</span>'
        : "";
      console.log("Tags HTML for item:", tagsHtml, "Pinned:", item.pinned);
      div.innerHTML = `
        <div class="tags">${tagsHtml}${pinnedIcon}</div>
        <button class="expand-icon" title="Click to read more"><span class="material-icons">open_in_full</span></button>
        <h4>${item.title || "Untitled"}</h4>
        ${
          item.date
            ? `<p class="timestamp">Posted on ${new Date(
                item.date
              ).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</p>`
            : ""
        }
        <p class="content-preview">${previewText}</p>
        ${
          item.file
            ? `<a href="${item.file}" class="download-link" target="_blank">Download</a>`
            : ""
        }
      `;
      div.addEventListener("click", (e) => {
        if (
          !e.target.closest(".download-link") &&
          !e.target.closest(".expand-icon")
        ) {
          showPopup(item);
        }
      });
      div
        .querySelector(".expand-icon")
        ?.addEventListener("click", () => showPopup(item));
      container.appendChild(div);
    };

    console.log("Rendering updates:", updates);
    updates.forEach((item) => renderItem(item, updatesContent));
    console.log("Rendering knowledge articles:", knowledgeArticles);
    knowledgeArticles.forEach((item) => renderItem(item, knowledgeContent));
    console.log("Rendering downloads:", downloads);
    downloads.forEach((item) => renderItem(item, downloadsContent));
  };

  // Show popup with full content
  const showPopup = (item) => {
    const contentText =
      item.content || item.description || "No content available";
    console.log("Raw content:", contentText);
    const parsedContent =
      typeof showdown !== "undefined"
        ? window.markdownConverter.makeHtml(contentText)
        : contentText;
    console.log("Parsed content:", parsedContent);
    const paragraphs = parsedContent
      .split("\n\n")
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join("");
    console.log("Final HTML:", paragraphs);
    const tagsHtml = (item.tags || [])
      .map((tag) => `<span class="tag">${tag}</span>`)
      .join("");
    const pinnedIcon = item.pinned
      ? '<span class="material-icons pinned-icon">push_pin</span>'
      : "";
    popupContent.innerHTML = `
      <div class="tags">${tagsHtml}${pinnedIcon}</div>
      <button class="close-button" aria-label="Close popup">×</button>
      <h4>${item.title || "Untitled"}</h4>
      ${
        item.date
          ? `<p class="timestamp">Posted on ${new Date(
              item.date
            ).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</p>`
          : ""
      }
      <div class="content">${paragraphs}</div>
      ${
        item.file
          ? `<a href="${item.file}" class="download-link" target="_blank">Download</a>`
          : ""
      }
    `;
    popup.classList.add("active");
  };

  // Close popup
  popup.addEventListener("click", (e) => {
    if (e.target === popup || e.target.classList.contains("close-button")) {
      popup.classList.remove("active");
    }
  });

  // Filter content by search and tag
  const filterContent = () => {
    const searchInput = document
      .getElementById("search-input")
      .value.toLowerCase();
    const selectedTag = document.getElementById("tag-select").value;

    const filterItems = (items) => {
      return items.filter((item) => {
        const matchesSearch =
          (item.title || "").toLowerCase().includes(searchInput) ||
          (item.content || "").toLowerCase().includes(searchInput) ||
          (item.description || "").toLowerCase().includes(searchInput) ||
          (item.tags || []).some((tag) =>
            tag.toLowerCase().includes(searchInput)
          );
        const matchesTag =
          !selectedTag || (item.tags || []).includes(selectedTag);
        return matchesSearch && matchesTag;
      });
    };

    Promise.all([
      fetch("data/updates.json").then((res) => {
        if (!res.ok)
          throw new Error(`Failed to fetch updates.json: ${res.status}`);
        return res.json();
      }),
      fetch("data/knowledge-articles.json").then((res) => {
        if (!res.ok)
          throw new Error(
            `Failed to fetch knowledge-articles.json: ${res.status}`
          );
        return res.json();
      }),
      fetch("data/downloads.json").then((res) => {
        if (!res.ok)
          throw new Error(`Failed to fetch downloads.json: ${res.status}`);
        return res.json();
      }),
    ])
      .then(([updates, knowledgeArticles, downloads]) => {
        // Sort items: pinned articles first (by date), then non-pinned (by date)
        const sortItems = (items) => {
          const pinned = items
            .filter((item) => item.pinned === true)
            .sort(
              (a, b) =>
                new Date(b.date || "1970-01-01") -
                new Date(a.date || "1970-01-01")
            );
          const nonPinned = items
            .filter((item) => !item.pinned)
            .sort(
              (a, b) =>
                new Date(b.date || "1970-01-01") -
                new Date(a.date || "1970-01-01")
            );
          return [...pinned, ...nonPinned];
        };
        renderContent(
          sortItems(filterItems(updates)),
          sortItems(filterItems(knowledgeArticles)),
          sortItems(filterItems(downloads))
        );
      })
      .catch((error) => {
        console.error("Error filtering content:", error);
        document.getElementById("updates-content").innerHTML =
          "<p>Error filtering content. Please try again later.</p>";
        document.getElementById("knowledge-articles-content").innerHTML =
          "<p>Error filtering content. Please try again later.</p>";
        document.getElementById("downloads-content").innerHTML =
          "<p>Error filtering content. Please try again later.</p>";
      });
  };

  // Sidebar navigation
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      contents.forEach((t) => t.classList.remove("active"));

      tab.classList.add("active");
      const tabId = tab.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
      filterContent();
    });
  });

  // Event listeners for filter inputs
  document
    .getElementById("search-input")
    .addEventListener("input", filterContent);
  document
    .getElementById("tag-select")
    .addEventListener("change", filterContent);

  loadContent();
});
