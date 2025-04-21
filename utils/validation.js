export const isValidSong = (song) => {
    return (
      typeof song === 'object' &&
      typeof song.name === 'string' &&
      typeof song.artist === 'string' &&
      typeof song.album === 'string' &&
      typeof song.imageUrl === 'string' &&
      typeof song.previewUrl === 'string' &&
      typeof song.spotifyUrl === 'string'
    );
  };
  