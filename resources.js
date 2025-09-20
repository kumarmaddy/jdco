document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".resource-tab");
  const contents = document.querySelectorAll(".resource-details");
  const popup = document.getElementById("resource-popup");
  const popupContent = document.getElementById("popup-content");
  const closeButton = document.querySelector(".close-button");
  let allItems = [];
  let allTags = [];

  // Configure marked.js to add target="_blank" to links
  if (typeof marked !== "undefined") {
    marked.setOptions({
      renderer: new marked.Renderer(),
      breaks: true,
    });
    const renderer = new marked.Renderer();
    renderer.link = (href, title, text) => {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    };
    marked.use({ renderer });
  } else {
    console.error("marked.js not loaded");
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

      // Sort items by date (most recent first) for sections with dates
      updates.sort(
        (a, b) =>
          new Date(b.date || "1970-01-01") - new Date(a.date || "1970-01-01")
      );
      knowledgeArticles.sort(
        (a, b) =>
          new Date(b.date || "1970-01-01") - new Date(a.date || "1970-01-01")
      );
      downloads.sort(
        (a, b) =>
          new Date(b.date || "1970-01-01") - new Date(a.date || "1970-01-01")
      );

      // Initial render
      renderContent(updates, knowledgeArticles, downloads);
    } catch (error) {
      console.error("Error loading content:", error);
      document.getElementById("updates-content").innerHTML =
        "<p>Error loading content. Please check the console for details.</p>";
      document.getElementById("knowledge-articles-content").innerHTML =
        "<p>Error loading content. Please check the console for details.</p>";
      document.getElementById("downloads-content").innerHTML =
        "<p>Error loading content. Please check the console for details.</p>";
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
      const div = document.createElement("div");
      div.classList.add("resource-item");
      div.dataset.id = `${item.section}-${item.title}`;
      const contentText =
        item.content || item.description || "No content available";
      div.innerHTML = `
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
        <div class="tags">${(item.tags || [])
          .map((tag) => `<span class="tag">${tag}</span>`)
          .join("")}</div>
        <p class="content-preview">${contentText}</p>
        ${
          item.file
            ? `<a href="${item.file}" class="download-link" target="_blank">Download</a>`
            : ""
        }
        <span class="read-more">Click to read more</span>
      `;
      div.addEventListener("click", (e) => {
        if (!e.target.closest(".download-link")) {
          showPopup(item);
        }
      });
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
    const paragraphs = contentText
      .split("\n\n")
      .map((paragraph) => {
        return `<p>${
          typeof marked !== "undefined" ? marked.parse(paragraph) : paragraph
        }</p>`;
      })
      .join("");
    popupContent.innerHTML = `
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
      <div class="tags">${(item.tags || [])
        .map((tag) => `<span class="tag">${tag}</span>`)
        .join("")}</div>
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
  closeButton.addEventListener("click", () => {
    popup.classList.remove("active");
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
        updates.sort(
          (a, b) =>
            new Date(b.date || "1970-01-01") - new Date(a.date || "1970-01-01")
        );
        knowledgeArticles.sort(
          (a, b) =>
            new Date(b.date || "1970-01-01") - new Date(a.date || "1970-01-01")
        );
        downloads.sort(
          (a, b) =>
            new Date(b.date || "1970-01-01") - new Date(a.date || "1970-01-01")
        );
        renderContent(
          filterItems(updates),
          filterItems(knowledgeArticles),
          filterItems(downloads)
        );
      })
      .catch((error) => {
        console.error("Error filtering content:", error);
        document.getElementById("updates-content").innerHTML =
          "<p>Error filtering content. Please check the console for details.</p>";
        document.getElementById("knowledge-articles-content").innerHTML =
          "<p>Error filtering content. Please check the console for details.</p>";
        document.getElementById("downloads-content").innerHTML =
          "<p>Error filtering content. Please check the console for details.</p>";
      });
  };

  // Sidebar navigation
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      contents.forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      const tabId = tab.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
      filterContent();
    });
  });

  loadContent();
});
