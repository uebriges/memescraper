const https = require('https');
const fs = require('fs');
const jsdom = require('jsdom');

// eslint-disable-next-line @typescript-eslint/naming-convention
const { JSDOM } = jsdom;

// ----------- Downloads the HTML of the website and returns a list of the first 10 img links (src) -----------
function fetchWebSite() {
  return new Promise((resolve, reject) => {
    let data = '';
    https.get(process.argv[2], (res) => {
      try {
        res
          .on('data', (chunk) => {
            data += chunk;
          })
          .setEncoding('utf8')
          .on('end', () => {
            const linksToMemes = [];
            const dom = new JSDOM(data.toString(), {
              includeNodeLocations: true,
            });
            const imgList = dom.window.document.querySelectorAll('img');
            for (const element of imgList.values()) {
              linksToMemes.push(element.src);
            }
            resolve(linksToMemes.slice(0, 10));
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
  return new Promise((resolve, reject) => {
    for (let i = 0; i < linkList.length; i++) {
      https.get(linkList[i], (res) => {
        let imgs = '';
        res
          .on('data', (chunk) => {
            imgs += chunk;
          })
          .setEncoding('binary')
          .on('end', () => {
            fs.writeFile(
              `./memes/test${i}.jpeg`,
              imgs,
              'binary',
              function (err) {
                if (err) throw err;
              },
            );
            if (i === 9) {
              resolve(
                process.stdout.cursorTo(i + 1),
                process.stdout.write('#'),
                process.stdout.cursorTo(29),
                process.stdout.write('done'),
              );
            } else {
              process.stdout.cursorTo(i + 1);
              process.stdout.write('#');
            }
          })
          .on('error', (err) => {
            reject(err);
          });
      });
    }
  });
}

// ----------- Actual application -----------
// Possible optimisation: Make the progress bar dynamic by keeping always 10 x '#' but fill it out in relation to the number of pictures to be downloaded

// Create 'memes' folder
fs.mkdir('./memes', (err) => {
  if (err) {
  }
});

// Print the static part of the progress bar
process.stdout.write('[          ] Downloading ... ');

// Start the scraping
fetchWebSite() // Download/Fetch the website
  .then((value) => {
    downloadImages(value); // Download images and store them in created folder
  })
  .catch((err) => {
    console.log(err);
  });
