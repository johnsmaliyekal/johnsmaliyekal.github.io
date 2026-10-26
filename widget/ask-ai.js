// ask-ai.js
// "Ask Amban!" — drop-in chat widget. Include after ask-ai.css, pointing
// data-api at your deployed Vercel function:
//
//   <link rel="stylesheet" href="/widget/ask-ai.css">
//   <script src="/widget/ask-ai.js" data-api="https://YOUR-PROJECT.vercel.app/api/chat" defer></script>

(function () {
  const script = document.currentScript;
  const API_URL = script?.dataset?.api;

  function init() {
    if (!API_URL) {
      console.warn('ask-ai: no data-api endpoint set on the script tag — widget not mounted.');
      return;
    }

    const root = document.createElement('div');
    root.className = 'ask-ai-widget';
    root.innerHTML = `
      <button type="button" class="ask-ai-toggle" aria-expanded="false" aria-controls="ask-ai-panel">
        <span class="ask-ai-dot" aria-hidden="true"></span>
        Ask Amban!
      </button>
      <section id="ask-ai-panel" class="ask-ai-panel" hidden aria-label="Ask Amban! — a chatbot about Johns' work">
        <div class="ask-ai-head">
          <span>Ask Amban!</span>
          <button type="button" class="ask-ai-close" aria-label="Close">×</button>
        </div>
        <div class="ask-ai-log" role="log" aria-live="polite">
          <p class="ask-ai-intro">Ask about experience, certifications, or projects. Answers are grounded in a verified record only — if it's not in there, I'll say so.</p>
        </div>
        <form class="ask-ai-form">
          <input type="text" name="question" placeholder="e.g. What's his current role?" maxlength="500" autocomplete="off" />
          <button type="submit">Send</button>
        </form>
      </section>
    `;
    document.body.appendChild(root);

    const toggle = root.querySelector('.ask-ai-toggle');
    const panel = root.querySelector('.ask-ai-panel');
    const closeBtn = root.querySelector('.ask-ai-close');
    const log = root.querySelector('.ask-ai-log');
    const form = root.querySelector('.ask-ai-form');
    const input = root.querySelector('input[name="question"]');

    function openPanel() {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      input.focus();
    }

    function closePanel() {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }

    toggle.addEventListener('click', () => (panel.hidden ? openPanel() : closePanel()));
    closeBtn.addEventListener('click', closePanel);
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) closePanel();
    });

    function addUserMessage(text) {
      const el = document.createElement('p');
      el.className = 'ask-ai-msg-user';
      el.textContent = text;
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
    }

    function addAiMessage(text, sources) {
      const wrap = document.createElement('div');
      wrap.className = 'ask-ai-msg-ai';

      const p = document.createElement('p');
      p.textContent = text;
      wrap.appendChild(p);

      if (sources && sources.length) {
        const row = document.createElement('div');
        row.className = 'ask-ai-sources';
        const label = document.createElement('span');
        label.className = 'ask-ai-sources-label';
        label.textContent = 'sources:';
        row.appendChild(label);
        sources.forEach((s) => {
          const a = document.createElement('a');
          a.className = 'ask-ai-source';
          a.href = s.url;
          a.textContent = s.id;
          row.appendChild(a);
        });
        wrap.appendChild(row);
      }

      log.appendChild(wrap);
      log.scrollTop = log.scrollHeight;
    }

    function addThinking() {
      const el = document.createElement('p');
      el.className = 'ask-ai-thinking';
      el.textContent = 'Checking the record…';
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
      return el;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const question = input.value.trim();
      if (!question) return;

      addUserMessage(question);
      input.value = '';
      input.disabled = true;
      form.querySelector('button').disabled = true;
      const thinkingEl = addThinking();

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: question }),
        });
        const data = await res.json();
        thinkingEl.remove();
        if (res.ok) {
          addAiMessage(data.answer, data.sources);
        } else {
          addAiMessage(data.error || "Something went wrong — please try again.", []);
        }
      } catch (err) {
        thinkingEl.remove();
        addAiMessage("Couldn't reach the server — check your connection and try again.", []);
      } finally {
        input.disabled = false;
        form.querySelector('button').disabled = false;
        input.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
