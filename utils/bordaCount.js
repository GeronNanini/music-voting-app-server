function calculateBordaCount(votes) {
  const scores = {};
  const rankCounts = {};

  // Step 1: Tally scores and rank counts
  for (let vote of votes) {
    const songList = vote.songs;
    const numSongs = songList.length;

    for (let i = 0; i < numSongs; i++) {
      const song = songList[i];
      const points = numSongs - i;

      scores[song] = (scores[song] || 0) + points;

      if (!rankCounts[song]) rankCounts[song] = [];
      rankCounts[song][i] = (rankCounts[song][i] || 0) + 1;
    }
  }

  // Step 2: Prepare song list with meta
  const songs = Object.keys(scores).map(song => ({
    song,
    score: scores[song],
    rankCounts: rankCounts[song] || [],
    tieBreakerInfo: null
  }));

  // Step 3: Sort with tie-breaking
  songs.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    for (let i = 0; i < Math.max(a.rankCounts.length, b.rankCounts.length); i++) {
      const countA = a.rankCounts[i] || 0;
      const countB = b.rankCounts[i] || 0;
      if (countB !== countA) return countB - countA;
    }

    return a.song.localeCompare(b.song);
  });

  // Step 4: Add tie-breaker info where relevant
  for (let i = 1; i < songs.length; i++) {
    const prev = songs[i - 1];
    const curr = songs[i];

    if (curr.score === prev.score) {
      // Compare rank counts for more detailed reason
      for (let j = 0; j < Math.max(prev.rankCounts.length, curr.rankCounts.length); j++) {
        const a = prev.rankCounts[j] || 0;
        const b = curr.rankCounts[j] || 0;
        if (a !== b) {
          const place = j + 1;
          const winner = a > b ? prev.song : curr.song;
          const loser = a < b ? prev.song : curr.song;

          if (winner === curr.song) {
            curr.tieBreakerInfo = `Tied in score, won due to more ${place}ⁿᵈ-place votes`;
            prev.tieBreakerInfo = `Tied in score, lost due to fewer ${place}ⁿᵈ-place votes`;
          } else {
            prev.tieBreakerInfo = `Tied in score, won due to more ${place}ⁿᵈ-place votes`;
            curr.tieBreakerInfo = `Tied in score, lost due to fewer ${place}ⁿᵈ-place votes`;
          }

          break;
        }
      }
    }
  }

  return songs;
}

export default calculateBordaCount;
