'use strict';

import Draft from './models/Draft.js';
import Continue from './models/Continue.js';
import LoadEvent from './utils/LoadEvent.js';
import SpeakUtils from './utils/SpeakUtils.js';
import ParentLimit from './utils/ParentLimit.js';

const btnSpeak = document.querySelector('.speak');
const aiResponseParent = document.querySelector(
  '.response-parent'
);
const historyParent = document.querySelector(
  '.history-content-container'
);

const btnStop = document.querySelector('.stop-generating')

const draftCollections = [];
const continueCollections = [];
let greetings = 'Good';
let questionCounter = 1;
let continueCounter = 0;

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const speakUtil = new SpeakUtils();
const loadEvent = new LoadEvent(greetings);
const parentUtil = new ParentLimit(aiResponseParent);
const recognition = new SpeechRecognition();

loadEvent.load();

btnSpeak.addEventListener('click', (e) => {
  e.preventDefault();
  recognition.start();
  recognition.timeout = 5000;

  recognition.onresult = (event) => {
    const current = event.resultIndex;
    const transcript = event.results[current][0].transcript;

    //#region --- api ---
    let data = JSON.stringify({
      q: `${transcript.toLowerCase()}`,
    });

    let config = {
      method: 'post',
      url: 'https://google.serper.dev/search/',
      headers: {
        'X-API-KEY': '71d9d549aeb814fa205100ed9fae50dbb9b603dd',
        'Content-Type': 'application/json',
      },
      data: data,
    };

    axios(config)
      .then((response) => {
        return response.data;
      })
      .then((data) => {
        if (transcript.includes('time')) {
          parentUtil.limit();
          const time = new Date().toLocaleString(undefined, {
            hour: 'numeric',
            minute: 'numeric',
          });
          const aiResParent = document.querySelector(
            '.response-parent'
          );

          const aiResHTML = `
          <div class="response greet">
             <p class="question-ai">
             ${transcript.toUpperCase()}
             </p>
             <p class="answer">
             The current time right now is ${time}
             </p>
         </div>
          `;
          aiResParent.insertAdjacentHTML('beforeend', aiResHTML);
          speakUtil.speak(`The current time right now is ${time}`);
        } else if (transcript.includes('go offline')) {
          parentUtil.limit();
          const offline =
            'Maiden is shutting down... Closing window in a few second... Maiden going offline...';
          const aiResParent = document.querySelector(
            '.response-parent'
          );

          const aiResHTML = `
          <div class="response greet">
             <p class="question-ai">
             ${transcript.toUpperCase()}
             </p>
             <p class="answer">
             ${offline}
             </p>
         </div>
          `;
          aiResParent.insertAdjacentHTML('beforeend', aiResHTML);
          speakUtil.speak(offline);

          setTimeout(() => {
            document.querySelector('.maiden-link').click();
          }, 7000);

        } else if (transcript.includes('clear chat')) {
          const clearChat = 'Clearing things up for you...';
          const aiResParent = document.querySelector(
            '.response-parent'
          );

          const aiResHTML = `
          <div class="response greet">
             <p class="question-ai">
             ${transcript.toUpperCase()}
             </p>
             <p class="answer">
             ${clearChat}
             </p>
         </div>
          `;
          aiResParent.insertAdjacentHTML('beforeend', aiResHTML);
          speakUtil.speak(clearChat);

          setTimeout(() => {
            while (aiResponseParent.hasChildNodes()) {
              if (aiResponseParent.childElementCount == 0) {
                return;
              }
              aiResponseParent.removeChild(
                aiResponseParent.firstChild
              );
            }
          }, 3000);
          
        } else if (transcript.includes('continue')) {
          console.log(continueCollections);
          continueCounter -= 1;
          console.log(continueCounter);
          const continueTemplate = [
            ...continueCollections[continueCounter].previousData,
          ];

          parentUtil.limit();
          const result =
            'Here is another result for your previous question, ' + `${continueTemplate}`;
          const aiResParent = document.querySelector(
            '.response-parent'
          );

          const aiResHTML = `
          <div class="response greet">
             <p class="question-ai">
             ${transcript.toUpperCase()}
             </p>
             <p class="answer">
             ${result}
             </p>
         </div>
          `;
          aiResParent.insertAdjacentHTML('beforeend', aiResHTML);
          speakUtil.speak(`${result}`);
          continueCounter += 1;

        } else {
          const linkParent = document.querySelector(
            '.link-content-container'
          );

          while (linkParent.hasChildNodes()) {
            linkParent.removeChild(linkParent.firstChild);
          }

          const resultData = `${JSON.stringify(
            data.organic[0].snippet
          )}${JSON.stringify(
            data.organic[1].snippet
          )}${JSON.stringify(data.organic[2].snippet)}`;

          const linkStorage = [];

          data.organic.forEach((element) => {
            if (linkStorage.length < 10) {
              linkStorage.push(element.link);
            } else {
              return;
            }
          });

          const draft = new Draft(
            transcript.toUpperCase(),
            resultData,
            questionCounter,
            data.organic[0].link,
            linkStorage,
            draftCollections
          );

          const continueData = new Continue([
            JSON.stringify(data.organic[4].snippet),
            JSON.stringify(data.organic[5].snippet),
            JSON.stringify(data.organic[6].snippet),
          ]);

          draftCollections.push(draft);
          continueCollections.push(continueData);

          parentUtil.limit();

          if (historyParent.childElementCount > 9) {
            historyParent.removeChild(
              historyParent.firstElementChild
            );
          }

          draft.renderContentAI();
          draft.renderContentHistory();
          draft.renderContentLinks();

          continueCounter += 1;

          if (
            document.querySelector('.history-content-container')
              .childElementCount > 0
          ) {
            speakUtil.speak(resultData);
            setTimeout(() => {
              speakUtil.speak(
                'If you are still having problems, let me know'
              );
            }, 2500);
            questionCounter += 1;
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
    //#endregion
  };
});



btnStop.addEventListener('click',(e)=>{
  e.preventDefault();
  window.speechSynthesis.cancel()
})
