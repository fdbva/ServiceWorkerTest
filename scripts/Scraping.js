/*eslint-env browser */
/*eslint no-var: "error"*/
/*eslint prefer-const: "error"*/
/*eslint-env es6*/

const btnScrape = document.querySelector("#btn-scrape");
const inputScrape = document.querySelector("#input-scrape");
// const indexedDbShowButton = document.querySelector("#indexedDbShow");
const resultsAnchor = document.querySelector('#resultsAnchor');
const nextChapterLink = document.querySelector('.next');
const previousChapterLink = document.querySelector('.prev');

let Story = {};

btnScrape.addEventListener('click', StartScrap);

nextChapterLink.addEventListener('click', function(e) {
    Story.currentChapter += 1;
    getCurrentChapter();
    updateNav();
    e.preventDefault();
});

previousChapterLink.addEventListener('click', function(e) {
    if (Story.currentChapter > 1) {
        Story.currentChapter -= 1;
        getCurrentChapter();
        updateNav();
    }
    e.preventDefault();
});

function updateNav() {
    if (Story.currentChapter > 1) {
        previousChapterLink.classList.remove('disable');

        if (Story.currentChapter == Story.chapters) {
            nextChapterLink.classList.add('disable');
        } else {
            nextChapterLink.classList.remove('disable');
        }
    } else if (Story.currentChapter == 1) {
        previousChapterLink.classList.add('disable');
    }
}

function scrapeTest001() {
    const parsedInput = parseUserInput(inputScrape.value, supportedSites);
    const yqlStringLinks = yqlStringBuilder(parsedInput.href, parsedInput.xpathLinks);
    const yqlStringChapters = new Set();
    const title = document.querySelector('#title');
    Story.name = parsedInput.storyName;
    title.textContent = Story.name;
    makeRequest('GET', yqlStringLinks)
    .then(function(data) {  
          const numberOfChapters = (JSON.parse(data)).query.results.select[0].option.length;
          //Joao drive API
          console.log("get chapterLinks and drive Ids");
          const driveIds = [];// get all drive generated Ids
          //delete folder parsedInput.storyId and everything inside
          return { "NumberOfChapters": numberOfChapters,
                    "driveIds": driveIds };
    })
    .then(function(json) { 
          //Joao drive API 
          //create folder parsedInput.storyId
          j=1;
          for(i=1;i<=json.NumberOfChapters;i++){
            makeRequest('GET', yqlStringBuilder(parsedInput.hrefEmptyChapter+i, parsedInput.xpathStory, 'xml'))
            .then(function(data) {
                console.log("getting chapter in loop and saving indexedDb");
                const obj = {
                    "ChapterId": parsedInput.storyId+"."+j,
                    "StoryName": parsedInput.storyName,
                    "Url": parsedInput.href,
                    "Content": data,
                    "NumberOfChapters": json.NumberOfChapters,
                    "DriveId": json.driveIds[j]}; //is it array, really? how to do?
              addOrReplaceStory(obj);
              return obj;
            })
            .then(function(obj) {  
                //Joao drive API 
                //create file obj
                console.log("upload file drive");
            })
            .catch(function(){
              console.log('Request failed', error);  
            });
          }
      }).catch(function(error) {  
          console.log('Request failed', error);  
      });
}
function StartScrap(e) {
    const parsedInput = parseUserInput(inputScrape.value, supportedSites);
    const yqlStringLinks = yqlStringBuilder(parsedInput.href, parsedInput.xpathLinks);
    const yqlStringChapters = new Set();
    var title = document.querySelector('#title');

    Story.name = parsedInput.storyName;
    title.textContent = Story.name;
    makeRequest('GET', yqlStringLinks).then(function(data) {
        const numberOfChapters = (JSON.parse(data)).query.results.select[0].option.length;
        var chaptersTotal = document.querySelector('#chapters-total');
        chaptersTotal.textContent = numberOfChapters;

        Story.chapters = numberOfChapters;
        Story.data = data;
        Story.parsedInput = parsedInput;
        Story.currentChapter = 1;
        Story.id = parsedInput.storyId;
        Story.href = parsedInput.href;

        populateChaptersSelectOptions();
        populateChapters();

    }).catch(function(err) {
        console.log('Request failed', err);
    })
}

function populateChaptersSelectOptions() {
    var chaptersSelect = document.querySelector('#chapters-select');
    for (var i = 1; i <= Story.chapters; i++) {
        var opt = document.createElement("option");
        opt.value = i;
        opt.innerHTML = "Chapter: " + i;

        chaptersSelect.appendChild(opt);
    }

    chaptersSelect.addEventListener('change', function() {
        goToChapter(this.value);
    })
}

function populateChapters(fn) {
    console.log(Story)

    const gApiIds = [];//google api generate all Ids
    for (let i = 1; i <= Story.chapters; i++) {
        const url = Story.parsedInput.hrefEmptyChapter + i,
            xpath = Story.parsedInput.xpathStory;

        const nextStoryPath = Story.id + "." + i;
        const actualId = i;
        makeRequest('GET', yqlStringBuilder(url, xpath, 'xml'))
            .then(function(data) {
                const obj = {
                    "ChapterId": nextStoryPath,
                    "StoryName": Story.name,
                    "Url": Story.href,
                    "Content": data,
                    "NumberOfChapters": Story.chapters,
                    "DriveId": gApiIds[actualId]};
                addOrReplaceStory(obj);
                return obj;
            })
            .then(function(obj){
                createFileWithJSONContent(nextStoryPath, obj);
            })
            .catch(function(err) {
                console.log('Request failed', err);
            })
    }

    getCurrentChapter();
}

function goToChapter(chapter) {
    Story.currentChapter = chapter;
    updateNav();
    getCurrentChapter();
}

function getCurrentChapter() {
    const nextStoryPath = Story.id + "." + Story.currentChapter;
    getChapter(nextStoryPath);
}

// indexedDbShowButton.addEventListener("click", function(){
//     populateStoryArray(function (data){ //TODO: Raphael, passar o callback aqui para montar o menu lateral?
//         // mas não em um click né, tem que fazer isso depois que a conexão com DB tiver aberto de fato.
//         data.forEach(function(obj) {
//           storyList.insertAdjacentHTML('beforeend', `<div class="chapterBox">${obj.StoryName}</div>`);
//         });
//   });
//     //displayStoryList(getObjectStore(DB_STORE_NAME, 'readwrite'));
// });
const supportedSites = new Map([
    ["www.fanfiction.net", {
        xpathLinks: '//*[@id="chap_select"]',
        xpathStory: '//*[@id="storytext"]'
    }],
    ["m.fanfiction.net", {
        xpathLinks: '//*[@id="jump"]',
        xpathStory: '//*[@id="storytext"]'
    }],
    ["www.fictionpress.com", {
        xpathLinks: '//*[@id="chap_select"]',
        xpathStory: '//*[@id="storytext"]',
        jsonNChapters: '.query.results.select[0].option.length'
    }],
    ["m.fictionpress.com", {
        xpathLinks: '//*[@id="d_menu"]/div/form',
        xpathStory: '//*[@id="storytext"]'
    }],
]);

function parseUserInput(url, supSites) {
    if (!url) {
        console.log(`Couldn't find url to be parsed`);
        return;
    }
    const input = parseUrl(url);
    if (!supSites.has(input.hostname)) {
        console.log(`I'm sorry, '${input.value}' not found in our supported sites list`);
        return;
    }
    input.xpathLinks = supSites.get(input.hostname).xpathLinks;
    input.xpathStory = supSites.get(input.hostname).xpathStory;
    if (!input.xpathLinks || !input.xpathStory) {
        console.log(`parseUserInput input problem:
                  xpathLinks: ${input.xpathLinks}
                  xpathStory: ${input.xpathStory}`);
        return;
    }
    console.log(`Site ${input.name} successfully detected`);
    console.log(JSON.stringify(input, undefined, 2));
    return input;
}

function yqlStringBuilder(parsedUrl, xpath, format = 'json') {
    if (!parsedUrl || !xpath) {
        console.log(`yqlStringBuilder input problem:
                      parsedUrl: ${parsedUrl}
                      xpath: ${xpath}`);
        return;
    }
    const yql = 'https://query.yahooapis.com/v1/public/yql?' + 'q=' + encodeURIComponent(`select * from html where url=@url and xpath='${xpath}'`) + '&url=' + encodeURIComponent(parsedUrl) + `&crossProduct=optimized&format=${format}`;

    if (!yql) {
        console.log(`something went wrong while building yqlString:
                      yqlQueryString: ${yql}
                      yqlQuery: ${yqlQuery}`);
    }
    return yql;
}

function makeRequest(method, url) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        //console.log(`making request with url: ${url}`);
        xhr.open(method, url);
        xhr.onload = function() {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function() {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
}

const parseUrl = (function() {
    const a = document.createElement('a');
    return function(url) {
        a.href = url;
        hostArrDot = a.host.split('.');
        hrefArrSlash = a.href.split('/');
        if (!hostArrDot[0] || !hostArrDot[1]) {
            console.log(`There's a problem in the story link`);
        }
        if (!hrefArrSlash[4]) {
            console.log(`Story ID could not be parsed from link`);
        }
        return {
            origin: a.origin,
            host: a.host,
            href: a.href,
            hostname: a.hostname,
            pathname: a.pathname,
            port: a.port,
            protocol: a.protocol,
            search: a.search,
            hash: a.hash,
            xpathLinks: '',
            xpathStory: '',
            name: hostArrDot[0] == 'www' || hostArrDot[0] == 'm' ? hostArrDot[1] : hostArrDot[0],
            hrefEmptyChapter: a.origin + `/s/${hrefArrSlash[4]}/`,
            storyId: hrefArrSlash[4],
            storyName: hrefArrSlash[6]
        };
    }
})();