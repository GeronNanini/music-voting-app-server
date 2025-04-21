import axios from 'axios';

// Utility function to handle common axios request structure
const makeAxiosRequest = async (url, method, params = {}, headers = {}) => {
  try {
    const response = await axios({ url, method, params, headers });
    return response.data;
  } catch (err) {
    throw new Error(`Request to ${url} failed: ${err.message}`);
  }
};

// Get the Spotify access token
export const getSpotifyToken = async (req, res) => {
  try {
    const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Missing Spotify credentials' });
    }

    const authHeader = 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const tokenParams = new URLSearchParams({ grant_type: 'client_credentials' });

    const tokenData = await makeAxiosRequest('https://accounts.spotify.com/api/token', 'POST', tokenParams, {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: authHeader,
    });

    res.json(tokenData);
  } catch (err) {
    console.error('Spotify token fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch Spotify token' });
  }
};

// Search for a song using the access token
export const searchSpotifySong = async (req, res) => {
  try {
    const { token, query, market = 'AU' } = req.body;

    if (!token || !query) {
      return res.status(400).json({ error: 'Token and query are required' });
    }

    const searchParams = {
      q: query,
      type: 'track',
      market,
      locale: 'en_US',
      limit: 10,
      offset: 0,
    };

    const searchData = await makeAxiosRequest('https://api.spotify.com/v1/search', 'GET', searchParams, {
      Authorization: `Bearer ${token}`,
    });

    const songs = searchData.tracks.items.map((item) => ({
      name: item.name,
      artist: item.artists.map((a) => a.name).join(', '),
      album: item.album.name,
      imageUrl: item.album.images?.[0]?.url || '', // Safer access to images array
      previewUrl: item.preview_url,
      spotifyUrl: item.external_urls?.spotify || '',
    }));

    res.json(songs);
  } catch (err) {
    console.error('Spotify search error:', err.message);
    res.status(500).json({ error: 'Failed to search for song' });
  }
};
