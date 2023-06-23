import axios from "axios";
import fs from "fs";
import path from "path";
import generateReport from "./generateReport.js";

const __dirname = path.resolve();

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

async function fetchAllEpisodesData(animeId, episodeStart, episodeEnd) {
  const jsonFilePath = path.join(__dirname, "data", "skiptime.json");
  const logFilePath = path.join(__dirname, "logs", "skiptime.log");

  let episodeSkipData = [];

  //Check the existing data in the JSON file
  if (fs.existsSync(jsonFilePath)) {
    const existingData = fs.readFileSync(jsonFilePath);
    episodeSkipData = JSON.parse(existingData);
  }

  // Open log file
  const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

  /// Redirect console output to the log file
  console.log = (message) => {
    logStream.write(`[LOG] ${message}\n`);
    process.stdout.write(`[LOG] ${message}\n`);
  };

  // Redirect console errors to the log file
  console.error = (error) => {
    logStream.write(`[ERROR] ${error}\n`);
    process.stderr.write(`[ERROR] ${error}\n`);
  };

  for (
    let episodeNumber = episodeStart;
    episodeNumber <= episodeEnd;
    episodeNumber++
  ) {
    try {
      const results = await fetchEpisodeData(animeId, episodeNumber);

      //Intial episodeObj Json data
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
      episodeSkipData.push(episodeObj);
      console.log(`Episode ${episodeNumber} processed.`);
    } catch (error) {
      console.error(`Error processing episode ${episodeNumber}: ${err}`);
    }
  }

  fs.writeFileSync(jsonFilePath, JSON.stringify(episodeSkipData, null, 2));
  console.log(`Data written to ${jsonFilePath} successfully.`);

  // Close the log stream
  logStream.end();
  console.log(`Log file '${logFilePath}' created successfully.`);
  // return episodeData;

  // Generate report
  await generateReport(jsonFilePath);
}

const animeId = 21; //MAL ID of one-piece
const episodeStart = 801;
const episodeEnd = 1065;

fetchAllEpisodesData(animeId, episodeStart, episodeEnd);

//! JSON file write calling
// fetchAllEpisodesData(animeId, episodeStart, episodeEnd)
//   .then((episodeData) => {
//     const jsonData = JSON.stringify(episodeData, null, 2);
//     fs.writeFileSync("./test/Skiptime.json", jsonData, (err) => {
//       if (err) {
//         console.error("Error writing JSON file:", err);
//       } else {
//         console.log("episodeData.json file has been created successfully.");
//       }
//     });
//   })
//   .catch((error) => {
//     console.error("Error fetching episode data:", error.message);
//   });
