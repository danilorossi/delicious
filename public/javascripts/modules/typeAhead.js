import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(stores) {
    return stores.map(store => {
      return `
        <a href="/store/${store.slug}" class="search__result">
          <string>${store.name}</store>
        </a>
      `;
    }).join('');
}

function typeAhead(search) {
  if (!search) return;

  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');

  searchInput.on('input', function() {

    if (!this.value) {
      searchResults.style.display = 'none';
      return;
    }

    searchResults.style.display = 'block';
    searchResults.innerHTML = '';

    axios
      .get(`/api/search?q=${this.value}`)
      .then(res => {
        if (res.data.length) {
          searchResults.innerHTML =
            dompurify.sanitize(searchResultsHTML(res.data)) ;
          return;
        }
        // no results
        searchResults.innerHTML = dompurify.sanitize(`
          <div class="search__result">
            No results for ${this.value} found!
          </div>
        `);
      })
      .catch(err => {
        console.error(err);
      });

  });

  searchInput.on('keyup', (e) => {

    // only deal with up, down or enter
    if(![38, 40, 13].includes(e.keyCode)) {
      return;
    }

    const activeClass = 'search__result--active';

    const current = search.querySelector(`.${activeClass}`);

    const items = search.querySelectorAll('.search__result');

    let next;

    if (e.keyCode === 40 && current) { // down and selected
      next = current.nextElementSibling || items[0];
    } else if (e.keyCode === 40) { // on first
      next = items[0];
    } else if (e.keyCode === 38 && current) { // up and current
      next = current.previousElementSibling || items[items.length - 1];
    } else if (e.keyCode === 38) {
      next = items[items.length - 1]
    } else if (e.keyCode === 13 && current.href) { // enter
      window.location = current.href;
      return;
    }

    if (current) {
      current.classList.remove(activeClass);
    }

    next.classList.add(activeClass);

  });


}

export default typeAhead;
