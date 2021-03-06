const https = require('https');
const fs = require('fs');
const jsdom = require('jsdom');
const jimp = require('jimp');
const cliProgress = require('cli-progress');

// eslint-disable-next-line @typescript-eslint/naming-convention
const { JSDOM } = jsdom;
const progressBarDownloadMemes = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic,
);

// ----------- Downloads the HTML of the website and returns a list of the first 10 img links (src) -----------
function fetchWebsite(url) {
  progressBarDownloadMemes.start(100, 0);
  return new Promise((resolve, reject) => {
    let data = '';
    https.get(url, (res) => {
      try {
        res
          .on('data', (chunk) => {
            data += chunk;
          })
          .on('end', () => {
            const linksToMemes = [];
            const dom = new JSDOM(data);
            const imgList = dom.window.document.querySelectorAll('img');

            for (let imageNr = 0; imageNr < 10; imageNr++) {
              linksToMemes.push(imgList[imageNr].src);
            }
            resolve(linksToMemes);
          });
        res.on('error', (err) => {
          reject(err);
        });
      } catch (err) {
        console.log('This is the error: ', err);
      }
    });
  });
}

// ----------- Downloads the images based on the list of links (linkList) -----------
function downloadImages(linkList) {
  const promisesArray = [];
  // Try it with Promise.all(), passing in array of promises, mapping over the link list
  for (
    let currentLinkIndex = 0;
    currentLinkIndex < linkList.length;
    currentLinkIndex++
  ) {
    const promise = new Promise((resolve, reject) => {
      https.get(linkList[currentLinkIndex], (res) => {
        let imgBinaryData = '';
        res
          .on('data', (chunk) => {
            imgBinaryData += chunk;
          })
          .setEncoding('binary')
          .on('end', () => {
            fs.writeFile(
              `./memes/test${currentLinkIndex}.jpeg`,
              imgBinaryData,
              'binary',
              function (err) {
                if (err) throw err;
              },
            );
            resolve('done');
            progressBarDownloadMemes.increment(10);
          })
          .on('error', (err) => {
            reject(err);
          });
      });
    });
    promisesArray.push(promise);
  }
  return promisesArray;
}

// ----------- Draws a custom meme -----------
// Possible optimization: Make the text positioning more dynamic in relation to the image size.
function drawMeme(greeting, nameToGreet) {
  jimp.read(
    'https://pngimg.com/uploads/futurama/futurama_PNG77.png',
    (err, pic) => {
      if (err) throw err;
      jimp.loadFont(jimp.FONT_SANS_64_BLACK).then((font) => {
        pic.print(
          font,
          pic.bitmap.width / 2,
          0,
          {
            text: greeting,
            alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: jimp.VERTICAL_ALIGN_TOP,
          },
          0,
          (error, image, { x, y }) => {
            image.print(
              font,
              x,
              y + (pic.bitmap.height - 300),
              {
                text: nameToGreet,
                alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: jimp.VERTICAL_ALIGN_BOTTOM,
              },
              0,
            );
          },
        );
        pic.background(0xffffffff);
        pic.write('./memes/bender.jpg');
      });
    },
  );
}

// ----------- Actual application -----------
// Possible optimization: Make the progress bar dynamic by keeping always 10 x '#' but fill it out in relation to the number of pictures to be downloaded

// Create 'memes' folder
if (!fs.existsSync('./memes')) {
  fs.mkdir('./memes', (err) => {
    if (err) {
      console.log(err);
    }
  });
}

if (process.argv[2] && process.argv[2].slice(0, 5) === 'https') {
  // Print the static part of the progress bar
  // Do the scraping
  fetchWebsite(process.argv[2]) // Download/Fetch the website
    .then((value) => {
      Promise.all(downloadImages(value)).then((value) => {
        progressBarDownloadMemes.stop();
        console.log('Your memes have been downloaded to the /memes folder');
      }); // Download images and store them in created folder
    })
    .catch((err) => {
      console.log(err);
    });
} else {
  if (!process.argv[2] || !process.argv[3] || !process.argv[2]) {
    // Print the static part of the progress bar
    // Do the scraping
    fetchWebsite('https://memegen-link-examples-upleveled.netlify.app/') // Download/Fetch the website
      .then((value) => {
        Promise.all(downloadImages(value)).then((value) => {
          progressBarDownloadMemes.stop();
          console.log('Your memes have been downloaded to the /memes folder');
        }); // Download images and store them in created folder
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    drawMeme(process.argv[2], process.argv[3]); // Creates bender meme with greeting an name
  }
}
