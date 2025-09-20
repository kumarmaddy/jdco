document.addEventListener('DOMContentLoaded', () => {
  // Load content from JSON files
  const loadContent = async () => {
    try {
      const [updates, knowledgeArticles, downloads] = await Promise.all([
        fetch('data/updates.json').then(res => res.json()),
        fetch('data/knowledge-articles.json').then(res => res.json()),
        fetch('data/downloads.json').then(res => res.json())
      ]);

      // Collect all tags
      const allTags = [...new Set([
        ...updates.flatMap(item => item.tags),
        ...knowledgeArticles.flatMap(item => item.tags),
        ...downloads.flatMap(item => item.tags)
      ])];

      // Render tags
      const tagFilter = document.getElementById('tag-filter');
      allTags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.classList.add('tag');
        tagElement.textContent = tag;
        tagElement.addEventListener('click', () => {
          tagElement.classList.toggle('active');
          filterContent();
        });
        tagFilter.appendChild(tagElement);
      });

      // Sort updates by date (most recent first)
      updates.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Initial render
      renderContent(updates, knowledgeArticles, downloads);

      // Search functionality
      const searchInput = document.getElementById('search-input');
      searchInput.addEventListener('input', () => filterContent());
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  // Render content to grids
  const renderContent = (updates, knowledgeArticles, downloads) => {
    const updatesGrid = document.getElementById('updates-grid');
    const knowledgeGrid = document.getElementById('knowledge-articles-grid');
    const downloadsGrid = document.getElementById('downloads-grid');

    updatesGrid.innerHTML = '';
    knowledgeGrid.innerHTML = '';
    downloadsGrid.innerHTML = '';

    updates.forEach(item => {
      const div = document.createElement('div');
      div.classList.add('resource-item');
      div.innerHTML = `
        <h4>${item.title}</h4>
        <p class="timestamp">${new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p>${item.content}</p>
        <div class="tags">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
      `;
      updatesGrid.appendChild(div);
    });

    knowledgeArticles.forEach(item => {
      const div = document.createElement('div');
      div.classList.add('resource-item');
      div.innerHTML = `
        <h4>${item.title}</h4>
        <p>${item.content}</p>
        <div class="tags">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
      `;
      knowledgeGrid.appendChild(div);
    });

    downloads.forEach(item => {
      const div = document.createElement('div');
      div.classList.add('resource-item');
      div.innerHTML = `
        <h4>${item.title}</h4>
        <p>${item.description}</p>
        <a href="${item.file}" class="download-link" target="_blank">Download</a>
        <div class="tags">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
      `;
      downloadsGrid.appendChild(div);
    });
  };

  // Filter content by search and tags
  const filterContent = () => {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const activeTags = Array.from(document.querySelectorAll('.tag.active')).map(tag => tag.textContent);

    const filterItems = (items) => {
      return items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchInput) || 
                             (item.content && item.content.toLowerCase().includes(searchInput)) || 
                             (item.description && item.description.toLowerCase().includes(searchInput));
        const matchesTags = activeTags.length === 0 || item.tags.some(tag => activeTags.includes(tag));
        return matchesSearch && matchesTags;
      });
    };

    Promise.all([
      fetch('data/updates.json').then(res => res.json()),
      fetch('data/knowledge-articles.json').then(res => res.json()),
      fetch('data/downloads.json').then(res => res.json())
    ]).then(([updates, knowledgeArticles, downloads]) => {
      updates.sort((a, b) => new Date(b.date) - new Date(a.date));
      renderContent(
        filterItems(updates),
        filterItems(knowledgeArticles),
        filterItems(downloads)
      );
    });
  };

  loadContent();
});
