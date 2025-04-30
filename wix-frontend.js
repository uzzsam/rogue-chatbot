// Wix Frontend Code for Rogue Chatbot v1
/*  chat-frontend.js  —  Wix Public code
    --------------------------------------------------------------
    Streams Grok tokens from Vercel Edge and renders them into a
    two-bubble repeater (#userBox / #botBox).
*/

const ENDPOINT = 'https://rogue-chatbot.vercel.app/api/chat';   // ← no trailing slash
const CHUNK_RE = /^data:(.*)$/m;                                // parses each SSE line
const td        = new TextDecoder();

let conversation = [];   // in-page memory (no history)
let lastBotId    = null; // _id of the currently streaming bot item

/* -------------------------------------------------------------- */
/*  Wix onReady                                                    */
/* -------------------------------------------------------------- */
$w.onReady(() => {
  /* 1  Set up repeater renderer  */
  $w('#chatRepeater').onItemReady(($item, itemData) => {
    const isUser = itemData.role === 'user';

    toggleBox($item('#userBox'),  isUser);
    toggleBox($item('#botBox'),  !isUser);

    if (isUser) {
      $item('#userText').text = itemData.message;
    } else {
      $item('#botText').text  = itemData.message;
    }
  });

  /* 2  UI handlers  */
  $w('#sendButton').onClick(sendMessage);
  $w('#userInput').onKeyPress(e => {
    if (e.key === 'Enter') sendMessage();
  });
});

/* -------------------------------------------------------------- */
/*  Send message & stream answer                                   */
/* -------------------------------------------------------------- */
async function sendMessage() {
  const input = $w('#userInput');
  const text  = input.value.trim();
  if (!text) return;

  appendBubble('user', text);   // show user bubble
  input.value = '';
  showThinking(true);

  try {
    const res = await fetch(ENDPOINT, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ message: text })
    });

    if (!res.ok || !res.body) throw new Error('Network error');

    let buffer = '';
    const reader = res.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += td.decode(value);
      const lines = buffer.split('\n');
      buffer = lines.pop();          // keep the last partial line

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
    showThinking(false);
  }
}

/* -------------------------------------------------------------- */
/*  Helper: add / update repeater items                            */
/* -------------------------------------------------------------- */
function appendBubble(role, textChunk, streaming = false) {
  /* Streaming update */
  if (role === 'bot' && streaming && lastBotId) {
    conversation = conversation.map(o =>
      o._id === lastBotId ? { ...o, message: o.message + textChunk } : o
    );
    refreshRepeater();
    return;
  }

  /* New message */
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
  $w('#chatRepeater').scrollToIndex(conversation.length - 1);
}

/* -------------------------------------------------------------- */
/*  Helper: show / hide elements                                   */
/* -------------------------------------------------------------- */
function toggleBox($box, show) {
  show ? $box.show() : $box.hide();
}

function showThinking(show) {
  const vid = $w('#streamingVideo');
  show ? vid.show() : vid.hide();
}
