document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".resource-tab");
  const contents = document.querySelectorAll(".resource-details");
  const popup = document.getElementById("resource-popup");
  const popupContent = document.getElementById("popup-content");
  let allItems = [];
  let allTags = [];
  const searchInput = document.getElementById("search-input");
  const tagFilter = document.getElementById("tag-filter");
  const clearSearch = document.querySelector(".clear-search");
  const clearTags = document.querySelector(".clear-tags");
  const searchIcon = document.createElement("span");
  searchIcon.className = "material-icons search-icon";
  searchIcon.textContent = "search";
  const allResults = document.getElementById("all-results");
  const searchResultsContent = document.getElementById(
    "search-results-content"
  );
  const searchWrapper = document.querySelector(".search-wrapper");
  const tagFilterWrapper = document.querySelector(".tag-filter-wrapper");

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

  // Function to convert markdown links manually
  function convertMarkdownLinks(text) {
    return text.replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" style="color: #1a73e8; text-decoration: underline;">$1</a>'
    );
  }

  // Load content from JSON files
  const loadContent = async () => {
    try {
      const [updates, knowledgeArticles, downloads] = await Promise.all([
        fetch("data/updates.json").then((res) => res.json()),
        fetch("data/knowledge-articles.json").then((res) => res.json()),
        fetch("data/downloads.json").then((res) => res.json()),
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
      allTags = [
        ...new Set(allItems.flatMap((item) => item.tags || [])),
      ].sort();
      console.log("All tags:", allTags);

      // Populate tag filter
      tagFilter.innerHTML =
        '<option value="">All Tags</option>' +
        allTags.map((tag) => `<option value="${tag}">${tag}</option>`).join("");
      searchWrapper.appendChild(searchIcon);
      tagFilterWrapper.appendChild(document.createElement("span")).className =
        "material-icons filter-icon";
      tagFilterWrapper.querySelector(".filter-icon").textContent =
        "filter_list";
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

  // Render content for sections or all results
  const renderContent = (
    updates,
    knowledgeArticles,
    downloads,
    isGlobalFilter = false
  ) => {
    if (isGlobalFilter) {
      allResults.classList.add("active");
      searchResultsContent.innerHTML = "";
      const filteredItems = filterAndSortAllItems();
      filteredItems.forEach((item) => renderItem(item, searchResultsContent));
      tabs.forEach((tab) => tab.classList.add("disabled"));
      contents.forEach((content) => content.classList.remove("active"));
    } else {
      const updatesContent = document.getElementById("updates-content");
      const knowledgeContent = document.getElementById(
        "knowledge-articles-content"
      );
      const downloadsContent = document.getElementById("downloads-content");

      updatesContent.innerHTML = "";
      knowledgeContent.innerHTML = "";
      downloadsContent.innerHTML = "";

      updates.forEach((item) => renderItem(item, updatesContent));
      knowledgeArticles.forEach((item) => renderItem(item, knowledgeContent));
      downloads.forEach((item) => renderItem(item, downloadsContent));
      tabs.forEach((tab) => tab.classList.remove("disabled"));
      contents.forEach((content) => content.classList.remove("active"));
      document.getElementById("updates").classList.add("active");
      allResults.classList.remove("active");
    }
  };

  // Render a single item
  const renderItem = (item, container) => {
    console.log("Rendering item:", item);
    const div = document.createElement("div");
    div.classList.add("resource-item");
    div.dataset.id = `${item.section}-${item.title}`;
    const contentText =
      item.content || item.description || "No content available";
    const lines = contentText.split("\n").slice(0, 2).join(" ");
    const previewText = convertMarkdownLinks(lines);
    const tagsHtml = (item.tags || [])
      .sort()
      .map((tag) => `<span class="tag">${tag}</span>`)
      .join("");
    const pinnedIcon = item.pinned
      ? '<span class="material-icons pinned-icon">push_pin</span>'
      : "";
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

  // Show popup with full content
  const showPopup = (item) => {
    const contentText =
      item.content || item.description || "No content available";
    const parsedContent =
      typeof showdown !== "undefined"
        ? window.markdownConverter.makeHtml(contentText)
        : contentText;
    const paragraphs = parsedContent
      .split("\n\n")
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join("");
    const tagsHtml = (item.tags || [])
      .sort()
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

  // Sort items by date (for initial load)
  const sortItems = (items) => {
    const pinned = items
      .filter((item) => item.pinned)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const nonPinned = items
      .filter((item) => !item.pinned)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return [...pinned, ...nonPinned];
  };

  // Filter and sort all items by relevance
  const filterAndSortAllItems = () => {
    const searchText = searchInput.value.toLowerCase();
    const selectedTags = Array.from(tagFilter.selectedOptions)
      .map((option) => option.value)
      .filter((v) => v !== "");

    return allItems
      .filter((item) => {
        const contentText = (
          item.content ||
          item.description ||
          ""
        ).toLowerCase();
        const titleText = (item.title || "").toLowerCase();
        const matchesSearch =
          !searchText ||
          titleText.includes(searchText) ||
          contentText.includes(searchText);
        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.some((tag) => (item.tags || []).includes(tag));
        return matchesSearch && matchesTags;
      })
      .map((item) => {
        const contentText = (
          item.content ||
          item.description ||
          ""
        ).toLowerCase();
        const titleText = (item.title || "").toLowerCase();
        let score = 0;
        if (titleText.includes(searchText)) score += 3;
        if (contentText.includes(searchText)) score += 2;
        (item.tags || []).forEach((tag) => {
          if (selectedTags.includes(tag)) score += 1;
        });
        return { ...item, relevanceScore: score };
      })
      .sort((a, b) => {
        if (a.pinned && b.pinned) return b.relevanceScore - a.relevanceScore;
        if (a.pinned) return -1;
        if (b.pinned) return 1;
        return b.relevanceScore - a.relevanceScore;
      });
  };

  // Filter content
  const filterContent = () => {
    const searchText = searchInput.value.trim();
    const selectedTags = Array.from(tagFilter.selectedOptions)
      .map((option) => option.value)
      .filter((v) => v !== "");
    const hasFilter = searchText !== "" || selectedTags.length > 0;

    if (hasFilter) {
      renderContent([], [], [], true);
      clearSearch.style.display = searchText ? "flex" : "none";
      searchIcon.style.display = searchText ? "none" : "flex";
    } else {
      const updates = allItems.filter((item) => item.section === "updates");
      const knowledgeArticles = allItems.filter(
        (item) => item.section === "knowledge-articles"
      );
      const downloads = allItems.filter((item) => item.section === "downloads");
      renderContent(
        sortItems(updates),
        sortItems(knowledgeArticles),
        sortItems(downloads)
      );
      clearSearch.style.display = "none";
      searchIcon.style.display = "flex";
      clearTags.style.display = "none";
      tagFilterWrapper.querySelector(".filter-icon").style.display = "flex";
    }
  };

  // Sidebar navigation
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (!tab.classList.contains("disabled")) {
        tabs.forEach((t) => t.classList.remove("active"));
        contents.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const tabId = tab.getAttribute("data-tab");
        document.getElementById(tabId).classList.add("active");
        const sectionItems = allItems.filter((item) => item.section === tabId);
        renderContent(
          tabId === "updates" ? sortItems(sectionItems) : [],
          tabId === "knowledge-articles" ? sortItems(sectionItems) : [],
          tabId === "downloads" ? sortItems(sectionItems) : []
        );
      }
    });
  });

  // Event listeners for filter inputs and clear buttons
  searchInput.addEventListener("input", filterContent);
  tagFilter.addEventListener("change", () => {
    filterContent();
    clearTags.style.display =
      tagFilter.selectedOptions.length > 1 ||
      (tagFilter.selectedOptions.length === 1 &&
        tagFilter.selectedOptions[0].value !== "")
        ? "flex"
        : "none";
    tagFilterWrapper.querySelector(".filter-icon").style.display =
      tagFilter.selectedOptions.length > 1 ||
      (tagFilter.selectedOptions.length === 1 &&
        tagFilter.selectedOptions[0].value !== "")
        ? "none"
        : "flex";
  });
  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    filterContent();
  });
  clearTags.addEventListener("click", () => {
    tagFilter.selectedIndex = 0;
    filterContent();
  });

  loadContent();
});
