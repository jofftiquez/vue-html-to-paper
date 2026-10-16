const DEFAULT_OPTIONS = {
  name: '_blank',
  specs: ['fullscreen=yes', 'titlebar=yes', 'scrollbars=yes'],
  styles: [],
  autoClose: true,
  timeout: 1000,
  windowTitle: undefined,
};

// Later sources win, but only for keys they actually define.
function mergeOptions (...sources) {
  const merged = {};
  sources.forEach((source) => {
    Object.keys(source || {}).forEach((key) => {
      if (source[key] !== undefined) merged[key] = source[key];
    });
  });
  return merged;
}

function escapeHtml (text) {
  return String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function addStyles (win, styles) {
  styles.forEach((style) => {
    const link = win.document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', style);
    win.document.getElementsByTagName('head')[0].appendChild(link);
  });
}

function openWindow (url, name, props) {
  const windowRef = window.open(url, name, props);
  if (!windowRef) return null;
  if (!windowRef.opener) {
    windowRef.opener = self;
  }
  windowRef.focus();
  return windowRef;
}

const VueHtmlToPaper = {
  // `app` is a Vue 3 app (app.use) or the Vue 2 constructor (Vue.use).
  install (app, options = {}) {
    const htmlToPaper = (el, localOptions, cb = () => true) => {
      const {
        name,
        specs,
        styles,
        autoClose,
        timeout,
        windowTitle,
      } = mergeOptions(DEFAULT_OPTIONS, options, localOptions);

      const element = window.document.getElementById(el);

      if (!element) {
        alert(`Element to print #${el} not found!`);
        return;
      }

      const win = openWindow('', name, specs.length ? specs.join(',') : '');

      if (!win) {
        console.error('[vue-html-to-paper] window.open() was blocked; allow pop-ups for this site to print.');
        return false;
      }

      win.document.write(`<!DOCTYPE html>
        <html>
          <head>
            <title>${escapeHtml(windowTitle || window.document.title)}</title>
          </head>
          <body>
            ${element.innerHTML}
          </body>
        </html>
      `);

      addStyles(win, styles);

      // Without this Chrome treats the popup as still loading and never
      // opens the print dialog (mycurelabs/vue-html-to-paper#126).
      win.document.close();

      setTimeout(() => {
        win.focus();
        win.print();
        if (autoClose) {
          setTimeout(() => win.close(), 1);
        }
        cb();
      }, timeout);

      return true;
    };

    if (app.config && app.config.globalProperties) {
      app.config.globalProperties.$htmlToPaper = htmlToPaper;
    } else {
      app.prototype.$htmlToPaper = htmlToPaper;
    }
  },
};

export default VueHtmlToPaper;
