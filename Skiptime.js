import axios from "axios";
import fs from "fs";

async function fetchEpisodeData(animeId, episodeNumber) {
  const url = `https://api.aniskip.com/v2/skip-times/${animeId}/${episodeNumber}?types=op&types=ed&types=recap&episodeLength=0`;
  try {
    const response = await axios.get(url);
    if (response.status === 200 && response.data.found) {
      return response.data.results;
    }
  } catch (error) {
    console.error(
      `Error fetching data for episode ${episodeNumber}:`,
      error.message
    );
  }
  return [];
}

async function fetchAllEpisodesData(animeId, totalEpisodes) {
  const episodeData = [];
  for (let episodeNumber = 1; episodeNumber <= totalEpisodes; episodeNumber++) {
    const results = await fetchEpisodeData(animeId, episodeNumber);

    const episodeObj = {
      //   id: animeId,
      episodeNo: episodeNumber,
      opSkip: {
        startTime: null,
        endTime: null,
        skipId: null,
        episodeLength: null,
      },
      edSkip: {
        startTime: null,
        endTime: null,
        skipId: null,
        episodeLength: null,
      },
      recapSkip: {
        startTime: null,
        endTime: null,
        skipId: null,
        episodeLength: null,
      },
    };
    for (const result of results) {
      switch (result.skipType) {
        case "op":
          episodeObj.opSkip.startTime = result.interval.startTime;
          episodeObj.opSkip.endTime = result.interval.endTime;
          episodeObj.opSkip.skipId = result.skipId;
          episodeObj.opSkip.episodeLength = result.episodeLength;
          break;
        case "ed":
          episodeObj.edSkip.startTime = result.interval.startTime;
          episodeObj.edSkip.endTime = result.interval.endTime;
          episodeObj.edSkip.skipId = result.skipId;
          episodeObj.edSkip.episodeLength = result.episodeLength;
          break;
        case "recap":
          episodeObj.recapSkip.startTime = result.interval.startTime;
          episodeObj.recapSkip.endTime = result.interval.endTime;
          episodeObj.recapSkip.skipId = result.skipId;
          episodeObj.recapSkip.episodeLength = result.episodeLength;
          break;
        default:
          break;
      }
    }
    episodeData.push(episodeObj);
  }
  return episodeData;
}

const animeId = 21;
const totalEpisodes = 3;

//! Test calling
// fetchAllEpisodesData(animeId, totalEpisodes)
//   .then((episodeData) => {
//     const jsonData = JSON.stringify(episodeData, null, 2);
//     console.log(jsonData);
//   })
//   .catch((error) => {
//     console.error("Error fetching episode data:", error.message);
//   });

//! JSON file write calling
fetchAllEpisodesData(animeId, totalEpisodes)
  .then((episodeData) => {
    const jsonData = JSON.stringify(episodeData, null, 2);
    fs.writeFile("./test/Skiptime.json", jsonData, (err) => {
      if (err) {
        console.error("Error writing JSON file:", err);
      } else {
        console.log("episodeData.json file has been created successfully.");
      }
    });
  })
  .catch((error) => {
    console.error("Error fetching episode data:", error.message);
  });
