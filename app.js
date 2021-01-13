const APIController = (() => {
  const clientId = 'f48d7b6b0fa74518a36b6c914621b89c';
  const clientSecret = '50ac38c0efb3445ca8fd1ed3628d734f';

  //token request post
  return {
    getToken: async () => {
      const result = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          ///base 64 encoding
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + btoa(clientId + ':' + clientSecret),
        },
        body: 'grant_type=client_credentials',
      });

      const data = await result.json();
      return data.access_token;
    },

    getGenres: async (token) => {
      const result = await fetch(`https://api.spotify.com/v1/browse/categories?locale=sv_GB`, {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
      });

      const data = await result.json();
      return data.categories.items;
    },

    getPlaylistByGenre: async (token, genreId) => {
      const limit = 5;

      const result = await fetch(
        `https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`,
        {
          method: 'GET',
          headers: { Authorization: 'Bearer ' + token },
        }
      );

      const data = await result.json();
      return data.playlists.items;
    },

    getTracks: async (token, tracksEndPoint) => {
      const limit = 5;

      const result = await fetch(`${tracksEndPoint}?limit=${limit}`, {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
      });

      const data = await result.json();
      return data.items;
    },

    getTrack: async (token, trackEndPoint) => {
      const result = await fetch(`${trackEndPoint}`, {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
      });

      const data = await result.json();
      return data;
    },
  };
})();

// UI Module
const UIController = (() => {
  //references to HTML selectors
  const DOMStrings = {
    selectGenre: '#select-genre',
    selectPlaylist: '#select-playlist',
    submitBtn: '#btn-submit',
    divSongDetail: '#song-detail',
    hiddenToken: '#hidden-token',
    divSonglist: '.song-list',
  };

  //public methods
  return {
    //method to get input fields
    getInput: () => {
      return {
        genre: document.querySelector(DOMStrings.selectGenre),
        playlist: document.querySelector(DOMStrings.selectPlaylist),
        tracks: document.querySelector(DOMStrings.divSonglist),
        submit: document.querySelector(DOMStrings.submitBtn),
        songDetail: document.querySelector(DOMStrings.divSongDetail),
      };
    },

    // need methods to create select list option
    createGenre: (text, value) => {
      const html = `<option value="${value}">${text}</option>`;
      document.querySelector(DOMStrings.selectGenre).insertAdjacentHTML('beforeend', html);
    },

    createPlaylist: (text, value) => {
      const html = `<option value="${value}">${text}</option>`;
      document.querySelector(DOMStrings.selectPlaylist).insertAdjacentHTML('beforeend', html);
    },

    // need method to create a track list group item
    createTrack: (id, name) => {
      const html = `<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="${id}">${name}</a>`;
      document.querySelector(DOMStrings.divSonglist).insertAdjacentHTML('beforeend', html);
    },

    // need method to create the song detail
    createTrackDetail: (img, title, artist) => {
      const detailDiv = document.querySelector(DOMStrings.divSongDetail);
      // any time user clicks a new song, we need to clear out the song detail div
      detailDiv.textContent = '';

      const html = `
            <div class="row col-sm-12 px-0">
                <img src="${img}" alt="">        
            </div>
            <div class="row col-sm-12 px-0">
                <label for="Genre" class="form-label col-sm-12">${title}</label>
            </div>
            <div class="row col-sm-12 px-0">
                <label for="artist" class="form-label col-sm-12">By ${artist}</label>
            </div> 
            <div class="row col-sm-12 px-0">
            <a href="https://www.youtube.com/results?search_query=${artist}+${title}" target="_blank">Listen on Youtube</a> 
            </div> 
            `;

      detailDiv.insertAdjacentHTML('beforeend', html);
    },

    resetTrackDetail: () => {
      UIController.getInput().songDetail.textContent = '';
    },

    resetTracks: () => {
      UIController.getInput().tracks.textContent = '';
      UIController.resetTrackDetail();
    },

    resetPlaylist: () => {
      UIController.getInput().playlist.textContent = '';
      UIController.resetTracks();
    },

    storeToken: (value) => {
      document.querySelector(DOMStrings.hiddenToken).value = value;
    },

    getStoredToken: () => {
      return {
        token: document.querySelector(DOMStrings.hiddenToken).value,
      };
    },
  };
})();

const controller = ((UICtrl, APICtrl) => {
  // get input field object ref
  let input = UICtrl.getInput();

  // get genres on page load
  const loadGenres = async () => {
    //get the token
    const token = await APICtrl.getToken();
    //store the token onto the page
    UICtrl.storeToken(token);
    //get the genres
    const genres = await APICtrl.getGenres(token);
    //populate our genres select element
    genres.forEach((element) => UICtrl.createGenre(element.name, element.id));
  };

  // create genre change event listener
  input.genre.addEventListener('change', async () => {
    //reset the playlist
    UICtrl.resetPlaylist();
    //get the token that's stored on the page
    const token = UICtrl.getStoredToken().token;
    // get the genre select field
    const genreSelect = UICtrl.getInput().genre;
    // get the genre id associated with the selected genre
    const genreId = genreSelect.options[genreSelect.selectedIndex].value;
    // ge the playlist based on a genre
    const playlist = await APICtrl.getPlaylistByGenre(token, genreId);
    // create a playlist list item for every playlist returned
    playlist.forEach((p) => UICtrl.createPlaylist(p.name, p.tracks.href));
  });

  //Submit button click event listener
  input.submit.addEventListener('click', async (event) => {
    // prevent page reset
    event.preventDefault();
    // clear tracks
    UICtrl.resetTracks();
    //get the token
    const token = UICtrl.getStoredToken().token;
    // get the playlist field
    const playlistSelect = UICtrl.getInput().playlist;
    // get track endpoint based on the selected playlist
    const tracksEndPoint = playlistSelect.options[playlistSelect.selectedIndex].value;
    // get the list of tracks
    const tracks = await APICtrl.getTracks(token, tracksEndPoint);
    // create a track list item
    tracks.forEach((element) => UICtrl.createTrack(element.track.href, element.track.name));
  });

  // Song Selection event listener
  input.tracks.addEventListener('click', async (event) => {
    event.preventDefault();
    UICtrl.resetTrackDetail();
    // get the token and track end point
    const token = UICtrl.getStoredToken().token;
    const trackEndpoint = event.target.id;
    const track = await APICtrl.getTrack(token, trackEndpoint);
    // load the track details
    UICtrl.createTrackDetail(track.album.images[2].url, track.name, track.artists[0].name);
  });

  return {
    init: () => {
      console.log('App is starting');
      UICtrl.resetTracks();
      UICtrl.resetTrackDetail();
      loadGenres();
    },
  };
})(UIController, APIController);

controller.init();
