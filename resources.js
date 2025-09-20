document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".resource-tab");
  const contents = document.querySelectorAll(".resource-details");
  let allItems = [];
  let allTags = [];

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
      // Downloads may not have dates; use JSON order if no date

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

    updates.forEach((item) => {
      const div = document.createElement("div");
      div.classList.add("resource-item");
      div.innerHTML = `
        <h4>${item.title}</h4>
        <p class="timestamp">Posted on ${new Date(item.date).toLocaleDateString(
          "en-US",
          { year: "numeric", month: "long", day: "numeric" }
        )}</p>
        <div class="tags">${item.tags
          .map((tag) => `<span class="tag">${tag}</span>`)
          .join("")}</div>
        <p>${item.content}</p>
      `;
      updatesContent.appendChild(div);
    });

    knowledgeArticles.forEach((item) => {
      const div = document.createElement("div");
      div.classList.add("resource-item");
      div.innerHTML = `
        <h4>${item.title}</h4>
        <p class="timestamp">Posted on ${new Date(item.date).toLocaleDateString(
          "en-US",
          { year: "numeric", month: "long", day: "numeric" }
        )}</p>
        <div class="tags">${item.tags
          .map((tag) => `<span class="tag">${tag}</span>`)
          .join("")}</div>
        <p>${item.content}</p>
      `;
      knowledgeContent.appendChild(div);
    });

    downloads.forEach((item) => {
      const div = document.createElement("div");
      div.classList.add("resource-item");
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
        <p>${item.description}</p>
        <a href="${
          item.file
        }" class="download-link" target="_blank">Download</a>
      `;
      downloadsContent.appendChild(div);
    });
  };

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
      filterContent(); // Re-apply filters for the new section
    });
  });

  loadContent();
});
