// Wix Frontend Code for Rogue Chatbot v1
/*  chat-frontend.js  —  Wix Public code
    --------------------------------------------------------------
    Streams Grok tokens from Vercel Edge and renders them into a
    two-bubble repeater (#userBox / #botBox).  Scrolls the page to
    #scroll2 (your anchor element) instead of using scrollToIndex(),
    which isn’t supported inside a repeater.
*/

const ENDPOINT = 'https://rogue-chatbot.vercel.app/api/chat';   // ← your edge fn
const CHUNK_RE = /^data:(.*)$/m;                                // SSE line regex
const td        = new TextDecoder();

let conversation = [];   // in-page memory (no history)
let lastBotId    = null; // _id of the message currently streaming

/* -------------------------------------------------------------- */
/*  Wix onReady                                                    */
/* -------------------------------------------------------------- */
$w.onReady(() => {

  /* 1 | How each repeater item renders -------------------------------- */
  $w('#chatRepeater').onItemReady(($item, itemData) => {
    const isUser = itemData.role === 'user';

    showHide($item('#userBox'),  isUser);
    showHide($item('#botBox'),  !isUser);

    if (isUser) {
      $item('#userText').text = itemData.message;
    } else {
      $item('#botText').text  = itemData.message;
    }
  });

  /* 2 | Input handlers ------------------------------------------------- */
  $w('#sendButton').onClick(sendMessage);
  $w('#userInput').onKeyPress(e => {
    if (e.key === 'Enter') sendMessage();
  });
});

/* -------------------------------------------------------------- */
/*  Send message & stream Grok answer                               */
/* -------------------------------------------------------------- */
async function sendMessage() {
  const input = $w('#userInput');
  const text  = input.value.trim();
  if (!text) return;

  appendBubble('user', text);        // show user message
  input.value = '';
  showThinking(true);                // show loader (#streamingVideo)

  try {
    const res = await fetch(ENDPOINT, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ message: text })
    });

    if (!res.ok || !res.body) {
      throw new Error(`Net error: ${res.status}`);
    }

    let buffer = '';
    const reader = res.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += td.decode(value);
      const lines = buffer.split('\n');
      buffer = lines.pop();                          // keep partial line

      for (const line of lines) {
        const m = CHUNK_RE.exec(line);
        if (m && m[1]) {
          if (m[1] === '[DONE]') continue;
          const delta = JSON.parse(m[1]).choices?.[0]?.delta?.content ?? '';
          if (delta) appendBubble('bot', delta, /*streaming=*/true);
        }
      }
    }
  } catch (err) {
    console.error(err);
    appendBubble('bot', '⚠️ Sorry, something went wrong.');
  } finally {
    showThinking(false);             // hide loader
  }
}

/* -------------------------------------------------------------- */
/*  Helper: add / update repeater items                            */
/* -------------------------------------------------------------- */
function appendBubble(role, textChunk, streaming = false) {
  /* 1 | Update existing bot bubble while streaming  */
  if (role === 'bot' && streaming && lastBotId) {
    conversation = conversation.map(obj =>
      obj._id === lastBotId ? { ...obj, message: obj.message + textChunk } : obj
    );
    refreshRepeater();
    return;
  }

  /* 2 | Insert a new message  */
  const newItem = {
    _id: String(Date.now() + Math.random()),
    role,
    message: textChunk
  };
  conversation.push(newItem);

  if (role === 'bot') lastBotId = newItem._id;
  refreshRepeater();
}

function refreshRepeater() {
  $w('#chatRepeater').data = conversation;
  $w('#scroll2').scrollTo()         // smooth scroll to anchor element
    .catch(()=>{});                 // ignore if element not in view yet
}

/* -------------------------------------------------------------- */
/*  Helper: show / hide & loader control                           */
/* -------------------------------------------------------------- */
function showHide($elem, show) {
  show ? $elem.show() : $elem.hide();
}

function showThinking(show) {
  const vid = $w('#streamingVideo');
  show ? vid.show() : vid.hide();
}
