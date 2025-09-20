document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".resource-tab");
  const contents = document.querySelectorAll(".resource-details");
  const popup = document.getElementById("resource-popup");
  const popupContent = document.getElementById("popup-content");
  const closeButton = document.querySelector(".close-button");
  let allItems = [];
  let allTags = [];
  let bookmarkedItems =
    JSON.parse(localStorage.getItem("bookmarkedItems")) || {};

  // Load content from JSON files
  const loadContent = async () => {
    try {
      const [updates, knowledgeArticles, downloads] = await Promise.all([
        fetch("data/updates.json").then((res) => res.json()),
        fetch("data/knowledge-articles.json").then((res) => res.json()),
        fetch("data/downloads.json").then((res) => res.json()),
      ]);

      // Add section identifier and normalize data
      allItems = [
        ...updates.map((item) => ({ ...item, section: "updates" })),
        ...knowledgeArticles.map((item) => ({
          ...item,
          section: "knowledge-articles",
        })),
        ...downloads.map((item) => ({ ...item, section: "downloads" })),
      ];

      // Collect unique tags
      allTags = [...new Set(allItems.flatMap((item) => item.tags))];

      // Populate tag dropdown
      const tagSelect = document.getElementById("tag-select");
      allTags.forEach((tag) => {
        const option = document.createElement("option");
        option.value = tag;
        option.textContent = tag;
        tagSelect.appendChild(option);
      });

      // Sort items by date (most recent first) for sections with dates
      updates.sort((a, b) => new Date(b.date) - new Date(a.date));
      knowledgeArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
      downloads.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Initial render
      renderContent(updates, knowledgeArticles, downloads);

      // Event listeners
      document
        .getElementById("search-input")
        .addEventListener("input", () => filterContent());
      tagSelect.addEventListener("change", () => filterContent());
    } catch (error) {
      console.error("Error loading content:", error);
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
      div.innerHTML = `
        <h4>${item.title}</h4>
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
        <div class="tags">${item.tags
          .map((tag) => `<span class="tag">${tag}</span>`)
          .join("")}</div>
        <p class="content-preview">${item.content || item.description}</p>
        ${
          item.file
            ? `<a href="${item.file}" class="download-link" target="_blank">Download</a>`
            : ""
        }
        <button class="bookmark-button ${
          bookmarkedItems[`${item.section}-${item.title}`] ? "bookmarked" : ""
        }" aria-label="Bookmark this item">📑</button>
        <span class="read-more">Click to read more</span>
      `;
      div.addEventListener("click", (e) => {
        if (
          e.target.classList.contains("bookmark-button") ||
          e.target.classList.contains("download-link")
        )
          return;
        showPopup(item);
      });
      div
        .querySelector(".bookmark-button")
        .addEventListener("click", () => toggleBookmark(item));
      container.appendChild(div);
    };

    updates.forEach((item) => renderItem(item, updatesContent));
    knowledgeArticles.forEach((item) => renderItem(item, knowledgeContent));
    downloads.forEach((item) => renderItem(item, downloadsContent));
  };

  // Show popup with full content
  const showPopup = (item) => {
    popupContent.innerHTML = `
      <h4>${item.title}</h4>
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
      <div class="tags">${item.tags
        .map((tag) => `<span class="tag">${tag}</span>`)
        .join("")}</div>
      <p>${item.content || item.description}</p>
      ${
        item.file
          ? `<a href="${item.file}" class="download-link" target="_blank">Download</a>`
          : ""
      }
      <button class="bookmark-button ${
        bookmarkedItems[`${item.section}-${item.title}`] ? "bookmarked" : ""
      }" aria-label="Bookmark this item">📑</button>
    `;
    popupContent
      .querySelector(".bookmark-button")
      .addEventListener("click", () => toggleBookmark(item));
    popup.classList.add("active");
  };

  // Toggle bookmark state
  const toggleBookmark = (item) => {
    const id = `${item.section}-${item.title}`;
    bookmarkedItems[id] = !bookmarkedItems[id];
    localStorage.setItem("bookmarkedItems", JSON.stringify(bookmarkedItems));
    renderContent(
      allItems.filter((i) => i.section === "updates"),
      allItems.filter((i) => i.section === "knowledge-articles"),
      allItems.filter((i) => i.section === "downloads")
    );
    if (popup.classList.contains("active")) {
      showPopup(item);
    }
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
          item.title.toLowerCase().includes(searchInput) ||
          (item.content && item.content.toLowerCase().includes(searchInput)) ||
          (item.description &&
            item.description.toLowerCase().includes(searchInput)) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchInput));
        const matchesTag = !selectedTag || item.tags.includes(selectedTag);
        return matchesSearch && matchesTag;
      });
    };

    Promise.all([
      fetch("data/updates.json").then((res) => res.json()),
      fetch("data/knowledge-articles.json").then((res) => res.json()),
      fetch("data/downloads.json").then((res) => res.json()),
    ]).then(([updates, knowledgeArticles, downloads]) => {
      updates.sort((a, b) => new Date(b.date) - new Date(a.date));
      knowledgeArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
      downloads.sort((a, b) => new Date(b.date) - new Date(a.date));
      renderContent(
        filterItems(updates),
        filterItems(knowledgeArticles),
        filterItems(downloads)
      );
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
