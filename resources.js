document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".resource-tab");
  const contents = document.querySelectorAll(".resource-details");
  const popup = document.getElementById("resource-popup");
  const popupContent = document.getElementById("popup-content");
  let allItems = [];
  let allTags = [];
  const searchInput = document.getElementById("search-input");
  const tagSelect = document.getElementById("tag-select");
  const searchWrapper = document.querySelector(".filter-container");

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

      allItems = [
        ...updates.map((item) => ({ ...item, section: "updates" })),
        ...knowledgeArticles.map((item) => ({
          ...item,
          section: "knowledge-articles",
        })),
        ...downloads.map((item) => ({ ...item, section: "downloads" })),
      ];

      console.log("All items:", allItems);

      allTags = [
        ...new Set(allItems.flatMap((item) => item.tags || [])),
      ].sort();
      console.log("All tags:", allTags);

      tagSelect.innerHTML = '<option value="">All Tags</option>';
      allTags.forEach((tag) => {
        const option = document.createElement("option");
        option.value = tag;
        option.textContent = tag;
        tagSelect.appendChild(option);
      });

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

  // Render content for the active section or search results
  const renderContent = (
    updates,
    knowledgeArticles,
    downloads,
    isSearch = false
  ) => {
    const updatesContent = document.getElementById("updates-content");
    const knowledgeContent = document.getElementById(
      "knowledge-articles-content"
    );
    const downloadsContent = document.getElementById("downloads-content");
    let searchResultsContent = document.getElementById(
      "search-results-content"
    );

    if (isSearch) {
      contents.forEach((content) => content.classList.remove("active"));
      tabs.forEach((tab) => tab.classList.remove("active", "disabled"));
      const searchResults = document.getElementById("search-results");
      if (!searchResults) {
        const newSearchResults = document.createElement("div");
        newSearchResults.classList.add("resource-details", "active");
        newSearchResults.id = "search-results";
        newSearchResults.innerHTML =
          "<h3>Search Results</h3><p>Results across all sections.</p>";
        searchResultsContent = document.createElement("div");
        searchResultsContent.id = "search-results-content";
        newSearchResults.appendChild(searchResultsContent);
        document
          .querySelector(".resources-content")
          .appendChild(newSearchResults);
      } else {
        searchResults.classList.add("active");
        searchResultsContent.innerHTML = ""; // Clear previous results
      }
    } else {
      contents.forEach((content) => content.classList.remove("active"));
      tabs.forEach((tab) => tab.classList.remove("disabled"));
      document.getElementById("updates").classList.add("active");
      tabs[0].classList.add("active"); // Activate Updates tab
      const searchResults = document.getElementById("search-results");
      if (searchResults) searchResults.remove();

      updatesContent.innerHTML = "";
      knowledgeContent.innerHTML = "";
      downloadsContent.innerHTML = "";
    }

    const renderItem = (item, container) => {
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

    if (isSearch) {
      const filteredItems = filterItems(allItems);
      filteredItems.forEach((item) => renderItem(item, searchResultsContent));
    } else {
      updates.forEach((item) => renderItem(item, updatesContent));
      knowledgeArticles.forEach((item) => renderItem(item, knowledgeContent));
      downloads.forEach((item) => renderItem(item, downloadsContent));
    }
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

  // Filter items across all sections
  const filterItems = (items) => {
    const searchText = searchInput.value
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean); // Split into keywords
    const selectedTag = tagSelect.value;
    return items.filter((item) => {
      const textContent =
        (item.title || "").toLowerCase() +
        " " +
        (item.content || "").toLowerCase() +
        " " +
        (item.description || "").toLowerCase() +
        " " +
        (item.tags || []).join(" ").toLowerCase();
      const matchesSearch =
        !searchText.length ||
        searchText.every((keyword) => textContent.includes(keyword));
      const matchesTag =
        !selectedTag || (item.tags || []).includes(selectedTag);
      return (
        (searchText.length ? matchesSearch : true) &&
        (selectedTag ? matchesTag : true)
      );
    });
  };

  // Sort items based on filter type
  const sortItems = (items, isTagFilter) => {
    const pinned = items
      .filter((item) => item.pinned)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const nonPinned = items.filter((item) => !item.pinned);
    if (isTagFilter) {
      return [
        ...pinned,
        ...nonPinned.sort((a, b) => new Date(b.date) - new Date(a.date)),
      ];
    } else {
      const searchText = searchInput.value
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      const rankItem = (item) => {
        const textContent =
          (item.title || "").toLowerCase() +
          " " +
          (item.content || "").toLowerCase() +
          " " +
          (item.description || "").toLowerCase() +
          " " +
          (item.tags || []).join(" ").toLowerCase();
        return searchText.reduce(
          (score, keyword) => score + (textContent.includes(keyword) ? 1 : 0),
          0
        );
      };
      return [
        ...pinned,
        ...nonPinned.sort((a, b) => {
          const rankA = rankItem(a);
          const rankB = rankItem(b);
          if (rankA !== rankB) return rankB - rankA; // Higher rank first
          return new Date(b.date) - new Date(a.date); // Then by date
        }),
      ];
    }
  };

  // Filter and render content
  const filterContent = () => {
    const searchText = searchInput.value.trim();
    const selectedTag = tagSelect.value;
    const hasFilter = searchText !== "" || selectedTag !== "";

    // Mutual exclusivity: Disable tag select when search is active, and vice versa
    if (searchText) {
      tagSelect.disabled = true;
    } else if (selectedTag) {
      searchInput.value = "";
      searchInput.disabled = true;
    } else {
      tagSelect.disabled = false;
      searchInput.disabled = false;
    }

    if (hasFilter) {
      const filteredItems = sortItems(filterItems(allItems), !!selectedTag);
      renderContent([], [], [], true);
      const searchResultsContent = document.getElementById(
        "search-results-content"
      );
      filteredItems.forEach((item) => renderItem(item, searchResultsContent));
      clearButton.classList.add("active");
    } else {
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
          const sortItems = (items) => {
            const pinned = items
              .filter((item) => item.pinned)
              .sort((a, b) => new Date(b.date) - new Date(a.date));
            const nonPinned = items
              .filter((item) => !item.pinned)
              .sort((a, b) => new Date(b.date) - new Date(a.date));
            return [...pinned, ...nonPinned];
          };
          renderContent(
            sortItems(updates),
            sortItems(knowledgeArticles),
            sortItems(downloads)
          );
          clearButton.classList.remove("active");
        })
        .catch((error) => {
          console.error("Error loading content:", error);
          document.getElementById("updates-content").innerHTML =
            "<p>Error loading content. Please try again later.</p>";
          document.getElementById("knowledge-articles-content").innerHTML =
            "<p>Error loading content. Please try again later.</p>";
          document.getElementById("downloads-content").innerHTML =
            "<p>Error loading content. Please try again later.</p>";
        });
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
        filterContent();
      }
    });
  });

  // Add clear button
  const clearButton = document.createElement("button");
  clearButton.textContent = "Clear";
  clearButton.classList.add("clear-button");
  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    tagSelect.value = "";
    tagSelect.disabled = false;
    searchInput.disabled = false;
    filterContent();
  });
  searchWrapper.appendChild(clearButton);

  // Event listeners for filter inputs
  searchInput.addEventListener("input", filterContent);
  tagSelect.addEventListener("change", filterContent);

  loadContent();
});
