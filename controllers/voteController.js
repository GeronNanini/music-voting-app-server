import { doc, setDoc, collection, getDocs, getDoc, updateDoc } from 'firebase/firestore';
import db from '../firebase.js';
import calculateBordaCount from '../utils/bordaCount.js';

// Utility function for fetching data from Firestore
const fetchDataFromCollection = async (collectionName) => {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map(doc => doc.data());
  } catch (err) {
    throw new Error(`Error fetching from ${collectionName}: ${err.message}`);
  }
};

// Get names of users who voted for a specific song
export const getVotersForSong = async (req, res) => {
  const { song } = req.query;

  if (!song) {
    return res.status(400).json({ message: 'Song title is required.' });
  }

  try {
    const votes = await fetchDataFromCollection('votes');
    const voters = votes
      .filter(data => Array.isArray(data.songs) && data.songs.some(s => (typeof s === 'string' && s === song) || (typeof s === 'object' && s.name === song)))
      .map(doc => doc.id);

    res.status(200).json({ song, voters });
  } catch (err) {
    console.error('Error fetching voters for song:', err);
    res.status(500).json({ message: 'Failed to get voters for song.' });
  }
};

// Submit or update user vote
export const submitVote = async (req, res) => {
  const { user, songs } = req.body;

  if (!user || !songs || !Array.isArray(songs)) {
    return res.status(400).json({ message: 'Invalid vote format.' });
  }

  if (songs.length > 20) {
    return res.status(400).json({ message: 'You can vote for up to 20 songs only.' });
  }

  try {
    const userVoteRef = doc(db, 'votes', user);
    const existingVote = await getDoc(userVoteRef);

    if (existingVote.exists()) {
      await updateDoc(userVoteRef, { songs });
      res.status(200).json({ message: 'Vote updated successfully!' });
    } else {
      await setDoc(userVoteRef, { songs });
      res.status(200).json({ message: 'Vote submitted successfully!' });
    }
  } catch (err) {
    console.error('Error submitting or updating vote:', err);
    res.status(500).json({ message: 'Error submitting or updating vote.' });
  }
};

// Get results using Borda count
export const getResults = async (req, res) => {
  try {
    const votes = await fetchDataFromCollection('votes');
    const rankedSongs = calculateBordaCount(votes);
    res.status(200).json({ rankedSongs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching votes from Firestore.' });
  }
};

// Submit initial songs
export const submitInitial = async (req, res) => {
  const { user, songs } = req.body;

  if (!user || !Array.isArray(songs) || songs.length > 5) {
    return res.status(400).json({ message: 'Submit up to 5 songs only.' });
  }

  try {
    const existingSongs = new Set();
    const snapshot = await getDocs(collection(db, 'initialSubmissions'));

    snapshot.forEach(doc => {
      if (doc.id !== user) {
        (doc.data().songs || []).forEach(song => {
          if (typeof song === 'object' && song.spotifyUrl) {
            existingSongs.add(song.spotifyUrl);
          }
        });
      }
    });

    const duplicates = songs.filter(song => existingSongs.has(song.spotifyUrl));

    if (duplicates.length > 0) {
      return res.status(409).json({
        message: 'Some songs have already been submitted by other users.',
        duplicates,
      });
    }

    await setDoc(doc(db, 'initialSubmissions', user), { songs });
    res.status(200).json({ message: 'Successfully submitted songs!' });
  } catch (err) {
    console.error('Error submitting initial songs:', err);
    res.status(500).json({ message: 'Error submitting initial songs.' });
  }
};

// Get aggregated unique songs
export const getAggregatedSongs = async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, 'initialSubmissions'));
    const songSet = new Set();

    snapshot.forEach(doc => {
      doc.data().songs.forEach(song => {
        if (typeof song === 'object' && song.name) {
          songSet.add(JSON.stringify(song)); // Store full song data
        }
      });
    });

    res.status(200).json({ songs: Array.from(songSet).map(s => JSON.parse(s)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error aggregating songs.' });
  }
};

// Submit final vote
export const submitFinalVote = async (req, res) => {
  const { user, songs } = req.body;

  if (!user || !Array.isArray(songs) || songs.length > 10) {
    return res.status(400).json({ message: 'Vote up to 10 songs only.' });
  }

  const isValid = songs.every(song => 
    typeof song === 'object' && typeof song.name === 'string' &&
    typeof song.artist === 'string' && typeof song.spotifyUrl === 'string' &&
    typeof song.rank === 'number'
  );

  if (!isValid) {
    return res.status(400).json({ message: 'Invalid song format in vote.' });
  }

  try {
    const userRef = doc(db, 'finalVotes', user);
    await setDoc(userRef, { songs });
    res.status(200).json({ message: 'Final vote submitted with ranks!' });
  } catch (err) {
    console.error('Error submitting final vote:', err);
    res.status(500).json({ message: 'Error submitting final vote.' });
  }
};

// Check if a song exists in any user's initial submission
export const checkIfSongExists = async (req, res) => {
  const { title } = req.query;

  if (!title) {
    return res.status(400).json({ exists: false, message: 'No song title provided.' });
  }

  try {
    const snapshot = await getDocs(collection(db, 'initialSubmissions'));
    const lowerTitle = title.toLowerCase();

    const exists = snapshot.docs.some(doc =>
      (doc.data().songs || []).some(song =>
        (typeof song === 'string' && song.toLowerCase() === lowerTitle) ||
        (typeof song === 'object' && song.name?.toLowerCase() === lowerTitle)
      )
    );

    res.status(200).json({ exists });
  } catch (err) {
    console.error('Error checking song existence:', err);
    res.status(500).json({ exists: false, message: 'Error checking song.' });
  }
};

// Get all songs submitted by a user
export const getNominatedSongs = async (req, res) => {
  const { user } = req.query;

  if (!user) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const userRef = doc(db, 'initialSubmissions', user);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return res.status(200).json({ songs: [] });
    }

    const { songs } = userDoc.data();
    res.status(200).json({ songs });
  } catch (err) {
    console.error('Error fetching user initial songs:', err);
    res.status(500).json({ message: 'Error fetching user submission.' });
  }
};

// Get final vote of a user
export const getFinalVote = async (req, res) => {
  const { user } = req.query;

  if (!user) return res.status(400).json({ message: 'User is required.' });

  try {
    const userRef = doc(db, 'finalVotes', user);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return res.status(200).json({ songs: [] });
    }

    const { songs } = userDoc.data();
    res.status(200).json({ songs });
  } catch (err) {
    console.error('Error fetching final vote:', err);
    res.status(500).json({ message: 'Failed to fetch final vote.' });
  }
};
